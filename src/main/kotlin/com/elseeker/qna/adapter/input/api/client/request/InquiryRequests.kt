package com.elseeker.qna.adapter.input.api.client.request

import com.elseeker.qna.domain.vo.InquiryCategory
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size

@Schema(description = "1:1 문의 등록 요청")
data class CreateInquiryRequest(
    @field:NotNull(message = "문의 유형은 필수입니다")
    @field:Schema(description = "문의 카테고리", example = "ACCOUNT")
    val category: InquiryCategory,

    @field:NotBlank(message = "제목은 필수입니다")
    @field:Size(max = 200, message = "제목은 200자 이내여야 합니다")
    @field:Schema(description = "제목", example = "로그인이 안 됩니다")
    val title: String,

    @field:NotBlank(message = "내용은 필수입니다")
    @field:Size(max = 4000, message = "내용은 4000자 이내여야 합니다")
    @field:Schema(description = "문의 내용")
    val content: String,
)

@Schema(description = "1:1 문의 수정 요청 (답변 전에만 가능)")
data class UpdateInquiryRequest(
    @field:NotNull(message = "문의 유형은 필수입니다")
    @field:Schema(description = "문의 카테고리", example = "ACCOUNT")
    val category: InquiryCategory,

    @field:NotBlank(message = "제목은 필수입니다")
    @field:Size(max = 200, message = "제목은 200자 이내여야 합니다")
    @field:Schema(description = "제목", example = "로그인이 안 됩니다")
    val title: String,

    @field:NotBlank(message = "내용은 필수입니다")
    @field:Size(max = 4000, message = "내용은 4000자 이내여야 합니다")
    @field:Schema(description = "문의 내용")
    val content: String,
)
