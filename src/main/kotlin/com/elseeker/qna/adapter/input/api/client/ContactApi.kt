package com.elseeker.qna.adapter.input.api.client

import com.elseeker.qna.adapter.input.api.client.request.CreateContactRequest
import com.elseeker.qna.application.service.ContactService
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Validated
@RestController
@RequestMapping("/api/v1/qna/contacts")
class ContactApi(
    private val contactService: ContactService,
) : ContactApiDocument {

    @PostMapping
    override fun createContact(
        @Valid @RequestBody request: CreateContactRequest,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<Void> {
        contactService.createContact(request, clientIp(httpRequest))
        return ResponseEntity.status(HttpStatus.CREATED).build()
    }

    /** 프록시 환경을 고려해 X-Forwarded-For 우선, 없으면 remoteAddr. */
    private fun clientIp(request: HttpServletRequest): String {
        val forwarded = request.getHeader("X-Forwarded-For")
        return if (!forwarded.isNullOrBlank()) {
            forwarded.substringBefore(',').trim()
        } else {
            request.remoteAddr ?: "unknown"
        }
    }
}
