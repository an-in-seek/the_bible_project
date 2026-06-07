package com.elseeker.qna.adapter.input.api.admin.request

import com.elseeker.qna.domain.vo.InquiryStatus
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size

@Schema(description = "문의 답변 작성/수정 요청")
data class AnswerInquiryRequest(
    @field:NotBlank(message = "답변 내용은 필수입니다")
    @field:Size(max = 4000, message = "답변은 4000자 이내여야 합니다")
    @field:Schema(description = "답변 본문")
    val content: String,
)

@Schema(description = "문의 상태 변경 요청 (종료/재개)")
data class AdminInquiryStatusRequest(
    @field:NotNull(message = "상태는 필수입니다")
    @field:Schema(description = "변경할 상태 (ANSWERED / CLOSED)", example = "CLOSED")
    val status: InquiryStatus,
)
