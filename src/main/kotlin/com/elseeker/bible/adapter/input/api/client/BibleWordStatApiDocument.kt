package com.elseeker.bible.adapter.input.api.client

import com.elseeker.bible.adapter.input.api.client.response.BibleWordStatResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity

@Tag(name = "Bible Word Stat", description = "성경 책/장 단어 빈도 통계 API")
interface BibleWordStatApiDocument {

    @Operation(
        summary = "책 단위 단어 빈도 조회",
        description = "선택한 책 전체에서 언급된 단어를 빈도 내림차순으로 조회합니다. " +
            "아직 집계되지 않은 범위는 404 가 아니라 빈 items 를 반환합니다."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "조회 성공"),
        ApiResponse(responseCode = "400", description = "잘못된 요청 파라미터 (limit 범위 위반)"),
        ApiResponse(responseCode = "404", description = "번역본 또는 책을 찾을 수 없음"),
    )
    fun getBookWordStats(
        translationId: Long,
        bookOrder: Int,
        @Parameter(description = "조회 개수 (1~300, 기본 100)") limit: Int,
    ): ResponseEntity<BibleWordStatResponse>

    @Operation(
        summary = "장 단위 단어 빈도 조회",
        description = "선택한 장에서 언급된 단어를 빈도 내림차순으로 조회합니다."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "조회 성공"),
        ApiResponse(responseCode = "400", description = "잘못된 요청 파라미터"),
        ApiResponse(responseCode = "404", description = "번역본 또는 책을 찾을 수 없음"),
    )
    fun getChapterWordStats(
        translationId: Long,
        bookOrder: Int,
        chapterNumber: Int,
        @Parameter(description = "조회 개수 (1~300, 기본 100)") limit: Int,
    ): ResponseEntity<BibleWordStatResponse>
}
