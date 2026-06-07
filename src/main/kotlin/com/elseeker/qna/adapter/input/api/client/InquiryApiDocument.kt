package com.elseeker.qna.adapter.input.api.client

import com.elseeker.common.adapter.input.api.response.PageResponse
import com.elseeker.common.security.jwt.JwtPrincipal
import com.elseeker.qna.adapter.input.api.client.request.CreateInquiryRequest
import com.elseeker.qna.adapter.input.api.client.request.UpdateInquiryRequest
import com.elseeker.qna.adapter.input.api.client.response.InquiryDetailResponse
import com.elseeker.qna.adapter.input.api.client.response.InquirySummaryResponse
import com.elseeker.qna.domain.vo.InquiryStatus
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Pageable
import org.springframework.http.ResponseEntity

@Tag(name = "Q&A (1:1 문의)", description = "회원 1:1 문의 API")
interface InquiryApiDocument {

    @Operation(summary = "문의 등록", description = "새 1:1 문의를 등록합니다.")
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "등록 성공"),
        ApiResponse(responseCode = "401", description = "인증 필요"),
    )
    fun createInquiry(
        @Valid request: CreateInquiryRequest,
        @Parameter(hidden = true) principal: JwtPrincipal,
    ): ResponseEntity<InquiryDetailResponse>

    @Operation(summary = "내 문의 목록", description = "로그인 회원 본인의 문의 목록을 조회합니다.")
    @ApiResponses(ApiResponse(responseCode = "200", description = "조회 성공"))
    fun getMyInquiries(
        @Parameter(description = "상태 필터 (RECEIVED/ANSWERED/CLOSED)") status: InquiryStatus?,
        pageable: Pageable,
        @Parameter(hidden = true) principal: JwtPrincipal,
    ): ResponseEntity<PageResponse<InquirySummaryResponse>>

    @Operation(summary = "내 문의 상세", description = "본인 문의의 상세(질문 + 답변)를 조회합니다.")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "조회 성공"),
        ApiResponse(responseCode = "404", description = "문의 없음 / 타인 문의"),
    )
    fun getMyInquiryDetail(
        @Parameter(description = "문의 ID") id: Long,
        @Parameter(hidden = true) principal: JwtPrincipal,
    ): ResponseEntity<InquiryDetailResponse>

    @Operation(summary = "문의 수정", description = "답변 전(RECEIVED) 상태에서만 본인 문의를 수정합니다.")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "수정 성공"),
        ApiResponse(responseCode = "400", description = "이미 답변된 문의"),
        ApiResponse(responseCode = "404", description = "문의 없음 / 타인 문의"),
    )
    fun updateInquiry(
        @Parameter(description = "문의 ID") id: Long,
        @Valid request: UpdateInquiryRequest,
        @Parameter(hidden = true) principal: JwtPrincipal,
    ): ResponseEntity<InquiryDetailResponse>

    @Operation(summary = "문의 삭제", description = "답변 전(RECEIVED) 상태에서만 본인 문의를 삭제(soft)합니다.")
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "삭제 성공"),
        ApiResponse(responseCode = "400", description = "이미 답변된 문의"),
        ApiResponse(responseCode = "404", description = "문의 없음 / 타인 문의"),
    )
    fun deleteInquiry(
        @Parameter(description = "문의 ID") id: Long,
        @Parameter(hidden = true) principal: JwtPrincipal,
    ): ResponseEntity<Void>
}
