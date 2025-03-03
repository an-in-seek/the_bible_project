package com.seek.thebible.application.exception

import org.springframework.boot.logging.LogLevel
import org.springframework.http.HttpStatus

enum class ErrorType(
    val status: HttpStatus,
    val message: String,
    val logLevel: LogLevel
) {
    TRANSLATION_NOT_FOUND(HttpStatus.NOT_FOUND, "번역본을 찾을 수 없습니다.", LogLevel.WARN),
    BOOK_NOT_FOUND(HttpStatus.NOT_FOUND, "성경을 찾을 수 없습니다.", LogLevel.WARN),
    CHAPTER_NOT_FOUND(HttpStatus.NOT_FOUND, "장을 찾을 수 없습니다.", LogLevel.WARN),
    INVALID_PARAMETER(HttpStatus.BAD_REQUEST, "잘못된 요청 파라미터입니다.", LogLevel.INFO),
    SEARCH_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "검색 처리 중 오류가 발생했습니다.", LogLevel.ERROR),
    DB_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "데이터베이스 오류가 발생했습니다.", LogLevel.ERROR),

    // 필요에 따라 확장
    UNKNOWN(HttpStatus.INTERNAL_SERVER_ERROR, "알 수 없는 오류가 발생했습니다.", LogLevel.ERROR)
}
