package com.elseeker.qna.domain.vo

enum class InquiryCategory(val title: String) {
    ACCOUNT("계정/로그인"),
    CONTENT("성경/콘텐츠"),
    GAME("게임"),
    BUG("오류/버그"),
    SUGGESTION("제안/건의"),
    ETC("기타");
}
