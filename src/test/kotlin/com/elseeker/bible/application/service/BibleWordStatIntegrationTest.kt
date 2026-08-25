package com.elseeker.bible.application.service

import com.elseeker.bible.adapter.output.jpa.BibleBookRepository
import com.elseeker.bible.adapter.output.jpa.BibleChapterRepository
import com.elseeker.bible.adapter.output.jpa.BibleTranslationRepository
import com.elseeker.bible.adapter.output.jpa.BibleVerseRepository
import com.elseeker.bible.adapter.output.jpa.BibleWordRepository
import com.elseeker.bible.adapter.output.jpa.BibleWordStatRepository
import com.elseeker.bible.domain.model.BibleBook
import com.elseeker.bible.domain.model.BibleChapter
import com.elseeker.bible.domain.model.BibleTranslation
import com.elseeker.bible.domain.model.BibleVerse
import com.elseeker.bible.domain.model.BibleWord
import com.elseeker.bible.domain.model.BibleWordStat
import com.elseeker.bible.domain.vo.BibleBookKey
import com.elseeker.bible.domain.vo.BibleTestamentType
import com.elseeker.bible.domain.vo.BibleTranslationType
import com.elseeker.bible.domain.vo.BibleWordCategory
import com.elseeker.bible.domain.vo.BibleWordStatSource
import com.elseeker.bible.domain.vo.BibleWordStatus
import com.elseeker.common.IntegrationTest
import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.ServiceError
import com.neovisionaries.i18n.LanguageCode
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.nulls.shouldNotBeNull
import io.kotest.matchers.shouldBe
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired

/**
 * 단어 빈도 통계 재계산·조회 통합 검증.
 *
 * 단위 테스트로 못 잡는 **계약**만 담는다. 특히 `MANUAL 보존`과 `낡은 AUTO 행 제거`는
 * 구현이 UPSERT 로 되돌아가면 곧바로 깨지는 안전망이다.
 */
