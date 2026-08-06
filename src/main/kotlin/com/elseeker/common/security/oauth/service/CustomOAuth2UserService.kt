package com.elseeker.common.security.oauth.service

import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.ServiceError
import com.elseeker.common.domain.throwError
import com.elseeker.common.security.jwt.JwtProvider
import com.elseeker.common.security.oauth.factory.OAuth2UserInfoFactory
import com.elseeker.common.security.oauth.info.OAuth2UserInfo
import com.elseeker.common.security.oauth.repository.HttpCookieOAuth2AuthorizationRequestRepository
import com.elseeker.common.security.oauth.util.CookieUtils
import com.elseeker.member.adapter.output.jpa.MemberOAuthAccountRepository
import com.elseeker.member.adapter.output.jpa.MemberRepository
import com.elseeker.member.domain.model.Member
import com.elseeker.member.domain.model.MemberOAuthAccount
import com.elseeker.member.domain.vo.MemberRole
import com.elseeker.member.domain.vo.MemberStatus
import com.elseeker.member.domain.vo.OAuthProvider
import jakarta.servlet.http.HttpServletRequest
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest
import org.springframework.security.oauth2.core.OAuth2AuthenticationException
import org.springframework.security.oauth2.core.OAuth2Error
import org.springframework.security.oauth2.core.user.DefaultOAuth2User
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.context.request.RequestContextHolder
import org.springframework.web.context.request.ServletRequestAttributes
import java.util.UUID

