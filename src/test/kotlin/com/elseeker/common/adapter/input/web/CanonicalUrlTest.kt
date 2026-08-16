package com.elseeker.common.adapter.input.web

import io.kotest.matchers.string.shouldContain
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.thymeleaf.context.Context
import org.thymeleaf.spring6.SpringTemplateEngine
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver
import org.thymeleaf.templateresolver.StringTemplateResolver

/**
 * `fragments/head` 의 canonical 계산 단위테스트.
 *
 * canonical 은 SEO 뿐 아니라 **상단 공유 버튼이 공유할 URL 의 origin/path** 이기도 하다
 * (`share.js#buildShareUrl`). 여기가 틀어지면 어떤 화면에서 눌러도 루트가 공유된다.
 *
 * 실제로 `#httpServletRequest` 를 쓰던 시절 그 사고가 났다. Thymeleaf 3.1 이 그 표현식 객체를
 * 없애면서 **예외가 아니라 조용히 null** 이 되고, canonical 이 siteUrl 로 폴백했다. 렌더링은
 * 멀쩡해서 눈에 띄지 않는다. 그래서 결과 마크업으로 고정한다.
 *
 * Spring 컨텍스트 없이 Thymeleaf 엔진만 띄우므로 Docker/DB 가 필요 없다.
 */
@DisplayName("head 프래그먼트 단위테스트 — canonical / og:url")
class CanonicalUrlTest {

    // 운영과 같은 SpEL 로 평가하도록 Spring 용 엔진을 쓴다. 기본 TemplateEngine 은 OGNL 이라
    // 표현식 평가 방식이 달라 이 테스트가 잡으려는 사고를 재현하지 못한다.
    private val engine = SpringTemplateEngine().apply {
        addTemplateResolver(
            ClassLoaderTemplateResolver().apply {
                prefix = "templates/"
                suffix = ".html"
                setCharacterEncoding("UTF-8")
                order = 1
                isCacheable = false
                setCheckExistence(true)
            }
        )
        // 프래그먼트에 인자를 넘기려면 호출하는 템플릿이 필요해, 문자열 템플릿으로 감싼다.
        addTemplateResolver(
            StringTemplateResolver().apply {
                order = 2
                isCacheable = false
            }
        )
    }

    @Test
    @DisplayName("currentPath 가 있으면 canonical 은 운영 도메인 + 현재 경로다")
    fun canonical() {
        // when
        val html = renderHead(currentPath = "/web/study/bible-genealogy")

        // then
        html shouldContain """<link rel="canonical" href="https://elseeker.com/web/study/bible-genealogy">"""
    }

    @Test
    @DisplayName("og:url 도 canonical 과 같은 값을 쓴다")
    fun ogUrl() {
        // when
        val html = renderHead(currentPath = "/web/community/42")

        // then
        html shouldContain """content="https://elseeker.com/web/community/42""""
    }

    @Test
    @DisplayName("컨트롤러가 canonicalUrl 을 지정하면 그 값이 이긴다")
    fun canonical_explicitOverride() {
        // when
        val html = renderHead(currentPath = "/web/study", canonicalUrl = "https://elseeker.com/web/study/dictionary")

        // then
        html shouldContain """<link rel="canonical" href="https://elseeker.com/web/study/dictionary">"""
    }

    @Test
    @DisplayName("currentPath 가 없으면 루트로 폴백한다")
    fun canonical_withoutCurrentPath() {
        // when
        val html = renderHead(currentPath = null)

        // then
        html shouldContain """<link rel="canonical" href="https://elseeker.com">"""
    }

    private fun renderHead(currentPath: String?, canonicalUrl: String? = null): String {
        val context = Context().apply {
            currentPath?.let { setVariable("currentPath", it) }
            canonicalUrl?.let { setVariable("canonicalUrl", it) }
        }
        return engine.process(
            """<div th:replace="~{fragments/head :: head('테스트 | ElSeeker', true, '')}"></div>""",
            context
        )
    }
}
