package com.elseeker.bible.adapter.input.api.admin.request

/** 관리자가 값을 직접 세팅한다. 이 순간부터 재계산이 건드리지 않는다(source = MANUAL). */
data class AdminBibleWordStatCreateRequest(
    val translationId: Long,
    val bookOrder: Int,
    /** 0 이면 책 전체 집계 */
    val chapterNumber: Int,
    val bibleWordId: Long,
    val wordCount: Int,
)

data class AdminBibleWordStatUpdateRequest(
    val wordCount: Int,
)
