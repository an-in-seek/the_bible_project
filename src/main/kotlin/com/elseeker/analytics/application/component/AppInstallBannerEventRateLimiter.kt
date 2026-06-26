package com.elseeker.analytics.application.component

import org.springframework.stereotype.Component
import java.util.concurrent.ConcurrentHashMap

/**
 * 익명 앱 설치 배너 이벤트에 대한 IP 단위 고정 윈도우 rate limiter.
 *
 * 인증 없는 비콘 엔드포인트의 무한 적재(데이터 오염/DoS)를 억제한다.
 * 정상 사용자는 세션당 노출 1 + 클릭/닫기 1 수준이므로 한도를 넉넉히 둔다.
 * 외부 의존성 없이 인메모리로 동작(단일 인스턴스 기준). (ContactRateLimiter 패턴 재사용)
 */
@Component
class AppInstallBannerEventRateLimiter {

    private class Window(@Volatile var start: Long, @Volatile var count: Int)

    private val counters = ConcurrentHashMap<String, Window>()

    fun tryAcquire(key: String, now: Long = System.currentTimeMillis()): Boolean {
        // 맵 무한 증식 방지 — 만료된 윈도우만 제거(전체 clear 는 동시 리셋 우회에 악용될 수 있어 지양).
        if (counters.size > MAX_TRACKED_KEYS) {
            counters.entries.removeIf { now - it.value.start >= WINDOW_MILLIS }
        }

        val window = counters.compute(key) { _, existing ->
            if (existing == null || now - existing.start >= WINDOW_MILLIS) Window(now, 0) else existing
        }!!

        synchronized(window) {
            if (window.count >= MAX_PER_WINDOW) return false
            window.count++
            return true
        }
    }

    companion object {
        private const val MAX_PER_WINDOW = 30
        private const val WINDOW_MILLIS = 60 * 60 * 1000L // 1시간
        private const val MAX_TRACKED_KEYS = 100_000
    }
}
