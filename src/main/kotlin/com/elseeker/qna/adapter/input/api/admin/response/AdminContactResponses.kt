package com.elseeker.qna.adapter.input.api.admin.response

import com.elseeker.qna.domain.vo.ContactStatus
import com.elseeker.qna.domain.vo.InquiryCategory
import io.swagger.v3.oas.annotations.media.Schema
import java.time.Instant

@Schema(description = "관리자 공개 문의 항목")
data class AdminContactItem(
    val id: Long,
    val category: InquiryCategory,
    val title: String,
    val content: String,
    val status: ContactStatus,
    val guestName: String?,
    val guestEmail: String,
    val replyContent: String?,
    val repliedByNickname: String?,
    val repliedAt: Instant?,
    val createdAt: Instant,
)
