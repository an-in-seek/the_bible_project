package com.elseeker.auth.domain.vo

/**
 * Apple 서버-대-서버 알림의 이벤트 타입.
 *
 * Apple 이 새 타입을 추가해도 수신 자체가 실패하면 안 되므로, 알 수 없는 값은 이 enum 으로
 * 변환하지 않고 원본 문자열 그대로 감사 테이블에 기록한다. ([findByRawValue] 가 `null` 을 반환)
 */
enum class AppleNotificationType(
    val rawValue: String,
    private val aliases: Set<String> = emptySet(),
) {

    /** 비공개 이메일 릴레이 전달이 켜졌다. */
    EMAIL_ENABLED("email-enabled"),

    /** 비공개 이메일 릴레이 전달이 꺼졌다. 이 주소로 보내는 메일은 더 이상 도달하지 않는다. */
    EMAIL_DISABLED("email-disabled"),

    /** 사용자가 Apple ID 설정에서 이 앱의 접근 권한을 철회했다. */
    CONSENT_REVOKED("consent-revoked"),

    /**
     * Apple 계정 자체가 삭제됐다.
     *
     * ⚠️ Apple **문서는 `account-delete`, 실제 운영에서는 `account-deleted`** 가 온다고 보고돼 있다.
     * (Apple Developer Forums #808898 에 discrepancy 로 등록된 상태)
     * 한쪽만 받으면 삭제 알림이 전부 [AppleNotificationResult.UNSUPPORTED_TYPE] 으로 흘러
     * **아무도 탈퇴 처리되지 않는데 에러도 나지 않는다.** 그래서 둘 다 받는다.
     */
    ACCOUNT_DELETED("account-deleted", aliases = setOf("account-delete")),
    ;

    /**
     * 회원 탈퇴까지 이어져야 하는 이벤트인지 여부.
     *
     * 두 경우 모두 사용자가 더 이상 이 서비스와의 연결을 원하지 않는다는 Apple 의 통보이므로,
     * 개인정보를 계속 보관할 근거가 사라진다.
     */
    val requiresWithdrawal: Boolean
        get() = this == CONSENT_REVOKED || this == ACCOUNT_DELETED

    companion object {
        fun findByRawValue(rawValue: String): AppleNotificationType? =
            entries.firstOrNull { it.rawValue == rawValue || rawValue in it.aliases }
    }
}
