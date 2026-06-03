package com.elseeker.common.security.jwt

import com.elseeker.common.security.oauth.handler.OAuth2LoginSuccessHandler
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpStatus
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

/**
 * 가입 동의 대기(SIGNUP 스코프) 회원의 서비스 접근을 차단하는 필터.
 *
 * [JwtAuthenticationFilter] 직후에 동작하며, 인증 주체의 토큰이 SIGNUP 스코프인 경우
 * 동의 관련 경로(허용 목록) 외 모든 요청을 차단한다.
 * - 웹(HTML) 요청 → 동의 페이지로 리다이렉트
 * - API 요청 → 403 + `CONSENT_REQUIRED`
 *
 * 토큰 클레임만으로 판정하므로 DB 조회가 없다.
 */
@Component
class ConsentGateFilter : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val principal = SecurityContextHolder.getContext().authentication?.principal as? JwtPrincipal
        if (principal != null && principal.isSignupScope && !isAllowed(request)) {
            val acceptHeader = request.getHeader("Accept").orEmpty()
            val isHtmlRequest = acceptHeader.contains("text/html")
            if (isHtmlRequest && request.requestURI.startsWith("/web/")) {
                response.sendRedirect(OAuth2LoginSuccessHandler.CONSENT_PAGE_PATH)
            } else {
                response.status = HttpStatus.FORBIDDEN.value()
                response.contentType = "application/json;charset=UTF-8"
                response.writer.write("""{"status":403,"code":"CONSENT_REQUIRED","message":"약관 동의가 필요합니다."}""")
            }
            return
        }
        filterChain.doFilter(request, response)
    }

    /**
     * 가입 동의 대기 상태에서도 접근을 허용하는 경로.
     * 동의 페이지/제출/취소, 내 정보 조회, 약관 페이지, 로그아웃, OAuth, 정적 리소스.
     */
    private fun isAllowed(request: HttpServletRequest): Boolean {
        // 후행 슬래시 정규화 — 정확 매칭 항목이 "/path/" 변형으로 우회되지 않도록 함
        val raw = request.requestURI
        val uri = if (raw.length > 1) raw.trimEnd('/') else raw
        return uri == OAuth2LoginSuccessHandler.CONSENT_PAGE_PATH ||
            uri == "/api/v1/auth/consent" ||
            uri == "/api/v1/auth/consent/cancel" ||
            uri == "/api/v1/auth/me" ||
            uri == "/web/auth/logout" ||
            uri == "/error" ||
            uri == "/favicon.ico" ||
            uri.startsWith("/web/legal/") ||
            uri.startsWith("/oauth2/") ||
            uri.startsWith("/login/oauth2/") ||
            uri.startsWith("/css/") ||
            uri.startsWith("/js/") ||
            uri.startsWith("/images/") ||
            uri.startsWith("/webjars/")
    }
}
