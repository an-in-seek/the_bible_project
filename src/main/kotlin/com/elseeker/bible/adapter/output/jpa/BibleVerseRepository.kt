package com.elseeker.bible.adapter.output.jpa

import com.elseeker.bible.adapter.input.api.client.response.BibleSearchResponse
import com.elseeker.bible.domain.model.BibleVerse
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Slice
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface BibleVerseRepository : JpaRepository<BibleVerse, Long> {

    fun findByChapterId(chapterId: Long, pageable: Pageable): Page<BibleVerse>

    @Query(
        """
        SELECT new com.elseeker.bible.adapter.input.api.client.response.BibleSearchResponse(
                    b.id,
                    b.bookOrder,
                    b.name,
                    c.id,
                    c.chapterNumber,
                    v.id,
                    v.verseNumber,
                    v.text
                )
        FROM BibleVerse v
        JOIN BibleChapter c ON v.chapterId = c.id
        JOIN BibleBook b ON c.bookId = b.id
        WHERE b.translationId = :translationId
          AND LOWER(v.text) LIKE LOWER(CONCAT('%', :keyword, '%'))
          AND (:bookOrder IS NULL OR b.bookOrder = :bookOrder)
        ORDER BY b.bookOrder, c.chapterNumber, v.verseNumber
        """
    )
    fun searchSliceByTranslationAndText(
        @Param("translationId") translationId: Long,
        @Param("keyword") keyword: String,
        @Param("bookOrder") bookOrder: Int?,
        pageable: Pageable
    ): Slice<BibleSearchResponse>

    @Query(
        """
        SELECT COUNT(v.id)
        FROM BibleVerse v
        JOIN BibleChapter c ON v.chapterId = c.id
        JOIN BibleBook b ON c.bookId = b.id
        WHERE b.translationId = :translationId
          AND LOWER(v.text) LIKE LOWER(CONCAT('%', :keyword, '%'))
          AND (:bookOrder IS NULL OR b.bookOrder = :bookOrder)
        """
    )
    fun countByTranslationAndText(
        @Param("translationId") translationId: Long,
        @Param("keyword") keyword: String,
        @Param("bookOrder") bookOrder: Int?
    ): Long

    @Query(
        """
        SELECT new com.elseeker.bible.adapter.input.api.client.response.BibleSearchResponse(
                    b.id,
                    b.bookOrder,
                    b.name,
                    c.id,
                    c.chapterNumber,
                    v.id,
                    v.verseNumber,
                    v.text
                )
        FROM BibleVerse v
        JOIN BibleChapter c ON v.chapterId = c.id
        JOIN BibleBook b ON c.bookId = b.id
        WHERE b.translationId = :translationId
        ORDER BY b.bookOrder, c.chapterNumber, v.verseNumber
        """
    )
    fun findSliceByTranslation(
        @Param("translationId") translationId: Long,
        pageable: Pageable
    ): Slice<BibleSearchResponse>

    @Query(
        """
        SELECT COUNT(v.id)
        FROM BibleVerse v
        JOIN BibleChapter c ON v.chapterId = c.id
        JOIN BibleBook b ON c.bookId = b.id
        WHERE b.translationId = :translationId
        """
    )
    fun countByTranslationId(
        @Param("translationId") translationId: Long
    ): Long


    @Query(
        """
            SELECT v.text
            FROM BibleVerse v
            JOIN BibleChapter c ON v.chapterId = c.id
            JOIN BibleBook b ON c.bookId = b.id
            WHERE b.translationId = :translationId 
                AND b.bookOrder = :bookOrder 
                AND c.chapterNumber = :chapterNumber 
                AND v.verseNumber = :verseNumber
        """
    )
    fun findVerseText(
        @Param("translationId") translationId: Long,
        @Param("bookOrder") bookOrder: Int,
        @Param("chapterNumber") chapterNumber: Int,
        @Param("verseNumber") verseNumber: Int
    ): String?

    /**
     * 단어 빈도 재계산용 본문 조회. 텍스트 컬럼만 뽑으므로 엔티티를 만들지 않고 N+1 도 없다.
     *
     * 빈도 집계에 순서는 무의미하므로 `ORDER BY` 를 넣지 않는다. 시편이면 2,461행을 괜히
     * 정렬하게 된다.
     */
    @Query(
        """
        SELECT new com.elseeker.bible.adapter.output.jpa.ChapterVerseText(c.chapterNumber, v.text)
        FROM BibleVerse v
        JOIN BibleChapter c ON v.chapterId = c.id
        JOIN BibleBook b ON c.bookId = b.id
        WHERE b.translationId = :translationId
          AND b.bookOrder = :bookOrder
        """
    )
    fun findChapterTextsByBook(
        @Param("translationId") translationId: Long,
        @Param("bookOrder") bookOrder: Int
    ): List<ChapterVerseText>

    /**
     * 키워드 문자열 집계용 본문 조회. [findChapterTextsByBook] 과 달리 **절 번호를 함께** 뽑는다.
     * 집계 결과와 함께 "실제로 잡힌 절" 을 보여 줘야 관리자가 오검출을 알아볼 수 있다.
     */
    @Query(
        """
        SELECT new com.elseeker.bible.adapter.output.jpa.BookVerseText(
            c.chapterNumber, v.verseNumber, v.text
        )
        FROM BibleVerse v
        JOIN BibleChapter c ON v.chapterId = c.id
        JOIN BibleBook b ON c.bookId = b.id
        WHERE b.translationId = :translationId
          AND b.bookOrder = :bookOrder
        """
    )
    fun findVerseTextsByBook(
        @Param("translationId") translationId: Long,
        @Param("bookOrder") bookOrder: Int
    ): List<BookVerseText>

    @Query(
        """
        SELECT v.text
        FROM BibleVerse v
        JOIN BibleChapter c ON v.chapterId = c.id
        JOIN BibleBook b ON c.bookId = b.id
        WHERE b.translationId = :translationId
          AND b.bookOrder = :bookOrder
          AND c.chapterNumber = :chapterNumber
        """
    )
    fun findTextsByChapter(
        @Param("translationId") translationId: Long,
        @Param("bookOrder") bookOrder: Int,
        @Param("chapterNumber") chapterNumber: Int
    ): List<String>

}

/**
 * 장 번호 + 절 본문. JPQL 생성자 프로젝션 대상이라 파라미터 순서를 바꾸면 깨진다.
 */
data class ChapterVerseText(
    val chapterNumber: Int,
    val text: String,
)

/**
 * 장·절 번호 + 절 본문. JPQL 생성자 프로젝션 대상이라 파라미터 순서를 바꾸면 깨진다.
 */
data class BookVerseText(
    val chapterNumber: Int,
    val verseNumber: Int,
    val text: String,
)
