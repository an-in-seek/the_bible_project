package com.seek.thebible.presentation.bible

import com.seek.thebible.application.bible.BibleFacade
import com.seek.thebible.domain.bible.model.BibleTranslationType
import com.seek.thebible.presentation.bible.dto.BibleVerseResponse
import com.seek.thebible.presentation.bible.dto.BookWithChaptersResponse
import com.seek.thebible.presentation.bible.dto.ChapterWithVersesResponse
import com.seek.thebible.presentation.bible.dto.SearchVerseResponse
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/bibles")
class BibleController(
    private val bibleFacade: BibleFacade
) {

    /**
     * 📌 특정 번역본에서 책과 해당 장 목록 조회
     * GET /bibles/{translation}/books/{book}
     */
    @GetMapping("/{translation}/books/{book}")
    fun getBookWithChapters(
        @PathVariable translation: BibleTranslationType,
        @PathVariable book: String
    ): BookWithChaptersResponse {
        return BookWithChaptersResponse.from(
            bibleFacade.getBookWithChapters(translation, book)
        )
    }

    /**
     * 📌 특정 책의 특정 장과 해당 절 목록 조회
     * GET /bibles/books/{bookId}/chapters/{chapterNumber}
     */
    @GetMapping("/books/{bookId}/chapters/{chapterNumber}")
    fun getChapterWithVerses(
        @PathVariable bookId: Long,
        @PathVariable chapterNumber: Int
    ): ChapterWithVersesResponse {
        return ChapterWithVersesResponse.from(
            bibleFacade.getChapterWithVerses(bookId, chapterNumber)
        )
    }

    /**
     * 📌 특정 번역본에서 특정 구절 조회
     * GET /bibles/{translation}/books/{book}/chapters/{chapter}/verses/{verse}
     */
    @GetMapping("/{translation}/books/{book}/chapters/{chapter}/verses/{verse}")
    fun getBibleVerse(
        @PathVariable translation: BibleTranslationType,
        @PathVariable book: String,
        @PathVariable chapter: Int,
        @PathVariable verse: Int
    ): BibleVerseResponse {
        val text = bibleFacade.getBibleVerse(translation, book, chapter, verse)
        return BibleVerseResponse(translation.name, book, chapter, verse, text)
    }

    /**
     * 📌 성경 구절 검색 (키워드 포함)
     * GET /bibles/search?keyword=
     */
    @GetMapping("/search")
    fun searchBibleVerses(@RequestParam keyword: String): List<SearchVerseResponse> {
        return bibleFacade.searchBibleVerses(keyword).map { SearchVerseResponse.from(it) }
    }
}
