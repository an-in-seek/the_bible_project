package com.elseeker.qna.adapter.input.api.admin.request

import com.elseeker.qna.domain.vo.ContactStatus
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size

@Schema(description = "공개 문의 회신 기록 요청 (회신 본문 보관 + 회신완료 처리)")
data class ReplyContactRequest(
    @field:NotBlank(message = "회신 내용은 필수입니다")
    @field:Size(max = 4000, message = "회신은 4000자 이내여야 합니다")
    @field:Schema(description = "회신 본문(관리자 기록용)")
    val content: String,
)

@Schema(description = "공개 문의 상태 변경 요청 (회신완료/종료)")
data class AdminContactStatusRequest(
    @field:NotNull(message = "상태는 필수입니다")
    @field:Schema(description = "변경할 상태 (REPLIED / CLOSED)", example = "CLOSED")
    val status: ContactStatus,
)
