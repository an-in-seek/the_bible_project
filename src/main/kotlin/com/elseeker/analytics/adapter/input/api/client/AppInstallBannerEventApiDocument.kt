package com.elseeker.analytics.adapter.input.api.client

import com.elseeker.analytics.adapter.input.api.client.request.AppInstallBannerEventRequest
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity

@Tag(name = "App Install Banner (앱 설치 유도 배너)", description = "Android 앱 설치 유도 배너의 익명 이벤트 로깅 API")
interface AppInstallBannerEventApiDocument {

    @Operation(
        summary = "배너 이벤트 적재",
        description = "노출/클릭/닫기 이벤트를 완전 익명으로 적재한다. 방문자 식별은 es_visitor_id 쿠키만 사용하며 회원 식별 정보는 저장하지 않는다."
    )
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "적재 성공(또는 조용히 폐기)"),
        ApiResponse(responseCode = "400", description = "유효성 검증 실패"),
    )
    fun trackEvent(
        @Valid request: AppInstallBannerEventRequest,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<Void>
}
