package com.elseeker.community.adapter.input.api.client

import com.elseeker.common.security.jwt.JwtPrincipal
import com.elseeker.community.adapter.input.api.client.request.*
import com.elseeker.community.adapter.input.api.client.response.*
import com.elseeker.community.domain.vo.PostType
import com.elseeker.community.domain.vo.ReactionType
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Pageable
import org.springframework.http.ResponseEntity

@Tag(name = "Community", description = "커뮤니티 API")
interface CommunityApiDocument {

    @Operation(summary = "게시글 목록 조회 (클라이언트)", description = "Slice 기반 게시글 목록을 조회합니다.")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "조회 성공"),
    )
    fun getClientPosts(
        @Parameter(description = "게시글 유형 필터") type: PostType?,
        @Parameter(description = "정렬 기준 (latest / popular)") order: String,
        pageable: Pageable,
    ): ResponseEntity<PostSliceResponse>

    @Operation(summary = "게시글 상세 조회", description = "게시글 상세 정보를 조회하고 조회수를 증가시킵니다.")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "조회 성공"),
        ApiResponse(responseCode = "404", description = "게시글 없음"),
    )
    fun getPostDetail(
        @Parameter(description = "게시글 ID") postId: Long,
        @Parameter(hidden = true) principal: JwtPrincipal?,
    ): ResponseEntity<PostDetailResponse>

    @Operation(summary = "게시글 작성", description = "새 게시글을 작성합니다.")
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "작성 성공"),
        ApiResponse(responseCode = "401", description = "인증 필요"),
    )
    fun createPost(
        @Valid request: CreatePostRequest,
        @Parameter(hidden = true) principal: JwtPrincipal,
    ): ResponseEntity<PostDetailResponse>

    @Operation(summary = "게시글 수정", description = "게시글을 수정합니다.")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "수정 성공"),
        ApiResponse(responseCode = "403", description = "권한 없음"),
        ApiResponse(responseCode = "404", description = "게시글 없음"),
    )
    fun updatePost(
        @Parameter(description = "게시글 ID") postId: Long,
        @Valid request: UpdatePostRequest,
        @Parameter(hidden = true) principal: JwtPrincipal,
    ): ResponseEntity<PostDetailResponse>

    @Operation(summary = "게시글 삭제", description = "게시글을 삭제합니다 (soft delete).")
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "삭제 성공"),
        ApiResponse(responseCode = "403", description = "권한 없음"),
        ApiResponse(responseCode = "404", description = "게시글 없음"),
    )
    fun deletePost(
        @Parameter(description = "게시글 ID") postId: Long,
        @Parameter(hidden = true) principal: JwtPrincipal,
    ): ResponseEntity<Void>

    @Operation(summary = "반응 추가", description = "게시글에 반응(LIKE, PRAY)을 추가합니다.")
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "반응 추가 성공"),
        ApiResponse(responseCode = "400", description = "이미 반응한 게시글"),
        ApiResponse(responseCode = "401", description = "인증 필요"),
    )
    fun addReaction(
        @Parameter(description = "게시글 ID") postId: Long,
        @Valid request: CreateReactionRequest,
        @Parameter(hidden = true) principal: JwtPrincipal,
    ): ResponseEntity<Void>

    @Operation(summary = "반응 취소", description = "게시글 반응을 취소합니다.")
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "반응 취소 성공"),
        ApiResponse(responseCode = "404", description = "반응 없음"),
    )
    fun removeReaction(
        @Parameter(description = "게시글 ID") postId: Long,
        @Parameter(description = "반응 유형") type: ReactionType,
        @Parameter(hidden = true) principal: JwtPrincipal,
    ): ResponseEntity<Void>

    @Operation(summary = "댓글 목록 조회", description = "게시글의 댓글 목록을 조회합니다.")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "조회 성공"),
    )
    fun getComments(
        @Parameter(description = "게시글 ID") postId: Long,
        pageable: Pageable,
        @Parameter(hidden = true) principal: JwtPrincipal?,
    ): ResponseEntity<CommentSliceResponse>

    @Operation(summary = "댓글 작성", description = "게시글에 댓글을 작성합니다.")
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "작성 성공"),
        ApiResponse(responseCode = "401", description = "인증 필요"),
    )
    fun createComment(
        @Parameter(description = "게시글 ID") postId: Long,
        @Valid request: CreateCommentRequest,
        @Parameter(hidden = true) principal: JwtPrincipal,
    ): ResponseEntity<CommentMutationResponse>

    @Operation(summary = "대댓글 작성", description = "댓글에 대댓글(답글)을 작성합니다. 2단계 평탄화로 항상 최상위 부모 아래에 달립니다.")
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "작성 성공"),
        ApiResponse(responseCode = "401", description = "인증 필요"),
        ApiResponse(responseCode = "404", description = "부모 댓글 없음/비노출"),
    )
    fun createReply(
        @Parameter(description = "게시글 ID") postId: Long,
        @Parameter(description = "부모 댓글 ID") parentId: Long,
        @Valid request: CreateCommentRequest,
        @Parameter(hidden = true) principal: JwtPrincipal,
    ): ResponseEntity<CommentMutationResponse>

    @Operation(summary = "대댓글 추가 조회", description = "부모 댓글의 대댓글을 keyset 커서로 추가 조회합니다 (\"더 보기\").")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "조회 성공"),
    )
    fun getReplies(
        @Parameter(description = "게시글 ID") postId: Long,
        @Parameter(description = "부모 댓글 ID") parentId: Long,
        @Parameter(description = "커서 — 이 작성시각 이후 (ISO-8601)") afterCreatedAt: java.time.Instant?,
        @Parameter(description = "커서 — 이 댓글 ID 이후 (동일 시각 tie-breaker)") afterId: Long?,
        pageable: Pageable,
        @Parameter(hidden = true) principal: JwtPrincipal?,
    ): ResponseEntity<CommentSliceResponse>

    @Operation(summary = "댓글 수정", description = "댓글을 수정합니다.")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "수정 성공"),
        ApiResponse(responseCode = "403", description = "권한 없음"),
        ApiResponse(responseCode = "404", description = "댓글 없음"),
    )
    fun updateComment(
        @Parameter(description = "게시글 ID") postId: Long,
        @Parameter(description = "댓글 ID") commentId: Long,
        @Valid request: UpdateCommentRequest,
        @Parameter(hidden = true) principal: JwtPrincipal,
    ): ResponseEntity<CommentMutationResponse>

    @Operation(summary = "댓글 삭제", description = "댓글을 삭제합니다 (soft delete).")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "삭제 성공"),
        ApiResponse(responseCode = "403", description = "권한 없음"),
        ApiResponse(responseCode = "404", description = "댓글 없음"),
    )
    fun deleteComment(
        @Parameter(description = "게시글 ID") postId: Long,
        @Parameter(description = "댓글 ID") commentId: Long,
        @Parameter(hidden = true) principal: JwtPrincipal,
    ): ResponseEntity<CommentCountResponse>

    @Operation(summary = "게시글 신고", description = "게시글을 신고합니다.")
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "신고 성공"),
        ApiResponse(responseCode = "400", description = "이미 신고한 게시글"),
        ApiResponse(responseCode = "404", description = "게시글 없음"),
    )
    fun reportPost(
        @Parameter(description = "게시글 ID") postId: Long,
        @Valid request: CreateReportRequest,
        @Parameter(hidden = true) principal: JwtPrincipal,
    ): ResponseEntity<Void>

    @Operation(summary = "댓글 신고", description = "댓글을 신고합니다.")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "신고 성공"),
        ApiResponse(responseCode = "400", description = "이미 신고한 댓글"),
        ApiResponse(responseCode = "404", description = "댓글 없음"),
    )
    fun reportComment(
        @Parameter(description = "게시글 ID") postId: Long,
        @Parameter(description = "댓글 ID") commentId: Long,
        @Valid request: CreateReportRequest,
        @Parameter(hidden = true) principal: JwtPrincipal,
    ): ResponseEntity<CommentCountResponse>

    @Operation(summary = "주간 인기글 Top 3", description = "최근 7일간 인기글 상위 3개를 조회합니다.")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "조회 성공"),
    )
    fun getTopPosts(): ResponseEntity<List<PostSummaryResponse>>
}
