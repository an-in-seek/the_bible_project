package com.elseeker.common.security.oauth.apple

import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.throwError
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.stereotype.Component
import tools.jackson.databind.ObjectMapper
import java.time.Instant

private val log = KotlinLogging.logger {}

/**
 * Apple 알림 JWT 의 `events` 클레임을 [AppleNotificationEvent] 목록으로 변환한다.
 *
 * 서명 검증([AppleNotificationVerifier])과 분리해 둔 이유는, Apple 이 이 클레임을 규격대로 보내지
 * 않는 사례가 많아 **파싱 자체가 별도로 검증할 가치가 있는 로직**이기 때문이다.
 *
 * 알려진 변칙:
 * - `events` 가 중첩 객체가 아니라 **JSON 을 문자열로 한 번 더 감싼 값**이다.
 * - 값이 단일 객체일 때와 배열일 때가 모두 보고돼 있다.
 * - `is_private_email` 이 boolean 이 아니라 문자열 `"true"` 로 오는 경우가 있다.
 * - `event_time` 은 초가 아니라 **밀리초** 단위 epoch 이며, 문자열로 오는 경우가 있다.
 */
@Component
class AppleNotificationEventParser(
    private val objectMapper: ObjectMapper,
) {

    /**
     * @param rawEventsClaim JWT 의 `events` 클레임 원본. 문자열(정상) 또는 이미 풀린 객체/배열.
     */
    fun parse(rawEventsClaim: Any?): List<AppleNotificationEvent> {
        if (rawEventsClaim == null) {
            return emptyList()
        }

        val decoded = if (rawEventsClaim is String) {
            if (rawEventsClaim.isBlank()) {
                return emptyList()
            }
            runCatching { objectMapper.readValue(rawEventsClaim, Any::class.java) }
                .getOrElse {
                    log.warn(it) { "Apple 알림 events 클레임 파싱 실패" }
                    throwError(ErrorType.OAUTH_APPLE_NOTIFICATION_INVALID)
                }
        } else {
            rawEventsClaim
        }

        val entries = if (decoded is List<*>) decoded else listOf(decoded)
        return entries.filterIsInstance<Map<*, *>>().mapNotNull(::toEvent)
    }

    /** `type` 또는 `sub` 가 없으면 무엇을 누구에게 적용할지 알 수 없으므로 버린다. */
    private fun toEvent(raw: Map<*, *>): AppleNotificationEvent? {
        val type = (raw[FIELD_TYPE] as? String)?.takeIf { it.isNotBlank() }
        val sub = (raw[FIELD_SUB] as? String)?.takeIf { it.isNotBlank() }
        if (type == null || sub == null) {
            log.warn { "Apple 알림 이벤트에 type 또는 sub 이 없어 무시한다" }
            return null
        }
        return AppleNotificationEvent(
            type = type,
            sub = sub,
            email = (raw[FIELD_EMAIL] as? String)?.takeIf { it.isNotBlank() },
            isPrivateEmail = when (val value = raw[FIELD_IS_PRIVATE_EMAIL]) {
                is Boolean -> value
                is String -> value.toBooleanStrictOrNull()
                else -> null
            },
            occurredAt = when (val value = raw[FIELD_EVENT_TIME]) {
                is Number -> value.toLong()
                is String -> value.toLongOrNull()
                else -> null
            }?.let(::toInstant),
        )
    }

    /**
     * `event_time` 을 [Instant] 로 바꾼다.
     *
     * Apple 문서와 실제 수신 보고가 **초와 밀리초로 엇갈린다.** 자릿수로 판별하는 이유는,
     * 초 값을 밀리초로 읽으면 1970년이 되고 밀리초 값을 초로 읽으면 수만 년 뒤가 되어
     * 어느 쪽도 조용히 넘어가면 감사 기록의 시각이 통째로 쓸모없어지기 때문이다.
     */
    private fun toInstant(epoch: Long): Instant =
        if (epoch >= EPOCH_MILLIS_THRESHOLD) Instant.ofEpochMilli(epoch) else Instant.ofEpochSecond(epoch)

    companion object {
        private const val FIELD_TYPE = "type"
        private const val FIELD_SUB = "sub"
        private const val FIELD_EMAIL = "email"
        private const val FIELD_IS_PRIVATE_EMAIL = "is_private_email"
        private const val FIELD_EVENT_TIME = "event_time"

        /**
         * 초/밀리초 판별 경계. 현실적인 epoch 초는 약 1.7e9, 밀리초는 약 1.7e12 이므로
         * 1e11 을 기준으로 두면 서기 5138년까지 초 값을 안전하게 초로 읽는다.
         */
        private const val EPOCH_MILLIS_THRESHOLD = 100_000_000_000L
    }
}

/**
 * 알림에 담긴 개별 이벤트.
 *
 * @property type Apple 이 보낸 원본 타입 문자열. 모르는 타입도 버리지 않고 그대로 보관한다.
 * @property sub Apple 사용자 식별자. `member_oauth_account.provider_user_id` 와 대응한다.
 * @property occurredAt Apple 이 알려 준 이벤트 발생 시각(UTC).
 */
data class AppleNotificationEvent(
    val type: String,
    val sub: String,
    val email: String?,
    val isPrivateEmail: Boolean?,
    val occurredAt: Instant?,
)
