package com.elseeker.auth.adapter.input.api.client.response

import io.swagger.v3.oas.annotations.media.Schema

/**
 * 토큰 재발급 응답 DTO.
 */
data class ReissueResponse(

    @Schema(description = "신규 JWT Access Token")
    val accessToken: String,

    @Schema(description = "JWT Refresh Token (현재는 회전 없이 동일 토큰 반환)")
    val refreshToken: String,
)
