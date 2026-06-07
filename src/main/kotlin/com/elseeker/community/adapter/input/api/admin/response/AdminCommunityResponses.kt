package com.elseeker.community.adapter.input.api.admin.response

import com.elseeker.community.domain.vo.CommentStatus
import com.elseeker.community.domain.vo.ReportReason
import com.elseeker.community.domain.vo.TargetType
import io.swagger.v3.oas.annotations.media.Schema
import java.time.Instant

@Schema(description = "관리자 댓글 목록 아이템")
data class AdminCommentItem(
    @field:Schema(description = "댓글 ID")
    val id: Long,
    @field:Schema(description = "게시글 ID")
    val postId: Long,
    @field:Schema(description = "게시글 제목")
    val postTitle: String,
    @field:Schema(description = "댓글 내용")
    val content: String,
    @field:Schema(description = "작성자 닉네임")
    val authorNickname: String,
    @field:Schema(description = "댓글 상태")
    val status: CommentStatus,
    @field:Schema(description = "신고 수")
    val reportCount: Long,
    @field:Schema(description = "작성일시 (UTC)")
    val createdAt: Instant,
    @field:Schema(description = "부모 댓글 ID (대댓글이면 부모 id, 최상위면 null)")
    val parentId: Long? = null,
)

@Schema(description = "관리자 신고 목록 아이템")
data class AdminReportItem(
    @field:Schema(description = "신고 ID")
    val id: Long,
    @field:Schema(description = "대상 유형")
    val targetType: TargetType,
    @field:Schema(description = "대상 ID")
    val targetId: Long,
    @field:Schema(description = "신고 사유")
    val reason: ReportReason,
    @field:Schema(description = "신고자 ID")
    val reporterId: Long,
    @field:Schema(description = "신고자 닉네임")
    val reporterNickname: String?,
    @field:Schema(description = "신고 일시 (UTC)")
    val createdAt: Instant,
)
