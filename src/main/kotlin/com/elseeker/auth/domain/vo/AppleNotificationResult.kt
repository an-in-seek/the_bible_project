package com.elseeker.auth.domain.vo

/**
 * Apple 알림 한 건의 처리 결과. 감사 테이블에 남겨 나중에 왜 그렇게 처리됐는지 설명할 수 있게 한다.
 */
enum class AppleNotificationResult {

    /**
     * Apple 연동만 해제했다. 다른 소셜 연동이 남아 있어 회원은 유지된다.
     *
     * `consent-revoked` 는 "**Apple** 인증을 철회한다"는 뜻이지 "서비스 계정을 지워달라"가 아니다.
     * Google 로 가입한 뒤 Apple 을 추가 연동한 사용자의 데이터를 통째로 지우면 안 된다.
     */
    APPLE_ACCOUNT_UNLINKED,

    /** 마지막 남은 연동이라 로그인 수단이 사라지므로 회원까지 탈퇴 처리했다. */
    MEMBER_WITHDRAWN,

    /** 탈퇴 대상 이벤트였으나 해당 Apple 계정에 연결된 회원이 없었다(이미 탈퇴했거나 미가입). */
    MEMBER_NOT_FOUND,

    /** 회원 상태를 바꾸지 않는 이벤트였다(이메일 전달 설정 변경 등). */
    NO_ACTION,

    /** 이 서버가 아직 모르는 이벤트 타입이라 기록만 했다. */
    UNSUPPORTED_TYPE,
}
