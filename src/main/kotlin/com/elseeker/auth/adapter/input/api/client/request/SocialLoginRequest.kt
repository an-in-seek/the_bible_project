package com.elseeker.auth.adapter.input.api.client.request

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank

/**
 * 모바일 소셜 로그인 요청 DTO.
 *
 * 앱에서 네이티브 SDK로 획득한 토큰을 서버에 전달합니다.
 * - Google: ID Token (JWT)
 * - Kakao: Access Token
 * - Naver: Access Token
 */
data class SocialLoginRequest(

    @field:NotBlank(message = "provider는 필수입니다.")
    @Schema(description = "소셜 로그인 제공자", example = "google", allowableValues = ["google", "kakao", "naver"])
    val provider: String,

    @field:NotBlank(message = "token은 필수입니다.")
    @Schema(description = "소셜 로그인 토큰 (Google: ID Token, Kakao/Naver: Access Token)")
    val token: String,

    @Schema(
        description = "요청 의도. login=소셜 로그인(기본), link=현재 로그인 계정에 소셜 연동(Authorization 헤더 필수)",
        example = "login",
        allowableValues = ["login", "link"],
    )
    val intent: String? = null,
) {
    /** intent 가 "link" 인지 여부(대소문자 무시). 미지정/그 외는 로그인으로 간주. */
    fun isLinkIntent(): Boolean = intent?.equals("link", ignoreCase = true) == true
}
