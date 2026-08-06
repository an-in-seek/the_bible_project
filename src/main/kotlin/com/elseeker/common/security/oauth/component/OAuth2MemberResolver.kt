package com.elseeker.common.security.oauth.component

import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.throwError
import com.elseeker.common.security.jwt.JwtProvider
import com.elseeker.common.security.oauth.info.OAuth2UserInfo
import com.elseeker.common.security.oauth.repository.HttpCookieOAuth2AuthorizationRequestRepository
import com.elseeker.common.security.oauth.result.OAuth2MemberResult
import com.elseeker.common.security.oauth.util.CookieUtils
import com.elseeker.member.adapter.output.jpa.MemberOAuthAccountRepository
import com.elseeker.member.adapter.output.jpa.MemberRepository
import com.elseeker.member.domain.model.Member
import com.elseeker.member.domain.model.MemberOAuthAccount
import com.elseeker.member.domain.vo.MemberRole
import com.elseeker.member.domain.vo.MemberStatus
import jakarta.servlet.http.HttpServletRequest
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.context.request.RequestContextHolder
import org.springframework.web.context.request.ServletRequestAttributes
import java.util.UUID

/**
 * OAuth 사용자 정보로부터 회원을 연동/로그인/가입 처리하는 컴포넌트.
 *
 * 트랜잭션 경계를 여기에 두는 이유는 두 가지다.
 *
 * 1. `CustomOAuth2UserService` 는 `DefaultOAuth2UserService` 를 상속하는데, 그 부모 클래스의
 *    `setRestOperations`/`setRequestEntityConverter` 가 `final` 이라 AOP 프록시 대상이 되면
 *    CGLIB 이 해당 메서드를 가로챌 수 없다는 경고를 남긴다. 상속 클래스에서 `@Transactional` 을
 *    걷어내면 프록시 자체가 만들어지지 않는다.
 * 2. provider 의 userinfo 엔드포인트 호출(HTTP)이 트랜잭션 안에 들어가지 않게 되어,
 *    외부 응답을 기다리는 동안 DB 커넥션을 붙잡지 않는다.
 */
@Component
class OAuth2MemberResolver(
    private val memberRepository: MemberRepository,
    private val memberOAuthAccountRepository: MemberOAuthAccountRepository,
    private val jwtProvider: JwtProvider,
    private val authorizationRequestRepository: HttpCookieOAuth2AuthorizationRequestRepository,
) {

    /**
     * OAuth 사용자 정보에 대응하는 회원을 확정하고 저장한다.
     *
     * `open-in-view: false` 이므로 엔티티가 아니라 [OAuth2MemberResult] 를 돌려준다.
     */
    @Transactional
    fun resolveMember(userInfo: OAuth2UserInfo): OAuth2MemberResult {
        val member = memberRepository.save(resolveTargetMember(userInfo))
        return OAuth2MemberResult(
            uid = member.uid,
            email = member.email,
            memberRole = member.memberRole,
            status = member.status
        )
    }

    /**
     * OAuth 사용자 정보로부터 대상 회원을 해석한다.
     *
     * - linkTarget 존재(연동 요청): 현재 회원에 연동, 단 타 회원 점유 계정이면 충돌
     * - 기존 OAuth 계정 존재: 해당 계정으로 로그인, 단 로그인 상태에서 타 회원 계정이면 충돌
     * - 로그인 상태인데 미연동 계정: 연동 전용 안내(OAUTH_LINK_REQUIRED)
     * - 그 외: 신규 회원 가입
     */
    private fun resolveTargetMember(userInfo: OAuth2UserInfo): Member {
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
