package com.elseeker.bible.adapter.output.jpa

import com.elseeker.bible.domain.model.BibleWordStat
import com.elseeker.bible.domain.result.WordFrequencyStat
import com.elseeker.bible.domain.vo.BibleWordStatSource
import com.elseeker.bible.domain.vo.BibleWordStatus
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface BibleWordStatRepository : JpaRepository<BibleWordStat, Long> {

    /**
     * 사용자 조회. `chapterNumber = 0` 이면 책 단위가 되므로 별도 메서드가 필요 없다.
     *
     * 정렬 2차 기준을 `term` 오름차순으로 고정한다. 동률 순서가 매번 달라지면 워드 클라우드
     * 배치가 새로고침마다 바뀌어 버그처럼 보인다.
     */
    @Query(
        """
        SELECT new com.elseeker.bible.domain.result.WordFrequencyStat(
            w.term, s.wordCount, w.dictionaryId
        )
        FROM BibleWordStat s
        JOIN BibleWord w ON w.id = s.bibleWordId
        WHERE s.translationId = :translationId
          AND s.bookOrder = :bookOrder
          AND s.chapterNumber = :chapterNumber
          AND w.status IN :statuses
        ORDER BY s.wordCount DESC, w.term
        """
    )
    fun findStats(
        @Param("translationId") translationId: Long,
        @Param("bookOrder") bookOrder: Int,
        @Param("chapterNumber") chapterNumber: Int,
        @Param("statuses") statuses: Collection<BibleWordStatus>,
        pageable: Pageable,
    ): List<WordFrequencyStat>

    /** 관리자 목록 — 표제어를 함께 보여 준다. */
    @Query(
        """
        SELECT new com.elseeker.bible.adapter.output.jpa.BibleWordStatRow(
            s.id, s.bibleWordId, w.term, s.chapterNumber, s.wordCount, s.source
        )
        FROM BibleWordStat s
        JOIN BibleWord w ON w.id = s.bibleWordId
        WHERE s.translationId = :translationId
          AND s.bookOrder = :bookOrder
          AND (:chapterNumber IS NULL OR s.chapterNumber = :chapterNumber)
        ORDER BY s.chapterNumber, s.wordCount DESC, w.term
        """
    )
    fun findAdminRows(
        @Param("translationId") translationId: Long,
        @Param("bookOrder") bookOrder: Int,
        @Param("chapterNumber") chapterNumber: Int?,
        pageable: Pageable,
    ): List<BibleWordStatRow>

    @Query(
        """
        SELECT COUNT(s)
        FROM BibleWordStat s
        WHERE s.translationId = :translationId
          AND s.bookOrder = :bookOrder
          AND (:chapterNumber IS NULL OR s.chapterNumber = :chapterNumber)
        """
    )
    fun countAdminRows(
        @Param("translationId") translationId: Long,
        @Param("bookOrder") bookOrder: Int,
        @Param("chapterNumber") chapterNumber: Int?,
    ): Long

    /**
     * 재계산 전 AUTO 행 삭제. **UPSERT 가 아니라 DELETE + INSERT 인 이유**는
     * 더 이상 매칭되지 않는 단어의 낡은 AUTO 행을 지울 방법이 달리 없기 때문이다.
     */
    @Modifying(flushAutomatically = true)
    @Query(
        """
        DELETE FROM BibleWordStat s
        WHERE s.translationId = :translationId
          AND s.bookOrder = :bookOrder
          AND s.source = :source
        """
    )
    fun deleteByBookAndSource(
        @Param("translationId") translationId: Long,
        @Param("bookOrder") bookOrder: Int,
        @Param("source") source: BibleWordStatSource,
    ): Int

    /** 재계산 시 보존해야 할 MANUAL 행 */
    fun findByTranslationIdAndBookOrderAndSource(
        translationId: Long,
        bookOrder: Int,
        source: BibleWordStatSource,
    ): List<BibleWordStat>

    /** 어휘를 차단·삭제할 때 통계 행을 즉시 정리한다(FK 가 없으므로 애플리케이션이 직접 지운다). */
    @Modifying(flushAutomatically = true)
    @Query("DELETE FROM BibleWordStat s WHERE s.bibleWordId = :bibleWordId")
    fun deleteByBibleWordId(@Param("bibleWordId") bibleWordId: Long): Int

    fun countByBibleWordIdAndSource(bibleWordId: Long, source: BibleWordStatSource): Long

    /**
     * 관리자가 행을 직접 추가할 때의 중복 확인. `uk_bible_word_stat` 과 같은 조합이다.
     *
     * 제약에 맡기면 `DataIntegrityViolationException` 이 나는데 `GlobalExceptionHandler` 는
     * `ServiceError` 만 잡으므로 500 + ERROR 로그가 된다. 관리자 입력 실수는 400 대여야 한다.
     */
    fun existsByTranslationIdAndBookOrderAndChapterNumberAndBibleWordId(
        translationId: Long,
        bookOrder: Int,
        chapterNumber: Int,
        bibleWordId: Long,
    ): Boolean

    fun countByTranslationIdAndBookOrder(translationId: Long, bookOrder: Int): Long
}

/**
 * 관리자 카운트 목록 한 행. JPQL 생성자 프로젝션 대상이라 파라미터 순서를 바꾸면 깨진다.
 */
data class BibleWordStatRow(
    val id: Long,
    val bibleWordId: Long,
    val term: String,
    val chapterNumber: Int,
    val wordCount: Int,
    val source: BibleWordStatSource,
)
