package com.elseeker.bible.adapter.input.api.client

import com.elseeker.bible.adapter.input.api.client.response.BibleApiResponse
import com.elseeker.bible.application.service.BibleService
import org.springframework.http.CacheControl
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.concurrent.TimeUnit

@RestController
@RequestMapping("/api/v1/bibles/translations")
class BibleTranslationApi(
    private val bibleService: BibleService,
) : BibleTranslationApiDocument {

    private val cacheControl = CacheControl.maxAge(1, TimeUnit.DAYS).cachePublic()

    @GetMapping
    override fun getTranslations(): ResponseEntity<List<BibleApiResponse.Translation>> {
        val response = bibleService.getTranslations().map(BibleApiResponse.Translation::from)
        return ResponseEntity.ok().cacheControl(cacheControl).body(response)
    }

    @GetMapping("/{translationId}")
    override fun getTranslation(
        @PathVariable translationId: Long,
    ): ResponseEntity<BibleApiResponse.Translation> {
        val response = BibleApiResponse.Translation.from(bibleService.getTranslation(translationId))
        return ResponseEntity.ok().cacheControl(cacheControl).body(response)
    }
}
