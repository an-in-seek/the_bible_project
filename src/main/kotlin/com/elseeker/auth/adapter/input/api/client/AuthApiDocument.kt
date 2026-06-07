package com.elseeker.auth.adapter.input.api.client

import com.elseeker.auth.adapter.input.api.client.request.ReissueRequest
import com.elseeker.auth.adapter.input.api.client.request.SocialLoginRequest
import com.elseeker.auth.adapter.input.api.client.response.AuthMeResponse
import com.elseeker.auth.adapter.input.api.client.response.ReissueResponse
import com.elseeker.auth.adapter.input.api.client.response.SocialLoginResponse
import com.elseeker.common.security.jwt.JwtPrincipal
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.ResponseEntity

@Tag(name = "Auth", description = "Authentication endpoints")
interface AuthApiDocument {

    @Operation(summary = "Get current authenticated member")
    fun me(
        principal: JwtPrincipal,
        request: HttpServletRequest,
        response: HttpServletResponse,
    ): ResponseEntity<AuthMeResponse>

    @Operation(summary = "Refresh access token using refresh token cookie")
    fun refresh(request: HttpServletRequest, response: HttpServletResponse): ResponseEntity<Void>

    @Operation(
        summary = "모바일 소셜 로그인 / 연동",
        description = "앱에서 네이티브 SDK로 획득한 소셜 토큰을 검증한다. " +
            "intent=login(기본)이면 로그인하여 {accessToken, refreshToken}을 반환한다. " +
            "intent=link이면 Authorization 헤더의 현재 사용자에게 소셜 계정을 연동하고 AuthMeResponse를 반환하며, " +
            "해당 소셜 계정이 다른 회원에 연동돼 있으면 409 OAUTH_ACCOUNT_ALREADY_LINKED, 미인증이면 401."
    )
    fun socialLogin(request: SocialLoginRequest, principal: JwtPrincipal?): ResponseEntity<Any>

    @Operation(
        summary = "토큰 재발급(바디 기반)",
        description = "저장된 Refresh Token으로 새 Access Token을 발급한다(네이티브 앱용). 만료/무효 시 401."
    )
    fun reissue(request: ReissueRequest): ReissueResponse
}
