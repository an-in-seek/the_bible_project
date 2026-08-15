package com.elseeker.common.security.oauth.apple

import com.elseeker.common.config.ElSeekerProperties
import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.throwError
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.security.oauth2.jwt.JwtException
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder
import org.springframework.stereotype.Component

private val log = KotlinLogging.logger {}

/**
 * Apple 서버-대-서버 알림(Server-to-Server Notification) 페이로드를 검증한다.
 *
 * Apple 은 사용자가 이메일 전달 설정을 바꾸거나, 앱 계정을 삭제하거나, Apple 계정 자체를 삭제할 때
 * 등록된 엔드포인트로 **서명된 JWS** 를 보낸다. 서명 키는 로그인 id_token 과 같은 JWKS
 * (`https://appleid.apple.com/auth/keys`, RS256) 다.
 *
 * 이 클래스는 신원 검증(서명·만료·iss·aud)만 책임진다. 페이로드 해석은
 * [AppleNotificationEventParser], 처리 결정은 상위 계층의 몫이다.
 */
@Component
class AppleNotificationVerifier(
    elSeekerProperties: ElSeekerProperties,
    private val appleNotificationEventParser: AppleNotificationEventParser,
) {

    /**
     * 허용할 `aud` 목록.
     *
     * 알림 엔드포인트는 primary App ID 에만 등록할 수 있어 Apple 이 웹 로그인용 Services ID 가
     * 아니라 App ID 를 보낼 수 있다. 그래서 설정으로 덮어쓸 수 있게 하고, 비었을 때만
     * Services ID 로 대체한다.
     */
    private val allowedAudiences: Set<String> = buildSet {
        val apple = elSeekerProperties.apple
        val configured = apple?.notificationAudiences.orEmpty()
            .map(String::trim)
            .filter(String::isNotBlank)
        if (configured.isNotEmpty()) {
            addAll(configured)
        } else {
            apple?.clientId?.trim()?.takeIf { it.isNotBlank() }?.let(::add)
        }
    }

    /** 알림을 검증할 수 있는 상태인지 여부. `aud` 후보가 하나도 없으면 검증 자체가 불가능하다. */
    val isConfigured: Boolean = allowedAudiences.isNotEmpty()

    /**
     * JWKS 를 원격 조회하는 디코더. Apple 서버에 대한 **기동 의존성을 만들지 않도록** 지연 생성한다.
     * [NimbusJwtDecoder] 는 첫 검증 시점에 JWKS 를 가져와 캐시하므로 Apple 의 키 교체에 자동 대응한다.
     */
    private val jwtDecoder: JwtDecoder by lazy {
        NimbusJwtDecoder.withJwkSetUri(APPLE_JWK_SET_URI).build()
    }

    /**
     * 알림 페이로드(JWS 문자열)를 검증하고 이벤트 목록으로 변환한다.
     *
     * 검증 실패는 [ErrorType.OAUTH_APPLE_NOTIFICATION_INVALID](401)로 끝낸다. Apple 이 재전송해도
     * 결과가 같으므로 5xx 로 올려 재시도를 유도할 이유가 없다.
     */
    fun verify(payload: String): AppleNotification {
        if (!isConfigured) {
            throwError(ErrorType.OAUTH_APPLE_NOTIFICATION_NOT_CONFIGURED)
        }

        val jwt = try {
            jwtDecoder.decode(payload)
        } catch (ex: JwtException) {
            log.warn(ex) { "Apple 알림 서명 검증 실패" }
            throwError(ErrorType.OAUTH_APPLE_NOTIFICATION_INVALID)
        }

        val issuer = jwt.getClaimAsString(CLAIM_ISSUER)
        if (issuer != APPLE_ISSUER) {
            log.warn { "Apple 알림 iss 불일치: expected=$APPLE_ISSUER, actual=$issuer" }
            throwError(ErrorType.OAUTH_APPLE_NOTIFICATION_INVALID)
        }

        val audiences = jwt.audience.orEmpty()
        if (audiences.none(allowedAudiences::contains)) {
            // 수신한 aud 를 남겨 둬야 el-seeker.apple.notification-audiences 에 무엇을 넣어야
            // 하는지 한 번의 배포로 알 수 있다.
            log.warn { "Apple 알림 aud 불일치: allowed=$allowedAudiences, actual=$audiences" }
            throwError(ErrorType.OAUTH_APPLE_NOTIFICATION_INVALID)
        }

        val jti = jwt.getClaimAsString(CLAIM_JWT_ID)
        if (jti.isNullOrBlank()) {
            log.warn { "Apple 알림에 jti 가 없어 중복 수신을 판별할 수 없다" }
            throwError(ErrorType.OAUTH_APPLE_NOTIFICATION_INVALID)
        }

        return AppleNotification(
            jti = jti,
            events = appleNotificationEventParser.parse(jwt.claims[CLAIM_EVENTS]),
        )
    }

    companion object {
        private const val APPLE_ISSUER = "https://appleid.apple.com"
        private const val APPLE_JWK_SET_URI = "https://appleid.apple.com/auth/keys"

        private const val CLAIM_ISSUER = "iss"
        private const val CLAIM_JWT_ID = "jti"
        private const val CLAIM_EVENTS = "events"
    }
}

/**
 * 검증을 통과한 알림 한 건.
 *
 * @property jti 알림 토큰 식별자. Apple 이 같은 알림을 재전송할 때 값이 같아 중복 판별에 쓴다.
 */
data class AppleNotification(
    val jti: String,
    val events: List<AppleNotificationEvent>,
)
