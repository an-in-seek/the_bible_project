package com.elseeker.common.security.oauth.handler

import com.elseeker.common.config.ElSeekerProperties
import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.throwError
import com.elseeker.common.security.jwt.JwtProvider
import com.elseeker.common.security.oauth.repository.HttpCookieOAuth2AuthorizationRequestRepository
import com.elseeker.common.security.oauth.util.CookieUtils
import com.elseeker.member.domain.vo.MemberRole
import com.elseeker.member.domain.vo.MemberStatus
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.core.Authentication
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler
import org.springframework.stereotype.Component
import java.nio.charset.StandardCharsets
import java.util.Base64

/**
 * OAuth2 로그인 성공 핸들러.
 *
 * [웹 기준 동작]
 * 1. 인증된 사용자 정보를 기반으로 JWT Access / Refresh Token을 생성합니다.
 * 2. 두 토큰을 HttpOnly + Secure 쿠키로 설정합니다.
 * 3. 토큰을 노출하지 않고 루트("/")로 리다이렉트합니다.
 *
 * ⚠️ 보안 원칙
 * - JWT를 URL(Query / Fragment)로 전달하지 않습니다.
 * - JWT는 JavaScript에서 접근할 수 없습니다.
 *
 * 모바일 클라이언트 대응은 추후 확장을 전제로 하며,
 * 현재 구현은 웹 클라이언트 전용입니다.
 */
@Component
class OAuth2LoginSuccessHandler(
    private val jwtProvider: JwtProvider,
    private val properties: ElSeekerProperties,
    private val authorizationRequestRepository: HttpCookieOAuth2AuthorizationRequestRepository,
) : SimpleUrlAuthenticationSuccessHandler() {

    /**
     * OAuth2 인증이 성공했을 때 호출됩니다.
     *
     * - CustomOAuth2UserService에서 주입한 사용자 속성을 사용합니다.
     * - 인증 성공 시점에서만 토큰을 발급합니다.
     */
    override fun onAuthenticationSuccess(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authentication: Authentication
    ) {
        val oAuth2User = authentication.principal as OAuth2User

        // OAuth2User에 매핑된 사용자 식별 정보 추출
        val email = oAuth2User.attributes["email"] as? String ?: throwError(ErrorType.OAUTH_EMAIL_MISSING)
        val memberUid = oAuth2User.attributes["memberUid"] as? String ?: throwError(ErrorType.MEMBER_ID_MISSING)
        val role = oAuth2User.attributes["role"] as? String ?: throwError(ErrorType.INVALID_PARAMETER, "role")
        val status = oAuth2User.attributes["status"] as? String

        // returnUrl 추출 후 OAuth 인가 요청 쿠키 정리
        val returnUrl = authorizationRequestRepository.getRedirectUriFromCookie(request)
        val safeReturnUrl = returnUrl?.takeIf { it.startsWith("/") && !it.startsWith("//") }
        authorizationRequestRepository.removeAuthorizationRequestCookies(request, response)
        CookieUtils.deleteCookie(response, HttpCookieOAuth2AuthorizationRequestRepository.LINK_FLAG_COOKIE_NAME, request.isSecure)
        val cookieSecure = cookieSecure(request)

        // [신규 가입자] 동의 미완료 → 단기 Signup 토큰만 발급하고 동의 페이지로 유도 (Refresh 미발급)
        if (status == MemberStatus.PENDING_CONSENT.name) {
            val signupToken = jwtProvider.generateSignupToken(memberUid, email)
            CookieUtils.addCookie(
                response,
                JwtProvider.ACCESS_TOKEN_COOKIE_NAME,
                signupToken,
                properties.jwt.signupTokenTtl.seconds,
                cookieSecure,
            )
            // 동의 완료 후 복귀할 returnUrl 을 단기 쿠키로 보존 (기존 RETURN_URL TTL 은 동의 단계에 부족)
            if (safeReturnUrl != null) {
                val encoded = Base64.getUrlEncoder().encodeToString(safeReturnUrl.toByteArray(StandardCharsets.UTF_8))
                CookieUtils.addCookie(
                    response,
                    SIGNUP_RETURN_URL_COOKIE_NAME,
                    encoded,
                    properties.jwt.signupTokenTtl.seconds,
                    request.isSecure,
                )
            }
            redirectStrategy.sendRedirect(request, response, CONSENT_PAGE_PATH)
            return
        }

        // [기존 회원] 정식 Access / Refresh 토큰 발급
        val memberRole = runCatching { MemberRole.valueOf(role) }.getOrNull() ?: (MemberRole.fromKey(role) ?: MemberRole.USER)
        val accessToken = jwtProvider.generateAccessToken(memberUid, email, listOf(memberRole))
        val refreshToken = jwtProvider.generateRefreshToken(memberUid)

        CookieUtils.addCookie(
            response,
            JwtProvider.ACCESS_TOKEN_COOKIE_NAME,
            accessToken,
            properties.jwt.accessTokenTtl.seconds,
            cookieSecure,
        )
        CookieUtils.addCookie(
            response,
            JwtProvider.REFRESH_TOKEN_COOKIE_NAME,
            refreshToken,
            properties.jwt.refreshTokenTtl.seconds,
            cookieSecure,
        )

        redirectStrategy.sendRedirect(request, response, safeReturnUrl ?: "/")

        /*
         * TODO: 모바일 클라이언트 확장 시 고려 사항
         *
         * 1. 클라이언트 구분
         * - OAuth2 인가 요청 시 client_type(web/mobile)을 AuthorizationRequest에 저장
         * - CustomAuthorizationRequestRepository를 통해 안전하게 복원
         *
         * 2. 토큰 전달 방식
         * - JWT를 URL로 전달하는 방식은 절대 금지
         * - RDB 기반 1회성 Authorization Code 발급 후
         *   앱에서 POST /api/v1/auth/exchange 호출로 토큰 교환
         *
         * 3. Redirect URI
         * - 웹: /
         * - 앱: 커스텀 스킴 또는 App/Universal Links 사용
         */
    }

    private fun cookieSecure(request: HttpServletRequest): Boolean {
        return properties.jwt.cookieSecure ?: request.isSecure
    }

    companion object {
        /** 동의 인터스티셜 페이지 경로. */
        const val CONSENT_PAGE_PATH = "/web/auth/consent"

        /** 동의 완료 후 복귀할 returnUrl 을 보존하는 단기 쿠키 이름(Base64 인코딩). */
        const val SIGNUP_RETURN_URL_COOKIE_NAME = "SIGNUP_RETURN_URL"
    }

}
