package com.elseeker.analytics.application.service

import com.elseeker.analytics.adapter.output.jpa.SiteVisitEventRepository
import com.elseeker.analytics.application.component.BotSignatureDetector
import com.elseeker.analytics.domain.model.SiteVisitEvent
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.net.URI
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.util.UUID

@Service
class SiteVisitTrackingService(
    private val siteVisitEventRepository: SiteVisitEventRepository,
    private val botSignatureDetector: BotSignatureDetector,
) {

    @Transactional
    fun track(
        visitorId: String,
        memberUid: UUID?,
        pageKey: String,
        requestUri: String,
        referer: String?,
        userAgent: String?,
    ) {
        val event = SiteVisitEvent(
            visitorId = visitorId,
            memberUid = memberUid,
            pageKey = pageKey.take(MAX_PAGE_KEY_LENGTH),
            requestUri = requestUri.take(MAX_REQUEST_URI_LENGTH),
            refererHost = extractRefererHost(referer),
            isAuthenticated = memberUid != null,
            isBot = botSignatureDetector.isBot(userAgent),
            visitedAt = Instant.now(),
            visitedDate = LocalDate.now(KST),
        )
        siteVisitEventRepository.save(event)
    }

    private fun extractRefererHost(referer: String?): String? {
        if (referer.isNullOrBlank()) return null
        return runCatching { URI.create(referer).host }.getOrNull()?.take(MAX_REFERER_HOST_LENGTH)
    }

    companion object {
        private val KST: ZoneId = ZoneId.of("Asia/Seoul")
        private const val MAX_PAGE_KEY_LENGTH = 160
        private const val MAX_REQUEST_URI_LENGTH = 255
        private const val MAX_REFERER_HOST_LENGTH = 120
    }
}
