package com.elseeker.auth.adapter.input.api.client

import com.elseeker.auth.adapter.input.api.client.request.ConsentRequest
import com.elseeker.auth.adapter.input.api.client.response.ConsentResponse
import com.elseeker.auth.application.service.ConsentService
import com.elseeker.common.config.ElSeekerProperties
import com.elseeker.common.security.jwt.JwtPrincipal
import com.elseeker.common.security.jwt.JwtProvider
import com.elseeker.common.security.oauth.handler.OAuth2LoginSuccessHandler
import com.elseeker.common.security.oauth.util.CookieUtils
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.nio.charset.StandardCharsets
import java.util.Base64

@RestController
@RequestMapping("/api/v1/auth/consent")
class ConsentApi(
    private val consentService: ConsentService,
    private val jwtProvider: JwtProvider,
    private val properties: ElSeekerProperties,
) : ConsentApiDocument {

    @PostMapping
    override fun submit(
        @AuthenticationPrincipal principal: JwtPrincipal,
        @Valid @RequestBody request: ConsentRequest,
        servletRequest: HttpServletRequest,
        servletResponse: HttpServletResponse,
    ): ConsentResponse {
        val activated = consentService.submitConsent(
            principal.memberUid,
            request.toCommand(),
            resolveClientIp(servletRequest),
        )

        val redirectTo = resolveSignupReturnUrl(servletRequest) ?: "/"
        CookieUtils.deleteCookie(servletResponse, OAuth2LoginSuccessHandler.SIGNUP_RETURN_URL_COOKIE_NAME, servletRequest.isSecure)

        // 이미 활성 회원(멱등) — 토큰 재발급 없이 이동 정보만 반환
        if (!activated) {
            return ConsentResponse(redirectTo = redirectTo)
        }

        val member = consentService.getMember(principal.memberUid)
        val accessToken = jwtProvider.generateAccessToken(member.uid.toString(), member.email, listOf(member.memberRole))
        val refreshToken = jwtProvider.generateRefreshToken(member.uid.toString())

        // 모바일(Bearer) 호출은 body 로, 웹(쿠키) 호출은 HttpOnly 쿠키로 토큰 전달
        return if (isBearerRequest(servletRequest)) {
            ConsentResponse(redirectTo = redirectTo, accessToken = accessToken, refreshToken = refreshToken)
        } else {
            CookieUtils.addCookie(
                servletResponse,
                JwtProvider.ACCESS_TOKEN_COOKIE_NAME,
                accessToken,
                properties.jwt.accessTokenTtl.seconds,
                servletRequest.isSecure,
            )
            CookieUtils.addCookie(
                servletResponse,
                JwtProvider.REFRESH_TOKEN_COOKIE_NAME,
                refreshToken,
                properties.jwt.refreshTokenTtl.seconds,
                servletRequest.isSecure,
            )
            ConsentResponse(redirectTo = redirectTo)
        }
    }

    @PostMapping("/cancel")
    override fun cancel(
        @AuthenticationPrincipal principal: JwtPrincipal,
        servletRequest: HttpServletRequest,
        servletResponse: HttpServletResponse,
    ): ResponseEntity<Void> {
        consentService.cancelSignup(principal.memberUid)
        CookieUtils.deleteCookie(servletResponse, JwtProvider.ACCESS_TOKEN_COOKIE_NAME, servletRequest.isSecure)
        CookieUtils.deleteCookie(servletResponse, JwtProvider.REFRESH_TOKEN_COOKIE_NAME, servletRequest.isSecure)
        CookieUtils.deleteCookie(servletResponse, OAuth2LoginSuccessHandler.SIGNUP_RETURN_URL_COOKIE_NAME, servletRequest.isSecure)
        return ResponseEntity.noContent().build()
    }

    private fun isBearerRequest(request: HttpServletRequest): Boolean =
        request.getHeader("Authorization")?.startsWith("Bearer ") == true

    /**
     * 동의 시점 클라이언트 IP. 신뢰할 수 없는 `X-Forwarded-For` 를 직접 신뢰하지 않고,
     * 프록시 보정된 `remoteAddr` 를 사용한다(prod: `server.forward-headers-strategy`).
     */
    private fun resolveClientIp(request: HttpServletRequest): String? =
        request.remoteAddr?.takeIf { it.isNotBlank() }

    private fun resolveSignupReturnUrl(request: HttpServletRequest): String? {
        val cookie = CookieUtils.getCookie(request, OAuth2LoginSuccessHandler.SIGNUP_RETURN_URL_COOKIE_NAME) ?: return null
        return try {
            val decoded = String(Base64.getUrlDecoder().decode(cookie.value), StandardCharsets.UTF_8)
            decoded.takeIf { it.startsWith("/") && !it.startsWith("//") }
        } catch (ex: IllegalArgumentException) {
            null
        }
    }
}
