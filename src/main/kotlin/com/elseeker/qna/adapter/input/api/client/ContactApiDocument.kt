package com.elseeker.qna.adapter.input.api.client

import com.elseeker.qna.adapter.input.api.client.request.CreateContactRequest
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity

@Tag(name = "Contact (공개 문의하기)", description = "비로그인 사용자도 이용할 수 있는 공개 문의 API")
interface ContactApiDocument {

    @Operation(
        summary = "공개 문의 등록",
        description = "로그인 없이 문의를 등록합니다. 답변은 입력한 이메일로 회신됩니다. (허니팟/제출시간/IP rate limit 적용)"
    )
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "등록 성공(또는 스팸으로 조용히 폐기)"),
        ApiResponse(responseCode = "400", description = "유효성 검증 실패"),
        ApiResponse(responseCode = "429", description = "요청이 너무 잦음"),
    )
    fun createContact(
        @Valid request: CreateContactRequest,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<Void>
}
