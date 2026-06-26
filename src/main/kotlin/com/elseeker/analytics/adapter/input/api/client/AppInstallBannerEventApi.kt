package com.elseeker.analytics.adapter.input.api.client

import com.elseeker.analytics.adapter.input.api.client.request.AppInstallBannerEventRequest
import com.elseeker.analytics.application.component.AppInstallBannerEventRateLimiter
import com.elseeker.analytics.application.service.AppInstallBannerEventTrackingService
import io.github.oshai.kotlinlogging.KotlinLogging
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.http.HttpHeaders
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@Validated
@RestController
@RequestMapping("/api/v1/analytics/app-install-banner/events")
class AppInstallBannerEventApi(
    private val appInstallBannerEventTrackingService: AppInstallBannerEventTrackingService,
    private val appInstallBannerEventRateLimiter: AppInstallBannerEventRateLimiter,
) : AppInstallBannerEventApiDocument {

    private val logger = KotlinLogging.logger {}

    @PostMapping
    override fun trackEvent(
        @Valid @RequestBody request: AppInstallBannerEventRequest,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<Void> {
        // Fire-and-forget 비콘 — 적재 실패/한도 초과가 사용자 경험을 막지 않도록 항상 204 반환.
        try {
            if (appInstallBannerEventRateLimiter.tryAcquire(clientIp(httpRequest))) {
                appInstallBannerEventTrackingService.track(
                    visitorId = resolveVisitorId(httpRequest),
                    eventType = request.event,
                    userAgent = httpRequest.getHeader(HttpHeaders.USER_AGENT),
                )
            }
            // 한도 초과 시 조용히 폐기(204 유지) — 스팸/DoS 억제
        } catch (e: Exception) {
            logger.warn(e) { "Failed to track app install banner event" }
        }
        return ResponseEntity.noContent().build()
    }

    /** 페이지 방문 인터셉터가 발급한 익명 방문자 쿠키(UUID)를 재사용. 유효하지 않으면 일회성 UUID. */
    private fun resolveVisitorId(request: HttpServletRequest): String {
        val cookieValue = request.cookies?.firstOrNull { it.name == VISITOR_COOKIE_NAME }?.value
        return if (!cookieValue.isNullOrBlank() && isValidUuid(cookieValue)) {
            cookieValue
        } else {
            UUID.randomUUID().toString()
        }
    }

    private fun isValidUuid(value: String): Boolean =
        runCatching { UUID.fromString(value) }.isSuccess

    /** 프록시 환경을 고려해 X-Forwarded-For 우선, 없으면 remoteAddr. */
    private fun clientIp(request: HttpServletRequest): String {
        val forwarded = request.getHeader("X-Forwarded-For")
        return if (!forwarded.isNullOrBlank()) {
            forwarded.substringBefore(',').trim()
        } else {
            request.remoteAddr ?: "unknown"
        }
    }

    companion object {
        private const val VISITOR_COOKIE_NAME = "es_visitor_id"
    }
}
