package com.elseeker.community.application.service

import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.throwError
import com.elseeker.community.adapter.input.api.client.response.CommentCountResponse
import com.elseeker.community.adapter.input.api.client.response.CommentMutationResponse
import com.elseeker.community.adapter.input.api.client.response.CommentSliceResponse
import com.elseeker.community.adapter.output.jpa.CommentRepository
import com.elseeker.community.adapter.output.jpa.CommunityReportRepository
import com.elseeker.community.adapter.output.jpa.PostRepository
import com.elseeker.community.application.mapper.toResponse
import com.elseeker.community.application.mapper.toResponseWithReplies
import com.elseeker.community.domain.model.Comment
import com.elseeker.community.domain.model.CommunityReport
import com.elseeker.community.domain.policy.CommentReportPolicy
import com.elseeker.community.domain.vo.CommentStatus
import com.elseeker.community.domain.vo.PostStatus
import com.elseeker.community.domain.vo.ReportReason
import com.elseeker.community.domain.vo.TargetType
import com.elseeker.member.adapter.output.jpa.MemberRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.*

@Service
class CommentService(
    private val commentRepository: CommentRepository,
    private val communityReportRepository: CommunityReportRepository,
    private val postRepository: PostRepository,
    private val memberRepository: MemberRepository,
) {

    companion object {
        /** 부모당 즉시 로드(미리보기) 대댓글 상한 (4-2-2). */
        const val REPLY_PREVIEW_SIZE = 20
    }

    @Transactional(readOnly = true)
    fun getComments(postId: Long, pageable: Pageable, memberUid: UUID? = null): CommentSliceResponse {
        val post = postRepository.findByIdAndStatusNot(postId, PostStatus.DELETED) ?: throwError(ErrorType.POST_NOT_FOUND)
        post.ensureReadableForClient()

        val parents = commentRepository.findTopLevelByPostId(postId, CommentStatus.PUBLISHED, pageable)
        val parentIds = parents.content.mapNotNull { it.id }
        if (parentIds.isEmpty()) {
            // 빈 부모 목록 short-circuit (4-2-5, Med-3): IN ()/count/preview 쿼리 차단
            return CommentSliceResponse(content = emptyList(), hasNext = parents.hasNext())
        }

        // 부모별 미리보기 N개 (DB-side 바운드, 4-2-2 방식 A)
        val repliesByParent: Map<Long, List<Comment>> = parentIds.associateWith { pid ->
            commentRepository.findRepliesByParentId(
                pid, CommentStatus.PUBLISHED, PageRequest.of(0, REPLY_PREVIEW_SIZE),
            ).content
        }
        // 부모별 총 PUBLISHED 대댓글 수 (4-2-3)
        val countByParent: Map<Long, Int> = commentRepository
            .countRepliesByParentIds(parentIds, CommentStatus.PUBLISHED)
            .associate { it.parentId to it.count.toInt() }

        val content = parents.content.map { parent ->
            val pid = parent.id
            parent.toResponseWithReplies(
                memberUid = memberUid,
                replies = repliesByParent[pid].orEmpty(),
                replyCount = countByParent[pid] ?: 0,
            )
        }
        return CommentSliceResponse(content = content, hasNext = parents.hasNext())
    }

    @Transactional(readOnly = true)
    fun getReplies(
        postId: Long,
        parentId: Long,
        afterCreatedAt: Instant?,
        afterId: Long?,
        pageable: Pageable,
        memberUid: UUID? = null,
    ): CommentSliceResponse {
        val slice = if (afterCreatedAt != null && afterId != null) {
            commentRepository.findRepliesByParentIdAfter(
                parentId, CommentStatus.PUBLISHED, afterCreatedAt, afterId, pageable,
            )
        } else {
            commentRepository.findRepliesByParentId(parentId, CommentStatus.PUBLISHED, pageable)
        }
        // 모든 결과는 :parentId 의 자식이므로 parentId를 직접 주입해 parent LAZY N+1 회피.
        return CommentSliceResponse(
            content = slice.content.map { it.toResponse(memberUid).copy(parentId = parentId) },
            hasNext = slice.hasNext(),
        )
    }

    @Transactional(readOnly = true)
    fun getAdminComments(
        status: CommentStatus?,
        postId: Long?,
        commentId: Long?,
        keyword: String?,
        author: String?,
        pageable: Pageable,
    ): Page<Comment> {
        val normalizedPageable = PageRequest.of(pageable.pageNumber, pageable.pageSize)
        val keywordLike = keyword?.trim()?.takeIf { it.isNotBlank() }?.let { "%$it%" }
        val authorLike = author?.trim()?.takeIf { it.isNotBlank() }?.let { "%$it%" }
        return commentRepository.findAdminPage(
            status = status,
            postId = postId,
            commentId = commentId,
            keyword = keywordLike,
            author = authorLike,
            pageable = normalizedPageable,
        )
    }

    @Transactional
    fun createComment(postId: Long, memberUid: UUID, content: String): CommentMutationResponse {
        val post = postRepository.findByIdAndStatusNot(postId, PostStatus.DELETED) ?: throwError(ErrorType.POST_NOT_FOUND)
        post.ensureReadableForClient()
        if (!post.useReply) throwError(ErrorType.COMMENT_DISABLED)
        val member = getMemberOrThrow(memberUid)
        val comment = Comment.create(
            post = post,
            author = member,
            content = content,
        )
        val saved = commentRepository.save(comment)
        postRepository.incrementCommentCount(postId)
        postRepository.updateScore(postId)
        return CommentMutationResponse(
            comment = saved.toResponse(memberUid),
            postCommentCount = postRepository.findCommentCountByPostId(postId),
        )
    }

    @Transactional
    fun createReply(postId: Long, parentId: Long, memberUid: UUID, content: String): CommentMutationResponse {
        // 7-1 가드: 게시글 가시성
        val post = postRepository.findByIdAndStatusNot(postId, PostStatus.DELETED) ?: throwError(ErrorType.POST_NOT_FOUND)
        post.ensureReadableForClient()
        if (!post.useReply) throwError(ErrorType.COMMENT_DISABLED)
        val member = getMemberOrThrow(memberUid)

        // 부모 로드 + 2단계 평탄화 + 무결성/상태 가드
        val target = commentRepository.findByIdWithParentAndPost(parentId) ?: throwError(ErrorType.COMMENT_NOT_FOUND)
        val realParent = target.parent ?: target
        if (realParent.post.id != postId) throwError(ErrorType.COMMENT_NOT_FOUND)
        if (realParent.status != CommentStatus.PUBLISHED) throwError(ErrorType.COMMENT_NOT_FOUND)

        val reply = Comment.createReply(post = post, author = member, content = content, parent = realParent)
        val saved = commentRepository.save(reply)
        postRepository.incrementCommentCount(postId)
        postRepository.updateScore(postId)

        val realParentId = requireNotNull(realParent.id)
        return CommentMutationResponse(
            comment = saved.toResponse(memberUid),
            postCommentCount = postRepository.findCommentCountByPostId(postId),
            parentId = realParentId,
            parentReplyCount = countReplies(realParentId),
        )
    }

    @Transactional
    fun updateComment(postId: Long, commentId: Long, memberUid: UUID, content: String): CommentMutationResponse {
        // author·post·parent 동반 페치 (LAZY N+1 회피)
        val comment = commentRepository.findByIdWithParentAndPost(commentId) ?: throwError(ErrorType.COMMENT_NOT_FOUND)
        if (comment.status == CommentStatus.DELETED) throwError(ErrorType.COMMENT_NOT_FOUND)
        if (comment.post.id != postId) throwError(ErrorType.COMMENT_NOT_FOUND)
        val member = getMemberOrThrow(memberUid)
        comment.updateBy(actor = member, content = content)
        val parent = comment.parent
        return CommentMutationResponse(
            comment = comment.toResponse(memberUid),
            postCommentCount = postRepository.findCommentCountByPostId(postId),
            parentId = parent?.id,
            parentReplyCount = parent?.id?.let { countReplies(it) },
        )
    }

    /**
     * postId: 클라이언트 경로(무결성 검증 대상). 관리자 경로는 postId path가 없으므로 null로 호출 → 검증 skip.
     */
    @Transactional
    fun deleteComment(commentId: Long, memberUid: UUID, postId: Long? = null): CommentCountResponse {
        val comment = commentRepository.findByIdWithAuthorAndPostForUpdate(commentId) ?: throwError(ErrorType.COMMENT_NOT_FOUND)
        ensurePostMatches(comment, postId)
        val member = getMemberOrThrow(memberUid)
        val before = comment.status
        comment.deleteBy(member)
        return applyTransition(comment, before)
    }

    @Transactional
    fun restoreComment(commentId: Long, memberUid: UUID) {
        val member = getMemberOrThrow(memberUid)
        val comment = commentRepository.findByIdWithAuthorAndPostForUpdate(commentId) ?: throwError(ErrorType.COMMENT_NOT_FOUND)
        val before = comment.status
        comment.restoreByAdmin(member)
        applyTransition(comment, before)
    }

    @Transactional
    fun updateCommentStatus(commentId: Long, memberUid: UUID, status: CommentStatus) {
        val member = getMemberOrThrow(memberUid)
        val comment = commentRepository.findByIdWithAuthorAndPostForUpdate(commentId) ?: throwError(ErrorType.COMMENT_NOT_FOUND)
        val before = comment.status
        comment.changeStatusByAdmin(member, status)
        applyTransition(comment, before)
    }

    @Transactional
    fun reportComment(commentId: Long, memberUid: UUID, reason: ReportReason, postId: Long? = null): CommentCountResponse {
        val comment = commentRepository.findByIdAndStatusNotForUpdate(commentId, CommentStatus.DELETED) ?: throwError(ErrorType.COMMENT_NOT_FOUND)
        ensurePostMatches(comment, postId)
        val member = getMemberOrThrow(memberUid)
        val memberId = requireNotNull(member.id)
        if (communityReportRepository.existsByTargetTypeAndTargetIdAndReporterId(TargetType.COMMENT, commentId, memberId)) {
            throwError(ErrorType.REPORT_COMMENT_ALREADY_EXISTS)
        }
        val report = CommunityReport.create(
            targetType = TargetType.COMMENT,
            targetId = commentId,
            reporterId = memberId,
            reason = reason,
        )
        communityReportRepository.save(report)
        val before = comment.status
        comment.registerReport(CommentReportPolicy)
        return applyTransition(comment, before)
    }

    private fun getMemberOrThrow(memberUid: UUID) =
        memberRepository.findByUid(memberUid) ?: throwError(ErrorType.MEMBER_NOT_FOUND)

    /** postId가 주어진 경우(클라이언트 경로) 댓글 소속 게시글 무결성 검증 (7-5). */
    private fun ensurePostMatches(comment: Comment, postId: Long?) {
        if (postId != null && comment.post.id != postId) throwError(ErrorType.COMMENT_NOT_FOUND)
    }

    private fun countReplies(parentId: Long): Int =
        commentRepository.countRepliesByParentIds(listOf(parentId), CommentStatus.PUBLISHED)
            .firstOrNull { it.parentId == parentId }?.count?.toInt() ?: 0

    /**
     * comment-scoped 상태 전이의 단일 정합 지점.
     * 부모(최상위)면 cascade, 자식이면 단건 카운트 변경 후 CommentCountResponse 조립.
     */
    private fun applyTransition(comment: Comment, before: CommentStatus): CommentCountResponse {
        val postId = comment.post.id ?: throwError(ErrorType.POST_NOT_FOUND)
        if (comment.parent == null) {
            cascadeTopLevelTransition(comment, before, comment.status)
            return CommentCountResponse(postCommentCount = postRepository.findCommentCountByPostId(postId))
        }
        applyCommentCountChange(postId, before, comment.status)
        val parentId = requireNotNull(comment.parent?.id)
        return CommentCountResponse(
            postCommentCount = postRepository.findCommentCountByPostId(postId),
            parentId = parentId,
            parentReplyCount = countReplies(parentId),
        )
    }

    /** 7-3 최상위 댓글 상태 전이 시 자식·카운트 통합 정합. */
    private fun cascadeTopLevelTransition(parent: Comment, before: CommentStatus, after: CommentStatus) {
        val postId = parent.post.id ?: throwError(ErrorType.POST_NOT_FOUND)
        if (before == after) return
        val wasCounted = before.isCountedInPost()
        val nowCounted = after.isCountedInPost()

        when {
            after == CommentStatus.DELETED || after == CommentStatus.HIDDEN -> {
                val children = if (after == CommentStatus.DELETED) {
                    commentRepository.findRepliesByParentIdAndStatusNot(parent.id!!, CommentStatus.DELETED)
                } else {
                    commentRepository.findRepliesByParentIds(listOf(parent.id!!), CommentStatus.PUBLISHED)
                }
                val publishedChildCount = children.count { it.status == CommentStatus.PUBLISHED }
                children.forEach { if (after == CommentStatus.DELETED) it.delete() else it.hide() }
                val removed = (if (wasCounted) 1L else 0L) + publishedChildCount
                if (removed > 0) {
                    postRepository.decrementCommentCountBy(postId, removed)
                    postRepository.updateScore(postId)
                }
            }
            // 비노출 → 노출(관리자 복원): 부모만 +1.
            // 설계 7-3 명시 제약 — 부모 숨김 시 함께 내려간 자식의 자동 복원은 2차로 미룸.
            // 주의: 부모 숨김 시 자식분까지 차감됐으나 복원은 부모분만 더하므로, 자식이 복원되기 전까지
            //       게시글 commentCount는 그 자식 수만큼 낮게 남는다("표시행=commentCount" 불변식이 이 경우
            //       일시적으로 깨짐). 자식 복원 기능은 향후 별도 작업으로 해소한다.
            !wasCounted && nowCounted -> {
                postRepository.incrementCommentCount(postId)
                postRepository.updateScore(postId)
            }
        }
    }

    private fun applyCommentCountChange(postId: Long, before: CommentStatus, after: CommentStatus) {
        if (before == after) return
        val beforeCounted = before.isCountedInPost()
        val afterCounted = after.isCountedInPost()
        if (beforeCounted == afterCounted) return
        if (afterCounted) {
            postRepository.incrementCommentCount(postId)
        } else {
            postRepository.decrementCommentCount(postId)
        }
        postRepository.updateScore(postId)
    }
}
