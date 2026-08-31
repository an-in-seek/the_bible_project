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
     * 화면마다 템플릿을 고치지 않도록 서버가 요청 경로로 판단한다.
     * 섹션 전체를 여는 경우는 접두사로(학습 화면이 추가돼도 자동으로 붙는다),
     * 화면 하나만 여는 경우는 정확히 일치하는 경로로 판단한다.
     * 설계 문서: docs/common/url-share.md
     */
    @ModelAttribute("showShareButton")
    fun showShareButton(request: HttpServletRequest): Boolean {
        val requestUri = request.requestURI
        if (requestUri in SHARE_ENABLED_PATHS) {
            return true
        }
        return SHARE_ENABLED_PATH_PREFIXES.any { requestUri.startsWith(it) } &&
            requestUri !in SHARE_EXCLUDED_PATHS
    }

    companion object {
        private val SHARE_ENABLED_PATH_PREFIXES = listOf("/web/study", "/web/community")

        /**
         * 섹션 전체가 아니라 화면 하나만 노출하는 경로.
         * - `/` — 홈. 사이트 자체를 알리는 진입점이라 공유 수요가 가장 크다.
         * - `/web/game` — 게임 목록. 개별 게임 화면은 진행 상태가 URL 에 없어 받는 사람이 같은 화면을 보지 못하므로 제외한다.
         */
        private val SHARE_ENABLED_PATHS = setOf("/", "/web/game")

        /**
         * 접두사만으로는 걸러지지 않는 예외 경로.
         * - `/web/study/creation` — 풀스크린 스크롤 연출 화면이라 상단 버튼이 몰입을 깬다.
         * - `/web/community/write` — 아직 저장되지 않은 작성 폼이라 공유할 대상이 없다.
         */
        private val SHARE_EXCLUDED_PATHS = setOf("/web/study/creation", "/web/community/write")
    }
}
