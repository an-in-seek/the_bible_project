package com.elseeker.common.domain

import org.springframework.boot.logging.LogLevel
import org.springframework.http.HttpStatus

enum class ErrorType(
    val status: HttpStatus,
    val message: String,
    val logLevel: LogLevel
) {
    // 400
    INVALID_PARAMETER(HttpStatus.BAD_REQUEST, "잘못된 요청 파라미터입니다.", LogLevel.WARN),
    PROVIDER_MISMATCH(HttpStatus.BAD_REQUEST, "해당 계정은 이미 가입되어 있습니다.", LogLevel.WARN),
    PROVIDER_USER_ID_MISMATCH(HttpStatus.BAD_REQUEST, "이미 가입된 계정과 사용자 식별자가 일치하지 않습니다.", LogLevel.WARN),
    OAUTH_EMAIL_MISSING(HttpStatus.BAD_REQUEST, "소셜 로그인 이메일 정보를 찾을 수 없습니다.", LogLevel.WARN),
    OAUTH_PROVIDER_USER_ID_MISSING(HttpStatus.BAD_REQUEST, "소셜 로그인 사용자 식별 정보를 찾을 수 없습니다.", LogLevel.WARN),
    OAUTH_ACCOUNT_ALREADY_LINKED(HttpStatus.CONFLICT, "해당 소셜 계정은 이미 다른 사용자에 연결되어 있습니다.", LogLevel.WARN),
    OAUTH_ACCOUNT_NOT_FOUND(HttpStatus.NOT_FOUND, "소셜 계정을 찾을 수 없습니다.", LogLevel.WARN),
    OAUTH_LINK_REQUIRED(HttpStatus.BAD_REQUEST, "연동 전용 요청입니다. 마이페이지에서 연동을 진행해 주세요.", LogLevel.WARN),
    SOCIAL_LOGIN_INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "소셜 로그인 토큰이 유효하지 않습니다.", LogLevel.WARN),
    SOCIAL_LOGIN_PROVIDER_NOT_SUPPORTED(HttpStatus.BAD_REQUEST, "해당 소셜 로그인 방식은 지원하지 않습니다.", LogLevel.WARN),
    SOCIAL_LOGIN_EMAIL_NOT_VERIFIED(HttpStatus.CONFLICT, "이메일이 인증되지 않아 기존 계정과 연결할 수 없습니다.", LogLevel.WARN),
    REQUIRED_NICKNAME(HttpStatus.BAD_REQUEST, "닉네임은 필수입니다.", LogLevel.WARN),
    INVALID_NICKNAME_FORMAT(HttpStatus.BAD_REQUEST, "닉네임은 공백을 포함할 수 없습니다.", LogLevel.WARN),
    NICKNAME_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 사용 중인 닉네임입니다.", LogLevel.WARN),
    SESSION_ALREADY_ENDED(HttpStatus.BAD_REQUEST, "이미 종료된 세션입니다.", LogLevel.WARN),
    INVALID_SESSION_KEY(HttpStatus.BAD_REQUEST, "잘못된 세션 키입니다.", LogLevel.WARN),
    CONSENT_REQUIRED(HttpStatus.BAD_REQUEST, "필수 약관에 모두 동의해야 합니다.", LogLevel.WARN),

    // 404
    TRANSLATION_NOT_FOUND(HttpStatus.NOT_FOUND, "번역본을 찾을 수 없습니다.", LogLevel.WARN),
    BOOK_NOT_FOUND(HttpStatus.NOT_FOUND, "성경을 찾을 수 없습니다.", LogLevel.WARN),
    BOOK_DESCRIPTION_NOT_FOUND(HttpStatus.NOT_FOUND, "성경 개요를 찾을 수 없습니다.", LogLevel.WARN),
    CHAPTER_NOT_FOUND(HttpStatus.NOT_FOUND, "장을 찾을 수 없습니다.", LogLevel.WARN),
    DICTIONARY_NOT_FOUND(HttpStatus.NOT_FOUND, "성경 사전 용어를 찾을 수 없습니다.", LogLevel.WARN),
    QUIZ_STAGE_NOT_FOUND(HttpStatus.NOT_FOUND, "퀴즈 스테이지를 찾을 수 없습니다.", LogLevel.WARN),
    QUIZ_QUESTION_NOT_FOUND(HttpStatus.NOT_FOUND, "퀴즈 문제를 찾을 수 없습니다.", LogLevel.WARN),
    OX_QUIZ_STAGE_NOT_FOUND(HttpStatus.NOT_FOUND, "O/X 퀴즈 스테이지를 찾을 수 없습니다.", LogLevel.WARN),
    OX_QUIZ_QUESTION_NOT_FOUND(HttpStatus.NOT_FOUND, "O/X 퀴즈 문제를 찾을 수 없습니다.", LogLevel.WARN),
    OX_QUIZ_ATTEMPT_NOT_FOUND(HttpStatus.NOT_FOUND, "진행 중인 O/X 퀴즈 시도를 찾을 수 없습니다.", LogLevel.WARN),
    OX_QUIZ_QUESTION_MISMATCH(HttpStatus.BAD_REQUEST, "해당 스테이지에 속하지 않는 문제입니다.", LogLevel.WARN),
    OX_QUIZ_ALREADY_ANSWERED(HttpStatus.BAD_REQUEST, "이미 답변한 문제입니다.", LogLevel.WARN),
    MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "회원을 찾을 수 없습니다.", LogLevel.WARN),
    SESSION_NOT_FOUND(HttpStatus.NOT_FOUND, "세션을 찾을 수 없습니다.", LogLevel.WARN),
    VERSE_NOT_FOUND(HttpStatus.NOT_FOUND, "구절을 찾을 수 없습니다.", LogLevel.WARN),
    POST_NOT_FOUND(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다.", LogLevel.WARN),
    COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "댓글을 찾을 수 없습니다.", LogLevel.WARN),
    REPORT_POST_ALREADY_EXISTS(HttpStatus.BAD_REQUEST, "이미 신고한 게시글입니다.", LogLevel.WARN),
    REPORT_COMMENT_ALREADY_EXISTS(HttpStatus.BAD_REQUEST, "이미 신고한 댓글입니다.", LogLevel.WARN),
    REPORT_SELF_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "본인이 작성한 글은 신고할 수 없습니다.", LogLevel.WARN),
    REACTION_ALREADY_EXISTS(HttpStatus.BAD_REQUEST, "이미 반응한 게시글입니다.", LogLevel.WARN),
    REACTION_NOT_FOUND(HttpStatus.NOT_FOUND, "반응을 찾을 수 없습니다.", LogLevel.WARN),
    INVALID_STATUS_TRANSITION(HttpStatus.BAD_REQUEST, "허용되지 않는 상태 전환입니다.", LogLevel.WARN),
    CANNOT_DELETE_PUBLISHED_PUZZLE(HttpStatus.BAD_REQUEST, "게시된 퍼즐은 삭제할 수 없습니다. 비공개(ARCHIVED) 처리하세요.", LogLevel.WARN),
    DUPLICATE_CLUE_ENTRY(HttpStatus.CONFLICT, "동일한 단서 번호와 방향 조합이 이미 존재합니다.", LogLevel.WARN),
    PUZZLE_NOT_AVAILABLE(HttpStatus.BAD_REQUEST, "현재 플레이할 수 없는 퍼즐입니다.", LogLevel.WARN),
    WORD_PUZZLE_NOT_FOUND(HttpStatus.NOT_FOUND, "퍼즐을 찾을 수 없습니다.", LogLevel.WARN),
    WORD_PUZZLE_ATTEMPT_NOT_FOUND(HttpStatus.NOT_FOUND, "퍼즐 시도를 찾을 수 없습니다.", LogLevel.WARN),
    WORD_PUZZLE_ENTRY_NOT_FOUND(HttpStatus.NOT_FOUND, "퍼즐 항목을 찾을 수 없습니다.", LogLevel.WARN),
    IN_PROGRESS_ATTEMPT_EXISTS(HttpStatus.CONFLICT, "이미 진행 중인 퍼즐이 있습니다.", LogLevel.WARN),
    ATTEMPT_ALREADY_COMPLETED(HttpStatus.BAD_REQUEST, "이미 완료된 퍼즐입니다.", LogLevel.WARN),
    EMPTY_CELLS_EXIST(HttpStatus.BAD_REQUEST, "아직 채워지지 않은 칸이 있습니다.", LogLevel.WARN),
    CELL_ALREADY_REVEALED(HttpStatus.BAD_REQUEST, "이미 공개된 칸입니다.", LogLevel.WARN),
    WORD_PUZZLE_ATTEMPT_ACCESS_DENIED(HttpStatus.FORBIDDEN, "퍼즐 시도에 대한 접근 권한이 없습니다.", LogLevel.WARN),
    POST_ACCESS_DENIED(HttpStatus.FORBIDDEN, "게시글에 대한 접근 권한이 없습니다.", LogLevel.WARN),
    COMMENT_DISABLED(HttpStatus.BAD_REQUEST, "댓글이 비활성화된 게시글입니다.", LogLevel.WARN),
    COMMENT_ACCESS_DENIED(HttpStatus.FORBIDDEN, "댓글에 대한 접근 권한이 없습니다.", LogLevel.WARN),

    // Q&A (1:1 문의)
    INQUIRY_NOT_FOUND(HttpStatus.NOT_FOUND, "문의를 찾을 수 없습니다.", LogLevel.WARN),
    INQUIRY_ALREADY_ANSWERED(HttpStatus.BAD_REQUEST, "이미 답변이 등록된 문의는 수정·삭제할 수 없습니다.", LogLevel.WARN),
    INQUIRY_NOT_ANSWERED(HttpStatus.BAD_REQUEST, "아직 답변이 등록되지 않은 문의입니다.", LogLevel.WARN),
    INQUIRY_ACCESS_DENIED(HttpStatus.FORBIDDEN, "문의에 대한 접근 권한이 없습니다.", LogLevel.WARN),

    // 공개 문의하기
    CONTACT_NOT_FOUND(HttpStatus.NOT_FOUND, "문의를 찾을 수 없습니다.", LogLevel.WARN),
    CONTACT_RATE_LIMITED(HttpStatus.TOO_MANY_REQUESTS, "문의 요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.", LogLevel.WARN),

    // 401
    AUTHENTICATION_REQUIRED(HttpStatus.UNAUTHORIZED, "인증이 필요합니다. 다시 로그인해 주세요.", LogLevel.WARN),
    OAUTH_APPLE_NOTIFICATION_INVALID(HttpStatus.UNAUTHORIZED, "Apple 알림을 검증할 수 없습니다.", LogLevel.WARN),

    // 403
    MEMBER_ACCESS_DENIED(HttpStatus.FORBIDDEN, "요청한 회원 정보에 접근할 수 없습니다.", LogLevel.WARN),
    ADMIN_ACCESS_DENIED(HttpStatus.FORBIDDEN, "관리자 권한이 필요합니다.", LogLevel.WARN),

    // 500
    SEARCH_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "검색 처리 중 오류가 발생했습니다.", LogLevel.ERROR),
    DB_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "데이터베이스 오류가 발생했습니다.", LogLevel.ERROR),
    MEMBER_ID_MISSING(HttpStatus.INTERNAL_SERVER_ERROR, "사용자 식별 정보가 없습니다.", LogLevel.ERROR),
    OAUTH_APPLE_NOT_CONFIGURED(HttpStatus.INTERNAL_SERVER_ERROR, "Apple 로그인이 설정되지 않았습니다.", LogLevel.ERROR),
    OAUTH_APPLE_PRIVATE_KEY_INVALID(HttpStatus.INTERNAL_SERVER_ERROR, "Apple 로그인 개인키를 읽을 수 없습니다.", LogLevel.ERROR),
    OAUTH_APPLE_NOTIFICATION_NOT_CONFIGURED(HttpStatus.INTERNAL_SERVER_ERROR, "Apple 알림 수신이 설정되지 않았습니다.", LogLevel.ERROR),
    UNKNOWN(HttpStatus.INTERNAL_SERVER_ERROR, "알 수 없는 오류가 발생했습니다.", LogLevel.ERROR),
}
