package com.elseeker.auth

import com.elseeker.common.IntegrationTest
import com.elseeker.common.security.jwt.JwtProvider
import com.elseeker.member.domain.vo.MemberRole
import jakarta.servlet.http.Cookie
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.http.HttpHeaders
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@DisplayName("ConsentGateFilter 통합테스트 — SIGNUP 스코프 접근 차단")
@AutoConfigureMockMvc
class ConsentGateFilterTest @Autowired constructor(
    private val mockMvc: MockMvc,
    private val jwtProvider: JwtProvider,
) : IntegrationTest() {

    private fun signupCookie(): Cookie =
        Cookie(JwtProvider.ACCESS_TOKEN_COOKIE_NAME, jwtProvider.generateSignupToken(member.uid.toString(), member.email))

    private fun fullAccessCookie(): Cookie =
        Cookie(
            JwtProvider.ACCESS_TOKEN_COOKIE_NAME,
            jwtProvider.generateAccessToken(member.uid.toString(), member.email, listOf(MemberRole.USER)),
        )

    @Test
    fun `SIGNUP 토큰은 보호된 API 접근 시 403 CONSENT_REQUIRED 로 차단된다`() {
        mockMvc.perform(get("/api/v1/bibles/my-memo-counts").cookie(signupCookie()))
            .andExpect(status().isForbidden)
            .andExpect { result ->
                assert(result.response.contentAsString.contains("CONSENT_REQUIRED")) {
                    "expected CONSENT_REQUIRED body but was: ${result.response.contentAsString}"
                }
            }
    }

    @Test
    fun `정식 토큰은 동일 API 에서 게이트에 막히지 않는다`() {
        mockMvc.perform(get("/api/v1/bibles/my-memo-counts").cookie(fullAccessCookie()))
            .andExpect { result ->
                assert(result.response.status != 403) {
                    "full token should pass the consent gate but got 403"
                }
            }
    }

    @Test
    fun `SIGNUP 토큰도 허용 목록인 auth me 는 통과한다`() {
        mockMvc.perform(get("/api/v1/auth/me").cookie(signupCookie()))
            .andExpect(status().isOk)
    }

    @Test
    fun `SIGNUP 토큰으로 보호된 웹 페이지 접근 시 동의 페이지로 리다이렉트된다`() {
        mockMvc.perform(
            get("/web/game")
                .header(HttpHeaders.ACCEPT, "text/html")
                .cookie(signupCookie())
        )
            .andExpect(status().is3xxRedirection)
            .andExpect(redirectedUrl("/web/auth/consent"))
    }
}
