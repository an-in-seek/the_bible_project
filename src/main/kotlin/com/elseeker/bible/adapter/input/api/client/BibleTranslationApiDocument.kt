package com.elseeker.bible.adapter.input.api.client

import com.elseeker.bible.adapter.input.api.client.response.BibleApiResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity

@Tag(name = "Bible Translation", description = "성경 번역본 API (모바일 클라이언트)")
interface BibleTranslationApiDocument {

    @Operation(
        summary = "번역본 목록 조회",
        description = "모바일 클라이언트에 노출 가능한 성경 번역본 목록을 조회순으로 반환합니다."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "조회 성공"),
    )
    fun getTranslations(): ResponseEntity<List<BibleApiResponse.Translation>>

    @Operation(
        summary = "번역본 단건 조회",
        description = "번역본 ID로 단일 번역본 정보를 조회합니다."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "조회 성공"),
        ApiResponse(responseCode = "404", description = "번역본을 찾을 수 없음"),
    )
    fun getTranslation(
        @Parameter(description = "번역본 ID") translationId: Long,
    ): ResponseEntity<BibleApiResponse.Translation>
}
