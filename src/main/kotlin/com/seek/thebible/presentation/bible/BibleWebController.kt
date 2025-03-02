package com.seek.thebible.presentation.bible

import com.seek.thebible.application.bible.BibleFacade
import com.seek.thebible.presentation.bible.dto.*
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam

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

    @GetMapping("/translations/{translationId}/books")
    fun showBooks(
        @PathVariable translationId: Long,
        model: Model
    ): String {
        val books = bibleFacade.getBooks(translationId).map(BookResponse::from)
        model.addAttribute("books", books)
        return "books"
    }

    @GetMapping("/translations/{translationId}/books/{bookId}/chapters")
    fun showChapters(
        @PathVariable translationId: Long,
        @PathVariable bookId: Long,
        model: Model
    ): String {
        val chapters = bibleFacade.getChapters(translationId, bookId).map(ChapterResponse::from)
        model.addAttribute("chapters", chapters)
        return "chapters"
    }

    @GetMapping("/translations/{translationId}/books/{bookId}/chapters/{chapterId}/verses")
    fun showVerses(
        @PathVariable translationId: Long,
        @PathVariable bookId: Long,
        @PathVariable chapterId: Long,
        model: Model
    ): String {
        val verses = bibleFacade.getVerses(translationId, bookId, chapterId).map(VerseResponse::from)
        model.addAttribute("verses", verses)
        return "verses"
    }

    @GetMapping("/search")
    fun searchBible(@RequestParam keyword: String, model: Model): String {
        val verses = bibleFacade.searchBibleVerses(keyword).map(SearchVerseResponse::from)
        model.addAttribute("verses", verses)
        return "search"
    }
}
