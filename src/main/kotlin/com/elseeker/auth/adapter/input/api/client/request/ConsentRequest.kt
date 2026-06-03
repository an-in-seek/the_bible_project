package com.elseeker.auth.adapter.input.api.client.request

import com.elseeker.auth.application.service.ConsentService
import io.swagger.v3.oas.annotations.media.Schema

/**
 * 회원가입 동의 제출 요청 DTO.
 * 세 항목 모두 필수이며, 하나라도 false 면 서버에서 거부한다.
 */
data class ConsentRequest(

    @Schema(description = "서비스 이용약관 동의(필수)", example = "true")
    val agreeTerms: Boolean = false,

    @Schema(description = "개인정보 수집 및 이용 동의(필수)", example = "true")
    val agreePrivacy: Boolean = false,

    @Schema(description = "만 14세 이상 확인(필수)", example = "true")
    val ageOver14: Boolean = false,
) {
    fun toCommand() = ConsentService.ConsentCommand(
        agreeTerms = agreeTerms,
        agreePrivacy = agreePrivacy,
        ageOver14 = ageOver14,
    )
}
