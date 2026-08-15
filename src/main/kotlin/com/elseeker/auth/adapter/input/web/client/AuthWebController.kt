package com.elseeker.auth.adapter.input.web.client

import com.elseeker.common.security.jwt.JwtProvider
import com.elseeker.common.security.oauth.apple.AppleClientSecretGenerator
import com.elseeker.common.security.oauth.util.CookieUtils
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.core.Authentication
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestParam

@Controller
class AuthWebController(
    private val appleClientSecretGenerator: AppleClientSecretGenerator,
) {

    @GetMapping("/web/auth/login")
    fun showLogin(
        @RequestParam(required = false) returnUrl: String?,
        authentication: Authentication?,
        model: Model,
    ): String {
        // SSR 접근 시에도 서버가 인증 여부를 확인하고 적절히 이동시킵니다.
        if (authentication != null && authentication.isAuthenticated && authentication.principal != "anonymousUser") {
            val safeReturnUrl = returnUrl?.takeIf { it.startsWith("/") && !it.startsWith("//") }
            return "redirect:${safeReturnUrl ?: "/"}"
        }
        // Apple 설정(el-seeker.apple.*)이 없으면 버튼을 숨긴다.
        // 노출해 두면 눌렀을 때 registration 을 찾지 못해 오류 페이지로 떨어진다.
        model.addAttribute("appleLoginEnabled", appleClientSecretGenerator.isConfigured)
        return "login/login"
    }

    @GetMapping("/web/auth/logout")
    fun logout(
        @RequestParam(required = false) returnUrl: String?,
        request: HttpServletRequest,
        response: HttpServletResponse,
    ): String {
        CookieUtils.deleteCookie(response, JwtProvider.Companion.ACCESS_TOKEN_COOKIE_NAME, request.isSecure)
        CookieUtils.deleteCookie(response, JwtProvider.Companion.REFRESH_TOKEN_COOKIE_NAME, request.isSecure)
        val safeReturnUrl = returnUrl?.takeIf { it.startsWith("/") && !it.startsWith("//") }
        return "redirect:${safeReturnUrl ?: "/"}"
    }
}