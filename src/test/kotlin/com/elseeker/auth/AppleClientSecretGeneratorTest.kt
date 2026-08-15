package com.elseeker.auth

import com.elseeker.common.config.ElSeekerProperties
import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.ServiceError
import com.elseeker.common.security.oauth.apple.AppleClientSecretGenerator
import io.jsonwebtoken.Jwts
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import java.security.KeyPair
import java.security.KeyPairGenerator
import java.security.spec.ECGenParameterSpec
import java.time.Duration
import java.util.Base64

/**
 * Apple `client_secret` 생성 검증.
 *
 * Apple 개인키(.p8)는 PKCS#8 PEM 이므로 테스트에서 동형의 EC 키를 만들어 사용한다.
 * 실제 Apple 발급 키가 없어도 파싱·서명 경로 전체를 검증할 수 있다.
 */
class AppleClientSecretGeneratorTest {

    private val keyPair: KeyPair = KeyPairGenerator.getInstance("EC").apply {
        initialize(ECGenParameterSpec("secp256r1"))
    }.generateKeyPair()

    @Test
    @DisplayName("Apple 규격에 맞는 ES256 client_secret 을 생성한다")
    fun generate() {
        // given
        val sut = AppleClientSecretGenerator(propertiesOf(privateKey = toPem(keyPair)))

        // when
        val secret = sut.generate()

        // then — Apple 공개키로 검증되어야 하고, 클레임이 Apple 규격과 일치해야 한다
        val parsed = Jwts.parser()
            .verifyWith(keyPair.public)
            .build()
            .parseSignedClaims(secret)

        parsed.header.keyId shouldBe KEY_ID
        parsed.payload.issuer shouldBe TEAM_ID
        parsed.payload.subject shouldBe CLIENT_ID
        parsed.payload.audience shouldBe setOf("https://appleid.apple.com")
        parsed.payload.expiration shouldNotBe null
    }

    @Test
    @DisplayName("PEM 개행이 \\n 리터럴로 들어와도 개인키를 읽는다")
    fun generateWithEscapedNewlines() {
        // given — 환경변수로 주입할 때 흔한 형태
        val escaped = toPem(keyPair).replace("\n", "\\n")
        val sut = AppleClientSecretGenerator(propertiesOf(privateKey = escaped))

        // when
        val secret = sut.generate()

        // then
        secret.isNotBlank() shouldBe true
    }

    @Test
    @DisplayName("만료 전 재호출하면 캐시된 client_secret 을 재사용한다")
    fun generateUsesCache() {
        // given
        val sut = AppleClientSecretGenerator(propertiesOf(privateKey = toPem(keyPair)))

        // when
        val first = sut.generate()
        val second = sut.generate()

        // then
        second shouldBe first
    }

    @Test
    @DisplayName("설정값이 비어 있으면 비활성 상태이며 생성 시 오류를 던진다")
    fun generateWithoutConfiguration() {
        // given
        val sut = AppleClientSecretGenerator(propertiesOf(privateKey = ""))

        // when & then
        sut.isConfigured shouldBe false
        val error = shouldThrow<ServiceError> { sut.generate() }
        error.errorType shouldBe ErrorType.OAUTH_APPLE_NOT_CONFIGURED
    }

    @Test
    @DisplayName("개인키 형식이 잘못되면 오류를 던진다")
    fun generateWithBrokenPrivateKey() {
        // given
        val sut = AppleClientSecretGenerator(propertiesOf(privateKey = "-----BEGIN PRIVATE KEY-----\nnot-a-key\n-----END PRIVATE KEY-----"))

        // when & then
        val error = shouldThrow<ServiceError> { sut.generate() }
        error.errorType shouldBe ErrorType.OAUTH_APPLE_PRIVATE_KEY_INVALID
    }

    private fun propertiesOf(privateKey: String) = ElSeekerProperties(
        jwt = ElSeekerProperties.Jwt(
            secret = Base64.getEncoder().encodeToString(ByteArray(32)),
            accessTokenTtl = Duration.ofHours(1),
            refreshTokenTtl = Duration.ofDays(14),
        ),
        api = ElSeekerProperties.Api(baseUrl = "http://localhost:8080", apiKey = "TEST"),
        apple = ElSeekerProperties.Apple(
            clientId = CLIENT_ID,
            teamId = TEAM_ID,
            keyId = KEY_ID,
            privateKey = privateKey,
        ),
    )

    /** 개인키를 Apple `.p8` 과 동일한 PKCS#8 PEM 문자열로 만든다. */
    private fun toPem(keyPair: KeyPair): String {
        val encoded = Base64.getMimeEncoder(64, "\n".toByteArray()).encodeToString(keyPair.private.encoded)
        return "-----BEGIN PRIVATE KEY-----\n$encoded\n-----END PRIVATE KEY-----\n"
    }

    companion object {
        private const val CLIENT_ID = "com.elseeker.service"
        private const val TEAM_ID = "TEAM123456"
        private const val KEY_ID = "KEY1234567"
    }
}
