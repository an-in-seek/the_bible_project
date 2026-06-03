package com.elseeker.common.security.oauth.service

import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.ServiceError
import com.elseeker.common.domain.throwError
import com.elseeker.common.security.jwt.JwtProvider
import com.elseeker.common.security.oauth.factory.OAuth2UserInfoFactory
import com.elseeker.common.security.oauth.repository.HttpCookieOAuth2AuthorizationRequestRepository
import com.elseeker.common.security.oauth.util.CookieUtils
import com.elseeker.member.adapter.output.jpa.MemberOAuthAccountRepository
import com.elseeker.member.adapter.output.jpa.MemberRepository
import com.elseeker.member.domain.model.Member
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

        // 1. Factory를 통해 Provider별 파싱된 정보 획득
        val provider = OAuthProvider.fromRegistrationId(userRequest.clientRegistration.registrationId)
        val userInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(provider, oAuth2User.attributes)

        // 2. 이메일 검증 (필수 값인 경우)
        if (userInfo.email.isBlank()) {
            throwError(ErrorType.OAUTH_EMAIL_MISSING, provider.registrationId)
        }
        if (userInfo.providerUserId.isBlank()) {
            throwError(ErrorType.OAUTH_PROVIDER_USER_ID_MISSING, provider.registrationId)
        }

        // 3. 사용자 저장 또는 업데이트 (OAuth 계정 기준)
        val oauthAccount = memberOAuthAccountRepository.findByProviderAndProviderUserId(
            provider = userInfo.provider,
            providerUserId = userInfo.providerUserId
        )
        val linkTarget = resolveLinkTargetMember()
        val authenticatedMember = linkTarget ?: resolveAuthenticatedMember()
        val member = if (linkTarget != null) {
            if (oauthAccount != null && oauthAccount.member.id != linkTarget.id) {
                throwError(ErrorType.OAUTH_ACCOUNT_ALREADY_LINKED, userInfo.provider.registrationId)
            }
            if (oauthAccount == null) {
                linkTarget.addOAuthAccount(
                    provider = userInfo.provider,
                    providerUserId = userInfo.providerUserId,
                    email = userInfo.email,
                    oauthNickname = userInfo.name,
                    oauthProfileImageUrl = userInfo.imageUrl
                )
            } else {
                oauthAccount.syncOAuthProfile(
                    email = userInfo.email,
                    nickname = userInfo.name,
                    profileImageUrl = userInfo.imageUrl
                )
            }
            linkTarget
        } else {
            oauthAccount?.let { account ->
                account.syncOAuthProfile(
                    email = userInfo.email,
                    nickname = userInfo.name,
                    profileImageUrl = userInfo.imageUrl
                )
                account.member
            }
                ?: run {
                    if (authenticatedMember != null) {
                        throwError(ErrorType.OAUTH_LINK_REQUIRED, userInfo.provider.registrationId)
                    }
                    Member.create(
                        email = userInfo.email,
                        nickname = "",
                        memberRole = MemberRole.USER,
                        profileImageUrl = null,
                        status = MemberStatus.PENDING_CONSENT
                    ).also { newMember ->
                        newMember.addOAuthAccount(
                            provider = userInfo.provider,
                            providerUserId = userInfo.providerUserId,
                            email = userInfo.email,
                            oauthNickname = userInfo.name,
                            oauthProfileImageUrl = userInfo.imageUrl
                        )
                    }
                }
        }
        val savedMember = memberRepository.save(member)
        val savedMemberUid = savedMember.uid

        // 4. 기존 attributes에 내부 시스템용 데이터(memberUid, role) 추가
        // 주의: Handler에서 attributes["memberUid"] 등으로 접근하므로 반드시 포함시켜야 함
        val enrichedAttributes = HashMap<String, Any>(oAuth2User.attributes)
        enrichedAttributes["memberUid"] = savedMemberUid.toString()
        enrichedAttributes["role"] = savedMember.memberRole.name
        enrichedAttributes["email"] = savedMember.email // Provider 구조에 따라 최상위에 없을 수 있으므로 명시적 추가
        enrichedAttributes["status"] = savedMember.status.name // 가입 동의 대기(PENDING_CONSENT) 분기용

        // 5. authorities
        val authorities = listOf(SimpleGrantedAuthority("ROLE_${savedMember.memberRole.name}"))

        // 6. UserInfoEndpoint의 userNameAttributeName 가져오기
        // (Google은 "sub", Naver는 "response", Kakao는 "id" 등이 될 수 있음)
        val userNameAttributeName = userRequest.clientRegistration.providerDetails.userInfoEndpoint.userNameAttributeName
        return DefaultOAuth2User(authorities, enrichedAttributes, userNameAttributeName)
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
