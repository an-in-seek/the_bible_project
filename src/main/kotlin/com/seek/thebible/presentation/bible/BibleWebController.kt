package com.seek.thebible.presentation.bible

import com.seek.thebible.application.bible.BibleFacade
import com.seek.thebible.presentation.bible.dto.TranslationResponse
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping

@Controller
@RequestMapping("/web/bibles")
class BibleWebController(
    private val bibleFacade: BibleFacade
) {

    @GetMapping("/translations")
    fun showTranslations(model: Model): String {
        val translations = bibleFacade.getTranslations().map(TranslationResponse::from)
        model.addAttribute("translations", translations)
        return "translations"
    }

    @GetMapping("/books")
    fun showBooks(): String {
        return "books"
    }

    @GetMapping("/chapters")
    fun showChapters(): String {
        return "chapters"
    }

    @GetMapping("/verses")
    fun showVerses(): String {
        return "verses"
    }
}
