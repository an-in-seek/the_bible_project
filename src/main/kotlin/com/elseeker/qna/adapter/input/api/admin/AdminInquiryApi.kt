package com.elseeker.qna.adapter.input.api.admin

import com.elseeker.common.adapter.input.api.admin.response.AdminPageResponse
import com.elseeker.common.security.jwt.JwtPrincipal
import com.elseeker.qna.adapter.input.api.admin.request.AdminInquiryStatusRequest
import com.elseeker.qna.adapter.input.api.admin.request.AnswerInquiryRequest
import com.elseeker.qna.adapter.input.api.admin.response.AdminInquiryItem
import com.elseeker.qna.application.mapper.toAdminItem
import com.elseeker.qna.application.service.AdminInquiryService
import com.elseeker.qna.domain.vo.InquiryCategory
import com.elseeker.qna.domain.vo.InquiryStatus
import jakarta.validation.Valid
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*

@Validated
@RestController
@RequestMapping("/api/v1/admin/qna/inquiries")
class AdminInquiryApi(
    private val adminInquiryService: AdminInquiryService,
) : AdminInquiryApiDocument {

    @GetMapping
    override fun getAdminInquiries(
        @RequestParam(required = false) status: InquiryStatus?,
        @RequestParam(required = false) category: InquiryCategory?,
        @RequestParam(required = false) keyword: String?,
        @RequestParam(required = false) author: String?,
        @PageableDefault(size = 20) pageable: Pageable,
        @AuthenticationPrincipal principal: JwtPrincipal,
    ): ResponseEntity<AdminPageResponse<AdminInquiryItem>> {
        val page = adminInquiryService.getAdminInquiries(status, category, keyword, author, pageable)
        val response = AdminPageResponse.from(page) { it.toAdminItem() }
        return ResponseEntity.ok(response)
    }

    @GetMapping("/{id}")
    override fun getAdminInquiryDetail(
        @PathVariable id: Long,
        @AuthenticationPrincipal principal: JwtPrincipal,
    ): ResponseEntity<AdminInquiryItem> {
        val response = adminInquiryService.getAdminInquiryDetail(id).toAdminItem()
        return ResponseEntity.ok(response)
    }

    @PostMapping("/{id}/answer")
    override fun answerInquiry(
        @PathVariable id: Long,
        @Valid @RequestBody request: AnswerInquiryRequest,
        @AuthenticationPrincipal principal: JwtPrincipal,
    ): ResponseEntity<Void> {
        adminInquiryService.answerInquiry(principal.memberUid, id, request.content)
        return ResponseEntity.ok().build()
    }

    @PutMapping("/{id}/answer")
    override fun updateAnswer(
        @PathVariable id: Long,
        @Valid @RequestBody request: AnswerInquiryRequest,
        @AuthenticationPrincipal principal: JwtPrincipal,
    ): ResponseEntity<Void> {
        adminInquiryService.updateAnswer(principal.memberUid, id, request.content)
        return ResponseEntity.ok().build()
    }

    @PatchMapping("/{id}/status")
    override fun updateStatus(
        @PathVariable id: Long,
        @Valid @RequestBody request: AdminInquiryStatusRequest,
        @AuthenticationPrincipal principal: JwtPrincipal,
    ): ResponseEntity<Void> {
        adminInquiryService.changeStatus(principal.memberUid, id, request.status)
        return ResponseEntity.ok().build()
    }
}
