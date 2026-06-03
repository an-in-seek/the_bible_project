package com.elseeker.common.security.jwt

import com.elseeker.member.domain.vo.MemberRole
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
 * JWT 기반 인증을 처리하는 Spring Security 필터입니다.
 *
 * HTTP 요청에 포함된 Access Token을 파싱하여,
 * 유효한 경우 인증 정보를 생성하고 [SecurityContextHolder]에 등록합니다.
 *
 * 토큰이 없거나 유효하지 않은 경우에는 인증을 강제하지 않고
 * 다음 필터로 요청을 그대로 전달합니다.
 */
@Component
class JwtAuthenticationFilter(
    private val jwtProvider: JwtProvider
) : OncePerRequestFilter() {

    /**
     * 요청마다 Access Token을 확인하여 인증 정보를 설정합니다.
     *
     * - Access Token이 존재하고 유효한 경우 인증 객체를 생성합니다.
     * - 토큰이 없거나 파싱에 실패한 경우 인증 없이 요청을 통과시킵니다.
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
        val token = jwtProvider.resolveAccessToken(request)
        if (!token.isNullOrBlank()) {
            val claims = jwtProvider.resolveClaims(token)
            if (claims != null) {
                val memberUid = runCatching { java.util.UUID.fromString(claims.subject) }.getOrNull()
                val email = claims["email"]?.toString().orEmpty()
                val rolesClaim = claims["roles"]
                val roles = when (rolesClaim) {
                    is Collection<*> -> rolesClaim.mapNotNull { it?.toString() }
                    is Array<*> -> rolesClaim.mapNotNull { it?.toString() }
                    else -> emptyList()
                }.mapNotNull { roleValue ->
                    runCatching { MemberRole.valueOf(roleValue) }.getOrNull()
                        ?: MemberRole.fromKey(roleValue)
                }
                val scope = claims[JwtProvider.SCOPE_CLAIM]?.toString()
                if (memberUid != null && roles.isNotEmpty()) {
                    val principal = JwtPrincipal(memberUid, email, roles, scope)
                    val authorities = roles.map { SimpleGrantedAuthority(it.key) }
                    val authentication = UsernamePasswordAuthenticationToken(principal, null, authorities)
                        .apply {
                            details = WebAuthenticationDetailsSource().buildDetails(request)
                        }
                    SecurityContextHolder.getContext().authentication = authentication
                }
            }
        }
        filterChain.doFilter(request, response)
    }
}
