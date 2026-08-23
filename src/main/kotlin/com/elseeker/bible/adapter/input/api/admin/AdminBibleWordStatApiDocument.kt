package com.elseeker.bible.adapter.input.api.admin

import com.elseeker.bible.adapter.input.api.admin.request.AdminBibleWordStatCreateRequest
import com.elseeker.bible.adapter.input.api.admin.request.AdminBibleWordStatUpdateRequest
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity

@Tag(name = "Admin Bible Word Stat", description = "관리자 성경 단어 통계 API")
interface AdminBibleWordStatApiDocument {

    @Operation(summary = "카운트 목록 조회", description = "chapterNumber 를 주지 않으면 책 전체(장 행 + 책 행)를 반환합니다.")
    fun list(
        translationId: Long,
        bookOrder: Int,
        @Parameter(description = "0 이면 책 전체 집계 행. 생략하면 전부") chapterNumber: Int?,
        page: Int,
        size: Int,
    ): ResponseEntity<AdminBibleWordStatApi.StatRowPageResponse>

    @Operation(summary = "재계산 이력 조회", description = "번역본의 책별 마지막 재계산 시각. 누락된 책을 찾는 데 씁니다.")
    fun runs(translationId: Long): ResponseEntity<List<AdminBibleWordStatApi.RunItem>>

    @Operation(
        summary = "책 단위 재계산",
        description = "AUTO 행을 지우고 다시 계산합니다. MANUAL 행은 보존됩니다. " +
            "번역본 전체가 필요하면 클라이언트가 책 단위로 순차 호출합니다."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "재계산 성공"),
        ApiResponse(responseCode = "404", description = "번역본·책을 찾을 수 없거나 본문이 없음"),
    )
    fun recalculate(translationId: Long, bookOrder: Int): ResponseEntity<AdminBibleWordStatApi.RecalculateResponse>

    @Operation(
        summary = "미매칭 후보 리포트",
        description = "본문에 있으나 어휘에 없는 정규화 토큰을 빈도순으로 반환합니다. " +
            "bookOrder 를 생략하면 번역본 전체를 훑으므로 수 초가 걸립니다."
    )
    fun candidates(
        translationId: Long,
        bookOrder: Int?,
        limit: Int,
    ): ResponseEntity<List<AdminBibleWordStatApi.CandidateItem>>

    @Operation(summary = "카운트 직접 추가", description = "source = MANUAL 로 저장되어 재계산이 건드리지 않습니다.")
    fun create(request: AdminBibleWordStatCreateRequest): ResponseEntity<AdminBibleWordStatApi.StatItem>

    @Operation(summary = "카운트 수정", description = "source 가 MANUAL 로 바뀌어 이후 재계산에서 보존됩니다.")
    fun update(id: Long, request: AdminBibleWordStatUpdateRequest): ResponseEntity<AdminBibleWordStatApi.StatItem>

    @Operation(summary = "자동값으로 되돌리기", description = "행을 지웁니다. 다음 재계산에서 AUTO 행으로 다시 채워집니다.")
    fun delete(id: Long): ResponseEntity<Void>
}
