package com.elseeker.bible.adapter.input.api.admin

import com.elseeker.bible.adapter.input.api.admin.request.AdminBibleWordStatCreateRequest
import com.elseeker.bible.adapter.input.api.admin.request.AdminBibleWordStatKeywordRequest
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
        description = "AUTO 행을 지우고 다시 계산합니다. AUTO 가 아닌 행(수동 입력·키워드 집계)은 보존됩니다. " +
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

    @Operation(
        summary = "키워드 집계 미리보기",
        description = "본문에 그 문자열이 나온 횟수를 셉니다. **저장하지 않습니다.** " +
            "bookOrder 를 주면 그 책의 장별 값을, 생략하면 번역본 전체를 책별로 돌려줍니다. " +
            "어절 매칭이 아니라 문자열 비교라 `말` 이 `말씀` 을 함께 셉니다. " +
            "잡힌 절을 함께 돌려주므로 저장 전에 확인해 주세요."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "집계 성공"),
        ApiResponse(responseCode = "404", description = "번역본·책을 찾을 수 없거나 본문이 없음"),
        ApiResponse(responseCode = "409", description = "차단된 표제어"),
    )
    fun countKeyword(
        translationId: Long,
        @Parameter(description = "생략하면 번역본 전체") bookOrder: Int?,
        @Parameter(description = "관리자가 직접 입력한 문자열") keyword: String,
    ): ResponseEntity<AdminBibleWordStatApi.KeywordCountResponse>

    @Operation(
        summary = "키워드 집계 저장",
        description = "다시 세어 `bible_word_stat` 에 반영합니다. 어휘에 없는 키워드는 표제어로 등록합니다. " +
            "같은 표제어의 행은 요청 범위(책 또는 번역본 전체) 안에서 새 값으로 교체됩니다. " +
            "저장 출처는 `KEYWORD` 라 이후 재계산이 이 행을 건드리지 않습니다."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "저장 성공"),
        ApiResponse(responseCode = "400", description = "키워드가 비었거나 본문에 한 번도 나오지 않음"),
        ApiResponse(responseCode = "409", description = "차단된 표제어"),
    )
    fun saveKeyword(request: AdminBibleWordStatKeywordRequest): ResponseEntity<AdminBibleWordStatApi.KeywordSaveResponse>

    @Operation(
        summary = "키워드 집계 되돌리기",
        description = "그 범위에서 키워드로 저장한 `KEYWORD` 행을 지웁니다. " +
            "관리자가 저장 뒤에 손으로 고친 행(`MANUAL`)과 자동 등록된 표제어는 남습니다."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "삭제 성공"),
        ApiResponse(responseCode = "404", description = "어휘에 없는 키워드"),
    )
    fun deleteKeyword(
        translationId: Long,
        @Parameter(description = "생략하면 번역본 전체") bookOrder: Int?,
        keyword: String,
    ): ResponseEntity<AdminBibleWordStatApi.KeywordDeleteResponse>

    @Operation(summary = "카운트 직접 추가", description = "source = MANUAL 로 저장되어 재계산이 건드리지 않습니다.")
    fun create(request: AdminBibleWordStatCreateRequest): ResponseEntity<AdminBibleWordStatApi.StatItem>

    @Operation(summary = "카운트 수정", description = "source 가 MANUAL 로 바뀌어 이후 재계산에서 보존됩니다.")
    fun update(id: Long, request: AdminBibleWordStatUpdateRequest): ResponseEntity<AdminBibleWordStatApi.StatItem>

    @Operation(summary = "자동값으로 되돌리기", description = "행을 지웁니다. 다음 재계산에서 AUTO 행으로 다시 채워집니다.")
    fun delete(id: Long): ResponseEntity<Void>
}
