package com.elseeker.auth.adapter.input.api.apple.request

import jakarta.validation.constraints.NotBlank

/**
 * Apple 서버-대-서버 알림 요청 본문.
 *
 * @property payload Apple 이 서명한 JWS 문자열. 서버가 서명을 검증하기 전까지 신뢰할 수 없다.
 */
data class AppleNotificationRequest(
    @field:NotBlank
    val payload: String,
)
