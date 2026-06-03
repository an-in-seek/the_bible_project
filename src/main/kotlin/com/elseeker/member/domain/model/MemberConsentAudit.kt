package com.elseeker.member.domain.model

import com.elseeker.common.domain.BaseEntity
import com.elseeker.member.domain.vo.ConsentType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/**
 * 회원 약관/방침/연령 동의 이력 (write-once, 분쟁 증빙용).
 *
 * 가입 1회당 필수 항목 수만큼 행이 생성된다 (TERMS / PRIVACY / AGE_OVER_14).
 * [MemberWithdrawalAudit]와 동일하게 BaseEntity 기반의 불변 감사 레코드다.
 */
@Entity
@Table(
    name = "member_consent_audit",
    indexes = [
        Index(name = "idx_member_consent_audit_member_uid", columnList = "member_uid"),
        Index(name = "idx_member_consent_audit_member_uid_type", columnList = "member_uid, consent_type"),
    ]
)
class MemberConsentAudit(

    id: Long? = null,

    @Column(name = "member_uid", nullable = false)
    val memberUid: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "consent_type", nullable = false, length = 32)
    val consentType: ConsentType,

    @Column(name = "policy_version", nullable = false, length = 32)
    val policyVersion: String,

    @Column(nullable = false)
    val agreed: Boolean,

    @Column(name = "agreed_at", nullable = false)
    val agreedAt: Instant = Instant.now(),

    @Column(name = "ip_address", length = 45)
    val ipAddress: String? = null,
) : BaseEntity(
    id = id,
)
