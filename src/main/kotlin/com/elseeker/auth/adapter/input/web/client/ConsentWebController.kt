package com.elseeker.auth.adapter.input.web.client

import com.elseeker.common.security.jwt.JwtPrincipal
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping

/**
 * 회원가입 동의 인터스티셜 페이지 컨트롤러.
 *
 * - 비로그인 → 로그인 페이지로
 * - 정식 회원(SIGNUP 스코프 아님) → 홈으로 (이미 동의 완료)
 * - 가입 동의 대기(SIGNUP 스코프) → 동의 페이지 렌더
 */
@Controller
class ConsentWebController {

    @GetMapping("/web/auth/consent")
    fun consent(@AuthenticationPrincipal principal: JwtPrincipal?): String {
        if (principal == null) {
            return "redirect:/web/auth/login"
        }
        if (!principal.isSignupScope) {
            return "redirect:/"
        }
        return "auth/consent"
    }
}
