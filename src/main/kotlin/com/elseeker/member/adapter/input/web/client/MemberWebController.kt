package com.elseeker.member.adapter.input.web.client

import org.springframework.http.HttpStatus
import org.springframework.security.core.Authentication
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.servlet.view.RedirectView

@Controller
@RequestMapping("/web/member")
class MemberWebController {

    @GetMapping("/withdraw")
    fun showWithdraw(authentication: Authentication?): String {
        redirectIfUnauthenticated(authentication, "/web/member/withdraw")?.let { return it }
        return "member/withdraw"
    }

    @GetMapping("/mypage")
    fun showMyPage(
        authentication: Authentication?,
        @RequestParam(required = false) tab: String?,
    ): Any {
        if (tab == "memo") {
            redirectIfUnauthenticated(authentication, "/web/member/my-memo")?.let { return it }
            return RedirectView("/web/member/my-memo", true).apply {
                setStatusCode(HttpStatus.MOVED_PERMANENTLY)
            }
        }

        redirectIfUnauthenticated(authentication, "/web/member/mypage")?.let { return it }
        return "member/mypage"
    }

    @GetMapping("/my-memo")
    fun showMyMemo(authentication: Authentication?): String {
        redirectIfUnauthenticated(authentication, "/web/member/my-memo")?.let { return it }
        return "member/my-memo"
    }

    @GetMapping("/my-inquiries")
    fun showMyInquiries(authentication: Authentication?): String {
        redirectIfUnauthenticated(authentication, "/web/member/my-inquiries")?.let { return it }
        return "member/my-inquiries"
    }

    @GetMapping("/my-inquiries/{id}")
    fun showMyInquiryDetail(authentication: Authentication?): String {
        redirectIfUnauthenticated(authentication, "/web/member/my-inquiries")?.let { return it }
        return "member/my-inquiry-detail"
    }

    @GetMapping("/withdraw/complete")
    fun showWithdrawComplete(): String {
        return "member/withdraw-complete"
    }

    private fun redirectIfUnauthenticated(authentication: Authentication?, returnUrl: String): String? {
        if (authentication == null || !authentication.isAuthenticated || authentication.principal == "anonymousUser") {
            return "redirect:/web/auth/login?returnUrl=$returnUrl"
        }
        return null
    }
}
