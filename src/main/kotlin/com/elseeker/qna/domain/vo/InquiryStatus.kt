package com.elseeker.qna.domain.vo

enum class InquiryStatus(val title: String) {
    RECEIVED("접수"),
    ANSWERED("답변완료"),
    CLOSED("종료"),
    DELETED("삭제");

    /** 회원에게 노출되는 상태(삭제 제외). */
    fun isVisibleToMember(): Boolean = this != DELETED

    /** 회원이 수정/삭제할 수 있는 상태(답변 전). */
    fun isModifiable(): Boolean = this == RECEIVED
}
