package com.elseeker.qna.domain.model

import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.ServiceError
import com.elseeker.member.domain.model.Member
import com.elseeker.member.domain.vo.MemberRole
import com.elseeker.qna.domain.vo.ContactStatus
import com.elseeker.qna.domain.vo.InquiryCategory
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.nulls.shouldNotBeNull
import io.kotest.matchers.shouldBe
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test

@DisplayName("ContactMessage 도메인 단위테스트")
class ContactMessageTest {

    private val admin = Member(id = 99L, email = "admin@e.com", nickname = "admin", memberRole = MemberRole.ADMIN)
    private val user = Member(id = 2L, email = "user@e.com", nickname = "user", memberRole = MemberRole.USER)

    private fun newContact() = ContactMessage.create(
        category = InquiryCategory.ACCOUNT,
        title = "제목",
        content = "내용",
        guestEmail = "guest@e.com",
        guestName = "게스트",
    )

    @Test
    @DisplayName("생성 시 상태는 RECEIVED, 회신 없음")
    fun create() {
        val c = newContact()
        c.status shouldBe ContactStatus.RECEIVED
        c.replyContent shouldBe null
        c.repliedAt shouldBe null
    }

    @Test
    @DisplayName("관리자 회신 시 RECEIVED -> REPLIED + 회신 필드 설정")
    fun reply() {
        val c = newContact()
        c.replyByAdmin(admin, "회신합니다")
        c.status shouldBe ContactStatus.REPLIED
        c.replyContent shouldBe "회신합니다"
        c.repliedBy shouldBe admin
        c.repliedAt.shouldNotBeNull()
    }

    @Test
    @DisplayName("비관리자가 회신하면 ADMIN_ACCESS_DENIED")
    fun reply_byNonAdmin() {
        val c = newContact()
        shouldThrow<ServiceError> { c.replyByAdmin(user, "회신") }
            .errorType shouldBe ErrorType.ADMIN_ACCESS_DENIED
    }

    @Test
    @DisplayName("회신 후 REPLIED <-> CLOSED 토글 가능")
    fun changeStatus_toggle() {
        val c = newContact()
        c.replyByAdmin(admin, "회신")
        c.changeStatusByAdmin(admin, ContactStatus.CLOSED)
        c.status shouldBe ContactStatus.CLOSED
        c.changeStatusByAdmin(admin, ContactStatus.REPLIED)
        c.status shouldBe ContactStatus.REPLIED
    }

    @Test
    @DisplayName("회신 전(RECEIVED) 상태는 직접 상태 토글 불가 INVALID_STATUS_TRANSITION")
    fun changeStatus_fromReceivedDenied() {
        val c = newContact()
        shouldThrow<ServiceError> { c.changeStatusByAdmin(admin, ContactStatus.CLOSED) }
            .errorType shouldBe ErrorType.INVALID_STATUS_TRANSITION
        shouldThrow<ServiceError> { c.changeStatusByAdmin(admin, ContactStatus.REPLIED) }
            .errorType shouldBe ErrorType.INVALID_STATUS_TRANSITION
    }

    @Test
    @DisplayName("RECEIVED 로의 상태 변경은 INVALID_STATUS_TRANSITION")
    fun changeStatus_invalidTarget() {
        val c = newContact()
        c.replyByAdmin(admin, "회신")
        shouldThrow<ServiceError> { c.changeStatusByAdmin(admin, ContactStatus.RECEIVED) }
            .errorType shouldBe ErrorType.INVALID_STATUS_TRANSITION
    }
}
