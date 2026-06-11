package com.elseeker.qna.application.service

import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.throwError
import com.elseeker.member.adapter.output.jpa.MemberRepository
import com.elseeker.qna.adapter.output.jpa.ContactMessageRepository
import com.elseeker.qna.domain.model.ContactMessage
import com.elseeker.qna.domain.vo.ContactStatus
import com.elseeker.qna.domain.vo.InquiryCategory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

@Service
class AdminContactService(
    private val contactMessageRepository: ContactMessageRepository,
    private val memberRepository: MemberRepository,
) {

    @Transactional(readOnly = true)
    fun getAdminContacts(
        status: ContactStatus?,
        category: InquiryCategory?,
        keyword: String?,
        pageable: Pageable,
    ): Page<ContactMessage> {
        val kw = keyword?.trim()?.takeIf { it.isNotBlank() }?.let { "%$it%" }
        return contactMessageRepository.findAdminPage(
            status = status,
            category = category,
            keyword = kw,
            pageable = PageRequest.of(pageable.pageNumber, pageable.pageSize),
        )
    }

    @Transactional(readOnly = true)
    fun getAdminContactDetail(contactId: Long): ContactMessage =
        contactMessageRepository.findByIdWithReplier(contactId)
            ?: throwError(ErrorType.CONTACT_NOT_FOUND, "contactId=$contactId")

    @Transactional
    fun reply(memberUid: UUID, contactId: Long, content: String) {
        val admin = getMemberOrThrow(memberUid)
        getAdminContactDetail(contactId).replyByAdmin(admin, content)
    }

    @Transactional
    fun changeStatus(memberUid: UUID, contactId: Long, status: ContactStatus) {
        val admin = getMemberOrThrow(memberUid)
        getAdminContactDetail(contactId).changeStatusByAdmin(admin, status)
    }

    private fun getMemberOrThrow(memberUid: UUID) =
        memberRepository.findByUid(memberUid) ?: throwError(ErrorType.MEMBER_NOT_FOUND)
}
