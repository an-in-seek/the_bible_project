package com.elseeker.bible.application.service

import com.elseeker.bible.adapter.output.jpa.BibleBookRepository
import com.elseeker.bible.adapter.output.jpa.BibleTranslationRepository
import com.elseeker.bible.adapter.output.jpa.BibleVerseRepository
import com.elseeker.bible.adapter.output.jpa.BibleWordAliasRepository
import com.elseeker.bible.adapter.output.jpa.BibleWordRepository
import com.elseeker.bible.adapter.output.jpa.BibleWordStatRepository
import com.elseeker.bible.adapter.output.jpa.BibleWordStatRow
import com.elseeker.bible.adapter.output.jpa.BibleWordStatRunRepository
import com.elseeker.bible.application.component.BibleWordMatcher
import com.elseeker.bible.domain.model.BibleWordStat
import com.elseeker.bible.domain.model.BibleWordStatRun
import com.elseeker.bible.domain.vo.BibleWordStatSource
import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.throwError
import com.neovisionaries.i18n.LanguageCode
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.data.domain.PageRequest
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

/**
 * 관리자 단어 통계 관리 — 재계산, 개별 값 수정, 미매칭 후보 리포트.
 *
 * 재계산은 **책 단위**가 기본이다. 번역본 전체는 클라이언트가 책 단위로 순차 호출한다.
 * 서버에서 루프를 돌리면 HTTP 타임아웃 경계에 걸리고, 같은 빈 안에서 `@Transactional` 메서드를
 * 반복 호출하면 자기 호출이라 프록시를 거치지 않아 트랜잭션이 하나로 합쳐진다.
 */
