package com.elseeker.qna.application.service

import com.elseeker.common.adapter.input.api.response.PageResponse
import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.throwError
import com.elseeker.member.adapter.output.jpa.MemberRepository
import com.elseeker.qna.adapter.input.api.client.request.CreateInquiryRequest
import com.elseeker.qna.adapter.input.api.client.request.UpdateInquiryRequest
import com.elseeker.qna.adapter.input.api.client.response.InquiryDetailResponse
import com.elseeker.qna.adapter.input.api.client.response.InquirySummaryResponse
import com.elseeker.qna.adapter.output.jpa.InquiryRepository
import com.elseeker.qna.application.mapper.toDetail
import com.elseeker.qna.application.mapper.toSummary
import com.elseeker.qna.domain.model.Inquiry
import com.elseeker.qna.domain.vo.InquiryStatus
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

@Service
class InquiryService(
    private val inquiryRepository: InquiryRepository,
    private val memberRepository: MemberRepository,
) {

    @Transactional
    fun createInquiry(memberUid: UUID, req: CreateInquiryRequest): InquiryDetailResponse {
        val member = getMemberOrThrow(memberUid)
        val saved = inquiryRepository.save(
            Inquiry.create(member, req.category, req.title, req.content)
        )
        return saved.toDetail(viewerId = member.id)
    }

    @Transactional(readOnly = true)
    fun getMyInquiries(memberUid: UUID, status: InquiryStatus?, pageable: Pageable): PageResponse<InquirySummaryResponse> {
        val member = getMemberOrThrow(memberUid)
        val page = inquiryRepository.findPageByAuthorId(member.id!!, InquiryStatus.DELETED, status, pageable)
        return PageResponse.from(page) { it.toSummary() }
    }

    @Transactional(readOnly = true)
    fun getMyInquiryDetail(memberUid: UUID, inquiryId: Long): InquiryDetailResponse {
        val member = getMemberOrThrow(memberUid)
        val inquiry = inquiryRepository.findByIdAndAuthorId(inquiryId, member.id!!, InquiryStatus.DELETED)
            ?: throwError(ErrorType.INQUIRY_NOT_FOUND, "inquiryId=$inquiryId")
        return inquiry.toDetail(viewerId = member.id)
    }

    @Transactional
    fun updateInquiry(memberUid: UUID, inquiryId: Long, req: UpdateInquiryRequest): InquiryDetailResponse {
        val member = getMemberOrThrow(memberUid)
        val inquiry = inquiryRepository.findByIdAndAuthorId(inquiryId, member.id!!, InquiryStatus.DELETED)
            ?: throwError(ErrorType.INQUIRY_NOT_FOUND, "inquiryId=$inquiryId")
        inquiry.updateByAuthor(member, req.category, req.title, req.content)   // RECEIVED 가드 내장
        return inquiry.toDetail(viewerId = member.id)
    }

    @Transactional
    fun deleteInquiry(memberUid: UUID, inquiryId: Long) {
        val member = getMemberOrThrow(memberUid)
        val inquiry = inquiryRepository.findByIdAndAuthorId(inquiryId, member.id!!, InquiryStatus.DELETED)
            ?: throwError(ErrorType.INQUIRY_NOT_FOUND, "inquiryId=$inquiryId")
        inquiry.deleteByAuthor(member)   // soft-delete, RECEIVED 가드 내장
    }

    private fun getMemberOrThrow(memberUid: UUID) =
        memberRepository.findByUid(memberUid) ?: throwError(ErrorType.MEMBER_NOT_FOUND)
}
