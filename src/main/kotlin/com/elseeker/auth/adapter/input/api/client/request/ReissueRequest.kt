package com.elseeker.auth.adapter.input.api.client.request

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank

/**
 * 토큰 재발급 요청 DTO (네이티브 앱용, 바디 기반).
 *
 * 저장된 Refresh Token을 바디로 전달하면 새 Access Token을 발급한다.
 * (웹 SSR용 쿠키 기반 `/api/v1/auth/refresh` 와 달리, 앱은 본 엔드포인트를 사용한다.)
 */
data class ReissueRequest(

    @field:NotBlank(message = "refreshToken은 필수입니다.")
    @Schema(description = "저장된 Refresh Token")
    val refreshToken: String,
)
