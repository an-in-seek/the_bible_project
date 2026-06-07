package com.elseeker.qna.adapter.input.api.client

import com.elseeker.common.adapter.input.api.response.PageResponse
import com.elseeker.common.security.jwt.JwtPrincipal
import com.elseeker.qna.adapter.input.api.client.request.CreateInquiryRequest
import com.elseeker.qna.adapter.input.api.client.request.UpdateInquiryRequest
import com.elseeker.qna.adapter.input.api.client.response.InquiryDetailResponse
import com.elseeker.qna.adapter.input.api.client.response.InquirySummaryResponse
import com.elseeker.qna.application.service.InquiryService
import com.elseeker.qna.domain.vo.InquiryStatus
import jakarta.validation.Valid
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*

@Validated
@RestController
@RequestMapping("/api/v1/qna/inquiries")
class InquiryApi(
    private val inquiryService: InquiryService,
) : InquiryApiDocument {

    @PostMapping
    override fun createInquiry(
        @Valid @RequestBody request: CreateInquiryRequest,
        @AuthenticationPrincipal principal: JwtPrincipal,
    ): ResponseEntity<InquiryDetailResponse> {
        val response = inquiryService.createInquiry(principal.memberUid, request)
        return ResponseEntity.status(HttpStatus.CREATED).body(response)
    }

    @GetMapping
    override fun getMyInquiries(
        @RequestParam(required = false) status: InquiryStatus?,
        @PageableDefault(size = 20) pageable: Pageable,
        @AuthenticationPrincipal principal: JwtPrincipal,
    ): ResponseEntity<PageResponse<InquirySummaryResponse>> {
        val response = inquiryService.getMyInquiries(principal.memberUid, status, pageable)
        return ResponseEntity.ok(response)
    }

    @GetMapping("/{id}")
    override fun getMyInquiryDetail(
        @PathVariable id: Long,
        @AuthenticationPrincipal principal: JwtPrincipal,
    ): ResponseEntity<InquiryDetailResponse> {
        val response = inquiryService.getMyInquiryDetail(principal.memberUid, id)
        return ResponseEntity.ok(response)
    }

    @PutMapping("/{id}")
    override fun updateInquiry(
        @PathVariable id: Long,
        @Valid @RequestBody request: UpdateInquiryRequest,
        @AuthenticationPrincipal principal: JwtPrincipal,
    ): ResponseEntity<InquiryDetailResponse> {
        val response = inquiryService.updateInquiry(principal.memberUid, id, request)
        return ResponseEntity.ok(response)
    }

    @DeleteMapping("/{id}")
    override fun deleteInquiry(
        @PathVariable id: Long,
        @AuthenticationPrincipal principal: JwtPrincipal,
    ): ResponseEntity<Void> {
        inquiryService.deleteInquiry(principal.memberUid, id)
        return ResponseEntity.noContent().build()
    }
}
