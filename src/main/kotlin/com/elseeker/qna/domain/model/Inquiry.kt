package com.elseeker.qna.domain.model

import com.elseeker.common.domain.BaseTimeEntity
import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.throwError
import com.elseeker.member.domain.model.Member
import com.elseeker.member.domain.vo.MemberRole
import com.elseeker.qna.domain.vo.InquiryCategory
import com.elseeker.qna.domain.vo.InquiryStatus
import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(
    name = "qna_inquiry",
    indexes = [
        Index(name = "idx_inquiry_author_created_at", columnList = "author_id, created_at"),
        Index(name = "idx_inquiry_status_created_at", columnList = "status, created_at"),
    ]
)
class Inquiry(

    id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    val author: Member,

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    var category: InquiryCategory,

    @Column(name = "title", nullable = false, length = 200)
    var title: String,

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    var content: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: InquiryStatus = InquiryStatus.RECEIVED,

    @Column(name = "answer_content", columnDefinition = "TEXT")
    var answerContent: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "answered_by_id")
    var answeredBy: Member? = null,

    @Column(name = "answered_at")
    var answeredAt: Instant? = null,

    createdAt: Instant = Instant.now(),
    updatedAt: Instant = Instant.now(),
) : BaseTimeEntity(
    id = id,
    createdAt = createdAt,
    updatedAt = updatedAt,
) {

    companion object {
        fun create(author: Member, category: InquiryCategory, title: String, content: String) =
            Inquiry(
                author = author,
                category = category,
                title = title,
                content = content,
                status = InquiryStatus.RECEIVED,
            )
    }

    val hasAnswer: Boolean get() = answeredAt != null && !answerContent.isNullOrBlank()
    val isAnswered: Boolean get() = hasAnswer

    // ── 회원(작성자) 행위 ── 답변 전(RECEIVED)에만 허용
    fun updateByAuthor(actor: Member, category: InquiryCategory, title: String, content: String) {
        ensureAuthor(actor)
        ensureModifiable()
        this.category = category
        this.title = title
        this.content = content
    }

    fun deleteByAuthor(actor: Member) {
        ensureAuthor(actor)
        ensureModifiable()
        this.status = InquiryStatus.DELETED   // soft-delete
    }

    // ── 관리자 행위 ──
    fun answer(actor: Member, content: String) {
        ensureAdmin(actor)
        ensureAnswerable()
        this.answerContent = content
        this.answeredBy = actor
        this.answeredAt = Instant.now()
        this.status = InquiryStatus.ANSWERED
    }

    fun updateAnswer(actor: Member, content: String) {
        ensureAdmin(actor)
        if (status == InquiryStatus.DELETED) throwError(ErrorType.INQUIRY_NOT_FOUND, "inquiryId=$id")
        if (!hasAnswer) throwError(ErrorType.INQUIRY_NOT_ANSWERED, "inquiryId=$id")
        this.answerContent = content
    }

    fun changeStatusByAdmin(actor: Member, target: InquiryStatus) {
        ensureAdmin(actor)
        // 관리자 상태 변경은 답변된 문의의 종료/재개만 허용. 최초 답변은 answer()로, 삭제는 회원 경로로 일원화.
        if (target != InquiryStatus.CLOSED && target != InquiryStatus.ANSWERED) {
            throwError(ErrorType.INVALID_STATUS_TRANSITION)
        }
        if (status == InquiryStatus.DELETED) throwError(ErrorType.INQUIRY_NOT_FOUND, "inquiryId=$id")
        if (!hasAnswer || (status != InquiryStatus.ANSWERED && status != InquiryStatus.CLOSED)) {
            throwError(ErrorType.INQUIRY_NOT_ANSWERED, "inquiryId=$id")
        }
        if (status == target) return
        this.status = target          // ANSWERED ↔ CLOSED (종료 / 재개)
    }

    private fun ensureModifiable() {
        if (!status.isModifiable()) throwError(ErrorType.INQUIRY_ALREADY_ANSWERED, "inquiryId=$id")
    }

    private fun ensureAnswerable() {
        if (status != InquiryStatus.RECEIVED) {
            throwError(ErrorType.INVALID_STATUS_TRANSITION, "inquiryId=$id,status=$status")
        }
    }

    private fun ensureAuthor(actor: Member) {
        if (author.id != actor.id) {
            throwError(ErrorType.INQUIRY_ACCESS_DENIED, "inquiryId=$id")
        }
    }

    private fun ensureAdmin(actor: Member) {
        if (actor.memberRole != MemberRole.ADMIN) throwError(ErrorType.ADMIN_ACCESS_DENIED)
    }
}
