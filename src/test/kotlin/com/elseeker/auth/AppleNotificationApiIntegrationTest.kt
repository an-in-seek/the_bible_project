package com.elseeker.auth

import com.elseeker.auth.adapter.output.jpa.AppleNotificationAuditRepository
import com.elseeker.common.IntegrationTest
import com.github.tomakehurst.wiremock.WireMockServer
import com.github.tomakehurst.wiremock.client.WireMock.get
import com.github.tomakehurst.wiremock.client.WireMock.okJson
import com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo
import io.kotest.matchers.shouldBe
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.wiremock.spring.InjectWireMock
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

/**
 * Apple 알림 엔드포인트 HTTP 계층 검증.
 *
 * 라우팅·`Content-Type` 협상·`permitAll` 은 실제로 HTTP 를 태워야만 확인된다. 특히 이 엔드포인트는
 * **Apple 이 어떤 형태로 보낼지 우리가 통제할 수 없다.** 매칭에 실패하면 Spring 이 415 를 내는데
 * 기본 리졸버가 DEBUG 로만 남기므로, 알림이 유실돼도 로그에 흔적이 없다.
 * 그래서 "어떤 Content-Type 이든 일단 받아 낸다"를 여기서 고정한다.
 */
@DisplayName("AppleNotificationApi 통합테스트")
class AppleNotificationApiIntegrationTest @Autowired constructor(
    private val mockMvc: MockMvc,
    private val appleNotificationAuditRepository: AppleNotificationAuditRepository,
) : IntegrationTest() {

    @InjectWireMock("apple")
    private lateinit var appleServer: WireMockServer

    @BeforeEach
    fun stubJwks() {
        appleServer.stubFor(
            get(urlEqualTo(AppleTestTokens.JWKS_PATH))
                .willReturn(okJson(AppleTestTokens.jwksJson()))
        )
    }

    @Test
    @DisplayName("문서상 형태인 JSON 으로 보내면 인증 없이 200 을 돌려주고 처리한다")
    fun receiveJsonNotification() {
        // given — 호출자가 Apple 서버라 세션도 토큰도 없다(permitAll)
        val body = """{"payload":"${AppleTestTokens.signedToken()}"}"""

        // when & then
        mockMvc.perform(
            post(ENDPOINT).contentType(MediaType.APPLICATION_JSON).content(body)
        ).andExpect { it.response.status shouldBe 200 }

        appleNotificationAuditRepository.count() shouldBe 1
    }

    @Test
    @DisplayName("폼 인코딩으로 보내도 처리한다")
    fun receiveFormNotification() {
        // given — Apple 이 폼으로 보내는 사례가 보고돼 있다
        val body = "payload=" + URLEncoder.encode(AppleTestTokens.signedToken(), StandardCharsets.UTF_8)

        // when & then
        mockMvc.perform(
            post(ENDPOINT).contentType(MediaType.APPLICATION_FORM_URLENCODED).content(body)
        ).andExpect { it.response.status shouldBe 200 }

        appleNotificationAuditRepository.count() shouldBe 1
    }

    @Test
    @DisplayName("Content-Type 이 예상 밖이어도 415 로 흘리지 않고 처리한다")
    fun receiveNotificationWithUnexpectedContentType() {
        // given — 폴백이 없으면 415 가 나고, 그 사실이 DEBUG 로만 남아 알림이 조용히 유실된다
        val body = """{"payload":"${AppleTestTokens.signedToken()}"}"""

        // when & then
        mockMvc.perform(
            post(ENDPOINT).contentType(MediaType.TEXT_PLAIN).content(body)
        ).andExpect { it.response.status shouldBe 200 }

        appleNotificationAuditRepository.count() shouldBe 1
    }

    @Test
    @DisplayName("본문이 JWS 문자열 그대로여도 처리한다")
    fun receiveBareJwsBody() {
        // given — 감싸는 형식 없이 토큰만 오는 경우까지 받아 낸다
        val body = AppleTestTokens.signedToken()

        // when & then
        mockMvc.perform(
            post(ENDPOINT).contentType(MediaType.TEXT_PLAIN).content(body)
        ).andExpect { it.response.status shouldBe 200 }

        appleNotificationAuditRepository.count() shouldBe 1
    }

    @Test
    @DisplayName("서명이 위조되면 401 로 거부하고 아무것도 기록하지 않는다")
    fun rejectForgedNotification() {
        // given
        val forged = AppleTestTokens.signedToken(signer = AppleTestTokens.forgedKey)
        val body = """{"payload":"$forged"}"""

        // when & then
        mockMvc.perform(
            post(ENDPOINT).contentType(MediaType.APPLICATION_JSON).content(body)
        ).andExpect { it.response.status shouldBe 401 }

        appleNotificationAuditRepository.count() shouldBe 0
    }

    @Test
    @DisplayName("payload 가 없으면 400 으로 거부한다")
    fun rejectMissingPayload() {
        // when & then
        mockMvc.perform(
            post(ENDPOINT).contentType(MediaType.APPLICATION_JSON).content("{}")
        ).andExpect { it.response.status shouldBe 400 }

        appleNotificationAuditRepository.count() shouldBe 0
    }

    companion object {
        private const val ENDPOINT = "/api/v1/auth/apple/notifications"
    }
}
