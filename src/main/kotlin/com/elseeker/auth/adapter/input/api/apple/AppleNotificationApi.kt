package com.elseeker.auth.adapter.input.api.apple

import com.elseeker.auth.adapter.input.api.apple.request.AppleNotificationRequest
import com.elseeker.auth.application.service.AppleNotificationService
import jakarta.validation.Valid
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

/**
 * Apple 서버-대-서버 알림 수신 엔드포인트.
 *
 * `client` / `admin` 하위가 아닌 이유는 이 API 의 호출자가 우리 클라이언트도 관리자도 아닌
 * **Apple 서버**이기 때문이다. 인증은 Spring Security 가 아니라 페이로드의 JWS 서명으로 한다.
 *
 * Apple Developer 콘솔의 primary App ID 에 이 경로를 등록해야 하며, 대한민국 소재 개발자는
 * 2026-01-01 부터 등록이 의무다.
 */
@Validated
@RestController
@RequestMapping("/api/v1/auth/apple/notifications")
class AppleNotificationApi(
    private val appleNotificationService: AppleNotificationService,
) : AppleNotificationApiDocument {

    @PostMapping(consumes = [MediaType.APPLICATION_JSON_VALUE])
    override fun receiveNotification(
        @Valid @RequestBody request: AppleNotificationRequest,
    ): ResponseEntity<Void> {
        appleNotificationService.handleNotification(request.payload)
        return ResponseEntity.ok().build()
    }

    /**
     * Apple 이 `application/x-www-form-urlencoded` 로 보내는 사례가 반복 보고돼 있어 함께 받는다.
     * 공식 문서는 JSON 이라고만 적고 있으나, 어느 쪽이든 놓치면 규정 준수 알림을 조용히 흘리게 된다.
     */
    @PostMapping(consumes = [MediaType.APPLICATION_FORM_URLENCODED_VALUE])
    override fun receiveFormNotification(
        @RequestParam payload: String,
    ): ResponseEntity<Void> {
        appleNotificationService.handleNotification(payload)
        return ResponseEntity.ok().build()
    }
}
