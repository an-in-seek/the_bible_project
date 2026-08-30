package com.elseeker.bible.adapter.input.api.admin

import com.elseeker.bible.adapter.input.api.admin.request.AdminBibleWordStatCreateRequest
import com.elseeker.bible.adapter.input.api.admin.request.AdminBibleWordStatKeywordRequest
import com.elseeker.bible.adapter.input.api.admin.request.AdminBibleWordStatUpdateRequest
import com.elseeker.bible.adapter.output.jpa.BibleWordStatRow
import com.elseeker.bible.application.service.AdminBibleWordStatService
import com.elseeker.bible.domain.model.BibleWordStat
import com.elseeker.bible.domain.vo.BibleWordStatSource
import com.elseeker.bible.domain.vo.BibleWordStatus
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

    @GetMapping("/keyword")
    override fun countKeyword(
        @RequestParam translationId: Long,
        @RequestParam(required = false) bookOrder: Int?,
        @RequestParam keyword: String,
    ): ResponseEntity<KeywordCountResponse> {
        val result = adminBibleWordStatService.countKeyword(translationId, bookOrder, keyword)
        return ResponseEntity.ok(KeywordCountResponse.from(result))
    }

    @PostMapping("/keyword")
    override fun saveKeyword(
        @RequestBody request: AdminBibleWordStatKeywordRequest,
    ): ResponseEntity<KeywordSaveResponse> {
        val result = adminBibleWordStatService.saveKeywordStat(
            request.translationId, request.bookOrder, request.keyword
        )
        return ResponseEntity.ok(KeywordSaveResponse.from(result))
    }

    @DeleteMapping("/keyword")
    override fun deleteKeyword(
        @RequestParam translationId: Long,
        @RequestParam(required = false) bookOrder: Int?,
        @RequestParam keyword: String,
    ): ResponseEntity<KeywordDeleteResponse> {
        val deleted = adminBibleWordStatService.deleteKeywordStat(translationId, bookOrder, keyword)
        return ResponseEntity.ok(KeywordDeleteResponse(deleted))
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

    /**
     * @param matcherCountable 책 단위 재계산이 이 단어를 셀 수 있는지. 저장 값은 어느 쪽이든
     *   `KEYWORD` 로 남아 재계산이 건드리지 않는다. 행을 지웠을 때 다음 재계산이 다시
     *   채워 주는지가 갈리므로 화면 안내가 달라진다.
     * @param samples 실제로 잡힌 절. 문자열 기준이라 오검출을 사람이 봐야 한다.
     */
    data class KeywordCountResponse(
        val keyword: String,
        /** 입력한 키워드가 별칭이면 해석된 표제어 표기. 같으면 null */
        val resolvedTerm: String?,
        val bibleWordId: Long?,
        val wordStatus: BibleWordStatus?,
        val aliases: List<String>,
        val matcherCountable: Boolean,
        /** null 이면 번역본 전체를 센 결과 */
        val bookOrder: Int?,
        val totalCount: Int,
        /** 책을 고른 경우에만 채워진다 */
        val chapterCounts: List<ChapterCountItem>,
        /** 번역본 전체인 경우에만 채워진다. 횟수 내림차순 */
        val bookCounts: List<BookCountItem>,
    ) {
        companion object {
            fun from(result: AdminBibleWordStatService.KeywordCountResult) = KeywordCountResponse(
                keyword = result.keyword,
                resolvedTerm = result.resolvedTerm,
                bibleWordId = result.bibleWordId,
                wordStatus = result.wordStatus,
                aliases = result.aliases,
                matcherCountable = result.matcherCountable,
                bookOrder = result.bookOrder,
                totalCount = result.totalCount,
                chapterCounts = result.chapterCounts.map {
                    ChapterCountItem(it.chapterNumber, it.wordCount)
                },
                bookCounts = result.bookCounts.map {
                    BookCountItem(it.bookOrder, it.wordCount)
                },
            )
        }
    }

    /** @param deletedRowCount 지운 `KEYWORD` 행 수 */
    data class KeywordDeleteResponse(
        val deletedRowCount: Int,
    )

    data class ChapterCountItem(
        val chapterNumber: Int,
        val wordCount: Int,
    )

    data class BookCountItem(
        val bookOrder: Int,
        val wordCount: Int,
    )


    /**
     * @param registeredWord 어휘에 없던 키워드라 표제어로 새로 등록했는지
     * @param replacedRowCount 새 값으로 바뀐 옛 행 수(`AUTO`·`KEYWORD`)
     * @param manualKeptCount 손으로 고친 값이라 그대로 둔 행 수(`MANUAL`)
     */
    data class KeywordSaveResponse(
        val count: KeywordCountResponse,
        val registeredWord: Boolean,
        val source: BibleWordStatSource,
        val savedRowCount: Int,
        val replacedRowCount: Int,
        val manualKeptCount: Int,
        /** 값이 들어간 책 수 */
        val bookCount: Int,
    ) {
        companion object {
            fun from(result: AdminBibleWordStatService.KeywordSaveResult) = KeywordSaveResponse(
                count = KeywordCountResponse.from(result.count),
                registeredWord = result.registeredWord,
                source = result.source,
                savedRowCount = result.savedRowCount,
                replacedRowCount = result.replacedRowCount,
                manualKeptCount = result.manualKeptCount,
                bookCount = result.bookCount,
            )
        }
    }
}
