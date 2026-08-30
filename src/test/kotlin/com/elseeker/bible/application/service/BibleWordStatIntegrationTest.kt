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

    @Test
    @DisplayName("키워드를 저장하면 어휘에 없던 단어가 표제어로 등록되고 장·책 행이 생긴다")
    fun keywordSaveRegistersWordAndRows() {
        // given — 본문에는 있으나 어휘에는 없는 단어
        wordRepository.findByTranslationIdAndTerm(translationId, "천지") shouldBe null

        // when
        val result = adminBibleWordStatService.saveKeywordStat(translationId, BOOK_ORDER, "천지")

        // then
        result.registeredWord shouldBe true
        result.count.totalCount shouldBe 1
        result.source shouldBe BibleWordStatSource.KEYWORD

        val word = wordRepository.findByTranslationIdAndTerm(translationId, "천지").shouldNotBeNull()
        val rows = statRepository.findAll().filter { it.bibleWordId == word.id }
        rows shouldHaveSize 2
        rows.first { it.chapterNumber == BibleWordStat.BOOK_SCOPE_CHAPTER_NUMBER }.wordCount shouldBe 1
    }

    @Test
    @DisplayName("같은 키워드를 다시 저장해도 행이 중복되지 않는다")
    fun keywordSaveReplacesOwnRows() {
        // given
        adminBibleWordStatService.saveKeywordStat(translationId, BOOK_ORDER, "하나님")

        // when — 지우기 전에 INSERT 가 나가면 uk_bible_word_stat 에 걸려 여기서 깨진다
        val again = adminBibleWordStatService.saveKeywordStat(translationId, BOOK_ORDER, "하나님")

        // then
        again.replacedRowCount shouldBe 2
        statRepository.findAll().filter { it.bibleWordId == godWord.id } shouldHaveSize 2
    }

    @Test
    @DisplayName("공백이 든 키워드도 재계산 뒤에 값이 남는다")
    fun multiWordKeywordSurvivesRecalculation() {
        // given — 어절 하나씩 조회하는 매처는 이 표제어를 영영 세지 못한다
        val saved = adminBibleWordStatService.saveKeywordStat(translationId, BOOK_ORDER, "태초에 하나님이")
        saved.source shouldBe BibleWordStatSource.KEYWORD
        val word = wordRepository.findByTranslationIdAndTerm(translationId, "태초에 하나님이").shouldNotBeNull()

        // when
        adminBibleWordStatService.recalculateBook(translationId, BOOK_ORDER)

        // then — 재계산이 지우기만 하고 다시 채우지 못하면 행이 통째로 사라진다
        val rows = statRepository.findAll().filter { it.bibleWordId == word.id }
        rows shouldHaveSize 2
        rows.first { it.chapterNumber == 1 }.wordCount shouldBe 1
    }

    @Test
    @DisplayName("매처가 셀 수 있는 단어라도 키워드로 저장한 행은 재계산이 건드리지 않는다")
    fun keywordRowIsExcludedFromRecalculation() {
        // given — 재계산도 셀 수 있는 평범한 한 어절 표제어다
        adminBibleWordStatService.saveKeywordStat(translationId, BOOK_ORDER, "하나님")

        // when
        adminBibleWordStatService.recalculateBook(translationId, BOOK_ORDER)

        // then — 재계산이 지우고 다시 넣었다면 출처가 AUTO 로 바뀌고 행 수도 흔들린다
        val rows = statRepository.findAll().filter { it.bibleWordId == godWord.id }
        rows shouldHaveSize 2
        rows.map { it.source }.toSet() shouldBe setOf(BibleWordStatSource.KEYWORD)
        rows.first { it.chapterNumber == 1 }.wordCount shouldBe 3
    }

    @Test
    @DisplayName("책을 고르지 않으면 번역본 전체를 세고 책마다 행을 만든다")
    fun keywordSaveCoversWholeTranslation() {
        // given — 두 번째 책을 더한다
        val exodus = bookRepository.save(
            BibleBook(
                translationId = translationId,
                bookKey = BibleBookKey.EXO,
                bookOrder = 2,
                name = "출애굽기",
                abbreviation = "출",
                testamentType = BibleTestamentType.OLD,
            )
        )
        val chapter = chapterRepository.save(BibleChapter.of(bookId = exodus.id!!, chapterNumber = 1))
        verseRepository.save(
            BibleVerse(chapterId = chapter.id!!, verseNumber = 1, text = "하나님이 모세에게 말씀하시니라")
        )

        // when — bookOrder 를 주지 않는다
        val result = adminBibleWordStatService.saveKeywordStat(translationId, null, "하나님")

        // then — 창세기 3 회 + 출애굽기 1 회
        result.bookCount shouldBe 2
        result.count.totalCount shouldBe 4

        // 책마다 장 행 하나와 책 행 하나
        val rows = statRepository.findAll().filter { it.bibleWordId == godWord.id }
        rows shouldHaveSize 4
        rows.first { it.bookOrder == 2 && it.chapterNumber == BibleWordStat.BOOK_SCOPE_CHAPTER_NUMBER }
            .wordCount shouldBe 1
        rows.first { it.bookOrder == 1 && it.chapterNumber == BibleWordStat.BOOK_SCOPE_CHAPTER_NUMBER }
            .wordCount shouldBe 3
    }

    @Test
    @DisplayName("키워드로 다시 저장해도 손으로 고친 값은 그대로고 책 합계가 그 값을 쓴다")
    fun keywordSaveKeepsManualRows() {
        // given — 저장한 뒤 장 행을 손으로 99 로 고친다(MANUAL 로 바뀐다)
        adminBibleWordStatService.saveKeywordStat(translationId, BOOK_ORDER, "하나님")
        val chapterRow = statRepository.findAll()
            .first { it.bibleWordId == godWord.id && it.chapterNumber == 1 }
        adminBibleWordStatService.updateCount(chapterRow.id!!, 99)

        // when — 같은 키워드를 다시 저장한다
        val result = adminBibleWordStatService.saveKeywordStat(translationId, BOOK_ORDER, "하나님")

        // then — 손으로 고친 값이 살아남고, 책 합계도 그 값을 쓴다
        result.manualKeptCount shouldBe 1
        val rows = statRepository.findAll().filter { it.bibleWordId == godWord.id }
        rows shouldHaveSize 2

        val chapter = rows.first { it.chapterNumber == 1 }
        chapter.wordCount shouldBe 99
        chapter.source shouldBe BibleWordStatSource.MANUAL

        val book = rows.first { it.chapterNumber == BibleWordStat.BOOK_SCOPE_CHAPTER_NUMBER }
        book.wordCount shouldBe 99
        book.source shouldBe BibleWordStatSource.KEYWORD
    }

    @Test
    @DisplayName("되돌리면 그 범위의 KEYWORD 행만 사라진다")
    fun keywordUndoRemovesOnlyKeywordRows() {
        // given — 저장한 뒤 장 행 하나를 손으로 고쳐 MANUAL 로 바꾼다
        adminBibleWordStatService.saveKeywordStat(translationId, BOOK_ORDER, "하나님")
        val chapterRow = statRepository.findAll()
            .first { it.bibleWordId == godWord.id && it.chapterNumber == 1 }
        adminBibleWordStatService.updateCount(chapterRow.id!!, 99)

        // when
        val deleted = adminBibleWordStatService.deleteKeywordStat(translationId, BOOK_ORDER, "하나님")

        // then — 되돌리기가 관리자의 손자국까지 지우면 그것은 또 다른 사고다
        deleted shouldBe 1
        val rows = statRepository.findAll().filter { it.bibleWordId == godWord.id }
        rows shouldHaveSize 1
        rows.first().source shouldBe BibleWordStatSource.MANUAL
        rows.first().wordCount shouldBe 99
    }

    @Test
    @DisplayName("본문에 없는 키워드는 저장하지 않는다 — 오타가 어휘에 남지 않도록")
    fun keywordSaveRejectsZeroCount() {
        // when
        val error = shouldThrow<ServiceError> {
            adminBibleWordStatService.saveKeywordStat(translationId, BOOK_ORDER, "유니콘")
        }

        // then
        error.errorType shouldBe ErrorType.INVALID_PARAMETER
        wordRepository.findByTranslationIdAndTerm(translationId, "유니콘") shouldBe null
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
