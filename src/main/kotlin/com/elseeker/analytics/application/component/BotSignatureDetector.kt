package com.elseeker.analytics.application.component

import org.springframework.stereotype.Component

/**
 * User-Agent 문자열 기반 봇 판별기 (analytics 모듈 공용).
 *
 * 사이트 방문 추적과 앱 설치 배너 이벤트가 동일한 봇 판정 로직을 공유하도록 추출.
 * (설계: docs/googleplay/app-install-banner-prd.md §8/§13 — is_bot 판정 재사용)
 */
@Component
class BotSignatureDetector {

    /** User-Agent 가 비어있거나 봇 시그니처를 포함하면 true. */
    fun isBot(userAgent: String?): Boolean {
        if (userAgent.isNullOrBlank()) return true
        val lower = userAgent.lowercase()
        return BOT_SIGNATURES.any { it in lower }
    }

    companion object {
        private val BOT_SIGNATURES = setOf(
            "bot",
            "crawler",
            "spider",
            "slurp",
            "curl",
            "wget",
            "facebookexternalhit",
        )
    }
}
