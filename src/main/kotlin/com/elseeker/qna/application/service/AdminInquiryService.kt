package com.elseeker.qna.application.service

import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.throwError
import com.elseeker.member.adapter.output.jpa.MemberRepository
import com.elseeker.qna.adapter.output.jpa.InquiryRepository
import com.elseeker.qna.domain.model.Inquiry
import com.elseeker.qna.domain.vo.InquiryCategory
import com.elseeker.qna.domain.vo.InquiryStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

@Service
class AdminInquiryService(
    private val inquiryRepository: InquiryRepository,
    private val memberRepository: MemberRepository,
) {

    @Transactional(readOnly = true)
    fun getAdminInquiries(
        status: InquiryStatus?,
        category: InquiryCategory?,
        keyword: String?,
        author: String?,
        pageable: Pageable,
    ): Page<Inquiry> {
        val kw = keyword?.trim()?.takeIf { it.isNotBlank() }?.let { "%$it%" }
        val au = author?.trim()?.takeIf { it.isNotBlank() }?.let { "%$it%" }
        return inquiryRepository.findAdminPage(
            excludedStatus = InquiryStatus.DELETED,
            status = status,
            category = category,
            keyword = kw,
            author = au,
            pageable = PageRequest.of(pageable.pageNumber, pageable.pageSize),
        )
    }

    @Transactional(readOnly = true)
    fun getAdminInquiryDetail(inquiryId: Long): Inquiry =
        inquiryRepository.findByIdWithAuthorAndAnswerer(inquiryId, InquiryStatus.DELETED)
            ?: throwError(ErrorType.INQUIRY_NOT_FOUND, "inquiryId=$inquiryId")

    @Transactional
    fun answerInquiry(memberUid: UUID, inquiryId: Long, content: String) {
        val admin = getMemberOrThrow(memberUid)
        val inquiry = getAdminInquiryDetail(inquiryId)
        inquiry.answer(admin, content)        // RECEIVED → ANSWERED
    }

    @Transactional
    fun updateAnswer(memberUid: UUID, inquiryId: Long, content: String) {
        val admin = getMemberOrThrow(memberUid)
        getAdminInquiryDetail(inquiryId).updateAnswer(admin, content)
    }

    @Transactional
    fun changeStatus(memberUid: UUID, inquiryId: Long, status: InquiryStatus) {
        val admin = getMemberOrThrow(memberUid)
        getAdminInquiryDetail(inquiryId).changeStatusByAdmin(admin, status)
    }

    private fun getMemberOrThrow(memberUid: UUID) =
        memberRepository.findByUid(memberUid) ?: throwError(ErrorType.MEMBER_NOT_FOUND)
}
