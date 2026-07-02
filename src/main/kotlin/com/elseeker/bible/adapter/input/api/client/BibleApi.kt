package com.elseeker.bible.adapter.input.api.client

import com.elseeker.bible.adapter.input.api.client.response.BibleApiResponse
import com.elseeker.bible.adapter.input.api.client.response.BibleDailyVerseResponse
import com.elseeker.bible.adapter.input.api.client.response.BibleSearchSliceResponse
import com.elseeker.bible.application.service.BibleService
import com.elseeker.bible.domain.vo.BibleTranslationType
import com.elseeker.bible.domain.vo.DirectionType
import org.springframework.http.CacheControl
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.concurrent.TimeUnit

@RestController
@RequestMapping("/api/v1/bibles")
class BibleApi(
    private val bibleService: BibleService
) : BibleApiDocument {

    private val bibleCacheControl = CacheControl.maxAge(1, TimeUnit.DAYS).cachePublic()

    @GetMapping("/translations/{translationId}/books")
    override fun getBooks(
        @PathVariable translationId: Long
    ): ResponseEntity<List<BibleApiResponse.Book>> {
        val response = bibleService.getBooks(translationId).map(BibleApiResponse.Book::from)
        return ResponseEntity.ok().cacheControl(bibleCacheControl).body(response)
    }

    @GetMapping("/translations/{translationId}/books/{bookOrder}")
    override fun getBook(
        @PathVariable translationId: Long,
        @PathVariable bookOrder: Int
    ): ResponseEntity<BibleApiResponse.BookDetail> {
        val response = bibleService.getBook(translationId, bookOrder)
        return ResponseEntity.ok().cacheControl(bibleCacheControl).body(response)
    }

    @GetMapping("/translations/{translationId}/books/{bookOrder}/chapters")
    override fun getChapters(
        @PathVariable translationId: Long,
        @PathVariable bookOrder: Int
    ): ResponseEntity<BibleApiResponse.Chapters> {
        val response = bibleService.getChapters(translationId, bookOrder)
        return ResponseEntity.ok().cacheControl(bibleCacheControl).body(response)
    }

    @GetMapping("/translations/{translationId}/books/{bookOrder}/chapters/{chapterNumber}/verses")
    override fun getChapterVerses(
        @PathVariable translationId: Long,
        @PathVariable bookOrder: Int,
        @PathVariable chapterNumber: Int
    ): ResponseEntity<BibleApiResponse.Verses> {
        val response = bibleService.getChapterVerses(translationId, bookOrder, chapterNumber)
        return ResponseEntity.ok().cacheControl(bibleCacheControl).body(response)
    }

    @GetMapping("/translations/{translationId}/books/{bookOrder}/chapters/{chapterNumber}/navigate")
    override fun getAdjacentChapterVerses(
        @PathVariable translationId: Long,
        @PathVariable bookOrder: Int,
        @PathVariable chapterNumber: Int,
        @RequestParam direction: DirectionType // "prev" or "next"
    ): ResponseEntity<BibleApiResponse.Verses> {
        val response = bibleService.getAdjacentChapterVerses(translationId, bookOrder, chapterNumber, direction)
        return ResponseEntity.ok().cacheControl(bibleCacheControl).body(response)
    }

    @GetMapping("/translations/{translationId}/search")
    override fun searchBible(
        @PathVariable translationId: Long,
        @RequestParam keyword: String,
        @RequestParam(required = false) bookOrder: Int?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "50") size: Int,
        @RequestParam(defaultValue = "true") track: Boolean
    ): ResponseEntity<BibleSearchSliceResponse> {
        val response = bibleService.searchBibleVersesSlice(translationId, keyword, bookOrder, page, size, track)
        return ResponseEntity.ok(response)
    }

    @GetMapping("/daily")
    override fun getDailyVerse(
        @RequestParam(defaultValue = "KRV") translationType: BibleTranslationType
    ): ResponseEntity<BibleDailyVerseResponse> {
        val verse = bibleService.getDailyVerse(translationType)
        return ResponseEntity.ok(BibleDailyVerseResponse.Companion.from(translationType, verse))
    }
}
