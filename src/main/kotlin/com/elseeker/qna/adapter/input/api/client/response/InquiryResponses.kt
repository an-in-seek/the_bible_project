package com.elseeker.qna.adapter.input.api.client.response

import com.elseeker.qna.domain.vo.InquiryCategory
import com.elseeker.qna.domain.vo.InquiryStatus
import io.swagger.v3.oas.annotations.media.Schema
import java.time.Instant

@Schema(description = "내 문의 목록 항목")
data class InquirySummaryResponse(
    val id: Long,
    val category: InquiryCategory,
    val title: String,
    val status: InquiryStatus,
    val isAnswered: Boolean,
    val createdAt: Instant,
    val answeredAt: Instant?,
)

@Schema(description = "문의 상세 (문의 + 답변)")
data class InquiryDetailResponse(
    val id: Long,
    val category: InquiryCategory,
    val title: String,
    val content: String,
    val status: InquiryStatus,
    val isAuthor: Boolean,
    val answerContent: String?,
    val answeredAt: Instant?,
    val createdAt: Instant,
    val updatedAt: Instant,
)
