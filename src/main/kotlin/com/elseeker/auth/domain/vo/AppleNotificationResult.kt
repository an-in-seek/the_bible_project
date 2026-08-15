package com.elseeker.auth.domain.vo

/**
 * Apple 알림 한 건의 처리 결과. 감사 테이블에 남겨 나중에 왜 그렇게 처리됐는지 설명할 수 있게 한다.
 */
enum class AppleNotificationResult {

    /** 연결된 회원을 탈퇴 처리했다. */
    MEMBER_WITHDRAWN,

    /** 탈퇴 대상 이벤트였으나 해당 Apple 계정에 연결된 회원이 없었다(이미 탈퇴했거나 미가입). */
    MEMBER_NOT_FOUND,

    /** 회원 상태를 바꾸지 않는 이벤트였다(이메일 전달 설정 변경 등). */
    NO_ACTION,

    /** 이 서버가 아직 모르는 이벤트 타입이라 기록만 했다. */
    UNSUPPORTED_TYPE,
}
