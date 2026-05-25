package com.elseeker.bible.adapter.input.api.client

import com.elseeker.bible.adapter.input.api.client.response.BibleApiResponse
import com.elseeker.bible.adapter.input.api.client.response.BibleDailyVerseResponse
import com.elseeker.bible.adapter.input.api.client.response.BibleSearchSliceResponse
import com.elseeker.bible.domain.vo.BibleTranslationType
import com.elseeker.bible.domain.vo.DirectionType
import org.springframework.http.ResponseEntity

interface BibleApiDocument {

    /**
     * 📌 번역본(Translation) 리스트 조회
     */
    fun getTranslations(): ResponseEntity<List<BibleApiResponse.Translation>>

    /**
     * 📌 특정 번역본(Translation)에 해당하는 책(Book) 리스트 조회
     */
    fun getBooks(
        translationId: Long
    ): ResponseEntity<List<BibleApiResponse.Book>>

    /**
     * 📌 특정 책(Book) 조회
     */
    fun getBook(
        translationId: Long,
        bookOrder: Int
    ): ResponseEntity<BibleApiResponse.BookDetail>

    /**
     * 📌 특정 책(Book)에 해당하는 장(Chapter) 리스트 조회
     */
    fun getChapters(
        translationId: Long,
        bookOrder: Int
    ): ResponseEntity<BibleApiResponse.Chapters>

    /**
     * 📌 특정 장(Chapter)에 해당하는 절(Verse) 리스트 조회
     */
    fun getChapterVerses(
        translationId: Long,
        bookOrder: Int,
        chapterNumber: Int
    ): ResponseEntity<BibleApiResponse.Verses>

    fun getAdjacentChapterVerses(
        translationId: Long,
        bookOrder: Int,
        chapterNumber: Int,
        direction: DirectionType // "prev" or "next"
    ): ResponseEntity<BibleApiResponse.Verses>

    /**
     * 📌 성경 구절 검색 (키워드 포함)
     *
     * @param track 인기 검색어 집계 여부. 기본 true. 통합 검색의 자동완성/결과 페이지처럼
     *              사용자 의도가 명확하지 않은 백그라운드 호출은 false 로 전달하여 랭킹 오염 방지.
     */
    fun searchBible(
        translationId: Long,
        keyword: String,
        bookOrder: Int?,
        page: Int,
        size: Int,
        track: Boolean
    ): ResponseEntity<BibleSearchSliceResponse>

    /**
     * 📌 오늘의 성경 구절 (일 단위 랜덤)
     */
    fun getDailyVerse(
        translationType: BibleTranslationType
    ): ResponseEntity<BibleDailyVerseResponse>
}
