package com.elseeker.qna.application.service

import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.ServiceError
import com.elseeker.qna.adapter.input.api.client.request.CreateContactRequest
import com.elseeker.qna.adapter.output.jpa.ContactMessageRepository
import com.elseeker.qna.application.component.ContactRateLimiter
import com.elseeker.qna.domain.model.ContactMessage
import com.elseeker.qna.domain.vo.InquiryCategory
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.shouldBe
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test

@DisplayName("공개 문의하기 서비스 단위테스트 (Docker 불필요)")
class ContactServiceTest {

    private val repository = mockk<ContactMessageRepository>()
    private val rateLimiter = mockk<ContactRateLimiter>()
    private val service = ContactService(repository, rateLimiter)

    private val clientIp = "1.2.3.4"

    private fun request(
        website: String? = null,
        formRenderedAt: Long? = null,
        guestName: String? = "홍길동",
        guestEmail: String = "user@example.com",
    ) = CreateContactRequest(
        category = InquiryCategory.ACCOUNT,
        title = "로그인이 안 됩니다",
        content = "소셜 로그인이 계속 실패합니다.",
        guestEmail = guestEmail,
        guestName = guestName,
        website = website,
        formRenderedAt = formRenderedAt,
    )

    @Test
    @DisplayName("정상 요청은 ContactMessage 로 저장된다")
    fun create_persists() {
        every { rateLimiter.tryAcquire(any(), any()) } returns true
        val saved = slot<ContactMessage>()
        // 제네릭 save 는 verify 시점 capture 에서 ClassCast 가 나므로 stub 시점에 캡처한다.
        every { repository.save(capture(saved)) } answers { firstArg() }

        service.createContact(request(), clientIp)

        saved.isCaptured shouldBe true
        saved.captured.guestEmail shouldBe "user@example.com"
        saved.captured.title shouldBe "로그인이 안 됩니다"
    }

    @Test
    @DisplayName("허니팟(website)이 채워지면 조용히 폐기되어 저장되지 않는다")
    fun honeypot_dropped() {
        service.createContact(request(website = "http://spam.example"), clientIp)

        verify(exactly = 0) { repository.save(any()) }
        verify(exactly = 0) { rateLimiter.tryAcquire(any(), any()) }
    }

    @Test
    @DisplayName("폼 제출이 너무 빠르면(봇) 조용히 폐기된다")
    fun tooFast_dropped() {
        // 방금 렌더된 폼(경과시간 ~0ms) → MIN_FILL_MILLIS 미만이라 폐기
        service.createContact(request(formRenderedAt = System.currentTimeMillis()), clientIp)

        verify(exactly = 0) { repository.save(any()) }
    }

    @Test
    @DisplayName("rate limit 초과 시 CONTACT_RATE_LIMITED 예외")
    fun rateLimited_throws() {
        every { rateLimiter.tryAcquire(any(), any()) } returns false

        shouldThrow<ServiceError> {
            service.createContact(request(), clientIp)
        }.errorType shouldBe ErrorType.CONTACT_RATE_LIMITED

        verify(exactly = 0) { repository.save(any()) }
    }
}
