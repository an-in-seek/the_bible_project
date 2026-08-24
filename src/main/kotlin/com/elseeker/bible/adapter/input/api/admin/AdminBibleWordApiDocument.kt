package com.elseeker.bible.adapter.input.api.admin

import com.elseeker.bible.adapter.input.api.admin.request.AdminBibleWordBulkRequest
import com.elseeker.bible.adapter.input.api.admin.request.AdminBibleWordCopyRequest
import com.elseeker.bible.adapter.input.api.admin.request.AdminBibleWordRequest
import com.elseeker.bible.adapter.input.api.admin.request.AdminBibleWordStatusRequest
import com.elseeker.bible.domain.vo.BibleWordCategory
import com.elseeker.bible.domain.vo.BibleWordStatus
import com.elseeker.common.adapter.input.api.admin.response.AdminPageResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity

@Tag(name = "Admin Bible Word", description = "관리자 성경 단어 어휘 API")
interface AdminBibleWordApiDocument {

    @Operation(summary = "어휘 목록 조회", description = "번역본별 어휘를 상태·분류·표제어로 필터링해 조회합니다.")
    fun list(
        @Parameter(description = "번역본 ID (필수). 어휘는 번역본별로 관리합니다.") translationId: Long,
        status: BibleWordStatus?,
        category: BibleWordCategory?,
        term: String?,
        page: Int,
        size: Int,
    ): ResponseEntity<AdminPageResponse<AdminBibleWordApi.WordItem>>

    @Operation(summary = "어휘 상세 조회", description = "별칭과 관리자 입력 통계 건수를 함께 반환합니다.")
    fun get(id: Long): ResponseEntity<AdminBibleWordApi.WordDetail>

    @Operation(summary = "어휘 등록")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "등록 성공"),
        ApiResponse(responseCode = "409", description = "같은 번역본에 이미 있는 표제어 또는 별칭"),
    )
    fun create(translationId: Long, request: AdminBibleWordRequest): ResponseEntity<AdminBibleWordApi.WordItem>

    @Operation(summary = "어휘 수정", description = "별칭은 전달한 목록으로 통째로 교체됩니다.")
    fun update(id: Long, request: AdminBibleWordRequest): ResponseEntity<AdminBibleWordApi.WordItem>

    @Operation(
        summary = "어휘 상태 변경",
        description = "BLOCKED 로 내리면 그 어휘의 통계 행을 즉시 삭제합니다. " +
            "재계산을 기다리면 차단한 단어가 그때까지 화면에 계속 보이기 때문입니다."
    )
    fun changeStatus(id: Long, request: AdminBibleWordStatusRequest): ResponseEntity<AdminBibleWordApi.WordItem>

    @Operation(
        summary = "어휘 삭제",
        description = "연결된 통계 행과 별칭도 함께 삭제됩니다. 대부분의 경우 삭제보다 BLOCKED 가 옳습니다."
    )
    fun delete(id: Long): ResponseEntity<Void>

    @Operation(
        summary = "성경 사전에서 어휘 가져오기",
        description = "이미 있는 표제어는 건너뛰므로 여러 번 실행해도 안전합니다. 현재는 한국어 번역본만 지원합니다."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "가져오기 성공"),
        ApiResponse(responseCode = "400", description = "지원하지 않는 언어의 번역본"),
    )
    fun importFromDictionary(translationId: Long): ResponseEntity<AdminBibleWordApi.ImportResultResponse>

    @Operation(
        summary = "표제어 일괄 등록",
        description = "후보 리포트에서 뽑은 표제어를 한 번에 등록합니다. status 로 CANDIDATE(기본) / " +
            "APPROVED(골라 넣기) / BLOCKED(쓸어 담아 차단) 를 정합니다. " +
            "조사가 붙었거나 활용형인 표제어는 거부되며 rejected 로 돌려줍니다(BLOCKED 는 예외)."
    )
    fun bulkCreate(
        translationId: Long,
        request: AdminBibleWordBulkRequest,
    ): ResponseEntity<AdminBibleWordApi.ImportResultResponse>

    @Operation(
        summary = "다른 번역본에서 어휘 복사",
        description = "같은 언어의 번역본끼리만 복사할 수 있습니다. 이미 있는 표제어는 건너뜁니다."
    )
    fun copyFrom(
        translationId: Long,
        request: AdminBibleWordCopyRequest,
    ): ResponseEntity<AdminBibleWordApi.ImportResultResponse>
}
