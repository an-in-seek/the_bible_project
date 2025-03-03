package com.seek.thebible.presentation

import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping

@Controller
class RootController {

    @GetMapping("/")
    fun redirectToWebBibles(): String {
        return "redirect:/web/bibles/translations"
    }
}
