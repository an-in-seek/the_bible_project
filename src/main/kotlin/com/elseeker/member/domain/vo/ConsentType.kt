package com.elseeker.member.domain.vo

/**
 * 회원가입 시 받는 동의 항목 유형.
 *
 * - [TERMS]: 서비스 이용약관 동의 (필수)
 * - [PRIVACY]: 개인정보 수집 및 이용 동의 (필수)
 * - [AGE_OVER_14]: 만 14세 이상 확인 (필수)
 *
 * 확장 예: MARKETING(선택) — 마케팅 기능 도입 시 추가.
 */
enum class ConsentType {
    TERMS,
    PRIVACY,
    AGE_OVER_14,
}
