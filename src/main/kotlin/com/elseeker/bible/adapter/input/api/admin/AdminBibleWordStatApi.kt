package com.elseeker.bible.adapter.input.api.admin

import com.elseeker.bible.adapter.input.api.admin.request.AdminBibleWordStatCreateRequest
import com.elseeker.bible.adapter.input.api.admin.request.AdminBibleWordStatUpdateRequest
import com.elseeker.bible.adapter.output.jpa.BibleWordStatRow
import com.elseeker.bible.application.service.AdminBibleWordStatService
import com.elseeker.bible.domain.model.BibleWordStat
import com.elseeker.bible.domain.vo.BibleWordStatSource
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.Instant

@RestController
@RequestMapping("/api/v1/admin/bible/word-stats")
class AdminBibleWordStatApi(
    private val adminBibleWordStatService: AdminBibleWordStatService,
) : AdminBibleWordStatApiDocument {

    @GetMapping
    override fun list(
        @RequestParam translationId: Long,
        @RequestParam bookOrder: Int,
        @RequestParam(required = false) chapterNumber: Int?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "50") size: Int,
    ): ResponseEntity<StatRowPageResponse> {
        val result = adminBibleWordStatService.findRows(translationId, bookOrder, chapterNumber, page, size)
        return ResponseEntity.ok(StatRowPageResponse.from(result))
    }

    @GetMapping("/runs")
    override fun runs(@RequestParam translationId: Long): ResponseEntity<List<RunItem>> {
        val runs = adminBibleWordStatService.findRuns(translationId).map(RunItem::from)
        return ResponseEntity.ok(runs)
    }

    @PostMapping("/recalculate")
    override fun recalculate(
        @RequestParam translationId: Long,
        @RequestParam bookOrder: Int,
    ): ResponseEntity<RecalculateResponse> {
        val result = adminBibleWordStatService.recalculateBook(translationId, bookOrder)
        return ResponseEntity.ok(RecalculateResponse.from(result))
    }

    @GetMapping("/candidates")
    override fun candidates(
        @RequestParam translationId: Long,
        @RequestParam(required = false) bookOrder: Int?,
        @RequestParam(defaultValue = "300") limit: Int,
    ): ResponseEntity<List<CandidateItem>> {
        val items = adminBibleWordStatService.findCandidates(translationId, bookOrder, limit)
            .map { CandidateItem(it.term, it.count) }
        return ResponseEntity.ok(items)
    }

    @PostMapping
    override fun create(
        @RequestBody request: AdminBibleWordStatCreateRequest,
    ): ResponseEntity<StatItem> {
        val created = adminBibleWordStatService.createManual(
            translationId = request.translationId,
            bookOrder = request.bookOrder,
            chapterNumber = request.chapterNumber,
            bibleWordId = request.bibleWordId,
            wordCount = request.wordCount,
        )
        return ResponseEntity.ok(StatItem.from(created))
    }

    @PatchMapping("/{id}")
    override fun update(
        @PathVariable id: Long,
        @RequestBody request: AdminBibleWordStatUpdateRequest,
    ): ResponseEntity<StatItem> =
        ResponseEntity.ok(StatItem.from(adminBibleWordStatService.updateCount(id, request.wordCount)))

    @DeleteMapping("/{id}")
    override fun delete(@PathVariable id: Long): ResponseEntity<Void> {
        adminBibleWordStatService.delete(id)
        return ResponseEntity.noContent().build()
    }

    data class StatRowPageResponse(
        val content: List<Row>,
        val totalElements: Long,
        val page: Int,
        val size: Int,
    ) {
        data class Row(
            val id: Long,
            val bibleWordId: Long,
            val term: String,
            val chapterNumber: Int,
            val wordCount: Int,
            val source: BibleWordStatSource,
        ) {
            companion object {
                fun from(row: BibleWordStatRow) = Row(
                    id = row.id,
                    bibleWordId = row.bibleWordId,
                    term = row.term,
                    chapterNumber = row.chapterNumber,
                    wordCount = row.wordCount,
                    source = row.source,
                )
            }
        }

        companion object {
            fun from(page: AdminBibleWordStatService.StatRowPage) = StatRowPageResponse(
                content = page.rows.map(Row::from),
                totalElements = page.totalElements,
                page = page.page,
                size = page.size,
            )
        }
    }

    data class StatItem(
        val id: Long,
        val bibleWordId: Long,
        val translationId: Long,
        val bookOrder: Int,
        val chapterNumber: Int,
        val wordCount: Int,
        val source: BibleWordStatSource,
    ) {
        companion object {
            fun from(s: BibleWordStat) = StatItem(
                id = s.id!!,
                bibleWordId = s.bibleWordId,
                translationId = s.translationId,
                bookOrder = s.bookOrder,
                chapterNumber = s.chapterNumber,
                wordCount = s.wordCount,
                source = s.source,
            )
        }
    }

    data class RecalculateResponse(
        val chapterCount: Int,
        val insertedRowCount: Int,
        val manualKeptCount: Int,
        val topUnmatched: List<CandidateItem>,
    ) {
        companion object {
            fun from(result: AdminBibleWordStatService.RecalculateResult) = RecalculateResponse(
                chapterCount = result.chapterCount,
                insertedRowCount = result.insertedRowCount,
                manualKeptCount = result.manualKeptCount,
                topUnmatched = result.topUnmatched.map { CandidateItem(it.term, it.count) },
            )
        }
    }

    data class RunItem(
        val bookOrder: Int,
        val calculatedAt: Instant,
        val chapterCount: Int,
        val statRowCount: Int,
        val manualKept: Int,
    ) {
        companion object {
            fun from(run: com.elseeker.bible.domain.model.BibleWordStatRun) = RunItem(
                bookOrder = run.bookOrder,
                calculatedAt = run.calculatedAt,
                chapterCount = run.chapterCount,
                statRowCount = run.statRowCount,
                manualKept = run.manualKept,
            )
        }
    }

    data class CandidateItem(
        val term: String,
        val count: Int,
    )
}
