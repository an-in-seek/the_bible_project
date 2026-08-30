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
import com.elseeker.bible.application.component.BibleWordOccurrenceCounter
import com.elseeker.bible.domain.model.BibleWord
import com.elseeker.bible.domain.model.BibleWordStat
import com.elseeker.bible.domain.model.BibleWordStatRun
import com.elseeker.bible.domain.vo.BibleWordStatSource
import com.elseeker.bible.domain.vo.BibleWordStatus
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
    private val bibleWordOccurrenceCounter: BibleWordOccurrenceCounter,
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
     *
     * `AUTO` 가 아닌 행([BibleWordStatSource.PRESERVED_ON_RECALCULATION])은 DELETE 조건에서
     * 빠지므로 그대로 살아남고, 그 (장, 표제어) 자리에는 새 AUTO 행을 넣지 않는다. 관리자가
     * 손으로 고친 값(`MANUAL`)과 키워드로 세어 저장한 값(`KEYWORD`)이 여기 해당한다.
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

        val preservedRows = bibleWordStatRepository.findByTranslationIdAndBookOrderAndSourceIn(
            translationId, bookOrder, BibleWordStatSource.PRESERVED_ON_RECALCULATION
        )
        val preservedKeys = preservedRows.map { it.chapterNumber to it.bibleWordId }.toHashSet()

        bibleWordStatRepository.deleteByBookAndSource(translationId, bookOrder, BibleWordStatSource.AUTO)

        val toInsert = ArrayList<BibleWordStat>()
        counted.chapterCounts.forEach { (chapterNumber, wordCounts) ->
            wordCounts.forEach { (bibleWordId, count) ->
                if ((chapterNumber to bibleWordId) in preservedKeys) return@forEach
                toInsert += BibleWordStat.auto(bibleWordId, translationId, bookOrder, chapterNumber, count)
            }
        }
        toInsert += buildBookRows(translationId, bookOrder, counted, preservedRows, preservedKeys)

        bibleWordStatRepository.saveAll(toInsert)
        recordRun(
            translationId = translationId,
            bookOrder = bookOrder,
            chapterCount = counted.chapterCounts.size,
            statRowCount = toInsert.size + preservedRows.size,
            manualKept = preservedRows.size,
        )

        logger.info {
            "재계산 완료: translationId=$translationId, bookOrder=$bookOrder, " +
                "장=${counted.chapterCounts.size}, 삽입=${toInsert.size}, 보존=${preservedRows.size}"
        }

        return RecalculateResult(
            chapterCount = counted.chapterCounts.size,
            insertedRowCount = toInsert.size,
            manualKeptCount = preservedRows.size,
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

    /**
     * 키워드가 본문에 몇 번 나오는지 세어 본다. **저장하지 않는다.**
     *
     * 문자열 기준이라 `말` 이 `말씀` 을 함께 세는 오검출을 코드가 걸러 줄 수 없다. 그래서 값과
     * 함께 실제로 잡힌 절을 돌려주고, 저장은 관리자가 그것을 보고 [saveKeywordStat] 로 따로
     * 지시한다(설계 문서 3.2).
     */
    fun countKeyword(translationId: Long, bookOrder: Int?, keyword: String): KeywordCountResult =
        computeKeyword(translationId, bookOrder, keyword).toResult()

    /**
     * 계산 결과를 `bible_word_stat` 에 반영한다. 어휘에 없는 키워드는 표제어로 먼저 등록한다.
     *
     * 값은 **클라이언트가 보낸 것을 믿지 않고 다시 센다.** 미리보기와 저장 사이에 본문이나
     * 별칭이 바뀔 수 있고, 관리자 화면이라도 값을 그대로 받아 쓰면 저장된 통계가 본문과
     * 무관해진다.
     */
    @Transactional
    fun saveKeywordStat(translationId: Long, bookOrder: Int?, keyword: String): KeywordSaveResult {
        val computed = computeKeyword(translationId, bookOrder, keyword)
        // 0 회인 키워드로는 표제어를 만들지 않는다. 여기서 먼저 끊지 않으면 오타 하나가
        // 어휘에 영구히 남는다.
        if (computed.totalCount == 0) {
            throwError(ErrorType.INVALID_PARAMETER, "본문에 한 번도 나오지 않아 저장할 것이 없습니다")
        }

        val word = computed.word
            ?: bibleWordRepository.save(BibleWord.keywordOf(translationId, computed.term))
        val wordId = word.id ?: throwError(ErrorType.BIBLE_WORD_NOT_FOUND, computed.term)

        // 범위 밖의 행은 건드리지 않는다. 책 하나를 다시 셌는데 다른 책 값까지 지우면
        // 관리자는 무엇이 사라졌는지 알 길이 없다.
        val replaced = if (bookOrder != null) {
            bibleWordStatRepository
                .findByTranslationIdAndBookOrderAndBibleWordId(translationId, bookOrder, wordId)
        } else {
            bibleWordStatRepository.findByTranslationIdAndBibleWordId(translationId, wordId)
        }
        if (replaced.isNotEmpty()) {
            bibleWordStatRepository.deleteAll(replaced)
            // 지우기 전에 INSERT 가 나가면 `uk_bible_word_stat` 에 걸린다. Hibernate 의 기본
            // 플러시 순서는 INSERT 가 DELETE 보다 앞이므로 여기서 직접 끊어 준다.
            bibleWordStatRepository.flush()
        }

        // 출처는 언제나 KEYWORD 다. 재계산과 계산 방식이 다르므로, 매처가 셀 수 있는 단어라도
        // 재계산이 덮으면 관리자가 확인하고 저장한 값이 조용히 다른 수로 바뀐다.
        val rows = ArrayList<BibleWordStat>()
        computed.countsByBook.forEach { (book, chapterCounts) ->
            chapterCounts.forEach { (chapterNumber, wordCount) ->
                rows += BibleWordStat.keyword(wordId, translationId, book, chapterNumber, wordCount)
            }
            // 책 행은 그 책의 장 합계다. 재계산을 기다리지 않고 여기서 함께 만든다.
            rows += BibleWordStat.keyword(
                wordId, translationId, book,
                BibleWordStat.BOOK_SCOPE_CHAPTER_NUMBER, chapterCounts.values.sum(),
            )
        }
        bibleWordStatRepository.saveAll(rows)

        logger.info {
            "키워드 집계 저장: translationId=$translationId, bookOrder=${bookOrder ?: "전체"}, " +
                "키워드=${computed.term}, 총=${computed.totalCount}, 책=${computed.countsByBook.size}, " +
                "행=${rows.size}, 교체=${replaced.size}, 표제어 신규=${computed.word == null}"
        }

        return KeywordSaveResult(
            count = computed.toResult(wordId),
            registeredWord = computed.word == null,
            source = BibleWordStatSource.KEYWORD,
            savedRowCount = rows.size,
            replacedRowCount = replaced.size,
            bookCount = computed.countsByBook.size,
        )
    }

    @Transactional
    fun updateCount(statId: Long, wordCount: Int): BibleWordStat {
        if (wordCount < 0) throwError(ErrorType.INVALID_PARAMETER, "wordCount=$wordCount")
        val stat = bibleWordStatRepository.findByIdOrNull(statId)
            ?: throwError(ErrorType.BIBLE_WORD_STAT_NOT_FOUND, "id=$statId")
        stat.updateByAdmin(wordCount)
        return stat
    }

    /**
     * 자동 매칭이 잡지 못한 행을 관리자가 직접 넣는다.
     *
     * 장 행을 넣어도 책 행(`chapterNumber = 0`)의 합계는 그 자리에서 바뀌지 않는다.
     * 합계는 재계산이 [buildBookRows] 에서 다시 만든다.
     */
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
        // 없는 책 번호로도 행이 만들어진다. 그 행은 어느 화면에도 나오지 않으므로
        // 관리자는 넣었다고 믿는 값을 영영 찾지 못한다.
        bibleBookRepository.findByTranslationAndBook(translationId, bookOrder)
            ?: throwError(ErrorType.BOOK_NOT_FOUND, "translationId=$translationId, bookOrder=$bookOrder")

        val duplicated = bibleWordStatRepository
            .existsByTranslationIdAndBookOrderAndChapterNumberAndBibleWordId(
                translationId, bookOrder, chapterNumber, bibleWordId
            )
        if (duplicated) throwError(ErrorType.BIBLE_WORD_STAT_DUPLICATED, word.term)

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

    /**
     * 미리보기와 저장이 같은 계산을 쓴다. 두 곳에 따로 두면 화면에 보여 준 값과 저장한 값이
     * 조용히 달라진다.
     */
    private fun computeKeyword(translationId: Long, bookOrder: Int?, keyword: String): KeywordComputation {
        val term = keyword.trim()
        if (term.isBlank()) throwError(ErrorType.INVALID_PARAMETER, "키워드를 입력해 주세요")
        // 저장하면 표제어가 되므로 `bible_word.term` 의 길이를 넘으면 여기서 끊는다.
        if (term.length > MAX_KEYWORD_LENGTH) throwError(ErrorType.INVALID_PARAMETER, "키워드가 너무 깁니다")

        val languageCode = getTranslationLanguage(translationId)
        val bookOrders = resolveBookOrders(translationId, bookOrder)

        // 별칭을 입력했으면 부모 표제어로 되돌린다. 그냥 두면 `하느님` 이 `하나님` 의 별칭인데도
        // 새 표제어로 등록되어, 같은 낱말의 통계가 둘로 갈라진다.
        val word = bibleWordRepository.findByTranslationIdAndTerm(translationId, term)
            ?: bibleWordAliasRepository.findByTranslationIdAndAlias(translationId, term)
                ?.let { bibleWordRepository.findByIdOrNull(it.bibleWordId) }
        // 차단은 관리자가 "이 낱말은 세지 않는다" 고 내린 판단이다. 키워드 집계가 그것을
        // 조용히 되돌리면 재계산 값과 어긋난다.
        if (word?.status == BibleWordStatus.BLOCKED) throwError(ErrorType.BIBLE_WORD_BLOCKED, term)

        // 매처는 별칭을 표제어 id 로 접어서 센다. 여기서 빼면 같은 표제어 행에 재계산보다
        // 작은 값이 들어간다.
        val aliases = word?.id
            ?.let { wordId -> bibleWordAliasRepository.findByBibleWordId(wordId).map { it.alias } }
            .orEmpty()
        // 어휘에 있는 낱말이면 표제어 표기로 센다. 입력한 별칭은 aliases 에 들어 있다.
        val keywords = word?.let { listOf(it.term) + aliases } ?: listOf(term)

        // 책 단위 재계산과 달리 여기서는 서버가 책을 순회한다. 재계산은 어휘 수천 개를 모든
        // 어절에 맞춰 보고 15만 행을 쓰지만, 이쪽은 키워드 하나를 문자열로 훑고 많아야
        // 천여 행을 쓴다. 미매칭 후보 리포트가 이미 같은 방식으로 번역본 전체를 훑는다.
        val countsByBook = LinkedHashMap<Int, Map<Int, Int>>()
        val samples = ArrayList<BibleWordOccurrenceCounter.Sample>()
        bookOrders.forEach { order ->
            val verses = bibleVerseRepository.findVerseTextsByBook(translationId, order)
            if (verses.isEmpty()) {
                // 책을 콕 집었는데 본문이 없으면 알려 준다. 번역본 전체라면 그냥 넘어간다
                // — 66권을 다 갖추지 않은 번역본이 있다.
                if (bookOrder != null) throwError(ErrorType.CHAPTER_NOT_FOUND, "bookOrder=$order")
                return@forEach
            }
            val counted = bibleWordOccurrenceCounter.countBook(verses, keywords, languageCode)
            if (counted.totalCount == 0) return@forEach
            countsByBook[order] = counted.chapterCounts.toSortedMap()
            if (samples.size < BibleWordOccurrenceCounter.DEFAULT_SAMPLE_LIMIT) {
                samples += counted.samples.take(BibleWordOccurrenceCounter.DEFAULT_SAMPLE_LIMIT - samples.size)
            }
        }

        return KeywordComputation(
            term = term,
            word = word,
            aliases = aliases,
            bookOrder = bookOrder,
            countsByBook = countsByBook,
            samples = samples,
            // 저장은 표제어 단위다. 매처가 그 표제어를 셀 수 있는지를 본다.
            matcherCountable = bibleWordMatcher.isCountableTerm(word?.term ?: term, languageCode),
        )
    }

    /** `bookOrder` 가 null 이면 번역본이 가진 책 전부. 없는 책 번호는 여기서 끊는다. */
    private fun resolveBookOrders(translationId: Long, bookOrder: Int?): List<Int> {
        if (bookOrder != null) {
            bibleBookRepository.findByTranslationAndBook(translationId, bookOrder)
                ?: throwError(ErrorType.BOOK_NOT_FOUND, "translationId=$translationId, bookOrder=$bookOrder")
            return listOf(bookOrder)
        }
        val orders = bibleBookRepository.findByTranslationId(translationId).map { it.bookOrder }.sorted()
        if (orders.isEmpty()) throwError(ErrorType.BOOK_NOT_FOUND, "translationId=$translationId")
        return orders
    }

    private fun buildIndex(translationId: Long, languageCode: LanguageCode): BibleWordMatcher.WordIndex {
        val words = bibleWordRepository.findByTranslationId(translationId)
        val aliases = bibleWordAliasRepository.findByTranslationId(translationId)
        return bibleWordMatcher.buildIndex(words, aliases, languageCode)
    }

    /**
     * 책 행(`chapterNumber = 0`)은 장 행의 **최종값**(보존된 행 포함) 합으로 만든다.
     * 자동 계산 결과만 더하면 관리자가 손으로 고쳤거나 키워드로 세어 넣은 장이 책 합계에
     * 반영되지 않아 앞뒤가 맞지 않는다.
     *
     * 조회 API 의 limit 상한이 300 이라 그보다 하위 순위는 어떤 화면에도 나올 수 없으므로 자른다.
     */
    private fun buildBookRows(
        translationId: Long,
        bookOrder: Int,
        counted: BibleWordMatcher.BookWordCount,
        preservedRows: List<BibleWordStat>,
        preservedKeys: Set<Pair<Int, Long>>,
    ): List<BibleWordStat> {
        val preservedCountByKey = preservedRows.associate { (it.chapterNumber to it.bibleWordId) to it.wordCount }
        val bookTotals = HashMap<Long, Int>()

        counted.chapterCounts.forEach { (chapterNumber, wordCounts) ->
            wordCounts.forEach { (bibleWordId, autoCount) ->
                val finalCount = preservedCountByKey[chapterNumber to bibleWordId] ?: autoCount
                bookTotals.merge(bibleWordId, finalCount, Int::plus)
            }
        }
        // 자동 집계에는 없고 사람이 넣은 장 행(수동·키워드)도 합계에 포함한다
        preservedRows.asSequence()
            .filter { !it.isBookScope() }
            .filter { counted.chapterCounts[it.chapterNumber]?.containsKey(it.bibleWordId) != true }
            .forEach { bookTotals.merge(it.bibleWordId, it.wordCount, Int::plus) }

        return bookTotals.entries
            .sortedWith(compareByDescending<Map.Entry<Long, Int>> { it.value }.thenBy { it.key })
            .take(BibleWordStatService.BOOK_SCOPE_STORED_LIMIT)
            .filterNot { (BibleWordStat.BOOK_SCOPE_CHAPTER_NUMBER to it.key) in preservedKeys }
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

    /**
     * 미리보기와 저장이 공유하는 계산 결과. 서비스 밖으로 나가지 않는다.
     *
     * @param bookOrder null 이면 번역본 전체를 센 것이다.
     * @param countsByBook 책 번호 -> (장 -> 횟수). 0 회인 책은 담지 않는다.
     */
    private data class KeywordComputation(
        val term: String,
        val word: BibleWord?,
        val aliases: List<String>,
        val bookOrder: Int?,
        val countsByBook: Map<Int, Map<Int, Int>>,
        val samples: List<BibleWordOccurrenceCounter.Sample>,
        val matcherCountable: Boolean,
    ) {
        val totalCount: Int
            get() = countsByBook.values.sumOf { chapters -> chapters.values.sum() }

        fun toResult(bibleWordId: Long? = word?.id) = KeywordCountResult(
            keyword = term,
            resolvedTerm = word?.term?.takeIf { it != term },
            bibleWordId = bibleWordId,
            wordStatus = word?.status,
            aliases = aliases,
            matcherCountable = matcherCountable,
            bookOrder = bookOrder,
            totalCount = totalCount,
            // 번역본 전체는 장이 1,000개를 넘는다. 화면에 늘어놓을 수 없으므로 책별 합계만 준다.
            chapterCounts = bookOrder?.let { order ->
                countsByBook[order].orEmpty().entries
                    .sortedBy { it.key }
                    .map { ChapterCount(chapterNumber = it.key, wordCount = it.value) }
            }.orEmpty(),
            bookCounts = if (bookOrder != null) emptyList() else {
                countsByBook.entries
                    .map { BookCount(bookOrder = it.key, wordCount = it.value.values.sum()) }
                    .sortedWith(compareByDescending<BookCount> { it.wordCount }.thenBy { it.bookOrder })
            },
            samples = samples,
        )
    }

    /**
     * @param resolvedTerm 입력한 키워드가 별칭이라 다른 표제어로 해석됐을 때의 표제어 표기.
     *   같으면 null. 값은 이 표제어의 행에 저장된다.
     * @param bibleWordId 아직 어휘에 없으면 null. 저장할 때 표제어로 등록된다.
     * @param matcherCountable 책 단위 재계산이 이 단어를 셀 수 있는지. 저장 값은 어느 쪽이든
     *   `KEYWORD` 로 남아 재계산이 건드리지 않지만, true 면 행을 지웠을 때 다음 재계산이
     *   매처 기준 값으로 다시 채운다는 뜻이라 화면 안내가 달라진다.
     * @param bookOrder null 이면 번역본 전체를 센 결과다.
     * @param chapterCounts 책을 고른 경우에만 채운다.
     * @param bookCounts 번역본 전체인 경우에만 채운다. 횟수 내림차순.
     */
    data class KeywordCountResult(
        val keyword: String,
        val resolvedTerm: String?,
        val bibleWordId: Long?,
        val wordStatus: BibleWordStatus?,
        val aliases: List<String>,
        val matcherCountable: Boolean,
        val bookOrder: Int?,
        val totalCount: Int,
        val chapterCounts: List<ChapterCount>,
        val bookCounts: List<BookCount>,
        val samples: List<BibleWordOccurrenceCounter.Sample>,
    )

    data class ChapterCount(
        val chapterNumber: Int,
        val wordCount: Int,
    )

    data class BookCount(
        val bookOrder: Int,
        val wordCount: Int,
    )

    data class KeywordSaveResult(
        val count: KeywordCountResult,
        val registeredWord: Boolean,
        val source: BibleWordStatSource,
        val savedRowCount: Int,
        val replacedRowCount: Int,
        /** 값이 들어간 책 수 */
        val bookCount: Int,
    )

    companion object {
        private const val UNMATCHED_PREVIEW_LIMIT = 30
        const val MAX_CANDIDATE_LIMIT = 10_000

        /** `bible_word.term` 컬럼 길이. 저장하면 표제어가 되므로 같은 값으로 끊는다. */
        private const val MAX_KEYWORD_LENGTH = 50
    }
}
