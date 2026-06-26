package com.elseeker.analytics.domain.model

import com.elseeker.analytics.domain.vo.AppInstallBannerEventType
import com.elseeker.common.domain.BaseTimeEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EntityListeners
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Index
import jakarta.persistence.Table
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.Instant
import java.time.LocalDate

/**
 * Android 앱 설치 유도 배너 이벤트 원시 로그.
 *
 * 설계 문서: docs/googleplay/app-install-banner-prd.md
 * 완전 익명 집계 — 로그인 사용자라도 member_uid 를 기록하지 않으며,
 * 익명 방문자 식별자(visitor_id)만 사용한다. (PRD 13장 익명 집계 원칙)
 */
@Entity
@Table(
    name = "app_install_banner_event",
    indexes = [
        // 단일 occurred_date 조회는 아래 복합 인덱스의 좌측 프리픽스로 충족됨
        Index(name = "idx_app_install_banner_event_occurred_date_event_type", columnList = "occurred_date, event_type"),
    ]
)
@EntityListeners(AuditingEntityListener::class)
class AppInstallBannerEvent(

    id: Long? = null,

    // 단방향 해시된 익명 방문자 식별자 — 원본 es_visitor_id 쿠키와 교차 식별 불가
    @Column(name = "visitor_id", nullable = false, length = 36)
    val visitorId: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 20)
    val eventType: AppInstallBannerEventType,

    @Column(name = "is_bot", nullable = false)
    val isBot: Boolean = false,

    @Column(name = "occurred_at", nullable = false)
    val occurredAt: Instant,

    @Column(name = "occurred_date", nullable = false)
    val occurredDate: LocalDate,

) : BaseTimeEntity(id = id)
