package com.elseeker.qna.application.mapper

import com.elseeker.qna.adapter.input.api.admin.response.AdminInquiryItem
import com.elseeker.qna.adapter.input.api.client.response.InquiryDetailResponse
import com.elseeker.qna.adapter.input.api.client.response.InquirySummaryResponse
import com.elseeker.qna.domain.model.Inquiry

fun Inquiry.toSummary() = InquirySummaryResponse(
    id = requireNotNull(this.id),
    category = this.category,
    title = this.title,
    status = this.status,
    isAnswered = this.isAnswered,
    createdAt = this.createdAt,
    answeredAt = this.answeredAt,
)

fun Inquiry.toDetail(viewerId: Long?) = InquiryDetailResponse(
    id = requireNotNull(this.id),
    category = this.category,
    title = this.title,
    content = this.content,
    status = this.status,
    isAuthor = viewerId != null && this.author.id == viewerId,
    answerContent = this.answerContent,
    answeredAt = this.answeredAt,
    createdAt = this.createdAt,
    updatedAt = this.updatedAt,
)

fun Inquiry.toAdminItem() = AdminInquiryItem(
    id = requireNotNull(this.id),
    category = this.category,
    title = this.title,
    content = this.content,
    status = this.status,
    authorNickname = this.author.nickname,
    answerContent = this.answerContent,
    answeredByNickname = this.answeredBy?.nickname,
    answeredAt = this.answeredAt,
    createdAt = this.createdAt,
)
