package com.elseeker.auth.domain.model

import com.elseeker.auth.domain.vo.AppleNotificationResult
import com.elseeker.common.domain.BaseTimeEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Index
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import java.time.Instant
import java.util.UUID

/**
 * Apple 서버-대-서버 알림 수신 이력.
 *
 * 남기는 이유는 두 가지다.
 * 1. **중복 수신 차단** — Apple 은 같은 알림을 재전송한다. `jti` 가 같으므로 이미 처리한 토큰을 걸러낸다.
 * 2. **근거 보존** — 회원 데이터가 삭제된 뒤 "왜 지웠는가"에 답할 수 있는 유일한 기록이다.
 *
 * 회원 자체는 하드 삭제되므로 FK 를 걸지 않고 [memberUid] 만 남긴다.
 */
@Entity
@Table(
    name = "apple_notification_audit",
    uniqueConstraints = [
        // 한 토큰(jti)에 여러 이벤트가 담길 수 있어 jti 단독으로는 유일하지 않다.
        UniqueConstraint(
            name = "uk_apple_notification_audit_event",
            columnNames = ["jti", "event_type", "apple_sub"]
        )
    ],
    indexes = [
        Index(name = "idx_apple_notification_audit_apple_sub", columnList = "apple_sub")
    ]
)
class AppleNotificationAudit(

    id: Long? = null,

    /** 알림 토큰 식별자. 재전송 판별 키. */
    @Column(nullable = false, length = 255)
    val jti: String,

    /** Apple 이 보낸 원본 타입 문자열. 모르는 타입도 그대로 보관한다. */
    @Column(name = "event_type", nullable = false, length = 64)
    val eventType: String,

    /** Apple 사용자 식별자(`sub`). `member_oauth_account.provider_user_id` 와 대응한다. */
    @Column(name = "apple_sub", nullable = false, length = 255)
    val appleSub: String,

    @Column(length = 255)
    val email: String? = null,

    @Column(name = "is_private_email")
    val isPrivateEmail: Boolean? = null,

    /** Apple 이 알려 준 이벤트 발생 시각(UTC). 수신 시각은 `createdAt` 이다. */
    @Column(name = "occurred_at")
    val occurredAt: Instant? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    val result: AppleNotificationResult,

    /** 처리 대상이 된 회원. 대상이 없었으면 `null`. */
    @Column(name = "member_uid")
    val memberUid: UUID? = null,

) : BaseTimeEntity(
    id = id,
)
