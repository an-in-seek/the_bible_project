package com.elseeker.common.policy

/**
 * 약관/개인정보처리방침의 현재 버전.
 *
 * 동의 이력([com.elseeker.member.domain.model.MemberConsentAudit])에 기록되어,
 * 향후 약관 개정 시 버전 비교로 재동의 유도에 활용할 수 있다.
 *
 * 값은 약관/방침 화면의 **최종 개정일** 기준으로 관리한다.
 */
object PolicyVersion {
    const val TERMS = "2026-06-03"
    const val PRIVACY = "2026-06-03"

    /** 연령 확인은 약관 버전과 무관하므로 고정 센티넬을 사용한다. */
    const val AGE_SENTINEL = "N/A"
}
