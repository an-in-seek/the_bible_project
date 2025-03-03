package com.seek.thebible.presentation

import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping

@Controller
class RootController {
    
    @GetMapping("/")
    fun showIndex(): String {
        return "index" // 루트 URL에서 index.html 로 연결
    }
}
