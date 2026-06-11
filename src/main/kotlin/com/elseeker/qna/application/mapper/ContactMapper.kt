package com.elseeker.qna.application.mapper

import com.elseeker.qna.adapter.input.api.admin.response.AdminContactItem
import com.elseeker.qna.domain.model.ContactMessage

fun ContactMessage.toAdminItem() = AdminContactItem(
    id = requireNotNull(this.id),
    category = this.category,
    title = this.title,
    content = this.content,
    status = this.status,
    guestName = this.guestName,
    guestEmail = this.guestEmail,
    replyContent = this.replyContent,
    repliedByNickname = this.repliedBy?.nickname,
    repliedAt = this.repliedAt,
    createdAt = this.createdAt,
)
