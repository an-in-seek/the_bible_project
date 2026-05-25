package com.elseeker.common.adapter.input.web

import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestParam

@Controller
class RootWebController {

    @GetMapping("/")
    fun showIndex(model: Model): String {
        model.addAttribute("hideHomeButton", true)
        return "index" // 루트 URL에서 index.html 로 연결
    }

    @GetMapping("/web/search")
    fun showUnifiedSearch(
        @RequestParam(required = false) q: String?,
        @RequestParam(required = false, defaultValue = "all") tab: String,
        model: Model,
    ): String {
        model.addAttribute("query", q ?: "")
        model.addAttribute("activeTab", tab)
        return "search"
    }
}
