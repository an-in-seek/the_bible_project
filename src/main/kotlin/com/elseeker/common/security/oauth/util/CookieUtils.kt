package com.elseeker.common.security.oauth.util

import jakarta.servlet.http.Cookie
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpHeaders
import org.springframework.http.ResponseCookie

object CookieUtils {

    // 보안 강화를 위해 SameSite 기본값은 Lax로 고정합니다.
    const val SAME_SITE_LAX = "Lax"

    /**
     * cross-site POST 로 돌아오는 콜백에서도 쿠키가 전송되어야 할 때만 사용합니다.
     * (Apple 로그인의 `response_mode=form_post`)
     * 브라우저 규칙상 `Secure` 와 함께여야 유효하므로 HTTPS 환경에서만 지정하세요.
     */
    const val SAME_SITE_NONE = "None"

    private const val DEFAULT_SAME_SITE = SAME_SITE_LAX

    fun getCookie(request: HttpServletRequest, name: String): Cookie? {
        return request.cookies?.firstOrNull { it.name == name }
    }

    fun addCookie(
        response: HttpServletResponse,
        name: String,
        value: String,
        maxAgeSeconds: Long,
        secure: Boolean,
        sameSite: String = DEFAULT_SAME_SITE,
    ) {
        val cookie = ResponseCookie.from(name, value)
            .httpOnly(true)
            .secure(secure)
            .path("/")
            .maxAge(maxAgeSeconds)
            .sameSite(sameSite)
            .build()
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString())
    }

    fun deleteCookie(
        response: HttpServletResponse,
        name: String,
        secure: Boolean,
        sameSite: String = DEFAULT_SAME_SITE,
    ) {
        val cookie = ResponseCookie.from(name, "")
            .httpOnly(true)
            .secure(secure)
            .path("/")
            .maxAge(0)
            .sameSite(sameSite)
            .build()
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString())
    }
}
