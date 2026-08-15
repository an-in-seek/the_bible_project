package com.elseeker.common.config

import com.elseeker.common.security.oauth.apple.AppleNotificationEventParser
import io.kotest.matchers.shouldBe
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.boot.autoconfigure.AutoConfigurations
import org.springframework.boot.jackson.autoconfigure.JacksonAutoConfiguration
import org.springframework.boot.test.context.runner.ApplicationContextRunner
import tools.jackson.databind.ObjectMapper

/**
 * Jackson 3 `ObjectMapper` 를 빈으로 주입받을 수 있는지 고정한다.
 *
 * 이 프로젝트에는 Jackson 2(`com.fasterxml.jackson`, springdoc 전용)와
 * Jackson 3(`tools.jackson`, 런타임 JSON) 두 스택이 공존한다.
 * [AppleNotificationEventParser] 는 Jackson 3 매퍼를 생성자 주입으로 받는데, 해당 타입의 빈이
 * 없거나 후보가 둘 이상이면 **애플리케이션 기동 자체가 실패한다.** 컴파일로는 잡히지 않는다.
 *
 * [ApplicationContextRunner] 를 쓰는 이유는 DB/Testcontainers 없이 자동설정 조각만 띄워
 * 확인하기 위함이다. `@SpringBootTest` 컨텍스트 캐시에 영향을 주지 않는다.
 */
class JacksonObjectMapperInjectionTest {

    private val contextRunner = ApplicationContextRunner()
        .withConfiguration(AutoConfigurations.of(JacksonAutoConfiguration::class.java))

    @Test
    @DisplayName("Jackson 3 ObjectMapper 빈이 정확히 하나 존재한다")
    fun jackson3ObjectMapperIsUnique() {
        contextRunner.run { context ->
            // 후보가 0개면 주입 실패, 2개 이상이면 NoUniqueBeanDefinitionException 으로 기동이 죽는다
            context.getBeanNamesForType(ObjectMapper::class.java).size shouldBe 1
        }
    }

    @Test
    @DisplayName("Jackson 3 ObjectMapper 로 AppleNotificationEventParser 가 생성된다")
    fun parserIsConstructible() {
        // given — 실제 빈 등록과 동일하게 생성자 주입을 컨텍스트에 맡긴다
        contextRunner.withBean(AppleNotificationEventParser::class.java).run { context ->
            // when & then — 주입에 실패하면 여기서 컨텍스트 기동 예외가 난다
            context.getBean(AppleNotificationEventParser::class.java)
                .parse("""{"type":"consent-revoked","sub":"001234.abc.1234"}""")
                .map { it.type } shouldBe listOf("consent-revoked")
        }
    }
}
