package com.elseeker.common.security.oauth.repository

import com.elseeker.common.config.ElSeekerProperties
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.mock.web.MockHttpServletResponse
import org.springframework.security.oauth2.core.AuthorizationGrantType
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest
import jakarta.servlet.http.Cookie
import java.time.Duration
import java.util.Base64

/**
 * SEC-01(OAuth2 인가요청 쿠키 Java 역직렬화 RCE) 수정 검증용 단위 테스트.
 *
 * Spring 컨텍스트/Testcontainers 없이 독립 실행되므로 Docker 가 없어도 동작한다.
 */
class HttpCookieOAuth2AuthorizationRequestRepositoryTest {

    private val secretBase64 = Base64.getEncoder()
        .encodeToString("unit-test-secret-key-which-is-long-enough-1234567890".toByteArray())

    private val repository = HttpCookieOAuth2AuthorizationRequestRepository(
        ElSeekerProperties(
            jwt = ElSeekerProperties.Jwt(
                secret = secretBase64,
                accessTokenTtl = Duration.ofHours(1),
                refreshTokenTtl = Duration.ofDays(14),
            ),
            api = ElSeekerProperties.Api(baseUrl = "http://localhost:8080", apiKey = "TEST"),
        ),
    )

    private fun sampleAuthorizationRequest(): OAuth2AuthorizationRequest =
        OAuth2AuthorizationRequest.authorizationCode()
            .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
            .clientId("client-123")
            .redirectUri("http://localhost:8080/login/oauth2/code/google")
            .scopes(setOf("openid", "email", "profile"))
            .state("state-xyz")
            .attributes(mapOf("registration_id" to "google"))
            .build()

    private fun cookieValueAfterSave(authRequest: OAuth2AuthorizationRequest): String {
        val request = MockHttpServletRequest()
        val response = MockHttpServletResponse()
        repository.saveAuthorizationRequest(authRequest, request, response)
        val cookie = response.getCookie("OAUTH2_AUTH_REQUEST")
        assertNotNull(cookie, "OAUTH2_AUTH_REQUEST 쿠키가 발급되어야 한다")
        return cookie!!.value
    }

    private fun loadFrom(cookieValue: String): OAuth2AuthorizationRequest? {
        val request = MockHttpServletRequest()
        request.setCookies(Cookie("OAUTH2_AUTH_REQUEST", cookieValue))
        return repository.loadAuthorizationRequest(request)
    }

    @Test
    fun `서버가 발급한 정상 쿠키는 원본 그대로 복원된다`() {
        val original = sampleAuthorizationRequest()

        val restored = loadFrom(cookieValueAfterSave(original))

        assertNotNull(restored)
        assertEquals(original.clientId, restored!!.clientId)
        assertEquals(original.state, restored.state)
        assertEquals(original.authorizationUri, restored.authorizationUri)
        assertEquals(original.redirectUri, restored.redirectUri)
        assertEquals(original.scopes, restored.scopes)
        assertEquals(AuthorizationGrantType.AUTHORIZATION_CODE, restored.grantType)
    }

    @Test
    fun `payload가 위변조된 쿠키는 서명 검증 실패로 복원되지 않는다`() {
        val signed = cookieValueAfterSave(sampleAuthorizationRequest())
        val separator = signed.indexOf('.')
        val payload = signed.substring(0, separator)
        val signature = signed.substring(separator + 1)

        // payload 의 첫 글자를 바꿔 서명과 불일치하도록 만든다.
        val tamperedChar = if (payload[0] == 'A') 'B' else 'A'
        val tampered = tamperedChar + payload.substring(1) + "." + signature

        assertNull(loadFrom(tampered), "위변조된 payload 는 null 로 거부되어야 한다")
    }

    @Test
    fun `서명이 없는 구버전(순수 Base64) 쿠키는 역직렬화되지 않는다`() {
        // 수정 전 포맷: 서명 구분자('.') 없이 Base64 만 존재하는 쿠키.
        val legacyLike = Base64.getUrlEncoder().encodeToString(byteArrayOf(1, 2, 3, 4, 5))

        assertTrue(!legacyLike.contains('.'))
        assertNull(loadFrom(legacyLike), "서명 없는 쿠키는 null 로 거부되어야 한다")
    }

    @Test
    fun `임의의 쓰레기 값 쿠키도 예외 없이 null 을 반환한다`() {
        assertNull(loadFrom("not-a-valid-cookie"))
        assertNull(loadFrom("."))
        assertNull(loadFrom("garbage.signature"))
    }
}
