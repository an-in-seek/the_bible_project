package com.elseeker.auth.adapter.input.api.apple

import com.elseeker.auth.adapter.input.api.apple.request.AppleNotificationRequest
import com.elseeker.auth.application.service.AppleNotificationService
import io.github.oshai.kotlinlogging.KotlinLogging
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import tools.jackson.databind.ObjectMapper
import java.net.URLDecoder
import java.nio.charset.StandardCharsets

private val log = KotlinLogging.logger {}

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
    private val objectMapper: ObjectMapper,
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

    /**
     * 위 두 가지에 해당하지 않는 `Content-Type` 으로 오는 요청을 받아 낸다.
     *
     * `consumes` 를 붙이지 않아 헤더가 없거나 예상 밖인 요청까지 매칭된다. 없으면 Spring 이
     * `HttpMediaTypeNotSupportedException` 으로 415 를 내는데, `GlobalExceptionHandler` 가
     * `ServiceError` 만 다루므로 기본 리졸버가 **DEBUG 로만** 기록한다. 즉 알림이 유실되는데
     * 로그에는 아무 흔적도 남지 않는다. Apple 은 몇 번 재시도한 뒤 포기한다.
     *
     * 구체적인 `consumes` 를 가진 위 두 매핑이 더 우선하므로 정상 요청은 이 경로로 오지 않는다.
     * 여기로 왔다는 것 자체가 조사 대상이라 WARN 으로 남긴다.
     */
    @PostMapping
    override fun receiveNotificationWithUnexpectedContentType(
        @RequestBody body: String,
        request: HttpServletRequest,
    ): ResponseEntity<Void> {
        log.warn { "Apple 알림이 예상 밖의 Content-Type 으로 도착했다: ${request.contentType}" }
        appleNotificationService.handleNotification(extractPayload(body))
        return ResponseEntity.ok().build()
    }

    /**
     * 본문에서 JWS 문자열을 꺼낸다.
     *
     * Content-Type 을 믿을 수 없는 상황이므로 본문 모양으로 판별한다. JWS 는 `.` 으로 구분된
     * base64url 3조각이라 `{` 로도 `payload=` 로도 시작하지 않는다.
     * 잘못 꺼내면 서명 검증에서 401 로 걸러지므로 여기서 과하게 방어하지 않는다.
     */
    private fun extractPayload(body: String): String {
        val trimmed = body.trim()
        return when {
            trimmed.startsWith("{") ->
                objectMapper.readValue(trimmed, AppleNotificationRequest::class.java).payload
            trimmed.startsWith("$PAYLOAD_FIELD=") ->
                URLDecoder.decode(trimmed.removePrefix("$PAYLOAD_FIELD="), StandardCharsets.UTF_8)
            else -> trimmed
        }
    }

    companion object {
        private const val PAYLOAD_FIELD = "payload"
    }
}
