package com.elseeker.bible.application.service

import com.elseeker.bible.adapter.output.jpa.BibleBookRepository
import com.elseeker.bible.adapter.output.jpa.BibleWordStatRepository
import com.elseeker.bible.adapter.output.jpa.BibleWordStatRunRepository
import com.elseeker.bible.domain.model.BibleWordStat
import com.elseeker.bible.domain.result.BibleWordStatResult
import com.elseeker.bible.domain.vo.BibleWordStatus
import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.throwError
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * 사용자 화면용 단어 빈도 조회.
 *
 * 요청 경로에 본문 스캔이나 형태소 분석이 없다. 인덱스 조회 2회(통계 + 재계산 시각)로 끝난다.
 */
@Service
@Transactional(readOnly = true)
class BibleWordStatService(
    private val bibleWordStatRepository: BibleWordStatRepository,
    private val bibleWordStatRunRepository: BibleWordStatRunRepository,
    private val bibleBookRepository: BibleBookRepository,
    @Value("\${el-seeker.word-stats.include-candidate:true}")
    private val includeCandidate: Boolean,
) {

    fun getBookWordStat(translationId: Long, bookOrder: Int, limit: Int): BibleWordStatResult =
        getWordStat(translationId, bookOrder, BibleWordStat.BOOK_SCOPE_CHAPTER_NUMBER, limit)

    fun getChapterWordStat(
        translationId: Long,
        bookOrder: Int,
        chapterNumber: Int,
        limit: Int,
    ): BibleWordStatResult {
        if (chapterNumber < 1) throwError(ErrorType.INVALID_PARAMETER, "chapterNumber=$chapterNumber")
        return getWordStat(translationId, bookOrder, chapterNumber, limit)
    }

    // ------------ Private Methods ------------

    private fun getWordStat(
        translationId: Long,
        bookOrder: Int,
        chapterNumber: Int,
        limit: Int,
    ): BibleWordStatResult {
        if (limit !in 1..MAX_LIMIT) throwError(ErrorType.INVALID_PARAMETER, "limit=$limit")

        val book = bibleBookRepository.findByTranslationAndBook(translationId, bookOrder)
            ?: throwError(ErrorType.BOOK_NOT_FOUND, "translationId=$translationId, bookOrder=$bookOrder")

        // limit + 1 개를 받아 초과분 유무로 truncated 를 판정한다. 별도 COUNT 쿼리를 아낀다.
        val rows = bibleWordStatRepository.findStats(
            translationId = translationId,
            bookOrder = bookOrder,
            chapterNumber = chapterNumber,
            statuses = BibleWordStatus.visibleStatuses(includeCandidate),
            pageable = PageRequest.of(0, limit + 1),
        )
        val items = rows.take(limit)
        val calculatedAt = bibleWordStatRunRepository
            .findByTranslationIdAndBookOrder(translationId, bookOrder)
            ?.calculatedAt

        return BibleWordStatResult(
            bookName = book.name,
            chapterNumber = chapterNumber.takeIf { it != BibleWordStat.BOOK_SCOPE_CHAPTER_NUMBER },
            shownCount = items.sumOf { it.wordCount },
            truncated = isTruncated(rows.size, items.size, limit, chapterNumber),
            calculatedAt = calculatedAt,
            items = items,
        )
    }

    /**
     * 책 단위는 **저장 시점의 절단도 반영해야 한다.** 책 행은 상위 300개만 저장하므로
     * `limit=300` 요청은 초과분이 없어 `false` 가 되지만 실제로는 이미 잘린 상태다.
     * 정확히 300개인 책에서 한 번 과보고되지만, "더 있는데 없다고 말하는" 쪽보다 안전하다.
     */
    private fun isTruncated(fetchedSize: Int, shownSize: Int, limit: Int, chapterNumber: Int): Boolean {
        if (fetchedSize > limit) return true
        val isBookScope = chapterNumber == BibleWordStat.BOOK_SCOPE_CHAPTER_NUMBER
        return isBookScope && shownSize >= BOOK_SCOPE_STORED_LIMIT
    }

    companion object {
        const val MAX_LIMIT = 300
        const val DEFAULT_LIMIT = 100

        /** 책 행 저장 상한. 조회 API 의 limit 상한과 같다 — 그보다 하위는 어떤 화면에도 못 나온다. */
        const val BOOK_SCOPE_STORED_LIMIT = 300
    }
}
