package com.elseeker.common.adapter.input.web

import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping

// 공개(비로그인) 고객지원 페이지 SSR 컨트롤러.
// 인증을 요구하지 않으며, 접근 권한은 SecurityConfig 의 web permitAll 규칙으로 허용된다.
@Controller
class SupportWebController {

    @GetMapping("/web/support/contact")
    fun showContactForm(): String = "support/contact"

    @GetMapping("/web/support/contact/complete")
    fun showContactComplete(): String = "support/contact-complete"
}
