package com.elseeker.qna.adapter.input.api.admin.response

import com.elseeker.qna.domain.vo.InquiryCategory
import com.elseeker.qna.domain.vo.InquiryStatus
import io.swagger.v3.oas.annotations.media.Schema
import java.time.Instant

@Schema(description = "관리자 문의 항목")
data class AdminInquiryItem(
    val id: Long,
    val category: InquiryCategory,
    val title: String,
    val content: String,
    val status: InquiryStatus,
    val authorNickname: String,
    val answerContent: String?,
    val answeredByNickname: String?,
    val answeredAt: Instant?,
    val createdAt: Instant,
)
