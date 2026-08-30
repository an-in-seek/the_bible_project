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

/**
 * 키워드를 세어 통계에 반영한다. 값은 보내지 않는다 — 서버가 본문을 다시 세서 저장한다.
 */
data class AdminBibleWordStatKeywordRequest(
    val translationId: Long,
    val bookOrder: Int,
    val keyword: String,
)