@DisplayName("단어 빈도 통계 통합테스트")
class BibleWordStatIntegrationTest @Autowired constructor(
    private val adminBibleWordStatService: AdminBibleWordStatService,
    private val bibleWordStatService: BibleWordStatService,
    private val translationRepository: BibleTranslationRepository,
    private val bookRepository: BibleBookRepository,
    private val chapterRepository: BibleChapterRepository,
    private val verseRepository: BibleVerseRepository,
    private val wordRepository: BibleWordRepository,
    private val statRepository: BibleWordStatRepository,
) : IntegrationTest() {

    private var translationId: Long = 0
    private lateinit var godWord: BibleWord

    @BeforeEach
    fun setUpBible() {
        val translation = translationRepository.save(
            BibleTranslation(
                translationType = BibleTranslationType.KRV,
                name = "개역한글",
                translationOrder = 1,
                languageCode = LanguageCode.ko,
            )
        )
        translationId = translation.id!!

        val book = bookRepository.save(
            BibleBook(
                translationId = translationId,
                bookKey = BibleBookKey.GEN,
                bookOrder = BOOK_ORDER,
                name = "창세기",
                abbreviation = "창",
                testamentType = BibleTestamentType.OLD,
            )
        )
        val chapter = chapterRepository.save(BibleChapter.of(bookId = book.id!!, chapterNumber = 1))
        verseRepository.save(BibleVerse(chapterId = chapter.id!!, verseNumber = 1, text = "태초에 하나님이 천지를 창조하시니라"))
        verseRepository.save(BibleVerse(chapterId = chapter.id!!, verseNumber = 2, text = "하나님이 빛을 보시니 하나님이 좋았더라"))

        godWord = wordRepository.save(
            BibleWord.approvedOf(translationId, "하나님", BibleWordCategory.CONCEPT, null)
        )
        wordRepository.save(BibleWord.approvedOf(translationId, "빛", BibleWordCategory.CONCEPT, null))
    }

    @Test
    @DisplayName("같은 범위를 두 번 재계산해도 행 수와 값이 같다")
    fun recalculateIsIdempotent() {
        // when
        adminBibleWordStatService.recalculateBook(translationId, BOOK_ORDER)
        val first = statRepository.countByTranslationIdAndBookOrder(translationId, BOOK_ORDER)

        adminBibleWordStatService.recalculateBook(translationId, BOOK_ORDER)
        val second = statRepository.countByTranslationIdAndBookOrder(translationId, BOOK_ORDER)

        // then
        second shouldBe first
        chapterCountOf(godWord.id!!) shouldBe 3
    }

    @Test
    @DisplayName("관리자가 고친 값은 재계산해도 유지된다")
    fun manualValueSurvivesRecalculation() {
        // given
        adminBibleWordStatService.recalculateBook(translationId, BOOK_ORDER)
        val target = statRepository.findAll()
            .first { it.bibleWordId == godWord.id && it.chapterNumber == 1 }
        adminBibleWordStatService.updateCount(target.id!!, 999)

        // when
        adminBibleWordStatService.recalculateBook(translationId, BOOK_ORDER)

        // then — 이 계약이 깨지면 관리자가 공들여 고친 값이 재계산 한 번에 사라진다
        val after = statRepository.findAll()
            .first { it.bibleWordId == godWord.id && it.chapterNumber == 1 }
        after.wordCount shouldBe 999
        after.source shouldBe BibleWordStatSource.MANUAL
    }

    @Test
    @DisplayName("어휘를 차단하고 재계산하면 그 단어의 AUTO 행이 남지 않는다")
    fun blockedWordLeavesNoStaleAutoRow() {
        // given
        adminBibleWordStatService.recalculateBook(translationId, BOOK_ORDER)
        chapterCountOf(godWord.id!!) shouldBe 3

        // when — 차단 후 재계산
        godWord.changeStatus(BibleWordStatus.BLOCKED)
        wordRepository.save(godWord)
        adminBibleWordStatService.recalculateBook(translationId, BOOK_ORDER)

        // then — UPSERT 구현으로 되돌아가면 낡은 AUTO 행이 그대로 남아 여기서 깨진다
        statRepository.findAll().filter { it.bibleWordId == godWord.id } shouldHaveSize 0
    }

    @Test
    @DisplayName("사용자 조회는 빈도 내림차순으로 반환하고 재계산 시각을 함께 준다")
    fun userQueryReturnsSortedStats() {
        // given
        adminBibleWordStatService.recalculateBook(translationId, BOOK_ORDER)

        // when
        val chapter = bibleWordStatService.getChapterWordStat(translationId, BOOK_ORDER, 1, 100)
        val book = bibleWordStatService.getBookWordStat(translationId, BOOK_ORDER, 100)

        // then
        chapter.bookName shouldBe "창세기"
        chapter.chapterNumber shouldBe 1
        chapter.items.first().term shouldBe "하나님"
        chapter.items.first().wordCount shouldBe 3
        chapter.calculatedAt.shouldNotBeNull()

        book.chapterNumber shouldBe null
        book.items.first().term shouldBe "하나님"
    }

    @Test
    @DisplayName("관리자가 직접 넣은 장 행은 재계산 후 책 합계에 더해진다")
    fun manualRowJoinsBookTotal() {
        // given — 본문에 없어 자동 집계로는 절대 생기지 않는 표제어
        adminBibleWordStatService.recalculateBook(translationId, BOOK_ORDER)
        val angel = wordRepository.save(
            BibleWord.approvedOf(translationId, "천사", BibleWordCategory.CONCEPT, null)
        )

        // when
        adminBibleWordStatService.createManual(translationId, BOOK_ORDER, 1, angel.id!!, 5)
        adminBibleWordStatService.recalculateBook(translationId, BOOK_ORDER)

        // then — 합계를 자동 집계 결과만으로 만들면 손으로 넣은 장이 책 행에서 통째로 빠진다
        val bookRow = statRepository.findAll()
            .first { it.bibleWordId == angel.id && it.chapterNumber == BibleWordStat.BOOK_SCOPE_CHAPTER_NUMBER }
        bookRow.wordCount shouldBe 5
    }

    @Test
    @DisplayName("같은 장에 같은 표제어를 또 넣으면 거부된다")
    fun manualRowRejectsDuplicate() {
        // given
        adminBibleWordStatService.createManual(translationId, BOOK_ORDER, 1, godWord.id!!, 7)

        // when
        val error = shouldThrow<ServiceError> {
            adminBibleWordStatService.createManual(translationId, BOOK_ORDER, 1, godWord.id!!, 9)
        }

        // then — 유니크 제약에 맡기면 GlobalExceptionHandler 가 못 잡아 500 + ERROR 로그가 된다
        error.errorType shouldBe ErrorType.BIBLE_WORD_STAT_DUPLICATED
    }

    // ------------ Private Methods ------------

    private fun chapterCountOf(bibleWordId: Long): Int =
        statRepository.findAll()
            .first { it.bibleWordId == bibleWordId && it.chapterNumber == 1 }
            .wordCount

    companion object {
        private const val BOOK_ORDER = 1
    }
}
