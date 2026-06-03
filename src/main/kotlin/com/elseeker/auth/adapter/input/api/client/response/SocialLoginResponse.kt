package com.elseeker.auth.adapter.input.api.client.response

import io.swagger.v3.oas.annotations.media.Schema

/**
 * 모바일 소셜 로그인 응답 DTO.
 *
 * - [consentRequired] = false: [accessToken]/[refreshToken]이 정식 토큰. 바로 서비스 이용 가능.
 * - [consentRequired] = true: 신규 가입자. [accessToken]은 동의 전용 단기 토큰이며 [refreshToken]은 null.
 *   앱은 동의 화면을 띄우고 `POST /api/v1/auth/consent` 를 Bearer 로 호출해 정식 토큰을 발급받는다.
 *
 * 앱에서 토큰을 안전하게 저장한 뒤, 이후 API 호출 시
 * Authorization: Bearer {accessToken} 헤더로 전달합니다.
 */
data class SocialLoginResponse(

    @Schema(description = "약관 동의 필요 여부(신규 가입자 true)")
    val consentRequired: Boolean,

    @Schema(description = "JWT Access Token (동의 필요 시 동의 전용 단기 토큰)")
    val accessToken: String,

    @Schema(description = "JWT Refresh Token (동의 필요 시 null)")
    val refreshToken: String?,
)
