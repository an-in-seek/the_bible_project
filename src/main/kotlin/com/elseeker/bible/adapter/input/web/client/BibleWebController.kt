package com.elseeker.bible.adapter.input.web.client

import com.elseeker.bible.adapter.input.web.client.response.BibleViewResponse
import com.elseeker.bible.application.service.BibleService
import com.elseeker.bible.domain.vo.BibleTranslationType
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam

private const val ROLE_ADMIN = "ROLE_ADMIN"
private val HIDDEN_TRANSLATION_TYPES = setOf(BibleTranslationType.NKRV)

@Controller
@RequestMapping("/web/bible")
class BibleWebController(
    private val bibleService: BibleService
) {

    @GetMapping("/translation")
    fun showTranslations(model: Model): String {
        val translations = bibleService.getTranslations()
            .filterNot { !isAdmin() && it.translationType in HIDDEN_TRANSLATION_TYPES }
            .map(BibleViewResponse.Translation::from)
        model.addAttribute("translations", translations)
        return "bible/translation-list"
    }

    @GetMapping("/book")
    fun showBooks(): String {
        return "bible/book-list"
    }

    @GetMapping("/book/description")
    fun showBookDescription(): String {
        return "bible/book-description"
    }

    @GetMapping("/chapter")
    fun showChapters(): String {
        return "bible/chapter-list"
    }

    @GetMapping("/verse")
    fun showVerses(): String {
        return "bible/verse-list"
    }

    @GetMapping("/search")
    fun showSearch(
        @RequestParam(required = false) keyword: String?,
        model: Model
    ): String {
        model.addAttribute("keyword", keyword?.trim().orEmpty())
        return "bible/verse-search"
    }

    // ------------ Private Methods ------------
    private fun isAdmin(): Boolean =
        SecurityContextHolder.getContext().authentication
            ?.authorities?.any { it.authority == ROLE_ADMIN } ?: false
}
