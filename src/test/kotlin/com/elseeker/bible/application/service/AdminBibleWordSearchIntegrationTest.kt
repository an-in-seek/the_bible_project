package com.elseeker.bible.application.service

import com.elseeker.bible.adapter.output.jpa.BibleTranslationRepository
import com.elseeker.bible.adapter.output.jpa.BibleWordRepository
import com.elseeker.bible.domain.model.BibleTranslation
import com.elseeker.bible.domain.model.BibleWord
import com.elseeker.bible.domain.vo.BibleTranslationType
import com.elseeker.bible.domain.vo.BibleWordCategory
import com.elseeker.common.IntegrationTest
import com.neovisionaries.i18n.LanguageCode
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.shouldBe
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort

/**
 * 관리자 어휘 목록의 동적 조건 조회 검증.
 *
 * 검색어를 비웠을 때 바인딩되는 `null` 파라미터의 타입은 **실제 DB 에 나가야만** 드러난다.
 * 예전에는 `LIKE CONCAT('%', :term, '%')` 라 null 이 bytea 로 바인딩되어
 * `operator does not exist: character varying ~~ bytea` 로 500 이 났다.
 */
@DisplayName("관리자 어휘 목록 조회 통합테스트")
class AdminBibleWordSearchIntegrationTest @Autowired constructor(
    private val sut: AdminBibleWordService,
    private val translationRepository: BibleTranslationRepository,
    private val wordRepository: BibleWordRepository,
) : IntegrationTest() {

    private var translationId: Long = 0

    @BeforeEach
    fun setUpWords() {
        val translation = translationRepository.save(
            BibleTranslation(
                translationType = BibleTranslationType.KRV,
                name = "개역한글",
                translationOrder = 1,
                languageCode = LanguageCode.ko,
            )
        )
        translationId = translation.id!!

        wordRepository.save(BibleWord.approvedOf(translationId, "하나님", BibleWordCategory.CONCEPT, null))
        wordRepository.save(BibleWord.approvedOf(translationId, "빛", BibleWordCategory.CONCEPT, null))
    }

    @Test
    @DisplayName("검색어가 없으면 번역본의 어휘를 모두 조회한다")
    fun findAllWithoutTerm() {
        // when
        val result = sut.findAll(translationId, null, null, null, PAGEABLE)

        // then
        result.content shouldHaveSize 2
    }

    @Test
    @DisplayName("검색어를 주면 부분 일치하는 어휘만 조회한다")
    fun findAllWithTerm() {
        // when
        val result = sut.findAll(translationId, null, null, "나님", PAGEABLE)

        // then
        result.content.map { it.term } shouldBe listOf("하나님")
    }

    companion object {
        private val PAGEABLE = PageRequest.of(0, 20, Sort.by("term"))
    }
}
