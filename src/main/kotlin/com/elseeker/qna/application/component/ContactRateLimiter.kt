package com.elseeker.qna.application.component

import org.springframework.stereotype.Component
import java.util.concurrent.ConcurrentHashMap

/**
 * 공개(비로그인) 문의 제출에 대한 IP 단위 고정 윈도우 rate limiter.
 *
 * 외부 의존성 없이 인메모리로 동작한다. 단일 인스턴스 기준 스팸 억제용이며,
 * 다중 인스턴스/정밀 제한이 필요해지면 Redis 기반 또는 Bucket4j 등으로 승급한다.
 */
@Component
class ContactRateLimiter {

    private class Window(@Volatile var start: Long, @Volatile var count: Int)

    private val counters = ConcurrentHashMap<String, Window>()

    /**
     * [key](보통 클라이언트 IP)에 대해 현재 윈도우에서 한 건을 허용할 수 있으면 true.
     * 허용 시 카운트를 증가시키고, 한도를 초과하면 false를 반환한다.
     */
    fun tryAcquire(key: String, now: Long = System.currentTimeMillis()): Boolean {
        // 맵 무한 증식 방지 — 임계치 초과 시 만료된 윈도우만 제거(전체 clear 시 모든 IP 카운터가
        // 동시에 0으로 리셋되어 우회에 악용될 수 있으므로 지양).
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
        private const val MAX_PER_WINDOW = 5
        private const val WINDOW_MILLIS = 60 * 60 * 1000L // 1시간
        private const val MAX_TRACKED_KEYS = 100_000
    }
}
