package com.elseeker.auth

import com.elseeker.auth.domain.vo.AppleNotificationType
import io.kotest.matchers.shouldBe
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test

/**
 * Apple 알림 타입 문자열 매핑 검증.
 *
 * 이 매핑이 어긋나면 **예외도 로그 오류도 없이** 탈퇴 알림이 전부 무시된다(UNSUPPORTED_TYPE).
 * 규정 준수가 조용히 깨지는 경로라서 문자열을 테스트로 고정한다.
 */
class AppleNotificationTypeTest {

    @Test
    @DisplayName("Apple 이 실제로 보내는 account-deleted 를 인식한다")
    fun findAccountDeleted() {
        AppleNotificationType.findByRawValue("account-deleted") shouldBe AppleNotificationType.ACCOUNT_DELETED
    }

    @Test
    @DisplayName("Apple 문서 표기인 account-delete 도 같은 타입으로 인식한다")
    fun findAccountDeleteAlias() {
        // Apple 문서는 account-delete, 운영 수신은 account-deleted 로 서로 다르다.
        AppleNotificationType.findByRawValue("account-delete") shouldBe AppleNotificationType.ACCOUNT_DELETED
    }

    @Test
    @DisplayName("나머지 세 가지 타입 문자열을 인식한다")
    fun findRemainingTypes() {
        AppleNotificationType.findByRawValue("consent-revoked") shouldBe AppleNotificationType.CONSENT_REVOKED
        AppleNotificationType.findByRawValue("email-enabled") shouldBe AppleNotificationType.EMAIL_ENABLED
        AppleNotificationType.findByRawValue("email-disabled") shouldBe AppleNotificationType.EMAIL_DISABLED
    }

    @Test
    @DisplayName("모르는 타입은 null 을 반환한다")
    fun findUnknownType() {
        AppleNotificationType.findByRawValue("some-future-event") shouldBe null
    }

    @Test
    @DisplayName("탈퇴로 이어지는 타입은 consent-revoked 와 account-deleted 뿐이다")
    fun requiresWithdrawal() {
        AppleNotificationType.entries.filter { it.requiresWithdrawal } shouldBe listOf(
            AppleNotificationType.CONSENT_REVOKED,
            AppleNotificationType.ACCOUNT_DELETED,
        )
    }
}
