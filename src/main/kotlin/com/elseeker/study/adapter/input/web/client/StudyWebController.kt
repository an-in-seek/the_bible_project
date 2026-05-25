package com.elseeker.study.adapter.input.web.client

import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping

@Controller
@RequestMapping("/web/study")
class StudyWebController {

    @GetMapping
    fun showStudyHome(): String {
        return "study/study"
    }

    @GetMapping("/bible-overview-video")
    fun showBibleOverviewVideo(): String {
        return "study/bible-overview-video"
    }

    @GetMapping("/bible-genealogy")
    fun showBibleGenealogy(): String {
        return "study/bible-genealogy"
    }

    @GetMapping("/twelve-tribes")
    fun showTwelveTribes(): String {
        return "study/twelve-tribes"
    }

    @GetMapping("/twelve-disciples")
    fun showTwelveDisciples(): String {
        return "study/twelve-disciples"
    }

    @GetMapping("/lords-prayer")
    fun showLordsPrayer(): String {
        return "study/lords-prayer"
    }

    @GetMapping("/apostles-creed")
    fun showApostlesCreed(): String {
        return "study/apostles-creed"
    }

    @GetMapping("/creation")
    fun showCreation(): String {
        return "study/creation"
    }

    @GetMapping("/ten-commandments")
    fun showTenCommandments(): String {
        return "study/ten-commandments"
    }

    @GetMapping("/holy-week")
    fun showHolyWeek(): String {
        return "study/holy-week"
    }

    @GetMapping("/public-reading-of-scripture")
    fun showPublicReadingOfScripture(): String {
        return "study/public-reading-of-scripture"
    }

    @GetMapping("/bible-commentary")
    fun showBibleCommentary(): String {
        return "study/bible-commentary"
    }
}