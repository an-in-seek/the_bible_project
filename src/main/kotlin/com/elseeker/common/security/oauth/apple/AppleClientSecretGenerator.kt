package com.elseeker.common.security.oauth.apple

import com.elseeker.common.config.ElSeekerProperties
import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.throwError
import io.jsonwebtoken.Jwts
import org.springframework.stereotype.Component
import java.security.KeyFactory
import java.security.PrivateKey
import java.security.spec.PKCS8EncodedKeySpec
import java.time.Duration
import java.time.Instant
import java.util.Base64
import java.util.Date
import java.util.concurrent.atomic.AtomicReference

/**
 * Apple 로그인의 `client_secret` 을 생성한다.
 *
 * 다른 provider 와 달리 Apple 은 고정 문자열 시크릿을 받지 않는다. 개발자 개인키(.p8)로 서명한
 * **ES256 JWT** 를 매번 client_secret 으로 보내야 하며, 유효기간은 최대 6개월이다.
 * 따라서 설정값으로 박아 둘 수 없고 런타임에 만들어야 한다.
 *
 * 매 요청 서명은 낭비이므로 [SECRET_TTL] 동안 캐시하고, 만료 [REFRESH_MARGIN] 전에 재발급한다.
 */
@Component
class AppleClientSecretGenerator(
    elSeekerProperties: ElSeekerProperties,
) {

    private val config: ElSeekerProperties.Apple? = elSeekerProperties.apple
    private val cache = AtomicReference<CachedSecret?>(null)

    /** Apple 설정이 모두 주입되어 로그인을 활성화할 수 있는지 여부. */
    val isConfigured: Boolean = config != null &&
        config.clientId.isNotBlank() &&
        config.teamId.isNotBlank() &&
        config.keyId.isNotBlank() &&
        config.privateKey.isNotBlank()

    /**
     * Services ID. 인가 요청의 `client_id` 와 client_secret JWT 의 `sub` 가 반드시 같아야 하므로,
     * 이 값을 **단일 정본**으로 삼아 registration 에도 그대로 주입한다.
     * (`spring.security...apple.client-id` 와 따로 관리하면 어긋나도 토큰 교환 단계에서야 드러난다)
     */
    val clientId: String? = config?.clientId?.takeIf { it.isNotBlank() }

    /**
     * 유효한 client_secret JWT 를 반환한다. 캐시가 만료에 가까우면 새로 서명한다.
     */
    fun generate(): String {
        val settings = config?.takeIf { isConfigured } ?: throwError(ErrorType.OAUTH_APPLE_NOT_CONFIGURED)

        val now = Instant.now()
        cache.get()?.let { cached ->
            if (now.isBefore(cached.expiresAt.minus(REFRESH_MARGIN))) {
                return cached.value
            }
        }

        val expiresAt = now.plus(SECRET_TTL)
        val secret = Jwts.builder()
            .header().keyId(settings.keyId).and()
            .issuer(settings.teamId)
            .audience().add(APPLE_AUDIENCE).and()
            .subject(settings.clientId)
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiresAt))
            .signWith(loadPrivateKey(settings.privateKey), Jwts.SIG.ES256)
            .compact()

        cache.set(CachedSecret(secret, expiresAt))
        return secret
    }

    /**
     * `.p8` PEM 문자열을 EC 개인키로 변환한다.
     *
     * 환경변수로 주입할 때 개행이 `\n` 리터럴로 들어오는 경우가 흔해 함께 정규화한다.
     */
    private fun loadPrivateKey(pem: String): PrivateKey {
        val normalized = pem
            .replace("\\n", "\n")
            .replace(PEM_HEADER, "")
            .replace(PEM_FOOTER, "")
            .replace(Regex("\\s"), "")

        return try {
            val encoded = Base64.getDecoder().decode(normalized)
            KeyFactory.getInstance(KEY_ALGORITHM).generatePrivate(PKCS8EncodedKeySpec(encoded))
        } catch (ex: Exception) {
            throwError(ErrorType.OAUTH_APPLE_PRIVATE_KEY_INVALID)
        }
    }

    private data class CachedSecret(val value: String, val expiresAt: Instant)

    companion object {
        private const val APPLE_AUDIENCE = "https://appleid.apple.com"
        private const val KEY_ALGORITHM = "EC"
        private const val PEM_HEADER = "-----BEGIN PRIVATE KEY-----"
        private const val PEM_FOOTER = "-----END PRIVATE KEY-----"

        /** Apple 이 허용하는 최대치는 6개월이지만, 키 교체 여유를 두고 짧게 잡는다. */
        private val SECRET_TTL: Duration = Duration.ofDays(30)

        /** 만료 직전 요청이 실패하지 않도록 미리 재발급하는 여유 시간. */
        private val REFRESH_MARGIN: Duration = Duration.ofHours(1)
    }
}
