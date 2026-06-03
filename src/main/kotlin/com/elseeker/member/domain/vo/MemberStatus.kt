package com.elseeker.member.domain.vo

/**
 * 회원 계정 상태.
 *
 * - [PENDING_CONSENT]: OAuth 인증은 마쳤으나 약관/개인정보/연령 동의가 완료되지 않은 상태.
 *   동의 관련 경로 외 서비스 접근이 차단된다.
 * - [ACTIVE]: 동의를 완료하여 정상적으로 서비스를 이용할 수 있는 상태.
 */
enum class MemberStatus {
    PENDING_CONSENT,
    ACTIVE,
}
