package com.elseeker.bible.adapter.input.api.client

import com.elseeker.bible.adapter.input.api.client.response.BibleWordStatResponse
import com.elseeker.bible.application.service.BibleWordStatService
import org.springframework.http.CacheControl
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.concurrent.TimeUnit

/**
 * 성경 조회 API 경로 전체가 `SecurityConfig` 에서 `permitAll` 이므로 별도 설정이 필요 없다.
 */
@RestController
@RequestMapping("/api/v1/bibles")
class BibleWordStatApi(
    private val bibleWordStatService: BibleWordStatService,
) : BibleWordStatApiDocument {

    /**
     * `BibleApi` 의 다른 조회는 하루 캐시지만 그쪽은 사람이 고치지 않는 본문 데이터다.
     * 단어 통계는 **관리자가 편집하는 데이터**라 하루는 너무 길다.
     */
    private val wordStatCacheControl = CacheControl.maxAge(1, TimeUnit.HOURS).cachePublic()

    @GetMapping("/translations/{translationId}/books/{bookOrder}/word-stats")
    override fun getBookWordStats(
        @PathVariable translationId: Long,
        @PathVariable bookOrder: Int,
        @RequestParam(defaultValue = "100") limit: Int,
    ): ResponseEntity<BibleWordStatResponse> {
        val result = bibleWordStatService.getBookWordStat(translationId, bookOrder, limit)
        return ResponseEntity.ok()
            .cacheControl(wordStatCacheControl)
            .body(BibleWordStatResponse.from(result))
    }

    @GetMapping("/translations/{translationId}/books/{bookOrder}/chapters/{chapterNumber}/word-stats")
    override fun getChapterWordStats(
        @PathVariable translationId: Long,
        @PathVariable bookOrder: Int,
        @PathVariable chapterNumber: Int,
        @RequestParam(defaultValue = "100") limit: Int,
    ): ResponseEntity<BibleWordStatResponse> {
        val result = bibleWordStatService.getChapterWordStat(translationId, bookOrder, chapterNumber, limit)
        return ResponseEntity.ok()
            .cacheControl(wordStatCacheControl)
            .body(BibleWordStatResponse.from(result))
    }
}
