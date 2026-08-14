package com.elseeker.common.config

import com.elseeker.game.adapter.input.api.client.response.OxAnswerResponse
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldContain
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import tools.jackson.databind.json.JsonMapper
import java.time.Instant

/**
 * Spring Boot 4 의 JSON 직렬화는 Jackson 3(tools.jackson) 이 담당하고,
 * JacksonAutoConfiguration 이 findAndAddModules() 로 클래스패스의 모듈을 등록한다.
 *
 * tools.jackson 코틀린 모듈이 빠지면 `val isCorrect: Boolean` 의 게터가 자바빈 규칙으로 해석되어
 * JSON 키가 "correct" 로 바뀐다. 응답 스펙이 조용히 어긋나므로 여기서 이름을 고정한다.
 */
class JacksonKotlinModuleTest {

    private val sut = JsonMapper.builder().findAndAddModules().build()

    @Test
    @DisplayName("is 로 시작하는 코틀린 프로퍼티는 이름 그대로 직렬화된다")
    fun serializeIsPrefixedProperty() {
        // given
        val response = OxAnswerResponse(
            isCorrect = true,
            correctAnswer = true,
            currentScore = 1,
            answeredAt = Instant.parse("2024-01-15T10:31:00Z")
        )

        // when
        val json = sut.writeValueAsString(response)

        // then
        json shouldContain "\"isCorrect\":true"
    }

    @Test
    @DisplayName("is 로 시작하는 코틀린 프로퍼티는 같은 이름으로 역직렬화된다")
    fun deserializeIsPrefixedProperty() {
        // given
        val json = """
            {"isCorrect":true,"correctAnswer":true,"currentScore":1,"answeredAt":"2024-01-15T10:31:00Z"}
        """.trimIndent()

        // when
        val response = sut.readValue(json, OxAnswerResponse::class.java)

        // then
        response.isCorrect shouldBe true
    }
}
