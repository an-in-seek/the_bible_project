package com.seek.thebible.presentation.bible

import com.seek.thebible.application.bible.BibleFacade
import com.seek.thebible.presentation.bible.dto.*
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/bibles")
class BibleController(
    private val bibleFacade: BibleFacade
) {

    /**
     * 📌 번역본(Translation) 리스트 조회
     */
    @GetMapping("/translations")
    fun getTranslations(): ResponseEntity<List<TranslationResponse>> {
        val response = bibleFacade.getTranslations().map(TranslationResponse::from)
        return ResponseEntity.ok().body(response)
    }

    /**
     * 📌 특정 번역본(Translation)에 해당하는 책(Book) 리스트 조회
     */
    @GetMapping("/translations/{translationId}/books")
    fun getBooks(
        @PathVariable translationId: Long
    ): ResponseEntity<List<BookResponse>> {
        val response = bibleFacade.getBooks(translationId).map(BookResponse::from)
        return ResponseEntity.ok().body(response)
    }

    /**
     * 📌 특정 책(Book)에 해당하는 장(Chapter) 리스트 조회
     */
    @GetMapping("/translations/{translationId}/books/{bookId}/chapters")
    fun getChapters(
        @PathVariable translationId: Long,
        @PathVariable bookId: Long
    ): ResponseEntity<ChaptersViewResponse> {
        val response = bibleFacade.getChapters(bookId).let(ChaptersViewResponse::from)
        return ResponseEntity.ok().body(response)
    }

    /**
     * 📌 특정 장(Chapter)에 해당하는 절(Verse) 리스트 조회
     */
    @GetMapping("/translations/{translationId}/books/{bookId}/chapters/{chapterId}/verses")
    fun getVerses(
        @PathVariable translationId: Long,
        @PathVariable bookId: Long,
        @PathVariable chapterId: Long
    ): ResponseEntity<VersesViewResponse> {
        val result = bibleFacade.getVerses(bookId, chapterId)
        val response = VersesViewResponse.from(result)
        return ResponseEntity.ok().body(response)
    }

    /**
     * 📌 성경 구절 검색 (키워드 포함)
     */
    @GetMapping("/search")
    fun searchBible(@RequestParam keyword: String): ResponseEntity<List<SearchVerseResponse>> {
        val response = bibleFacade.searchBibleVerses(keyword).map(SearchVerseResponse::from)
        return ResponseEntity.ok(response)
    }
}
