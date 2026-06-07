package com.elseeker.qna.domain.model

import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.ServiceError
import com.elseeker.member.domain.model.Member
import com.elseeker.member.domain.vo.MemberRole
import com.elseeker.qna.domain.vo.InquiryCategory
import com.elseeker.qna.domain.vo.InquiryStatus
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.nulls.shouldNotBeNull
import io.kotest.matchers.shouldBe
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test

@DisplayName("Inquiry 도메인 단위테스트")
class InquiryTest {

    private val author = Member(id = 1L, email = "author@e.com", nickname = "author", memberRole = MemberRole.USER)
    private val other = Member(id = 2L, email = "other@e.com", nickname = "other", memberRole = MemberRole.USER)
    private val admin = Member(id = 99L, email = "admin@e.com", nickname = "admin", memberRole = MemberRole.ADMIN)

    private fun newInquiry() =
        Inquiry.create(author = author, category = InquiryCategory.ACCOUNT, title = "제목", content = "내용")

    @Test
    @DisplayName("생성 시 상태는 RECEIVED, 답변 없음")
    fun create() {
        val inquiry = newInquiry()
        inquiry.status shouldBe InquiryStatus.RECEIVED
        inquiry.hasAnswer shouldBe false
        inquiry.isAnswered shouldBe false
    }

    @Test
    @DisplayName("관리자 답변 시 RECEIVED -> ANSWERED + 답변 필드 설정")
    fun answer() {
        val inquiry = newInquiry()
        inquiry.answer(admin, "답변입니다")
        inquiry.status shouldBe InquiryStatus.ANSWERED
        inquiry.answerContent shouldBe "답변입니다"
        inquiry.answeredBy shouldBe admin
        inquiry.answeredAt.shouldNotBeNull()
        inquiry.hasAnswer shouldBe true
    }

    @Test
    @DisplayName("비관리자가 답변하면 ADMIN_ACCESS_DENIED")
    fun answer_byNonAdmin() {
        val inquiry = newInquiry()
        shouldThrow<ServiceError> { inquiry.answer(other, "답변") }
            .errorType shouldBe ErrorType.ADMIN_ACCESS_DENIED
    }

    @Test
    @DisplayName("이미 답변된 문의에 다시 answer() 하면 INVALID_STATUS_TRANSITION")
    fun answer_whenNotReceived() {
        val inquiry = newInquiry()
        inquiry.answer(admin, "첫 답변")
        shouldThrow<ServiceError> { inquiry.answer(admin, "두번째") }
            .errorType shouldBe ErrorType.INVALID_STATUS_TRANSITION
    }

    @Test
    @DisplayName("작성자는 답변 전 문의를 수정할 수 있다")
    fun updateByAuthor() {
        val inquiry = newInquiry()
        inquiry.updateByAuthor(author, InquiryCategory.BUG, "수정제목", "수정내용")
        inquiry.category shouldBe InquiryCategory.BUG
        inquiry.title shouldBe "수정제목"
        inquiry.content shouldBe "수정내용"
    }

    @Test
    @DisplayName("작성자가 아니면 수정 시 INQUIRY_ACCESS_DENIED")
    fun updateByAuthor_byOther() {
        val inquiry = newInquiry()
        shouldThrow<ServiceError> { inquiry.updateByAuthor(other, InquiryCategory.ETC, "t", "c") }
            .errorType shouldBe ErrorType.INQUIRY_ACCESS_DENIED
    }

    @Test
    @DisplayName("답변 후에는 작성자도 수정 불가 INQUIRY_ALREADY_ANSWERED")
    fun updateByAuthor_afterAnswered() {
        val inquiry = newInquiry()
        inquiry.answer(admin, "답변")
        shouldThrow<ServiceError> { inquiry.updateByAuthor(author, InquiryCategory.ETC, "t", "c") }
            .errorType shouldBe ErrorType.INQUIRY_ALREADY_ANSWERED
    }

    @Test
    @DisplayName("작성자는 답변 전 문의를 삭제(soft)할 수 있다")
    fun deleteByAuthor() {
        val inquiry = newInquiry()
        inquiry.deleteByAuthor(author)
        inquiry.status shouldBe InquiryStatus.DELETED
    }

    @Test
    @DisplayName("답변 후에는 삭제 불가 INQUIRY_ALREADY_ANSWERED")
    fun deleteByAuthor_afterAnswered() {
        val inquiry = newInquiry()
        inquiry.answer(admin, "답변")
        shouldThrow<ServiceError> { inquiry.deleteByAuthor(author) }
            .errorType shouldBe ErrorType.INQUIRY_ALREADY_ANSWERED
    }

    @Test
    @DisplayName("답변된 문의는 종료(CLOSED) 및 재개(ANSWERED) 가능")
    fun changeStatus_closeAndReopen() {
        val inquiry = newInquiry()
        inquiry.answer(admin, "답변")
        inquiry.changeStatusByAdmin(admin, InquiryStatus.CLOSED)
        inquiry.status shouldBe InquiryStatus.CLOSED
        inquiry.changeStatusByAdmin(admin, InquiryStatus.ANSWERED)
        inquiry.status shouldBe InquiryStatus.ANSWERED
    }

    @Test
    @DisplayName("답변 없는 문의의 상태 변경은 INQUIRY_NOT_ANSWERED")
    fun changeStatus_whenNoAnswer() {
        val inquiry = newInquiry()
        shouldThrow<ServiceError> { inquiry.changeStatusByAdmin(admin, InquiryStatus.CLOSED) }
            .errorType shouldBe ErrorType.INQUIRY_NOT_ANSWERED
    }

    @Test
    @DisplayName("RECEIVED/DELETED 로의 상태 변경은 INVALID_STATUS_TRANSITION")
    fun changeStatus_invalidTarget() {
        val inquiry = newInquiry()
        inquiry.answer(admin, "답변")
        shouldThrow<ServiceError> { inquiry.changeStatusByAdmin(admin, InquiryStatus.RECEIVED) }
            .errorType shouldBe ErrorType.INVALID_STATUS_TRANSITION
        shouldThrow<ServiceError> { inquiry.changeStatusByAdmin(admin, InquiryStatus.DELETED) }
            .errorType shouldBe ErrorType.INVALID_STATUS_TRANSITION
    }

    @Test
    @DisplayName("답변 전 updateAnswer 는 INQUIRY_NOT_ANSWERED")
    fun updateAnswer_beforeAnswer() {
        val inquiry = newInquiry()
        shouldThrow<ServiceError> { inquiry.updateAnswer(admin, "수정") }
            .errorType shouldBe ErrorType.INQUIRY_NOT_ANSWERED
    }

    @Test
    @DisplayName("답변 후 updateAnswer 로 본문 수정")
    fun updateAnswer() {
        val inquiry = newInquiry()
        inquiry.answer(admin, "원답변")
        inquiry.updateAnswer(admin, "수정답변")
        inquiry.answerContent shouldBe "수정답변"
        inquiry.status shouldBe InquiryStatus.ANSWERED
    }
}
