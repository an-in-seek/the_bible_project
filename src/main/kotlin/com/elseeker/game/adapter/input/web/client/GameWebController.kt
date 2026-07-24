package com.elseeker.game.adapter.input.web.client

import org.springframework.security.core.Authentication
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping

@Controller
@RequestMapping("/web/game")
class GameWebController {

    @GetMapping
    fun showGameList(): String {
        return "game/game"
    }

    @GetMapping("/ranking")
    fun showRanking(): String {
        return "game/game-ranking"
    }

    @GetMapping("/bible-quiz")
    fun showBibleQuiz(authentication: Authentication?): String {
        redirectIfUnauthenticated(authentication, "/web/game/bible-quiz")?.let { return it }
        return "game/bible-quiz"
    }

    @GetMapping("/bible-quiz/map")
    fun showBibleQuizMap(authentication: Authentication?): String {
        redirectIfUnauthenticated(authentication, "/web/game/bible-quiz/map")?.let { return it }
        return "game/bible-quiz-map"
    }

    @GetMapping("/bible-typing")
    fun showBibleTyping(authentication: Authentication?): String {
        redirectIfUnauthenticated(authentication, "/web/game/bible-typing")?.let { return it }
        return "game/bible-typing"
    }

    @GetMapping("/bible-ox-quiz")
    fun showOxQuiz(authentication: Authentication?): String {
        redirectIfUnauthenticated(authentication, "/web/game/bible-ox-quiz")?.let { return it }
        return "game/bible-ox-quiz"
    }

    @GetMapping("/bible-ox-quiz/map")
    fun showOxQuizMap(authentication: Authentication?): String {
        redirectIfUnauthenticated(authentication, "/web/game/bible-ox-quiz/map")?.let { return it }
        return "game/bible-ox-quiz-map"
    }

    @GetMapping("/bible-casting-lots")
    fun showCastingLots(authentication: Authentication?): String {
        redirectIfUnauthenticated(authentication, "/web/game/bible-casting-lots")?.let { return it }
        return "game/bible-casting-lots"
    }

    @GetMapping("/bible-word-puzzle")
    fun showWordPuzzle(authentication: Authentication?): String {
        redirectIfUnauthenticated(authentication, "/web/game/bible-word-puzzle")?.let { return it }
        return "game/bible-word-puzzle"
    }

    @GetMapping("/bible-word-puzzle/play")
    fun showWordPuzzlePlay(authentication: Authentication?): String {
        redirectIfUnauthenticated(authentication, "/web/game/bible-word-puzzle/play")?.let { return it }
        return "game/bible-word-puzzle-play"
    }

    @GetMapping("/bible-story")
    fun showBibleStory(authentication: Authentication?): String {
        redirectIfUnauthenticated(authentication, "/web/game/bible-story")?.let { return it }
        return "game/bible-story"
    }

    private fun redirectIfUnauthenticated(authentication: Authentication?, returnUrl: String): String? {
        if (authentication == null || !authentication.isAuthenticated || authentication.principal == "anonymousUser") {
            return "redirect:/web/auth/login?returnUrl=$returnUrl"
        }
        return null
    }
}
