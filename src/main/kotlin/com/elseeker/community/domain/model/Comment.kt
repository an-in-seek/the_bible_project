package com.elseeker.community.domain.model

import com.elseeker.common.domain.BaseTimeEntity
import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.throwError
import com.elseeker.community.domain.policy.CommentReportPolicy
import com.elseeker.community.domain.vo.CommentStatus
import com.elseeker.member.domain.model.Member
import com.elseeker.member.domain.vo.MemberRole
import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(
    name = "community_comment",
    indexes = [
        Index(
            name = "idx_comment_post_created_at",
            columnList = "post_id, created_at"
        ),
        Index(
            name = "idx_comment_author_created_at",
            columnList = "author_id, created_at"
        ),
        Index(
            name = "idx_comment_parent_created_at",
            columnList = "parent_id, created_at, id"
        )
    ]
)
class Comment(

    id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    val post: Post,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    val author: Member,

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    var content: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: CommentStatus,

    @Column(name = "report_count", nullable = false)
    var reportCount: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    val parent: Comment? = null,

    createdAt: Instant = Instant.now(),
    updatedAt: Instant = Instant.now(),
) : BaseTimeEntity(
    id = id,
    createdAt = createdAt,
    updatedAt = updatedAt,
) {

    companion object {
        fun create(
            post: Post,
            author: Member,
            content: String,
        ) = Comment(
            post = post,
            author = author,
            content = content,
            status = CommentStatus.PUBLISHED,
            parent = null,
        )

        fun createReply(
            post: Post,
            author: Member,
            content: String,
            parent: Comment,
        ) = Comment(
            post = post,
            author = author,
            content = content,
            status = CommentStatus.PUBLISHED,
            parent = parent,
        )
    }

    fun isReply(): Boolean = parent != null

    fun update(content: String) {
        this.content = content
    }

    fun updateBy(actor: Member, content: String) {
        ensureEditableBy(actor)
        update(content)
    }

    fun deleteBy(actor: Member) {
        ensureEditableBy(actor)
        if (status == CommentStatus.DELETED) {
            throwError(ErrorType.COMMENT_NOT_FOUND, "commentId=$id")
        }
        delete()
    }

    fun restoreByAdmin(actor: Member) {
        ensureAdmin(actor)
        if (status == CommentStatus.PUBLISHED) return
        this.status = CommentStatus.PUBLISHED
    }

    fun hideByAdmin(actor: Member) {
        ensureAdmin(actor)
        if (status != CommentStatus.PUBLISHED) return
        hide()
    }

    fun changeStatusByAdmin(actor: Member, targetStatus: CommentStatus) {
        ensureAdmin(actor)
        if (status == targetStatus) return
        when (targetStatus) {
            CommentStatus.PUBLISHED -> restoreByAdmin(actor)
            CommentStatus.HIDDEN -> hideByAdmin(actor)
            CommentStatus.DELETED -> delete()
        }
    }

    fun registerReport(policy: CommentReportPolicy = CommentReportPolicy): Boolean {
        reportCount += 1
        if (policy.shouldHide(status, reportCount)) {
            hide()
            return true
        }
        return false
    }

    fun delete() {
        this.status = CommentStatus.DELETED
    }

    fun hide() {
        this.status = CommentStatus.HIDDEN
    }

    fun ensureEditableBy(actor: Member) {
        if (author.id != actor.id && actor.memberRole != MemberRole.ADMIN) {
            throwError(ErrorType.COMMENT_ACCESS_DENIED, "commentId=$id")
        }
    }

    private fun ensureAdmin(actor: Member) {
        if (actor.memberRole != MemberRole.ADMIN) {
            throwError(ErrorType.ADMIN_ACCESS_DENIED)
        }
    }
}
