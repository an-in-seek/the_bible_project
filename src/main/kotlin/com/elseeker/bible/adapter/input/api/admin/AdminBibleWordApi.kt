package com.elseeker.bible.adapter.input.api.admin

import com.elseeker.bible.adapter.input.api.admin.request.AdminBibleWordBulkRequest
import com.elseeker.bible.adapter.input.api.admin.request.AdminBibleWordCopyRequest
import com.elseeker.bible.adapter.input.api.admin.request.AdminBibleWordRequest
import com.elseeker.bible.adapter.input.api.admin.request.AdminBibleWordStatusRequest
import com.elseeker.bible.application.service.AdminBibleWordService
import com.elseeker.bible.domain.model.BibleWord
import com.elseeker.bible.domain.model.BibleWordUpdateCommand
import com.elseeker.bible.domain.vo.BibleWordCategory
import com.elseeker.bible.domain.vo.BibleWordStatus
import com.elseeker.common.adapter.input.api.admin.response.AdminPageResponse
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

/**
 * 관리자 어휘 관리 API. 관리자 API 경로 전체가 `SecurityConfig` 에서 이미 `hasRole("ADMIN")` 이다.
 */
@RestController
@RequestMapping("/api/v1/admin/bible/words")
class AdminBibleWordApi(
    private val adminBibleWordService: AdminBibleWordService,
) : AdminBibleWordApiDocument {

    @GetMapping
    override fun list(
        @RequestParam translationId: Long,
        @RequestParam(required = false) status: BibleWordStatus?,
        @RequestParam(required = false) category: BibleWordCategory?,
        @RequestParam(required = false) term: String?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "50") size: Int,
    ): ResponseEntity<AdminPageResponse<WordItem>> {
        val pageable = PageRequest.of(page, size, Sort.by("term"))
        val result = adminBibleWordService.findAll(translationId, status, category, term, pageable)
        return ResponseEntity.ok(AdminPageResponse.from(result) { WordItem.from(it) })
    }

    @GetMapping("/{id}")
    override fun get(@PathVariable id: Long): ResponseEntity<WordDetail> {
        val word = adminBibleWordService.findById(id)
        val aliases = adminBibleWordService.findAliases(id).map { it.alias }
        val manualStatCount = adminBibleWordService.countManualStats(id)
        return ResponseEntity.ok(WordDetail.from(word, aliases, manualStatCount))
    }

    @PostMapping
    override fun create(
        @RequestParam translationId: Long,
        @RequestBody request: AdminBibleWordRequest,
    ): ResponseEntity<WordItem> {
        val created = adminBibleWordService.create(
            translationId = translationId,
            term = request.term,
            category = request.category,
            status = request.status,
            dictionaryId = request.dictionaryId,
            note = request.note,
            aliases = request.aliases,
        )
        return ResponseEntity.ok(WordItem.from(created))
    }

    @PutMapping("/{id}")
    override fun update(
        @PathVariable id: Long,
        @RequestBody request: AdminBibleWordRequest,
    ): ResponseEntity<WordItem> {
        val updated = adminBibleWordService.update(
            id = id,
            command = BibleWordUpdateCommand(
                term = request.term,
                category = request.category,
                dictionaryId = request.dictionaryId,
                note = request.note,
            ),
            aliases = request.aliases,
        )
        return ResponseEntity.ok(WordItem.from(updated))
    }

    @PatchMapping("/{id}/status")
    override fun changeStatus(
        @PathVariable id: Long,
        @RequestBody request: AdminBibleWordStatusRequest,
    ): ResponseEntity<WordItem> =
        ResponseEntity.ok(WordItem.from(adminBibleWordService.changeStatus(id, request.status)))

    @DeleteMapping("/{id}")
    override fun delete(@PathVariable id: Long): ResponseEntity<Void> {
        adminBibleWordService.delete(id)
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/import-from-dictionary")
    override fun importFromDictionary(
        @RequestParam translationId: Long,
    ): ResponseEntity<ImportResultResponse> {
        val result = adminBibleWordService.importFromDictionary(translationId)
        return ResponseEntity.ok(ImportResultResponse(result.imported, result.skipped))
    }

    @PostMapping("/bulk")
    override fun bulkCreate(
        @RequestParam translationId: Long,
        @RequestBody request: AdminBibleWordBulkRequest,
    ): ResponseEntity<ImportResultResponse> {
        val result = adminBibleWordService.bulkCreate(translationId, request.terms, request.status)
        return ResponseEntity.ok(ImportResultResponse(result.imported, result.skipped, result.rejected))
    }

    @PostMapping("/copy-from")
    override fun copyFrom(
        @RequestParam translationId: Long,
        @RequestBody request: AdminBibleWordCopyRequest,
    ): ResponseEntity<ImportResultResponse> {
        val result = adminBibleWordService.copyFrom(request.sourceTranslationId, translationId)
        return ResponseEntity.ok(ImportResultResponse(result.imported, result.skipped))
    }

    data class WordItem(
        val id: Long,
        val translationId: Long,
        val term: String,
        val category: BibleWordCategory,
        val status: BibleWordStatus,
        val dictionaryId: Long?,
    ) {
        companion object {
            fun from(w: BibleWord) = WordItem(
                id = w.id!!,
                translationId = w.translationId,
                term = w.term,
                category = w.category,
                status = w.status,
                dictionaryId = w.dictionaryId,
            )
        }
    }

    data class WordDetail(
        val id: Long,
        val translationId: Long,
        val term: String,
        val category: BibleWordCategory,
        val status: BibleWordStatus,
        val dictionaryId: Long?,
        val note: String?,
        val aliases: List<String>,
        /** 삭제 시 함께 사라지는 관리자 입력 값의 개수. 경고 문구에 쓴다. */
        val manualStatCount: Long,
    ) {
        companion object {
            fun from(w: BibleWord, aliases: List<String>, manualStatCount: Long) = WordDetail(
                id = w.id!!,
                translationId = w.translationId,
                term = w.term,
                category = w.category,
                status = w.status,
                dictionaryId = w.dictionaryId,
                note = w.note,
                aliases = aliases,
                manualStatCount = manualStatCount,
            )
        }
    }

    /** @param rejected 표제어가 될 수 없어 거부한 건수(조사가 붙어 있거나 활용형) */
    data class ImportResultResponse(
        val imported: Int,
        val skipped: Int,
        val rejected: Int = 0,
    )
}
