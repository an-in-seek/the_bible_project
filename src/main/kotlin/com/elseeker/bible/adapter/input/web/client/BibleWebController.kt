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
        model.addAttribute("translations", getVisibleTranslations())
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

    /**
     * 대역 비교 번역본 목록을 서버가 모델에 담아 내려준다.
     *
     * `GET /api/v1/bibles/translations` 를 쓰지 않는 이유가 있다. 그 응답에는
     * `Cache-Control: public, max-age=1d` 가 붙어 있어 **누가 부르든 같은 응답**이라는 전제로
     * 공유 캐시에 담긴다. 그래서 [HIDDEN_TRANSLATION_TYPES] 를 거기서 거르면 관리자가 받은
     * 응답이 캐시에 남아 일반 사용자에게 그대로 나갈 수 있다.
     *
     * 설계 문서: docs/bible/bible-compare-design.md §7
     */
    @GetMapping("/verse")
    fun showVerses(model: Model): String {
        model.addAttribute("compareTranslations", getVisibleTranslations())
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

    /**
     * 화면에 내놓을 번역본. 숨김 규칙은 이 한 곳에서만 판단한다 — 번역본 목록 화면과
     * 대역 선택 목록이 서로 다른 번역본을 보여 주는 일이 없도록.
     */
    private fun getVisibleTranslations(): List<BibleViewResponse.Translation> {
        val admin = isAdmin()
        return bibleService.getTranslations()
            .filterNot { !admin && it.translationType in HIDDEN_TRANSLATION_TYPES }
            .map(BibleViewResponse.Translation::from)
    }

    private fun isAdmin(): Boolean =
        SecurityContextHolder.getContext().authentication
            ?.authorities?.any { it.authority == ROLE_ADMIN } ?: false
}
