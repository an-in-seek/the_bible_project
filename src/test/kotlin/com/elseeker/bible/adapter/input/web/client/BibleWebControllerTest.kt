package com.elseeker.bible.adapter.input.web.client

import com.elseeker.bible.adapter.input.web.client.response.BibleViewResponse
import com.elseeker.bible.application.service.BibleService
import com.elseeker.bible.domain.result.BibleResult
import com.elseeker.bible.domain.vo.BibleTranslationType
import io.kotest.matchers.collections.shouldContain
import io.kotest.matchers.collections.shouldNotContain
import io.kotest.matchers.shouldBe
import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.ui.ExtendedModelMap

/**
 * 숨김 번역본이 대역 선택 목록으로 새어 나가지 않는지 고정한다.
 *
 * 대역 목록을 `GET /api/v1/bibles/translations` 로 만들지 않은 이유가 여기 있다. 그 응답은
 * `Cache-Control: public, max-age=1d` 라 역할에 따라 달라지면 안 되고, 실제로 거르지도 않는다
 * (`BibleReader.getTranslations()` 의 허용 목록에 NKRV 가 들어 있다). 필터는 이 컨트롤러
 * 한 곳에만 있으므로, 여기가 무너지면 감춰 둔 번역본이 조용히 노출된다.
 *
 * Spring 컨텍스트를 띄우지 않으므로 Docker/DB 가 필요 없다.
 * 설계 문서: docs/bible/bible-compare-design.md §7
 */
@DisplayName("BibleWebController 단위테스트 — 숨김 번역본 노출")
class BibleWebControllerTest {

    private val bibleService = mockk<BibleService>()
    private val sut = BibleWebController(bibleService)

    @AfterEach
    fun clearSecurityContext() {
        SecurityContextHolder.clearContext()
    }

    @Test
    @DisplayName("일반 사용자의 대역 목록에는 숨김 번역본이 없다")
    fun compareTranslationsHidesNkrvForGuest() {
        // given
        givenTranslations()
        val model = ExtendedModelMap()

        // when
        sut.showVerses(model)

        // then
        translationTypesOf(model, "compareTranslations") shouldNotContain BibleTranslationType.NKRV
    }

    @Test
    @DisplayName("관리자의 대역 목록에는 숨김 번역본도 포함한다")
    fun compareTranslationsIncludesNkrvForAdmin() {
        // given
        givenTranslations()
        givenAdminAuthenticated()
        val model = ExtendedModelMap()

        // when
        sut.showVerses(model)

        // then
        translationTypesOf(model, "compareTranslations") shouldContain BibleTranslationType.NKRV
    }

    @Test
    @DisplayName("번역본 목록 화면과 대역 목록은 같은 숨김 규칙을 쓴다")
    fun translationListAndCompareListShareTheSameRule() {
        // given
        givenTranslations()
        val translationModel = ExtendedModelMap()
        val verseModel = ExtendedModelMap()

        // when
        sut.showTranslations(translationModel)
        sut.showVerses(verseModel)

        // then
        translationTypesOf(verseModel, "compareTranslations") shouldBe
            translationTypesOf(translationModel, "translations")
    }

    // ------------ Fixtures ------------
    private fun givenTranslations() {
        every { bibleService.getTranslations() } returns listOf(
            translationOf(1L, BibleTranslationType.KRV),
            translationOf(2L, BibleTranslationType.NKRV),
            translationOf(10L, BibleTranslationType.KJV),
        )
    }

    private fun givenAdminAuthenticated() {
        SecurityContextHolder.getContext().authentication = UsernamePasswordAuthenticationToken(
            "admin",
            null,
            listOf(SimpleGrantedAuthority("ROLE_ADMIN"))
        )
    }

    private fun translationOf(id: Long, type: BibleTranslationType) =
        BibleResult.Translation(
            translationId = id,
            translationType = type,
            translationName = type.displayName,
            translationLanguage = type.language
        )

    @Suppress("UNCHECKED_CAST")
    private fun translationTypesOf(model: ExtendedModelMap, attribute: String): List<BibleTranslationType> =
        (model.getAttribute(attribute) as List<BibleViewResponse.Translation>)
            .map { it.translationType }
}
