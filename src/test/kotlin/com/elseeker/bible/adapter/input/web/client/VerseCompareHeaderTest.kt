package com.elseeker.bible.adapter.input.web.client

import com.elseeker.bible.adapter.input.web.client.response.BibleViewResponse
import com.elseeker.bible.domain.result.BibleResult
import com.elseeker.bible.domain.vo.BibleTranslationType
import io.kotest.matchers.string.shouldContain
import io.kotest.matchers.string.shouldNotContain
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.thymeleaf.context.Context
import org.thymeleaf.spring6.SpringTemplateEngine
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver
import org.thymeleaf.templateresolver.StringTemplateResolver

/**
 * 상단바 대역 컨트롤이 실제로 렌더되는지 고정한다.
 *
 * `header` 는 모든 화면이 쓰는 프래그먼트라, 여기가 깨지면 성경 화면 하나가 아니라 사이트가
 * 통째로 500 이 난다. 그리고 대역 목록은 서버가 내려준 값만 담아야 한다 — 이 어긋남은
 * 렌더링 결과로만 잡힌다(모델은 맞는데 템플릿이 다른 값을 쓰는 경우).
 *
 * `CanonicalUrlTest` 와 같은 방식으로 Spring 컨텍스트 없이 Thymeleaf 엔진만 띄운다.
 * 설계 문서: docs/bible/bible-compare-design.md §4.1
 */
@DisplayName("header 프래그먼트 단위테스트 — 대역 비교 컨트롤")
class VerseCompareHeaderTest {

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
        addTemplateResolver(
            StringTemplateResolver().apply {
                order = 2
                isCacheable = false
            }
        )
    }

    @Test
    @DisplayName("구절 화면에서는 서버가 내려준 번역본만 대역 후보로 렌더한다")
    fun rendersCompareOptionsOnVersePage() {
        // when
        val html = renderHeader(useVerseFontBoot = true, compareTranslations = listOf(krv(), kjv()))

        // then
        html shouldContain """id="verseCompareControl""""
        html shouldContain """data-compare-id="1""""
        html shouldContain """data-compare-type="KRV""""
        html shouldContain """data-compare-id="10""""
        html shouldContain """data-compare-type="KJV""""
        // 목록에 없는 번역본은 화면에도 없어야 한다
        html shouldNotContain "NKRV"
    }

    @Test
    @DisplayName("대역을 끄는 선택지가 늘 함께 있다")
    fun rendersCompareOffOption() {
        // when
        val html = renderHeader(useVerseFontBoot = true, compareTranslations = listOf(kjv()))

        // then
        html shouldContain "대역 끄기"
    }

    @Test
    @DisplayName("구절 화면이 아니면 대역 컨트롤을 렌더하지 않는다")
    fun hidesCompareControlOnOtherPages() {
        // when
        val html = renderHeader(useVerseFontBoot = false, compareTranslations = null)

        // then
        html shouldNotContain "verseCompareControl"
    }

    private fun renderHeader(
        useVerseFontBoot: Boolean,
        compareTranslations: List<BibleViewResponse.Translation>?
    ): String {
        val context = Context().apply {
            setVariable("useVerseFontBoot", useVerseFontBoot)
            setVariable("compareTranslations", compareTranslations)
            setVariable("pageTitle", "성경 구절 목록")
        }
        return engine.process(
            """<div th:replace="~{fragments/header :: header}"></div>""",
            context
        )
    }

    private fun krv() = translationOf(1L, BibleTranslationType.KRV)

    private fun kjv() = translationOf(10L, BibleTranslationType.KJV)

    private fun translationOf(id: Long, type: BibleTranslationType) =
        BibleViewResponse.Translation.from(
            BibleResult.Translation(
                translationId = id,
                translationType = type,
                translationName = type.displayName,
                translationLanguage = type.language
            )
        )
}
