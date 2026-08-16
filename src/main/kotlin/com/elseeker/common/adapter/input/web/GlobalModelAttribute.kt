package com.elseeker.common.adapter.input.web

import jakarta.servlet.http.HttpServletRequest
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ModelAttribute

@ControllerAdvice
class GlobalModelAttribute {

    @ModelAttribute("currentPath")
    fun currentPath(request: HttpServletRequest): String = request.requestURI

    @ModelAttribute("useVerseFontBoot")
    fun useVerseFontBoot(request: HttpServletRequest): Boolean =
        request.requestURI.startsWith("/web/bible/verse")

    /**
     * 상단 네비게이션 URL 공유 버튼 노출 여부.
     * 화면마다 템플릿을 고치지 않도록 경로 접두사로 판단한다. 학습 화면이 추가돼도 자동으로 붙는다.
     * 설계 문서: docs/common/url-share.md
     */
    @ModelAttribute("showShareButton")
    fun showShareButton(request: HttpServletRequest): Boolean {
        val requestUri = request.requestURI
        return SHARE_ENABLED_PATH_PREFIXES.any { requestUri.startsWith(it) } &&
            requestUri !in SHARE_EXCLUDED_PATHS
    }

    companion object {
        private val SHARE_ENABLED_PATH_PREFIXES = listOf("/web/study")

        /** 풀스크린 스크롤 연출 화면 — 상단 버튼이 몰입을 깨서 공유 대상에서 뺀다. */
        private val SHARE_EXCLUDED_PATHS = setOf("/web/study/creation")
    }
}
