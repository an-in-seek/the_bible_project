package com.elseeker.common.security.jwt

import com.elseeker.member.domain.vo.MemberRole
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import java.util.*

data class JwtPrincipal(
    val memberUid: UUID,
    val email: String,
    val roles: List<MemberRole>,
    /** 토큰 스코프. 가입 동의 대기 토큰은 [JwtProvider.SCOPE_SIGNUP], 정식 토큰은 null. */
    val scope: String? = null
) {
    // String 기반 권한을 Spring Security 표준 GrantedAuthority로 변환
    fun getAuthorities(): Collection<GrantedAuthority> {
        return roles.map { SimpleGrantedAuthority(it.key) }
    }

    /** 가입 동의 대기(SIGNUP 스코프) 토큰 여부. */
    val isSignupScope: Boolean
        get() = scope == JwtProvider.SCOPE_SIGNUP
}
