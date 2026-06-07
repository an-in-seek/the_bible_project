package com.elseeker.common.security.jwt

import com.elseeker.common.config.ElSeekerProperties
import com.elseeker.common.security.oauth.util.CookieUtils
import com.elseeker.member.application.service.MemberService
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

/**
 * JWT 리프레시 처리를 담당하는 Spring Security 필터입니다.
 *
 * Access Token이 없거나 만료된 요청에 대해 Refresh Token을 검증하고,
 * 유효한 경우 새로운 Access Token을 발급합니다.
 *
 * Refresh Token이 유효하지 않은 경우에는 인증을 강제하지 않고
 * 요청을 그대로 다음 필터로 전달합니다.
 */
@Component
class JwtRefreshFilter(
    private val jwtProvider: JwtProvider,
    private val memberService: MemberService,
    private val properties: ElSeekerProperties,
) : OncePerRequestFilter() {

    /**
     * 리프레시 전용 엔드포인트는 별도의 컨트롤러에서 처리하므로
     * 본 필터 적용 대상에서 제외합니다.
     *
     * @param request HTTP 요청
     * @return 필터 제외 여부
     */
    override fun shouldNotFilter(request: HttpServletRequest): Boolean {
        return request.requestURI == "/api/v1/auth/refresh"
    }

    /**
     * Refresh Token을 이용해 Access Token을 재발급하고 인증 정보를 설정합니다.
     *
     * 처리 흐름은 다음과 같습니다.
     * 1. 이미 인증 정보가 존재하는 경우 필터를 종료합니다.
     * 2. 유효한 Access Token이 존재하는 경우 필터를 종료합니다.
     * 3. Refresh Token을 검증합니다.
     * 4. Refresh Token이 유효한 경우 새로운 Access Token을 발급합니다.
     * 5. 발급된 Access Token을 쿠키에 저장하고 인증 정보를 등록합니다.
     *
     * @param request HTTP 요청
     * @param response HTTP 응답
     * @param filterChain 필터 체인
     */
    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val existingAuth = SecurityContextHolder.getContext().authentication
        if (existingAuth != null && existingAuth.isAuthenticated) {
            filterChain.doFilter(request, response)
            return
        }
        val accessToken = jwtProvider.resolveAccessToken(request)
        val accessClaims = accessToken?.let(jwtProvider::resolveClaims)
        if (accessClaims != null) {
            filterChain.doFilter(request, response)
            return
        }
        val refreshToken = jwtProvider.resolveRefreshToken(request)
        val refreshClaims = refreshToken?.let(jwtProvider::resolveRefreshClaims)
        if (refreshClaims == null) {
            filterChain.doFilter(request, response)
            return
        }
        val memberUid = runCatching { java.util.UUID.fromString(refreshClaims.subject) }.getOrNull()
        if (memberUid == null) {
            filterChain.doFilter(request, response)
            return
        }
        // orphaned session: refresh 토큰은 유효하나 회원이 없음(탈퇴/삭제).
        // 필터 내부에서 throwError(404)를 던지면 @RestControllerAdvice가 못 잡아 500이 되므로,
        // nullable 조회로 처리 — 쿠키를 삭제해 ghost 세션을 끊고 미인증 상태로 체인을 계속한다.
        val member = memberService.findMember(memberUid)
        if (member == null) {
            CookieUtils.deleteCookie(response, JwtProvider.ACCESS_TOKEN_COOKIE_NAME, cookieSecure(request))
            CookieUtils.deleteCookie(response, JwtProvider.REFRESH_TOKEN_COOKIE_NAME, cookieSecure(request))
            filterChain.doFilter(request, response)
            return
        }
        val roles = listOf(member.memberRole)
        val newAccessToken = jwtProvider.generateAccessToken(
            member.uid.toString(),
            member.email,
            roles
        )
        CookieUtils.addCookie(
            response,
            JwtProvider.ACCESS_TOKEN_COOKIE_NAME,
            newAccessToken,
            properties.jwt.accessTokenTtl.seconds,
            cookieSecure(request)
        )
        val principal = JwtPrincipal(member.uid, member.email, roles)
        val authorities = roles.map { SimpleGrantedAuthority(it.key) }
        val authentication = UsernamePasswordAuthenticationToken(principal, null, authorities)
            .apply {
                details = WebAuthenticationDetailsSource().buildDetails(request)
            }
        SecurityContextHolder.getContext().authentication = authentication
        filterChain.doFilter(request, response)
    }

    private fun cookieSecure(request: HttpServletRequest): Boolean {
        return properties.jwt.cookieSecure ?: request.isSecure
    }

}
