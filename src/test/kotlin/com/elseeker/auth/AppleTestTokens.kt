package com.elseeker.auth

import com.nimbusds.jose.JWSAlgorithm
import com.nimbusds.jose.JWSHeader
import com.nimbusds.jose.crypto.RSASSASigner
import com.nimbusds.jose.jwk.JWKSet
import com.nimbusds.jose.jwk.RSAKey
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator
import com.nimbusds.jwt.JWTClaimsSet
import com.nimbusds.jwt.SignedJWT
import java.time.Instant
import java.util.Date

/**
 * Apple 알림 토큰 테스트 픽스처.
 *
 * **키를 여기 하나로 모아 두는 것이 필수다.** `AppleNotificationVerifier` 는 싱글턴이고 내부
 * `NimbusJwtDecoder` 가 JWKS 를 한 번 가져와 캐시한다. 테스트 클래스마다 키를 따로 만들면
 * 먼저 실행된 클래스의 JWKS 가 캐시에 남아, 나중 클래스의 `kid` 를 찾지 못해
 * **실행 순서에 따라 성패가 갈린다.**
 */
object AppleTestTokens {

    const val APPLE_ISSUER = "https://appleid.apple.com"
    const val JTI = "0e0e0e0e-1111-2222-3333-444444444444"
    const val APPLE_SUB = "001234.abcdef0123456789.1234"

    /** `application-test.yml` 의 `el-seeker.apple.notification-audiences` 와 일치해야 한다. */
    const val ALLOWED_AUDIENCE = "com.elseeker.test.app"

    const val JWKS_PATH = "/auth/keys"

    private const val KEY_ID = "apple-test-key"

    /** JWKS 로 내려주는 키. Apple 의 서명 키 역할. */
    val signingKey: RSAKey = RSAKeyGenerator(2048).keyID(KEY_ID).generate()

    /** JWKS 에 실리지 않는 키. 공격자가 임의로 서명한 상황을 만든다. */
    val forgedKey: RSAKey = RSAKeyGenerator(2048).keyID(KEY_ID).generate()

    /** WireMock 이 `/auth/keys` 로 내려줄 JWKS 문서. */
    fun jwksJson(): String = JWKSet(signingKey.toPublicJWK()).toString()

    /** Apple 이 보내는 형태의 알림 토큰. 인자를 바꿔 각 거부 조건을 재현한다. */
    fun signedToken(
        issuer: String = APPLE_ISSUER,
        audience: String = ALLOWED_AUDIENCE,
        jti: String? = JTI,
        eventType: String = "consent-revoked",
        sub: String = APPLE_SUB,
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
            .claim("events", """{"type":"$eventType","sub":"$sub","event_time":1700000000000}""")
            .build()

        // kid 는 항상 JWKS 에 있는 것으로 둔다. 위조 케이스는 개인키만 바꿔 서명 불일치를 만든다.
        val header = JWSHeader.Builder(JWSAlgorithm.RS256).keyID(KEY_ID).build()
        return SignedJWT(header, claims).apply { sign(RSASSASigner(signer)) }.serialize()
    }
}
