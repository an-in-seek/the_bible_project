package com.elseeker.auth.adapter.input.api.apple

import com.elseeker.auth.adapter.input.api.apple.request.AppleNotificationRequest
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity

@Tag(
    name = "Apple Server-to-Server Notification",
    description = "Apple 이 호출하는 계정 변경 알림 수신 엔드포인트. 클라이언트가 호출하는 API 가 아니다."
)
interface AppleNotificationApiDocument {

    @Operation(
        summary = "Apple 계정 변경 알림 수신 (JSON)",
        description = "Apple 이 서명한 JWS 를 검증하고 consent-revoked / account-deleted 시 회원을 탈퇴 처리한다. " +
            "대한민국 소재 개발자는 2026-01-01 부터 이 엔드포인트 등록이 의무다."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "수신 및 처리 완료(중복 수신 포함)"),
        ApiResponse(responseCode = "400", description = "payload 누락"),
        ApiResponse(responseCode = "401", description = "서명·iss·aud 검증 실패"),
    )
    fun receiveNotification(@Valid request: AppleNotificationRequest): ResponseEntity<Void>

    @Operation(
        summary = "Apple 계정 변경 알림 수신 (form-urlencoded)",
        description = "Apple 이 JSON 대신 폼 인코딩으로 보내는 사례가 보고돼 있어 같은 처리를 폼 본문으로도 받는다."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "수신 및 처리 완료(중복 수신 포함)"),
        ApiResponse(responseCode = "401", description = "서명·iss·aud 검증 실패"),
    )
    fun receiveFormNotification(payload: String): ResponseEntity<Void>

    @Operation(
        summary = "Apple 계정 변경 알림 수신 (Content-Type 미상)",
        description = "Content-Type 이 없거나 예상 밖일 때의 폴백. 없으면 415 가 나면서 알림이 " +
            "로그 흔적 없이 유실된다. 본문 모양으로 JWS 를 꺼내 동일하게 처리한다."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "수신 및 처리 완료"),
        ApiResponse(responseCode = "401", description = "서명·iss·aud 검증 실패"),
    )
    fun receiveNotificationWithUnexpectedContentType(
        body: String,
        request: HttpServletRequest,
    ): ResponseEntity<Void>
}
