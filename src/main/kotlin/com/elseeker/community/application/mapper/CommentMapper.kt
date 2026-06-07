package com.elseeker.community.application.mapper

import com.elseeker.community.adapter.input.api.admin.response.AdminCommentItem
import com.elseeker.community.adapter.input.api.client.response.CommentResponse
import com.elseeker.community.domain.model.Comment
import java.util.*

fun Comment.toResponse(memberUid: UUID? = null) = CommentResponse(
    id = requireNotNull(this.id),
    content = this.content,
    authorNickname = this.author.nickname,
    authorProfileImageUrl = this.author.profileImageUrl,
    status = this.status,
    isAuthor = memberUid != null && this.author.uid == memberUid,
    createdAt = this.createdAt,
    parentId = this.parent?.id,
)

/** 최상위 댓글 + 미리보기 대댓글(parentId만 채움) + 서버 count replyCount 조립. */
fun Comment.toResponseWithReplies(
    memberUid: UUID? = null,
    replies: List<Comment>,
    replyCount: Int,
) = this.toResponse(memberUid).copy(
    replyCount = replyCount,
    replies = replies.map { it.toResponse(memberUid) },
)

fun Comment.toAdminItem() = AdminCommentItem(
    id = requireNotNull(this.id),
    postId = requireNotNull(this.post.id),
    postTitle = this.post.title,
    content = this.content,
    authorNickname = this.author.nickname,
    status = this.status,
    reportCount = this.reportCount,
    createdAt = this.createdAt,
    parentId = this.parent?.id,
)
