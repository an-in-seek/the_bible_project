package com.elseeker.qna.adapter.input.api.client.request

import com.elseeker.qna.domain.vo.InquiryCategory
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size

@Schema(description = "공개(비로그인) 문의하기 등록 요청")
data class CreateContactRequest(
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

    @field:NotBlank(message = "회신받을 이메일은 필수입니다")
    @field:Email(message = "이메일 형식이 올바르지 않습니다")
    @field:Size(max = 255, message = "이메일은 255자 이내여야 합니다")
    @field:Schema(description = "답변을 회신받을 이메일", example = "user@example.com")
    val guestEmail: String,

    @field:Size(max = 100, message = "이름은 100자 이내여야 합니다")
    @field:Schema(description = "이름/호칭(선택)", example = "홍길동")
    val guestName: String? = null,

    @field:Schema(description = "스팸 방지용 허니팟 — 사용자는 비워둬야 함(봇 트랩). 값이 차 있으면 서버가 조용히 폐기", hidden = true)
    val website: String? = null,

    @field:Schema(description = "폼 렌더 시각(epoch ms) — 제출 소요시간 검증용", hidden = true)
    val formRenderedAt: Long? = null,
)
