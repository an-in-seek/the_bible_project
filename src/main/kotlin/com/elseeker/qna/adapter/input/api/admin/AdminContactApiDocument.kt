package com.elseeker.qna.adapter.input.api.admin

import com.elseeker.common.adapter.input.api.admin.response.AdminPageResponse
import com.elseeker.common.security.jwt.JwtPrincipal
import com.elseeker.qna.adapter.input.api.admin.request.AdminContactStatusRequest
import com.elseeker.qna.adapter.input.api.admin.request.ReplyContactRequest
import com.elseeker.qna.adapter.input.api.admin.response.AdminContactItem
import com.elseeker.qna.domain.vo.ContactStatus
import com.elseeker.qna.domain.vo.InquiryCategory
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Pageable
import org.springframework.http.ResponseEntity

@Tag(name = "Admin Contact (공개 문의)", description = "관리자 공개 문의 관리 API")
interface AdminContactApiDocument {

    @Operation(summary = "공개 문의 목록 (관리자)", description = "상태/카테고리/검색 필터로 공개 문의를 조회합니다.")
    @ApiResponses(ApiResponse(responseCode = "200", description = "조회 성공"))
    fun getAdminContacts(
        @Parameter(description = "상태 필터") status: ContactStatus?,
        @Parameter(description = "카테고리 필터") category: InquiryCategory?,
        @Parameter(description = "제목/내용/이메일 키워드") keyword: String?,
        pageable: Pageable,
        @Parameter(hidden = true) principal: JwtPrincipal,
    ): ResponseEntity<AdminPageResponse<AdminContactItem>>

    @Operation(summary = "공개 문의 상세 (관리자)", description = "공개 문의 상세를 조회합니다.")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "조회 성공"),
        ApiResponse(responseCode = "404", description = "문의 없음"),
    )
    fun getAdminContactDetail(
        @Parameter(description = "문의 ID") id: Long,
        @Parameter(hidden = true) principal: JwtPrincipal,
    ): ResponseEntity<AdminContactItem>

    @Operation(summary = "회신 기록", description = "회신 본문을 기록하고 회신완료(REPLIED) 처리합니다. 실제 메일 발송은 수동입니다.")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "회신 기록 성공"),
        ApiResponse(responseCode = "404", description = "문의 없음"),
    )
    fun reply(
        @Parameter(description = "문의 ID") id: Long,
        @Valid request: ReplyContactRequest,
        @Parameter(hidden = true) principal: JwtPrincipal,
    ): ResponseEntity<Void>

    @Operation(summary = "상태 변경 (회신완료/종료)", description = "공개 문의를 종료(CLOSED)하거나 회신완료(REPLIED)로 되돌립니다.")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "변경 성공"),
        ApiResponse(responseCode = "400", description = "허용되지 않는 전이"),
        ApiResponse(responseCode = "404", description = "문의 없음"),
    )
    fun updateStatus(
        @Parameter(description = "문의 ID") id: Long,
        @Valid request: AdminContactStatusRequest,
        @Parameter(hidden = true) principal: JwtPrincipal,
    ): ResponseEntity<Void>
}
