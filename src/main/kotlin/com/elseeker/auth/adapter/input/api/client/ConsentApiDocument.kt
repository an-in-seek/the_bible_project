package com.elseeker.auth.adapter.input.api.client

import com.elseeker.auth.adapter.input.api.client.request.ConsentRequest
import com.elseeker.auth.adapter.input.api.client.response.ConsentResponse
import com.elseeker.common.security.jwt.JwtPrincipal
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.ResponseEntity

@Tag(name = "Consent", description = "회원가입 동의 처리")
interface ConsentApiDocument {

    @Operation(
        summary = "회원가입 동의 제출",
        description = "가입 동의 대기(PENDING_CONSENT) 회원이 필수 약관에 동의하면 계정을 활성화하고 정식 토큰을 발급합니다. " +
            "웹(쿠키) 호출은 HttpOnly 쿠키로 토큰을 내려주고 응답 body 토큰 필드는 null, " +
            "모바일(Authorization: Bearer) 호출은 응답 body 의 accessToken/refreshToken 으로 전달합니다. " +
            "이미 활성화된 회원이 호출하면 토큰 재발급 없이 redirectTo 만 반환합니다."
    )
    fun submit(
        principal: JwtPrincipal,
        request: ConsentRequest,
        servletRequest: HttpServletRequest,
        servletResponse: HttpServletResponse,
    ): ConsentResponse

    @Operation(
        summary = "회원가입 동의 취소",
        description = "동의를 취소하면 가입 동의 대기 회원을 즉시 삭제하고 토큰 쿠키를 제거합니다."
    )
    fun cancel(
        principal: JwtPrincipal,
        servletRequest: HttpServletRequest,
        servletResponse: HttpServletResponse,
    ): ResponseEntity<Void>
}
