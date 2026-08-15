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
import com.nimbusds.jose.JWSAlgorithm
import com.nimbusds.jose.JWSHeader
import com.nimbusds.jose.crypto.RSASSASigner
import com.nimbusds.jose.jwk.JWKSet
import com.nimbusds.jose.jwk.RSAKey
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator
import com.nimbusds.jwt.JWTClaimsSet
import com.nimbusds.jwt.SignedJWT
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.shouldBe
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.wiremock.spring.InjectWireMock
import java.time.Duration
import java.time.Instant
import java.util.Date

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
            get(urlEqualTo("/auth/keys"))
                .willReturn(okJson(JWKSet(signingKey.toPublicJWK()).toString()))
        )
    }

    @Test
    @DisplayName("Apple 이 서명한 정상 알림이면 이벤트를 돌려준다")
    fun verifyValidNotification() {
        // given
        val payload = signedToken()

        // when
        val notification = appleNotificationVerifier.verify(payload)

        // then
        notification.jti shouldBe JTI
        notification.events.size shouldBe 1
        notification.events[0].type shouldBe "consent-revoked"
        notification.events[0].sub shouldBe APPLE_SUB
    }

    @Test
    @DisplayName("Apple 키가 아닌 다른 키로 서명하면 거부한다")
    fun rejectForgedSignature() {
        // given — kid 는 같지만 개인키가 다르다(= 위조)
        val payload = signedToken(signer = forgedKey)

        // when & then
        verifyShouldFail(payload)
    }

    @Test
    @DisplayName("iss 가 Apple 이 아니면 거부한다")
    fun rejectWrongIssuer() {
        // given — 서명은 유효하지만 발급자가 다르다
        val payload = signedToken(issuer = "https://evil.example.com")

        // when & then
        verifyShouldFail(payload)
    }

    @Test
    @DisplayName("aud 가 허용 목록에 없으면 거부한다")
    fun rejectWrongAudience() {
        // given — 다른 개발자의 앱으로 발급된 알림을 우리 엔드포인트로 흘려보낸 경우
        val payload = signedToken(audience = "com.someone.else.app")

        // when & then
        verifyShouldFail(payload)
    }

    @Test
    @DisplayName("만료된 토큰이면 거부한다")
    fun rejectExpiredToken() {
        // given — 캡처해 둔 페이로드의 재사용을 막는다
        val past = Instant.now().minusSeconds(3600)
        val payload = signedToken(issuedAt = past, expiresAt = past.plusSeconds(60))

        // when & then
        verifyShouldFail(payload)
    }

    @Test
    @DisplayName("jti 가 없으면 중복 수신을 판별할 수 없으므로 거부한다")
    fun rejectMissingJti() {
        // given
        val payload = signedToken(jti = null)

        // when & then
        verifyShouldFail(payload)
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
        val error = shouldThrow<ServiceError> { verifier.verify(signedToken()) }
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
            notificationAudiences = listOf(ALLOWED_AUDIENCE),
            jwkSetUri = jwkSetUri,
        ),
    )

    private fun verifyShouldFail(payload: String) {
        val error = shouldThrow<ServiceError> { appleNotificationVerifier.verify(payload) }
        error.errorType shouldBe ErrorType.OAUTH_APPLE_NOTIFICATION_INVALID
    }

    /** Apple 이 보내는 형태의 알림 토큰을 만든다. 인자를 바꿔 각 거부 조건을 재현한다. */
    private fun signedToken(
        issuer: String = APPLE_ISSUER,
        audience: String = ALLOWED_AUDIENCE,
        jti: String? = JTI,
        issuedAt: Instant = Instant.now(),
        expiresAt: Instant = Instant.now().plusSeconds(600),
        signer: RSAKey = signingKey,
    ): String {
        val claims = JWTClaimsSet.Builder()
            .issuer(issuer)
            .audience(audience)
            .issueTime(Date.from(issuedAt))
            .expirationTime(Date.from(expiresAt))
            .apply { jti?.let { jwtID(it) } }
            // Apple 은 events 를 JSON 을 문자열로 감싸 보낸다
            .claim("events", """{"type":"consent-revoked","sub":"$APPLE_SUB","event_time":1700000000000}""")
            .build()

        // kid 는 항상 JWKS 에 있는 것으로 둔다. 위조 케이스는 개인키만 바꿔 서명 불일치를 만든다.
        val header = JWSHeader.Builder(JWSAlgorithm.RS256).keyID(signingKey.keyID).build()
        return SignedJWT(header, claims).apply { sign(RSASSASigner(signer)) }.serialize()
    }

    companion object {
        private const val APPLE_ISSUER = "https://appleid.apple.com"
        private const val JTI = "0e0e0e0e-1111-2222-3333-444444444444"
        private const val APPLE_SUB = "001234.abcdef0123456789.1234"

        /** `application-test.yml` 의 `el-seeker.apple.notification-audiences` 와 일치해야 한다. */
        private const val ALLOWED_AUDIENCE = "com.elseeker.test.app"

        private const val KEY_ID = "apple-test-key"

        /** JWKS 조회 실패를 재현하는 별도 경로. 정상 스텁(/auth/keys)을 건드리지 않는다. */
        private const val JWKS_DOWN_PATH = "/auth/keys-down"

        /** JWKS 로 내려주는 키. Apple 의 서명 키 역할. */
        private val signingKey: RSAKey = RSAKeyGenerator(2048).keyID(KEY_ID).generate()

        /** JWKS 에 없는 키. 공격자가 임의로 서명한 상황을 만든다. */
        private val forgedKey: RSAKey = RSAKeyGenerator(2048).keyID(KEY_ID).generate()
    }
}
