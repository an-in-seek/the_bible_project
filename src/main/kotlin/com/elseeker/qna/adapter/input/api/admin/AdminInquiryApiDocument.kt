package com.elseeker.qna.adapter.input.api.admin

import com.elseeker.common.adapter.input.api.admin.response.AdminPageResponse
import com.elseeker.common.security.jwt.JwtPrincipal
import com.elseeker.qna.adapter.input.api.admin.request.AdminInquiryStatusRequest
import com.elseeker.qna.adapter.input.api.admin.request.AnswerInquiryRequest
import com.elseeker.qna.adapter.input.api.admin.response.AdminInquiryItem
import com.elseeker.qna.domain.vo.InquiryCategory
import com.elseeker.qna.domain.vo.InquiryStatus
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Pageable
import org.springframework.http.ResponseEntity

@Tag(name = "Admin Q&A (1:1 문의)", description = "관리자 1:1 문의 API")
interface AdminInquiryApiDocument {

    @Operation(summary = "문의 목록 (관리자)", description = "상태/카테고리/검색 필터로 문의를 조회합니다.")
    @ApiResponses(ApiResponse(responseCode = "200", description = "조회 성공"))
    fun getAdminInquiries(
        @Parameter(description = "상태 필터") status: InquiryStatus?,
        @Parameter(description = "카테고리 필터") category: InquiryCategory?,
        @Parameter(description = "제목/내용 키워드") keyword: String?,
        @Parameter(description = "작성자 닉네임") author: String?,
        pageable: Pageable,
        @Parameter(hidden = true) principal: JwtPrincipal,
    ): ResponseEntity<AdminPageResponse<AdminInquiryItem>>

    @Operation(summary = "문의 상세 (관리자)", description = "문의 상세(질문 + 답변 + 작성자/답변자)를 조회합니다.")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "조회 성공"),
        ApiResponse(responseCode = "404", description = "문의 없음"),
    )
    fun getAdminInquiryDetail(
        @Parameter(description = "문의 ID") id: Long,
        @Parameter(hidden = true) principal: JwtPrincipal,
    ): ResponseEntity<AdminInquiryItem>

    @Operation(summary = "답변 작성", description = "접수(RECEIVED) 문의에 답변을 등록합니다 (→ ANSWERED).")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "답변 성공"),
        ApiResponse(responseCode = "400", description = "이미 답변/종료된 문의"),
        ApiResponse(responseCode = "404", description = "문의 없음"),
    )
    fun answerInquiry(
        @Parameter(description = "문의 ID") id: Long,
        @Valid request: AnswerInquiryRequest,
        @Parameter(hidden = true) principal: JwtPrincipal,
    ): ResponseEntity<Void>

    @Operation(summary = "답변 수정", description = "이미 답변된 문의의 답변 본문을 수정합니다.")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "수정 성공"),
        ApiResponse(responseCode = "400", description = "답변 없는 문의"),
        ApiResponse(responseCode = "404", description = "문의 없음"),
    )
    fun updateAnswer(
        @Parameter(description = "문의 ID") id: Long,
        @Valid request: AnswerInquiryRequest,
        @Parameter(hidden = true) principal: JwtPrincipal,
    ): ResponseEntity<Void>

    @Operation(summary = "상태 변경 (종료/재개)", description = "답변된 문의를 종료(CLOSED)하거나 재개(ANSWERED)합니다.")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "변경 성공"),
        ApiResponse(responseCode = "400", description = "허용되지 않는 전이"),
        ApiResponse(responseCode = "404", description = "문의 없음"),
    )
    fun updateStatus(
        @Parameter(description = "문의 ID") id: Long,
        @Valid request: AdminInquiryStatusRequest,
        @Parameter(hidden = true) principal: JwtPrincipal,
    ): ResponseEntity<Void>
}
