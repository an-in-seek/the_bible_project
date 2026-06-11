package com.elseeker.qna.adapter.input.web.admin

import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping

/**
 * 관리자 공개 문의(문의하기) 콘솔 SSR 뷰 컨트롤러.
 * 접근 권한(ROLE_ADMIN)은 SecurityConfig 의 admin 경로 규칙으로 강제된다.
 */
@Controller
@RequestMapping("/web/admin/qna")
class AdminContactWebController {

    @GetMapping("/contacts")
    fun showContactList(): String = "admin/qna/admin-contact-list"

    @GetMapping("/contacts/{id}")
    fun showContactDetail(@PathVariable id: Long): String = "admin/qna/admin-contact-detail"
}
