package com.elseeker.auth

import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.ServiceError
import com.elseeker.common.security.oauth.apple.AppleNotificationEventParser
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.shouldBe
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import tools.jackson.databind.json.JsonMapper
import java.time.Instant

/**
 * Apple 알림 `events` 클레임 파싱 검증.
 *
 * Apple 은 이 클레임을 JSON 을 문자열로 한 번 더 감싸 보내고, 필드 타입도 문서와 어긋나는 사례가
 * 잦다. 여기서 막지 못하면 규정 준수용 알림이 조용히 버려지므로 변칙 케이스를 함께 고정한다.
 */
class AppleNotificationEventParserTest {

    private val sut = AppleNotificationEventParser(JsonMapper.builder().build())

    @Test
    @DisplayName("문자열로 감싼 단일 JSON 객체를 이벤트로 읽는다")
    fun parseSingleObject() {
        // given
        val claim = """{"type":"account-delete","sub":"$APPLE_SUB","event_time":1700000000000}"""

        // when
        val events = sut.parse(claim)

        // then
        events.size shouldBe 1
        events[0].type shouldBe "account-delete"
        events[0].sub shouldBe APPLE_SUB
        events[0].occurredAt shouldBe Instant.ofEpochMilli(1700000000000)
    }

    @Test
    @DisplayName("이벤트가 배열로 오면 전부 읽는다")
    fun parseArray() {
        // given
        val claim = """[
            {"type":"email-disabled","sub":"$APPLE_SUB"},
            {"type":"consent-revoked","sub":"$APPLE_SUB"}
        ]"""

        // when
        val events = sut.parse(claim)

        // then
        events.map { it.type } shouldBe listOf("email-disabled", "consent-revoked")
    }

    @Test
    @DisplayName("is_private_email 이 문자열 \"true\" 여도 boolean 으로 읽는다")
    fun parseStringifiedBoolean() {
        // given — Apple 이 boolean 대신 문자열을 보내는 사례
        val claim = """{"type":"email-enabled","sub":"$APPLE_SUB","is_private_email":"true"}"""

        // when
        val events = sut.parse(claim)

        // then
        events[0].isPrivateEmail shouldBe true
    }

    @Test
    @DisplayName("event_time 이 문자열이어도 밀리초 epoch 으로 읽는다")
    fun parseStringifiedEventTime() {
        // given
        val claim = """{"type":"consent-revoked","sub":"$APPLE_SUB","event_time":"1700000000000"}"""

        // when
        val events = sut.parse(claim)

        // then
        events[0].occurredAt shouldBe Instant.ofEpochMilli(1700000000000)
    }

    @Test
    @DisplayName("event_time 이 초 단위여도 자릿수로 판별해 올바른 시각으로 읽는다")
    fun parseSecondsEventTime() {
        // given — Apple 문서 예시는 초, 실수신 보고는 밀리초라 둘 다 들어올 수 있다
        val claim = """{"type":"consent-revoked","sub":"$APPLE_SUB","event_time":1700000000}"""

        // when
        val events = sut.parse(claim)

        // then — 밀리초로 잘못 읽으면 1970년이 된다
        events[0].occurredAt shouldBe Instant.ofEpochSecond(1700000000)
    }

    @Test
    @DisplayName("type 또는 sub 이 없는 이벤트는 버린다")
    fun parseDropsIncompleteEvent() {
        // given — sub 이 없으면 누구에게 적용할지 알 수 없다
        val claim = """[{"type":"consent-revoked"},{"sub":"$APPLE_SUB"},{"type":"consent-revoked","sub":"$APPLE_SUB"}]"""

        // when
        val events = sut.parse(claim)

        // then
        events.size shouldBe 1
    }

    @Test
    @DisplayName("events 클레임이 없으면 빈 목록을 반환한다")
    fun parseNull() {
        // when & then
        sut.parse(null) shouldBe emptyList()
    }

    @Test
    @DisplayName("이미 풀린 Map 으로 들어와도 읽는다")
    fun parseDecodedMap() {
        // given — Apple 이 문자열이 아닌 중첩 객체로 보내는 경우에 대한 방어
        val claim = mapOf("type" to "account-delete", "sub" to APPLE_SUB)

        // when
        val events = sut.parse(claim)

        // then
        events[0].sub shouldBe APPLE_SUB
    }

    @Test
    @DisplayName("JSON 이 깨져 있으면 검증 실패로 처리한다")
    fun parseBrokenJson() {
        // when & then
        val error = shouldThrow<ServiceError> { sut.parse("{not-json") }
        error.errorType shouldBe ErrorType.OAUTH_APPLE_NOTIFICATION_INVALID
    }

    companion object {
        private const val APPLE_SUB = "001234.abcdef0123456789.1234"
    }
}
