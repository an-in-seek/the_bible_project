package com.elseeker.auth.adapter.input.api.client.response

import io.swagger.v3.oas.annotations.media.Schema

/**
 * 회원가입 동의 완료 응답 DTO.
 *
 * - 웹(쿠키 인증): [redirectTo]만 사용하고 토큰은 HttpOnly 쿠키로 발급된다(토큰 필드 null).
 * - 모바일(Bearer 인증): [accessToken]/[refreshToken]을 body 로 전달받는다.
 */
data class ConsentResponse(

    @Schema(description = "동의 완료 후 이동할 경로")
    val redirectTo: String,

    @Schema(description = "정식 Access Token (모바일 Bearer 호출 시에만 제공)")
    val accessToken: String? = null,

    @Schema(description = "정식 Refresh Token (모바일 Bearer 호출 시에만 제공)")
    val refreshToken: String? = null,
)
