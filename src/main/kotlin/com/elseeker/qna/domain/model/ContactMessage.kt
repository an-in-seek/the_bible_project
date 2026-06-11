package com.elseeker.qna.domain.model

import com.elseeker.common.domain.BaseTimeEntity
import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.throwError
import com.elseeker.member.domain.model.Member
import com.elseeker.member.domain.vo.MemberRole
import com.elseeker.qna.domain.vo.ContactStatus
import com.elseeker.qna.domain.vo.InquiryCategory
import jakarta.persistence.*
import java.time.Instant

/**
 * 공개(비로그인) 문의하기 메시지.
 *
 * 회원 1:1 문의([Inquiry])와 달리 작성자 회원 계정이 없으며, 회신용 이메일만 수집한다.
 * 답변은 별도의 메일 발송 인프라 없이 관리자가 수신 메일함에서 수동 회신(mailto)하는 것을 전제로 하며,
 * [replyContent]는 관리자 내부 기록(회신 본문 보관)용이다.
 */
@Entity
@Table(
    name = "qna_contact_message",
    indexes = [
        Index(name = "idx_contact_status_created_at", columnList = "status, created_at"),
    ]
)
class ContactMessage(

    id: Long? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    var category: InquiryCategory,

    @Column(name = "title", nullable = false, length = 200)
    var title: String,

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    var content: String,

    @Column(name = "guest_name", length = 100)
    var guestName: String? = null,

    @Column(name = "guest_email", nullable = false, length = 255)
    var guestEmail: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: ContactStatus = ContactStatus.RECEIVED,

    @Column(name = "reply_content", columnDefinition = "TEXT")
    var replyContent: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "replied_by_id")
    var repliedBy: Member? = null,

    @Column(name = "replied_at")
    var repliedAt: Instant? = null,

    createdAt: Instant = Instant.now(),
    updatedAt: Instant = Instant.now(),
) : BaseTimeEntity(
    id = id,
    createdAt = createdAt,
    updatedAt = updatedAt,
) {

    companion object {
        fun create(
            category: InquiryCategory,
            title: String,
            content: String,
            guestEmail: String,
            guestName: String? = null,
        ) = ContactMessage(
            category = category,
            title = title,
            content = content,
            guestEmail = guestEmail,
            guestName = guestName,
            status = ContactStatus.RECEIVED,
        )
    }

    // ── 관리자 행위 ──

    /** 회신 본문 기록(보관) 후 회신완료 처리. 재호출 시 본문을 갱신한다. */
    fun replyByAdmin(actor: Member, content: String) {
        ensureAdmin(actor)
        this.replyContent = content
        this.repliedBy = actor
        this.repliedAt = Instant.now()
        this.status = ContactStatus.REPLIED
    }

    /** 회신완료 ↔ 종료 토글만 허용. 접수(RECEIVED) 상태는 먼저 회신해야 하므로 직접 토글 불가. */
    fun changeStatusByAdmin(actor: Member, target: ContactStatus) {
        ensureAdmin(actor)
        if (target != ContactStatus.REPLIED && target != ContactStatus.CLOSED) {
            throwError(ErrorType.INVALID_STATUS_TRANSITION, "target=$target")
        }
        // 회신 전(RECEIVED) 문의는 상태 토글 불가 — 회신(replyByAdmin)으로만 REPLIED 진입
        if (status == ContactStatus.RECEIVED) {
            throwError(ErrorType.INVALID_STATUS_TRANSITION, "id=$id,status=$status")
        }
        if (status == target) return
        this.status = target
    }

    private fun ensureAdmin(actor: Member) {
        if (actor.memberRole != MemberRole.ADMIN) throwError(ErrorType.ADMIN_ACCESS_DENIED)
    }
}
