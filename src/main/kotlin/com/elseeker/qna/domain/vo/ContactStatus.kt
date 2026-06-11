package com.elseeker.qna.domain.vo

/**
 * 공개(비로그인) 문의 메일의 처리 상태.
 *
 * 회원 1:1 문의([InquiryStatus])와 달리 작성자 계정이 없으므로 답변은 수동 회신(메일)으로 전달되며,
 * 상태는 접수 → 회신완료 → 종료의 단순 흐름만 갖는다.
 */
enum class ContactStatus(val title: String) {
    RECEIVED("접수"),
    REPLIED("회신완료"),
    CLOSED("종료");
}
