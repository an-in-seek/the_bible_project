package com.elseeker.qna.adapter.input.api.admin

import com.elseeker.common.adapter.input.api.admin.response.AdminPageResponse
import com.elseeker.common.security.jwt.JwtPrincipal
import com.elseeker.qna.adapter.input.api.admin.request.AdminContactStatusRequest
import com.elseeker.qna.adapter.input.api.admin.request.ReplyContactRequest
import com.elseeker.qna.adapter.input.api.admin.response.AdminContactItem
import com.elseeker.qna.application.mapper.toAdminItem
import com.elseeker.qna.application.service.AdminContactService
import com.elseeker.qna.domain.vo.ContactStatus
import com.elseeker.qna.domain.vo.InquiryCategory
import jakarta.validation.Valid
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*

@Validated
@RestController
@RequestMapping("/api/v1/admin/qna/contacts")
class AdminContactApi(
    private val adminContactService: AdminContactService,
) : AdminContactApiDocument {

    @GetMapping
    override fun getAdminContacts(
        @RequestParam(required = false) status: ContactStatus?,
        @RequestParam(required = false) category: InquiryCategory?,
        @RequestParam(required = false) keyword: String?,
        @PageableDefault(size = 20) pageable: Pageable,
        @AuthenticationPrincipal principal: JwtPrincipal,
    ): ResponseEntity<AdminPageResponse<AdminContactItem>> {
        val page = adminContactService.getAdminContacts(status, category, keyword, pageable)
        val response = AdminPageResponse.from(page) { it.toAdminItem() }
        return ResponseEntity.ok(response)
    }

    @GetMapping("/{id}")
    override fun getAdminContactDetail(
        @PathVariable id: Long,
        @AuthenticationPrincipal principal: JwtPrincipal,
    ): ResponseEntity<AdminContactItem> {
        val response = adminContactService.getAdminContactDetail(id).toAdminItem()
        return ResponseEntity.ok(response)
    }

    @PostMapping("/{id}/reply")
    override fun reply(
        @PathVariable id: Long,
        @Valid @RequestBody request: ReplyContactRequest,
        @AuthenticationPrincipal principal: JwtPrincipal,
    ): ResponseEntity<Void> {
        adminContactService.reply(principal.memberUid, id, request.content)
        return ResponseEntity.ok().build()
    }

    @PatchMapping("/{id}/status")
    override fun updateStatus(
        @PathVariable id: Long,
        @Valid @RequestBody request: AdminContactStatusRequest,
        @AuthenticationPrincipal principal: JwtPrincipal,
    ): ResponseEntity<Void> {
        adminContactService.changeStatus(principal.memberUid, id, request.status)
        return ResponseEntity.ok().build()
    }
}
