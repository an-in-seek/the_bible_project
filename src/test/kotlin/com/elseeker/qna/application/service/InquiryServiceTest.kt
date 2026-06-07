package com.elseeker.qna.application.service

import com.elseeker.common.IntegrationTest
import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.ServiceError
import com.elseeker.member.adapter.output.jpa.MemberRepository
import com.elseeker.member.domain.model.Member
import com.elseeker.member.domain.vo.MemberRole
import com.elseeker.qna.adapter.input.api.client.request.CreateInquiryRequest
import com.elseeker.qna.adapter.input.api.client.request.UpdateInquiryRequest
import com.elseeker.qna.adapter.output.jpa.InquiryRepository
import com.elseeker.qna.domain.vo.InquiryCategory
import com.elseeker.qna.domain.vo.InquiryStatus
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.shouldBe
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.data.domain.PageRequest

@DisplayName("Q&A(1:1 문의) 통합테스트")
class InquiryServiceTest @Autowired constructor(
    private val inquiryService: InquiryService,
    private val adminInquiryService: AdminInquiryService,
    private val inquiryRepository: InquiryRepository,
    private val memberRepository: MemberRepository,
) : IntegrationTest() {

    private val pageable = PageRequest.of(0, 20)

    private fun saveAdmin() = memberRepository.save(
        Member.create(email = "admin@e.com", nickname = "관리자", profileImageUrl = null, memberRole = MemberRole.ADMIN)
    )

    private fun saveOtherUser() = memberRepository.save(
        Member.create(email = "other@e.com", nickname = "다른회원", profileImageUrl = null, memberRole = MemberRole.USER)
    )

    private fun createRequest() =
        CreateInquiryRequest(category = InquiryCategory.ACCOUNT, title = "로그인 문의", content = "로그인이 안 됩니다")

    @Test
    @DisplayName("문의 등록 후 내 목록에 RECEIVED 로 노출된다")
    fun create_andList() {
        inquiryService.createInquiry(member.uid, createRequest())

        val page = inquiryService.getMyInquiries(member.uid, null, pageable)
        page.content shouldHaveSize 1
        page.content[0].status shouldBe InquiryStatus.RECEIVED
        page.content[0].isAnswered shouldBe false
    }

    @Test
    @DisplayName("다른 회원의 문의는 상세 조회 시 INQUIRY_NOT_FOUND")
    fun detail_otherMemberDenied() {
        val created = inquiryService.createInquiry(member.uid, createRequest())
        val other = saveOtherUser()

        shouldThrow<ServiceError> { inquiryService.getMyInquiryDetail(other.uid, created.id) }
            .errorType shouldBe ErrorType.INQUIRY_NOT_FOUND
    }

    @Test
    @DisplayName("관리자 답변 후 작성자 상세에 답변이 보이고 상태가 ANSWERED")
    fun answer_thenVisibleToAuthor() {
        val created = inquiryService.createInquiry(member.uid, createRequest())
        val admin = saveAdmin()

        adminInquiryService.answerInquiry(admin.uid, created.id, "비밀번호를 재설정해 주세요")

        val detail = inquiryService.getMyInquiryDetail(member.uid, created.id)
        detail.status shouldBe InquiryStatus.ANSWERED
        detail.answerContent shouldBe "비밀번호를 재설정해 주세요"
        detail.isAuthor shouldBe true
    }

    @Test
    @DisplayName("답변 후 작성자 수정 시 INQUIRY_ALREADY_ANSWERED")
    fun update_afterAnswered() {
        val created = inquiryService.createInquiry(member.uid, createRequest())
        val admin = saveAdmin()
        adminInquiryService.answerInquiry(admin.uid, created.id, "답변")

        shouldThrow<ServiceError> {
            inquiryService.updateInquiry(
                member.uid, created.id,
                UpdateInquiryRequest(InquiryCategory.BUG, "수정", "수정내용"),
            )
        }.errorType shouldBe ErrorType.INQUIRY_ALREADY_ANSWERED
    }

    @Test
    @DisplayName("회원이 문의를 삭제하면 내 목록·관리자 목록에서 제외된다")
    fun delete_excludedFromLists() {
        val created = inquiryService.createInquiry(member.uid, createRequest())

        inquiryService.deleteInquiry(member.uid, created.id)

        inquiryService.getMyInquiries(member.uid, null, pageable).content.shouldHaveSize(0)
        adminInquiryService.getAdminInquiries(null, null, null, null, pageable).content.shouldHaveSize(0)
    }

    @Test
    @DisplayName("관리자 목록은 상태/카테고리 필터로 조회된다")
    fun adminList_filter() {
        inquiryService.createInquiry(member.uid, createRequest())
        inquiryService.createInquiry(
            member.uid,
            CreateInquiryRequest(InquiryCategory.GAME, "게임 오류", "퀴즈가 멈춰요"),
        )

        adminInquiryService.getAdminInquiries(InquiryStatus.RECEIVED, null, null, null, pageable)
            .content.shouldHaveSize(2)
        adminInquiryService.getAdminInquiries(null, InquiryCategory.GAME, null, null, pageable)
            .content.shouldHaveSize(1)
        adminInquiryService.getAdminInquiries(null, null, "게임", null, pageable)
            .content.shouldHaveSize(1)
    }

    @Test
    @DisplayName("답변 없는 문의의 상태 변경은 실패한다")
    fun changeStatus_withoutAnswer() {
        val created = inquiryService.createInquiry(member.uid, createRequest())
        val admin = saveAdmin()

        shouldThrow<ServiceError> {
            adminInquiryService.changeStatus(admin.uid, created.id, InquiryStatus.CLOSED)
        }.errorType shouldBe ErrorType.INQUIRY_NOT_ANSWERED
    }
}