@Service
@Transactional(readOnly = true)
class AdminBibleWordStatService(
    private val bibleWordRepository: BibleWordRepository,
    private val bibleWordAliasRepository: BibleWordAliasRepository,
    private val bibleWordStatRepository: BibleWordStatRepository,
    private val bibleWordStatRunRepository: BibleWordStatRunRepository,
    private val bibleVerseRepository: BibleVerseRepository,
    private val bibleBookRepository: BibleBookRepository,
    private val bibleTranslationRepository: BibleTranslationRepository,
    private val bibleWordMatcher: BibleWordMatcher,
) {

    private val logger = KotlinLogging.logger {}

    fun findRows(
        translationId: Long,
        bookOrder: Int,
        chapterNumber: Int?,
        page: Int,
        size: Int,
    ): StatRowPage {
        val rows = bibleWordStatRepository.findAdminRows(
            translationId, bookOrder, chapterNumber, PageRequest.of(page, size)
        )
        val total = bibleWordStatRepository.countAdminRows(translationId, bookOrder, chapterNumber)
        return StatRowPage(rows = rows, totalElements = total, page = page, size = size)
    }

    fun findRuns(translationId: Long): List<BibleWordStatRun> =
        bibleWordStatRunRepository.findByTranslationIdOrderByBookOrder(translationId)

    /**
     * 책 한 권의 통계를 다시 계산한다.
     *
     * AUTO 행은 **지우고 다시 넣는다.** UPSERT 만 하면 더 이상 매칭되지 않는 단어의 낡은 행을
     * 지울 방법이 없다 — 어휘를 차단하거나 별칭을 고쳐 매칭이 달라진 경우가 정확히 그렇다.
     * MANUAL 행은 DELETE 조건에서 빠지므로 그대로 살아남는다.
     */
    @Transactional
    fun recalculateBook(translationId: Long, bookOrder: Int): RecalculateResult {
        val languageCode = getTranslationLanguage(translationId)
        bibleBookRepository.findByTranslationAndBook(translationId, bookOrder)
            ?: throwError(ErrorType.BOOK_NOT_FOUND, "translationId=$translationId, bookOrder=$bookOrder")

        val index = buildIndex(translationId, languageCode)
        val texts = bibleVerseRepository.findChapterTextsByBook(translationId, bookOrder)
        if (texts.isEmpty()) throwError(ErrorType.CHAPTER_NOT_FOUND, "bookOrder=$bookOrder")

        val counted = bibleWordMatcher.countBook(texts, index)

        val manualRows = bibleWordStatRepository
            .findByTranslationIdAndBookOrderAndSource(translationId, bookOrder, BibleWordStatSource.MANUAL)
        val manualKeys = manualRows.map { it.chapterNumber to it.bibleWordId }.toHashSet()

        bibleWordStatRepository.deleteByBookAndSource(translationId, bookOrder, BibleWordStatSource.AUTO)

        val toInsert = ArrayList<BibleWordStat>()
        counted.chapterCounts.forEach { (chapterNumber, wordCounts) ->
            wordCounts.forEach { (bibleWordId, count) ->
                if ((chapterNumber to bibleWordId) in manualKeys) return@forEach
                toInsert += BibleWordStat.auto(bibleWordId, translationId, bookOrder, chapterNumber, count)
            }
        }
        toInsert += buildBookRows(translationId, bookOrder, counted, manualRows, manualKeys)

        bibleWordStatRepository.saveAll(toInsert)
        recordRun(
            translationId = translationId,
            bookOrder = bookOrder,
            chapterCount = counted.chapterCounts.size,
            statRowCount = toInsert.size + manualRows.size,
            manualKept = manualRows.size,
        )

        logger.info {
            "재계산 완료: translationId=$translationId, bookOrder=$bookOrder, " +
                "장=${counted.chapterCounts.size}, 삽입=${toInsert.size}, MANUAL 보존=${manualRows.size}"
        }

        return RecalculateResult(
            chapterCount = counted.chapterCounts.size,
            insertedRowCount = toInsert.size,
            manualKeptCount = manualRows.size,
            topUnmatched = counted.unmatched.toCandidates(UNMATCHED_PREVIEW_LIMIT),
        )
    }

    /**
     * 미매칭 후보 리포트. 저장하지 않고 요청 시 계산한다 — 저장하면 또 하나의 낡은 데이터가 된다.
     *
     * `bookOrder` 를 주지 않으면 번역본 전체를 훑으므로 수 초가 걸린다.
     */
    fun findCandidates(translationId: Long, bookOrder: Int?, limit: Int): List<CandidateItem> {
        if (limit !in 1..MAX_CANDIDATE_LIMIT) throwError(ErrorType.INVALID_PARAMETER, "limit=$limit")

        val languageCode = getTranslationLanguage(translationId)
        val index = buildIndex(translationId, languageCode)
        val bookOrders = bookOrder?.let { listOf(it) }
            ?: bibleBookRepository.findByTranslationId(translationId).map { it.bookOrder }.sorted()

        val merged = HashMap<String, Int>()
        bookOrders.forEach { order ->
            val texts = bibleVerseRepository.findChapterTextsByBook(translationId, order)
            if (texts.isEmpty()) return@forEach
            bibleWordMatcher.countBook(texts, index).unmatched.forEach { (token, count) ->
                merged.merge(token, count, Int::plus)
            }
        }
        return merged.toCandidates(limit)
    }

    @Transactional
    fun updateCount(statId: Long, wordCount: Int): BibleWordStat {
        if (wordCount < 0) throwError(ErrorType.INVALID_PARAMETER, "wordCount=$wordCount")
        val stat = bibleWordStatRepository.findByIdOrNull(statId)
            ?: throwError(ErrorType.BIBLE_WORD_STAT_NOT_FOUND, "id=$statId")
        stat.updateByAdmin(wordCount)
        return stat
    }

    @Transactional
    fun createManual(
        translationId: Long,
        bookOrder: Int,
        chapterNumber: Int,
        bibleWordId: Long,
        wordCount: Int,
    ): BibleWordStat {
        if (wordCount < 0) throwError(ErrorType.INVALID_PARAMETER, "wordCount=$wordCount")
        if (chapterNumber < 0) throwError(ErrorType.INVALID_PARAMETER, "chapterNumber=$chapterNumber")

        val word = bibleWordRepository.findByIdOrNull(bibleWordId)
            ?: throwError(ErrorType.BIBLE_WORD_NOT_FOUND, "id=$bibleWordId")
        if (word.translationId != translationId) {
            throwError(ErrorType.INVALID_PARAMETER, "어휘의 번역본이 다릅니다")
        }

        return bibleWordStatRepository.save(
            BibleWordStat.manual(bibleWordId, translationId, bookOrder, chapterNumber, wordCount)
        )
    }

    /** "삭제" 라기보다 **자동값 복원**이다. 다음 재계산에서 AUTO 행으로 다시 채워진다. */
    @Transactional
    fun delete(statId: Long) {
        val stat = bibleWordStatRepository.findByIdOrNull(statId)
            ?: throwError(ErrorType.BIBLE_WORD_STAT_NOT_FOUND, "id=$statId")
        bibleWordStatRepository.delete(stat)
    }

    // ------------ Private Methods ------------

    private fun buildIndex(translationId: Long, languageCode: LanguageCode): BibleWordMatcher.WordIndex {
        val words = bibleWordRepository.findByTranslationId(translationId)
        val aliases = bibleWordAliasRepository.findByTranslationId(translationId)
        return bibleWordMatcher.buildIndex(words, aliases, languageCode)
    }

    /**
     * 책 행(`chapterNumber = 0`)은 장 행의 **최종값**(MANUAL 포함) 합으로 만든다.
     * 자동 계산 결과만 더하면 관리자가 손으로 고친 장이 책 합계에 반영되지 않아 앞뒤가 맞지 않는다.
     *
     * 조회 API 의 limit 상한이 300 이라 그보다 하위 순위는 어떤 화면에도 나올 수 없으므로 자른다.
     */
    private fun buildBookRows(
        translationId: Long,
        bookOrder: Int,
        counted: BibleWordMatcher.BookWordCount,
        manualRows: List<BibleWordStat>,
        manualKeys: Set<Pair<Int, Long>>,
    ): List<BibleWordStat> {
        val manualCountByKey = manualRows.associate { (it.chapterNumber to it.bibleWordId) to it.wordCount }
        val bookTotals = HashMap<Long, Int>()

        counted.chapterCounts.forEach { (chapterNumber, wordCounts) ->
            wordCounts.forEach { (bibleWordId, autoCount) ->
                val finalCount = manualCountByKey[chapterNumber to bibleWordId] ?: autoCount
                bookTotals.merge(bibleWordId, finalCount, Int::plus)
            }
        }
        // 자동 집계에는 없고 관리자가 손으로만 넣은 장 행도 합계에 포함한다
        manualRows.asSequence()
            .filter { !it.isBookScope() }
            .filter { counted.chapterCounts[it.chapterNumber]?.containsKey(it.bibleWordId) != true }
            .forEach { bookTotals.merge(it.bibleWordId, it.wordCount, Int::plus) }

        return bookTotals.entries
            .sortedWith(compareByDescending<Map.Entry<Long, Int>> { it.value }.thenBy { it.key })
            .take(BibleWordStatService.BOOK_SCOPE_STORED_LIMIT)
            .filterNot { (BibleWordStat.BOOK_SCOPE_CHAPTER_NUMBER to it.key) in manualKeys }
            .map {
                BibleWordStat.auto(
                    bibleWordId = it.key,
                    translationId = translationId,
                    bookOrder = bookOrder,
                    chapterNumber = BibleWordStat.BOOK_SCOPE_CHAPTER_NUMBER,
                    wordCount = it.value,
                )
            }
    }

    private fun recordRun(
        translationId: Long,
        bookOrder: Int,
        chapterCount: Int,
        statRowCount: Int,
        manualKept: Int,
    ) {
        val now = Instant.now()
        val existing = bibleWordStatRunRepository.findByTranslationIdAndBookOrder(translationId, bookOrder)
        if (existing != null) {
            existing.record(now, chapterCount, statRowCount, manualKept)
            return
        }
        bibleWordStatRunRepository.save(
            BibleWordStatRun(
                translationId = translationId,
                bookOrder = bookOrder,
                calculatedAt = now,
                chapterCount = chapterCount,
                statRowCount = statRowCount,
                manualKept = manualKept,
            )
        )
    }

    /**
     * 언어는 **`BibleTranslationType` enum 이 권위 있는 출처**다. `bible_translation.language_code`
     * 컬럼은 관리자 API 에서 `translationType` 과 따로 입력받아 KRV + `en` 같은 조합을 막지 못한다.
     * 그러면 한국어 본문을 영어 규칙으로 토크나이즈하는데, 화면에는 이상한 단어 목록으로만 보여
     * 알아채기 어렵다.
     */
    private fun getTranslationLanguage(translationId: Long): LanguageCode =
        bibleTranslationRepository.findByIdOrNull(translationId)?.translationType?.language
            ?: throwError(ErrorType.TRANSLATION_NOT_FOUND, "translationId=$translationId")

    private fun Map<String, Int>.toCandidates(limit: Int): List<CandidateItem> =
        entries.sortedWith(compareByDescending<Map.Entry<String, Int>> { it.value }.thenBy { it.key })
            .take(limit)
            .map { CandidateItem(term = it.key, count = it.value) }

    data class StatRowPage(
        val rows: List<BibleWordStatRow>,
        val totalElements: Long,
        val page: Int,
        val size: Int,
    ) {
        /** 화면의 페이지 이동 링크가 쓴다. 템플릿에서 나눗셈을 하면 올림 처리를 매번 틀린다. */
        val totalPages: Int
            get() = if (size <= 0) 0 else ((totalElements + size - 1) / size).toInt()
    }

    data class RecalculateResult(
        val chapterCount: Int,
        val insertedRowCount: Int,
        val manualKeptCount: Int,
        val topUnmatched: List<CandidateItem>,
    )

    data class CandidateItem(
        val term: String,
        val count: Int,
    )

    companion object {
        private const val UNMATCHED_PREVIEW_LIMIT = 30
        const val MAX_CANDIDATE_LIMIT = 10_000
    }
}
