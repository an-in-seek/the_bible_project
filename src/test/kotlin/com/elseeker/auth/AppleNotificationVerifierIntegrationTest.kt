package com.elseeker.auth

import com.elseeker.common.IntegrationTest
import com.elseeker.common.config.ElSeekerProperties
import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.ServiceError
import com.elseeker.common.security.oauth.apple.AppleNotificationEventParser
import com.elseeker.common.security.oauth.apple.AppleNotificationVerifier
import com.github.tomakehurst.wiremock.WireMockServer
import com.github.tomakehurst.wiremock.client.WireMock.get
import com.github.tomakehurst.wiremock.client.WireMock.okJson
import com.github.tomakehurst.wiremock.client.WireMock.serverError
import com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.shouldBe
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.wiremock.spring.InjectWireMock
import java.time.Duration
import java.time.Instant

/**
 * Apple 알림 서명 검증 통합테스트.
 *
 * 이 엔드포인트는 `permitAll` 이고 회원을 하드 삭제까지 할 수 있다. 즉 **이 검증이 유일한
 * 인증 수단**이므로, "Apple 이 아닌 요청은 확실히 거부되는가"를 실제 JWKS 조회 경로까지
 * 태워서 확인한다.
 *
 * 실제 `appleid.apple.com` 대신 WireMock 이 JWKS 를 내려준다
 * (`el-seeker.apple.jwk-set-uri` → `test.apple.base-url`, [IntegrationTest] 의 `@EnableWireMock`).
 * 덕분에 네트워크 없이 서명 위조·만료·발급자 위조를 모두 재현할 수 있다.
 */
@DisplayName("AppleNotificationVerifier 통합테스트")
class AppleNotificationVerifierIntegrationTest @Autowired constructor(
    private val appleNotificationVerifier: AppleNotificationVerifier,
    private val appleNotificationEventParser: AppleNotificationEventParser,
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
    @DisplayName("Apple 이 서명한 정상 알림이면 이벤트를 돌려준다")
    fun verifyValidNotification() {
        // when
        val notification = appleNotificationVerifier.verify(AppleTestTokens.signedToken())

        // then
        notification.jti shouldBe AppleTestTokens.JTI
        notification.events.size shouldBe 1
        notification.events[0].type shouldBe "consent-revoked"
        notification.events[0].sub shouldBe AppleTestTokens.APPLE_SUB
    }

    @Test
    @DisplayName("Apple 키가 아닌 다른 키로 서명하면 거부한다")
    fun rejectForgedSignature() {
        // given — kid 는 같지만 개인키가 다르다(= 위조)
        verifyShouldFail(AppleTestTokens.signedToken(signer = AppleTestTokens.forgedKey))
    }

    @Test
    @DisplayName("iss 가 Apple 이 아니면 거부한다")
    fun rejectWrongIssuer() {
        // given — 서명은 유효하지만 발급자가 다르다
        verifyShouldFail(AppleTestTokens.signedToken(issuer = "https://evil.example.com"))
    }

    @Test
    @DisplayName("aud 가 허용 목록에 없으면 거부한다")
    fun rejectWrongAudience() {
        // given — 다른 개발자의 앱으로 발급된 알림을 우리 엔드포인트로 흘려보낸 경우
        verifyShouldFail(AppleTestTokens.signedToken(audience = "com.someone.else.app"))
    }

    @Test
    @DisplayName("만료된 토큰이면 거부한다")
    fun rejectExpiredToken() {
        // given — 캡처해 둔 페이로드의 재사용을 막는다
        val past = Instant.now().minusSeconds(3600)
        verifyShouldFail(AppleTestTokens.signedToken(issuedAt = past, expiresAt = past.plusSeconds(60)))
    }

    @Test
    @DisplayName("jti 가 없으면 중복 수신을 판별할 수 없으므로 거부한다")
    fun rejectMissingJti() {
        verifyShouldFail(AppleTestTokens.signedToken(jti = null))
    }

    @Test
    @DisplayName("JWKS 를 못 가져오면 서명 위조와 구분해 5xx 로 올린다")
    fun rejectWhenJwksUnavailable() {
        // given — Apple 장애/DNS/egress 차단 상황.
        // 위조와 같은 401 로 묶으면 운영자가 공격으로 오판하고, Apple 이 재시도하지 않아
        // 실제 탈퇴가 조용히 누락된다.
        appleServer.stubFor(get(urlEqualTo(JWKS_DOWN_PATH)).willReturn(serverError()))
        // 디코더가 JWKS 를 캐시하므로, 이 케이스만 별도 인스턴스로 확인한다.
        val verifier = AppleNotificationVerifier(
            elSeekerProperties = propertiesWithJwkSetUri("${appleServer.baseUrl()}$JWKS_DOWN_PATH"),
            appleNotificationEventParser = appleNotificationEventParser,
        )

        // when & then
        val error = shouldThrow<ServiceError> { verifier.verify(AppleTestTokens.signedToken()) }
        error.errorType shouldBe ErrorType.OAUTH_APPLE_JWKS_UNAVAILABLE
    }

    private fun propertiesWithJwkSetUri(jwkSetUri: String) = ElSeekerProperties(
        jwt = ElSeekerProperties.Jwt(
            secret = "dGVzdC1zZWNyZXQta2V5LWZvci1pbnRlZ3JhdGlvbi10ZXN0LTEyMzQ=",
            accessTokenTtl = Duration.ofHours(1),
            refreshTokenTtl = Duration.ofDays(14),
        ),
        api = ElSeekerProperties.Api(baseUrl = "http://localhost:8080", apiKey = "TEST"),
        apple = ElSeekerProperties.Apple(
            clientId = "com.elseeker.test.service",
            teamId = "TEAMTEST01",
            keyId = "KEYTEST001",
            privateKey = "",
            notificationAudiences = listOf(AppleTestTokens.ALLOWED_AUDIENCE),
            jwkSetUri = jwkSetUri,
        ),
    )

    private fun verifyShouldFail(payload: String) {
        val error = shouldThrow<ServiceError> { appleNotificationVerifier.verify(payload) }
        error.errorType shouldBe ErrorType.OAUTH_APPLE_NOTIFICATION_INVALID
    }

    companion object {
        /** JWKS 조회 실패를 재현하는 별도 경로. 정상 스텁을 건드리지 않는다. */
        private const val JWKS_DOWN_PATH = "/auth/keys-down"
    }
}
