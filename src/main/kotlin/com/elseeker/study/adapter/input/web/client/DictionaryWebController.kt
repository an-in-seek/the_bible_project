package com.elseeker.study.adapter.input.web.client

import com.elseeker.study.adapter.input.web.client.response.DictionaryViewResponse
import com.elseeker.study.application.service.DictionaryService
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

@Controller
@RequestMapping("/web/study/dictionary")
class DictionaryWebController(
    private val dictionaryService: DictionaryService
) {
    @GetMapping
    fun showDictionaryList(
        @RequestParam(required = false) keyword: String?,
        model: Model
    ): String {
        model.addAttribute("keyword", normalizeKeyword(keyword))
        return "study/dictionary-list"
    }

    @GetMapping("/{id}")
    fun showDictionaryDetail(
        @PathVariable id: Long,
        @RequestParam(required = false) keyword: String?,
        model: Model
    ): String {
        val dictionary = DictionaryViewResponse.Detail.from(dictionaryService.getDictionary(id))
        val backLink = buildBackLink(keyword)
        model.addAttribute("dictionary", dictionary)
        model.addAttribute("backLink", backLink)
        model.addAttribute("shareTitle", "${dictionary.term} - 성경 사전")
        return "study/dictionary-detail"
    }

    // --------------------- Private Methods ---------------------
    private fun normalizeKeyword(keyword: String?): String {
        return keyword?.trim().orEmpty()
    }

    private fun buildBackLink(keyword: String?): String {
        val trimmedKeyword = normalizeKeyword(keyword)
        if (trimmedKeyword.isBlank()) {
            return "/web/study/dictionary"
        }
        val encodedKeyword = URLEncoder.encode(trimmedKeyword, StandardCharsets.UTF_8)
        return "/web/study/dictionary?keyword=$encodedKeyword"
    }
}