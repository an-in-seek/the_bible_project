package com.elseeker.analytics.adapter.input.api.client.request

import com.elseeker.analytics.domain.vo.AppInstallBannerEventType
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotNull

@Schema(description = "Android 앱 설치 유도 배너 이벤트 적재 요청")
data class AppInstallBannerEventRequest(
    @field:NotNull(message = "이벤트 종류는 필수입니다")
    @field:Schema(description = "배너 이벤트 종류", example = "IMPRESSION")
    val event: AppInstallBannerEventType,
)
