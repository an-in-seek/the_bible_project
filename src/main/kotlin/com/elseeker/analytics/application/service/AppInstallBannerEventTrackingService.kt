package com.elseeker.analytics.application.service

import com.elseeker.analytics.adapter.output.jpa.AppInstallBannerEventRepository
import com.elseeker.analytics.application.component.BotSignatureDetector
import com.elseeker.analytics.domain.model.AppInstallBannerEvent
import com.elseeker.analytics.domain.vo.AppInstallBannerEventType
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.security.MessageDigest
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

/**
 * Android 앱 설치 유도 배너 이벤트를 완전 익명으로 적재한다.
 *
 * 설계 문서: docs/googleplay/app-install-banner-prd.md (13장)
 * - member_uid 등 회원 식별 정보는 받지도, 저장하지도 않는다.
 * - 방문자 식별자는 단방향 해시로 저장하여 site_visit_event(member_uid 보유)와의
 *   visitor_id 직접 조인을 차단한다. 세션 내 노출/클릭 상관관계 집계는 유지된다.
 */
@Service
class AppInstallBannerEventTrackingService(
    private val appInstallBannerEventRepository: AppInstallBannerEventRepository,
    private val botSignatureDetector: BotSignatureDetector,
) {

    @Transactional
    fun track(
        visitorId: String,
        eventType: AppInstallBannerEventType,
        userAgent: String?,
    ) {
        val event = AppInstallBannerEvent(
            visitorId = hashVisitorId(visitorId),
            eventType = eventType,
            isBot = botSignatureDetector.isBot(userAgent),
            occurredAt = Instant.now(),
            occurredDate = LocalDate.now(KST),
        )
        appInstallBannerEventRepository.save(event)
    }

    /** SHA-256(pepper + visitorId) 의 hex 앞 36자. 원본 쿠키와 교차 식별 불가. */
    private fun hashVisitorId(visitorId: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
            .digest((VISITOR_HASH_PEPPER + visitorId).toByteArray(Charsets.UTF_8))
        return digest.joinToString("") { "%02x".format(it) }.take(MAX_VISITOR_ID_LENGTH)
    }

    companion object {
        private val KST: ZoneId = ZoneId.of("Asia/Seoul")
        private const val MAX_VISITOR_ID_LENGTH = 36

        // 교차 테이블 재식별 난이도를 높이기 위한 고정 pepper(비밀이 아니어도 단순 조인은 차단).
        private const val VISITOR_HASH_PEPPER = "app-install-banner:v1:"
    }
}
