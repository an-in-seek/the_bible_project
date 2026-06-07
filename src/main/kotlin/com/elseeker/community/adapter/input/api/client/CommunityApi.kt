package com.elseeker.community.adapter.input.api.client

import com.elseeker.common.security.jwt.JwtPrincipal
import com.elseeker.community.adapter.input.api.client.request.*
import com.elseeker.community.adapter.input.api.client.response.*
import com.elseeker.community.application.service.CommentService
import com.elseeker.community.application.service.PostService
import com.elseeker.community.application.service.ReactionService
import com.elseeker.community.domain.vo.PostType
import com.elseeker.community.domain.vo.ReactionType
import jakarta.validation.Valid
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*
import java.time.Instant

@Validated
@RestController
@RequestMapping("/api/v1/community")
class CommunityApi(
    private val postService: PostService,
    private val reactionService: ReactionService,
    private val commentService: CommentService,
) : CommunityApiDocument {

    @GetMapping("/posts")
    override fun getClientPosts(
        @RequestParam(required = false) type: PostType?,
        @RequestParam(name = "order", defaultValue = "latest") order: String,
        @PageableDefault(size = 20) pageable: Pageable,
    ): ResponseEntity<PostSliceResponse> {
        val response = postService.getClientPosts(type, order, pageable)
        return ResponseEntity.ok(response)
    }

    @GetMapping("/posts/{postId}")
    override fun getPostDetail(
        @PathVariable postId: Long,
        @AuthenticationPrincipal principal: JwtPrincipal?,
    ): ResponseEntity<PostDetailResponse> {
        val response = postService.getPostDetail(postId, principal?.memberUid)
        return ResponseEntity.ok(response)
    }

    @PostMapping("/posts")
    override fun createPost(
        @Valid @RequestBody request: CreatePostRequest,
        @AuthenticationPrincipal principal: JwtPrincipal,
    ): ResponseEntity<PostDetailResponse> {
        val response = postService.createPost(principal.memberUid, request)
        return ResponseEntity.status(HttpStatus.CREATED).body(response)
    }

    @PutMapping("/posts/{postId}")
    override fun updatePost(
        @PathVariable postId: Long,
        @Valid @RequestBody request: UpdatePostRequest,
        @AuthenticationPrincipal principal: JwtPrincipal,
    ): ResponseEntity<PostDetailResponse> {
        val response = postService.updatePost(postId, principal.memberUid, request)
        return ResponseEntity.ok(response)
    }

    @DeleteMapping("/posts/{postId}")
    override fun deletePost(
        @PathVariable postId: Long,
        @AuthenticationPrincipal principal: JwtPrincipal,
    ): ResponseEntity<Void> {
        postService.deletePost(postId, principal.memberUid)
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/posts/{postId}/reactions")
    override fun addReaction(
        @PathVariable postId: Long,
        @Valid @RequestBody request: CreateReactionRequest,
        @AuthenticationPrincipal principal: JwtPrincipal,
    ): ResponseEntity<Void> {
        reactionService.addReaction(postId, principal.memberUid, request.type)
        return ResponseEntity.status(HttpStatus.CREATED).build()
    }

    @DeleteMapping("/posts/{postId}/reactions/{type}")
    override fun removeReaction(
        @PathVariable postId: Long,
        @PathVariable type: ReactionType,
        @AuthenticationPrincipal principal: JwtPrincipal,
    ): ResponseEntity<Void> {
        reactionService.removeReaction(postId, principal.memberUid, type)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/posts/{postId}/comments")
    override fun getComments(
        @PathVariable postId: Long,
        @PageableDefault(size = 20) pageable: Pageable,
        @AuthenticationPrincipal principal: JwtPrincipal?,
    ): ResponseEntity<CommentSliceResponse> {
        val response = commentService.getComments(postId, pageable, principal?.memberUid)
        return ResponseEntity.ok(response)
    }

    @PostMapping("/posts/{postId}/comments")
    override fun createComment(
        @PathVariable postId: Long,
        @Valid @RequestBody request: CreateCommentRequest,
        @AuthenticationPrincipal principal: JwtPrincipal,
    ): ResponseEntity<CommentMutationResponse> {
        val response = commentService.createComment(postId, principal.memberUid, request.content)
        return ResponseEntity.status(HttpStatus.CREATED).body(response)
    }

    @PostMapping("/posts/{postId}/comments/{parentId}/replies")
    override fun createReply(
        @PathVariable postId: Long,
        @PathVariable parentId: Long,
        @Valid @RequestBody request: CreateCommentRequest,
        @AuthenticationPrincipal principal: JwtPrincipal,
    ): ResponseEntity<CommentMutationResponse> {
        val response = commentService.createReply(postId, parentId, principal.memberUid, request.content)
        return ResponseEntity.status(HttpStatus.CREATED).body(response)
    }

    @GetMapping("/posts/{postId}/comments/{parentId}/replies")
    override fun getReplies(
        @PathVariable postId: Long,
        @PathVariable parentId: Long,
        @RequestParam(required = false) afterCreatedAt: Instant?,
        @RequestParam(required = false) afterId: Long?,
        @PageableDefault(size = 20) pageable: Pageable,
        @AuthenticationPrincipal principal: JwtPrincipal?,
    ): ResponseEntity<CommentSliceResponse> {
        val response = commentService.getReplies(postId, parentId, afterCreatedAt, afterId, pageable, principal?.memberUid)
        return ResponseEntity.ok(response)
    }

    @PutMapping("/posts/{postId}/comments/{commentId}")
    override fun updateComment(
        @PathVariable postId: Long,
        @PathVariable commentId: Long,
        @Valid @RequestBody request: UpdateCommentRequest,
        @AuthenticationPrincipal principal: JwtPrincipal,
    ): ResponseEntity<CommentMutationResponse> {
        val response = commentService.updateComment(postId, commentId, principal.memberUid, request.content)
        return ResponseEntity.ok(response)
    }

    @DeleteMapping("/posts/{postId}/comments/{commentId}")
    override fun deleteComment(
        @PathVariable postId: Long,
        @PathVariable commentId: Long,
        @AuthenticationPrincipal principal: JwtPrincipal,
    ): ResponseEntity<CommentCountResponse> {
        val response = commentService.deleteComment(commentId, principal.memberUid, postId)
        return ResponseEntity.ok(response)
    }

    @PostMapping("/posts/{postId}/reports")
    override fun reportPost(
        @PathVariable postId: Long,
        @Valid @RequestBody request: CreateReportRequest,
        @AuthenticationPrincipal principal: JwtPrincipal,
    ): ResponseEntity<Void> {
        postService.reportPost(postId, principal.memberUid, request.reason)
        return ResponseEntity.status(HttpStatus.CREATED).build()
    }

    @PostMapping("/posts/{postId}/comments/{commentId}/reports")
    override fun reportComment(
        @PathVariable postId: Long,
        @PathVariable commentId: Long,
        @Valid @RequestBody request: CreateReportRequest,
        @AuthenticationPrincipal principal: JwtPrincipal,
    ): ResponseEntity<CommentCountResponse> {
        val response = commentService.reportComment(commentId, principal.memberUid, request.reason, postId)
        return ResponseEntity.ok(response)
    }

    @GetMapping("/posts/top")
    override fun getTopPosts(): ResponseEntity<List<PostSummaryResponse>> {
        val response = postService.getTopPosts()
        return ResponseEntity.ok(response)
    }
}