@Service
class CustomOAuth2UserService(
    private val memberRepository: MemberRepository,
    private val memberOAuthAccountRepository: MemberOAuthAccountRepository,
    private val jwtProvider: JwtProvider,
    private val authorizationRequestRepository: HttpCookieOAuth2AuthorizationRequestRepository,
) : DefaultOAuth2UserService() {

    @Transactional
    override fun loadUser(userRequest: OAuth2UserRequest): OAuth2User {
        try {
            return doLoadUser(userRequest)
        } catch (e: ServiceError) {
            throw OAuth2AuthenticationException(
                OAuth2Error(e.errorType.name, e.message, null),
                e.message,
                e
            )
        }
    }

    private fun doLoadUser(userRequest: OAuth2UserRequest): OAuth2User {
        val oAuth2User = super.loadUser(userRequest)

        // 1. Provider별 파싱된 사용자 정보 획득 후 필수 값 검증
        val provider = OAuthProvider.fromRegistrationId(userRequest.clientRegistration.registrationId)
        val userInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(provider, oAuth2User.attributes)
        validateUserInfo(userInfo)

        // 2. OAuth 계정 기준으로 회원을 연동/로그인/가입 처리
        val savedMember = memberRepository.save(resolveMember(userInfo))

        // 3. 후속 Handler가 사용할 OAuth2User 구성 (memberUid/role/status 등 주입)
        // Spring Security 7 에서 userNameAttributeName 은 nullable 로 선언됐다. 값이 없다는 것은
        // 해당 provider 등록에 user-name-attribute 가 빠졌다는 뜻이라 사용자 식별이 불가능하다.
        val userNameAttributeName = userRequest.clientRegistration.providerDetails.userInfoEndpoint.userNameAttributeName
            ?: throwError(ErrorType.OAUTH_PROVIDER_USER_ID_MISSING, provider.registrationId)
        return buildOAuth2User(oAuth2User, savedMember, userNameAttributeName)
    }

    /** 이메일·providerUserId 등 필수 값 존재 여부 검증. */
    private fun validateUserInfo(userInfo: OAuth2UserInfo) {
        if (userInfo.email.isBlank()) {
            throwError(ErrorType.OAUTH_EMAIL_MISSING, userInfo.provider.registrationId)
        }
        if (userInfo.providerUserId.isBlank()) {
            throwError(ErrorType.OAUTH_PROVIDER_USER_ID_MISSING, userInfo.provider.registrationId)
        }
    }

    /**
     * OAuth 사용자 정보로부터 대상 회원을 해석한다.
     *
     * - linkTarget 존재(연동 요청): 현재 회원에 연동, 단 타 회원 점유 계정이면 충돌
     * - 기존 OAuth 계정 존재: 해당 계정으로 로그인, 단 로그인 상태에서 타 회원 계정이면 충돌
     * - 로그인 상태인데 미연동 계정: 연동 전용 안내(OAUTH_LINK_REQUIRED)
     * - 그 외: 신규 회원 가입
     */
    private fun resolveMember(userInfo: OAuth2UserInfo): Member {
        val oauthAccount = memberOAuthAccountRepository.findByProviderAndProviderUserId(
            provider = userInfo.provider,
            providerUserId = userInfo.providerUserId
        )
        val linkTarget = resolveLinkTargetMember()
        val authenticatedMember = linkTarget ?: resolveAuthenticatedMember()

        return when {
            linkTarget != null -> linkAccountToMember(userInfo, oauthAccount, linkTarget)
            oauthAccount != null -> loginWithExistingAccount(userInfo, oauthAccount, authenticatedMember)
            authenticatedMember != null -> throwError(ErrorType.OAUTH_LINK_REQUIRED, userInfo.provider.registrationId)
            else -> registerNewMember(userInfo)
        }
    }

    /** 연동 요청: 대상 회원에 OAuth 계정을 신규 연동하거나 기존 프로필을 동기화한다. */
    private fun linkAccountToMember(
        userInfo: OAuth2UserInfo,
        oauthAccount: MemberOAuthAccount?,
        linkTarget: Member,
    ): Member {
        if (oauthAccount != null && oauthAccount.member.id != linkTarget.id) {
            throwError(ErrorType.OAUTH_ACCOUNT_ALREADY_LINKED, userInfo.provider.registrationId)
        }
        if (oauthAccount == null) {
            linkTarget.addOAuthAccountFrom(userInfo)
        } else {
            oauthAccount.syncProfileFrom(userInfo)
        }
        return linkTarget
    }

    /** 기존 OAuth 계정으로 로그인. 로그인 상태에서 '다른 회원' 계정이면 연동 충돌로 차단한다. */
    private fun loginWithExistingAccount(
        userInfo: OAuth2UserInfo,
        oauthAccount: MemberOAuthAccount,
        authenticatedMember: Member?,
    ): Member {
        // 링크 플래그 인식 실패 등으로 linkTarget 이 null 이어도 여기서 막아 의도치 않은 계정 전환/탈취를 방지한다.
        if (authenticatedMember != null && oauthAccount.member.id != authenticatedMember.id) {
            throwError(ErrorType.OAUTH_ACCOUNT_ALREADY_LINKED, userInfo.provider.registrationId)
        }
        oauthAccount.syncProfileFrom(userInfo)
        return oauthAccount.member
    }

    /** 신규 회원 가입(동의 대기 상태)과 OAuth 계정 연동. */
    private fun registerNewMember(userInfo: OAuth2UserInfo): Member {
        return Member.create(
            email = userInfo.email,
            nickname = "",
            memberRole = MemberRole.USER,
            profileImageUrl = null,
            status = MemberStatus.PENDING_CONSENT
        ).also { it.addOAuthAccountFrom(userInfo) }
    }

    /**
     * 후속 Handler용 OAuth2User 구성.
     * 주의: Handler에서 attributes["memberUid"] 등으로 접근하므로 내부 시스템용 데이터를 반드시 포함시킨다.
     */
    private fun buildOAuth2User(
        oAuth2User: OAuth2User,
        member: Member,
        userNameAttributeName: String,
    ): OAuth2User {
        val enrichedAttributes = HashMap<String, Any>(oAuth2User.attributes).apply {
            put("memberUid", member.uid.toString())
            put("role", member.memberRole.name)
            put("email", member.email) // Provider 구조에 따라 최상위에 없을 수 있으므로 명시적 추가
            put("status", member.status.name) // 가입 동의 대기(PENDING_CONSENT) 분기용
        }
        // userNameAttributeName: Google은 "sub", Naver는 "response", Kakao는 "id" 등
        val authorities = listOf(SimpleGrantedAuthority("ROLE_${member.memberRole.name}"))
        return DefaultOAuth2User(authorities, enrichedAttributes, userNameAttributeName)
    }

    private fun Member.addOAuthAccountFrom(userInfo: OAuth2UserInfo) {
        addOAuthAccount(
            provider = userInfo.provider,
            providerUserId = userInfo.providerUserId,
            email = userInfo.email,
            oauthNickname = userInfo.name,
            oauthProfileImageUrl = userInfo.imageUrl
        )
    }

    private fun MemberOAuthAccount.syncProfileFrom(userInfo: OAuth2UserInfo) {
        syncOAuthProfile(
            email = userInfo.email,
            nickname = userInfo.name,
            profileImageUrl = userInfo.imageUrl
        )
    }

    private fun resolveLinkTargetMember(): Member? {
        val request = getCurrentRequest() ?: return null
        val authRequest = authorizationRequestRepository.loadAuthorizationRequest(request)
        val linkFlag = authRequest?.attributes
            ?.get(HttpCookieOAuth2AuthorizationRequestRepository.LINK_FLAG_ATTRIBUTE) as? Boolean
        val linkCookie = CookieUtils.getCookie(request, HttpCookieOAuth2AuthorizationRequestRepository.LINK_FLAG_COOKIE_NAME)
        val linkCookieFlag = linkCookie?.value?.equals("true", ignoreCase = true) ?: false
        if (linkFlag != true && !linkCookieFlag) {
            return null
        }
        val accessToken = jwtProvider.resolveAccessToken(request)
            ?: throwError(ErrorType.MEMBER_ACCESS_DENIED, "link")
        val claims = jwtProvider.resolveClaims(accessToken)
            ?: throwError(ErrorType.MEMBER_ACCESS_DENIED, "link")
        val memberUid = runCatching { UUID.fromString(claims.subject) }
            .getOrElse { throwError(ErrorType.INVALID_PARAMETER, "memberUid") }
        return memberRepository.findByUid(memberUid)
            ?: throwError(ErrorType.MEMBER_NOT_FOUND, memberUid)
    }

    private fun resolveAuthenticatedMember(): Member? {
        val request = getCurrentRequest() ?: return null
        val accessToken = jwtProvider.resolveAccessToken(request) ?: return null
        val claims = jwtProvider.resolveClaims(accessToken) ?: return null
        val memberUid = runCatching { UUID.fromString(claims.subject) }.getOrNull() ?: return null
        return memberRepository.findByUid(memberUid)
    }

    private fun getCurrentRequest(): HttpServletRequest? {
        val attributes = RequestContextHolder.getRequestAttributes() as? ServletRequestAttributes
        return attributes?.request
    }
}
