package com.elseeker.study.adapter.input.web.client

import com.elseeker.study.adapter.input.web.client.response.HistoryDummyData
import com.elseeker.study.adapter.input.web.client.response.HistoryEventDetail
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam

@Controller
@RequestMapping("/web/study/history")
class HistoryWebController {

    @GetMapping
    fun showHistoryMain(
        @RequestParam(required = false) selectedEra: String?,
        model: Model
    ): String {
        val normalizedSelectedEra = selectedEra?.trim().orEmpty().ifBlank { null }
        model.addAttribute("eras", HistoryDummyData.eras)
        model.addAttribute("bookCategories", HistoryDummyData.bookCategories)
        model.addAttribute("timelineBlocks", HistoryDummyData.timelineBlocks)
        model.addAttribute("selectedEra", normalizedSelectedEra)
        return "study/history"
    }

    @GetMapping("/{era}")
    fun showEraHistory(
        @PathVariable era: String,
        model: Model
    ): String {
        val eraSummary = HistoryDummyData.findEra(era)
        val events = HistoryDummyData.eventsForEra(era)
        model.addAttribute("eras", HistoryDummyData.eras)
        model.addAttribute("currentEra", eraSummary)
        model.addAttribute("currentEraSlug", era)
        model.addAttribute("events", events)
        eraSummary?.let { model.addAttribute("shareTitle", "${it.label} - 성경 연대기") }
        return "study/history-era"
    }

    @GetMapping("/event/{id}")
    fun showEventDetail(
        @PathVariable id: String,
        model: Model
    ): String {
        val detail = HistoryDummyData.findEventDetail(id) ?: buildFallbackDetail(id)
        model.addAttribute("detail", detail)
        model.addAttribute("shareTitle", "${detail.title} - 성경 역사")
        return "study/history-event"
    }

    private fun buildFallbackDetail(id: String): HistoryEventDetail {
        return HistoryEventDetail(
            id = id,
            eraSlug = "",
            eraLabel = "알 수 없는 시대",
            title = "준비중",
            timeline = "연대 정보 없음",
            summary = "해당 사건의 상세 정보가 준비중입니다.",
            background = "정치·문화적 배경 정보가 준비중입니다.",
            references = emptyList()
        )
    }
}
