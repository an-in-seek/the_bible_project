package com.elseeker.auth

import com.elseeker.auth.application.component.AppleNotificationProcessor
import com.elseeker.auth.application.service.AppleNotificationService
import com.elseeker.auth.domain.model.APPLE_NOTIFICATION_AUDIT_UNIQUE_CONSTRAINT
import com.elseeker.common.security.oauth.apple.AppleNotification
import com.elseeker.common.security.oauth.apple.AppleNotificationEvent
import com.elseeker.common.security.oauth.apple.AppleNotificationVerifier
import io.kotest.assertions.throwables.shouldNotThrowAny
import io.kotest.assertions.throwables.shouldThrow
import io.mockk.every
import io.mockk.justRun
import io.mockk.mockk
import io.mockk.verify
import org.hibernate.exception.ConstraintViolationException
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.dao.DataIntegrityViolationException

/**
 * 알림 처리 중 제약 위반이 났을 때의 응답 판단 검증.
 *
 * 이 판단이 틀리면 **조용히 규정 준수가 깨진다.** 무엇이든 삼키고 200 을 돌려주면 Apple 은
 * 재시도하지 않으므로, 실제로는 탈퇴가 안 됐는데 성공한 것처럼 끝난다.
 */
class AppleNotificationServiceTest {

    private val appleNotificationVerifier = mockk<AppleNotificationVerifier>()
    private val appleNotificationProcessor = mockk<AppleNotificationProcessor>()

    private val sut = AppleNotificationService(
        appleNotificationVerifier = appleNotificationVerifier,
        appleNotificationProcessor = appleNotificationProcessor,
    )

    @Test
    @DisplayName("감사 유니크 제약 위반은 이미 처리된 알림이므로 성공으로 간주한다")
    fun swallowDuplicateAuditInsert() {
        // given — 같은 알림이 동시에 두 번 도착해 다른 트랜잭션이 먼저 기록을 남긴 경우
        givenVerified()
        every {
            appleNotificationProcessor.process(any(), any())
        } throws dataIntegrityViolation(APPLE_NOTIFICATION_AUDIT_UNIQUE_CONSTRAINT)

        // when & then — 재시도를 유도할 이유가 없다
        shouldNotThrowAny { sut.handleNotification(PAYLOAD) }
    }

    @Test
    @DisplayName("다른 제약 위반은 삼키지 않고 전파해 Apple 이 재시도하게 한다")
    fun rethrowUnrelatedConstraintViolation() {
        // given — 최초 탈퇴가 동시에 일어나 탈퇴 센티넬 계정 생성이 이메일 제약에 걸린 경우.
        // 이걸 삼키면 회원은 남고 감사 기록도 없는 채로 Apple 에 200 이 나가 영구 누락된다.
        givenVerified()
        every {
            appleNotificationProcessor.process(any(), any())
        } throws dataIntegrityViolation("uk_member_email")

        // when & then
        shouldThrow<DataIntegrityViolationException> { sut.handleNotification(PAYLOAD) }
    }

    @Test
    @DisplayName("제약명을 알 수 없으면 판별 불가이므로 전파한다")
    fun rethrowWhenConstraintNameIsUnknown() {
        // given — 삼켰다가 실제 실패를 놓치는 것보다 재시도시키는 쪽이 안전하다
        givenVerified()
        every {
            appleNotificationProcessor.process(any(), any())
        } throws dataIntegrityViolation(constraintName = null)

        // when & then
        shouldThrow<DataIntegrityViolationException> { sut.handleNotification(PAYLOAD) }
    }

    @Test
    @DisplayName("이벤트가 여러 건이면 각각 처리한다")
    fun processEachEvent() {
        // given
        every { appleNotificationVerifier.verify(PAYLOAD) } returns AppleNotification(
            jti = JTI,
            events = listOf(eventOf("email-disabled"), eventOf("consent-revoked")),
        )
        justRun { appleNotificationProcessor.process(any(), any()) }

        // when
        sut.handleNotification(PAYLOAD)

        // then
        verify(exactly = 2) { appleNotificationProcessor.process(JTI, any()) }
    }

    private fun givenVerified() {
        every { appleNotificationVerifier.verify(PAYLOAD) } returns AppleNotification(
            jti = JTI,
            events = listOf(eventOf("account-deleted")),
        )
    }

    /**
     * Spring 이 번역한 형태 그대로 만든다. 실제 경로에서도 Hibernate 의
     * [ConstraintViolationException] 이 원인 사슬에 실려 온다.
     */
    private fun dataIntegrityViolation(constraintName: String?): DataIntegrityViolationException {
        val hibernateCause = mockk<ConstraintViolationException>(relaxed = true) {
            every { this@mockk.constraintName } returns constraintName
        }
        return DataIntegrityViolationException("constraint violation", hibernateCause)
    }

    private fun eventOf(type: String) = AppleNotificationEvent(
        type = type,
        sub = APPLE_SUB,
        email = null,
        isPrivateEmail = null,
        occurredAt = null,
    )

    companion object {
        private const val PAYLOAD = "signed.jws.payload"
        private const val JTI = "0e0e0e0e-1111-2222-3333-444444444444"
        private const val APPLE_SUB = "001234.abcdef0123456789.1234"
    }
}
