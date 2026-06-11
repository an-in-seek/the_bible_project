package com.elseeker.qna.application.service

import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.throwError
import com.elseeker.qna.adapter.input.api.client.request.CreateContactRequest
import com.elseeker.qna.adapter.output.jpa.ContactMessageRepository
import com.elseeker.qna.application.component.ContactRateLimiter
import com.elseeker.qna.domain.model.ContactMessage
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * 공개(비로그인) 문의하기 등록 서비스.
 *
 * 스팸 방어는 외부 의존성 없이 3단계로 구성된다:
 * 1) 허니팟(website) — 봇이 채우면 정상 응답을 흉내내며 조용히 폐기(봇에게 단서를 주지 않음)
 * 2) 제출 소요시간 트랩 — 폼 렌더 후 너무 빨리 제출되면 조용히 폐기
 * 3) IP 단위 rate limit — 한도 초과 시 429 반환
 */
@Service
class ContactService(
    private val contactMessageRepository: ContactMessageRepository,
    private val rateLimiter: ContactRateLimiter,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    @Transactional
    fun createContact(req: CreateContactRequest, clientIp: String) {
        // 1) 허니팟: 값이 차 있으면 봇 — 조용히 폐기(성공처럼 반환)
        if (!req.website.isNullOrBlank()) {
            log.warn("Contact honeypot triggered, dropping submission. ip={}", clientIp)
            return
        }

        // 2) 제출 소요시간 트랩: 폼 렌더 후 MIN_FILL_MILLIS 미만이면 봇 — 조용히 폐기
        req.formRenderedAt?.let { renderedAt ->
            val elapsed = System.currentTimeMillis() - renderedAt
            if (elapsed in 0 until MIN_FILL_MILLIS) {
                log.warn("Contact submitted too fast ({}ms), dropping. ip={}", elapsed, clientIp)
                return
            }
        }

        // 3) IP rate limit
        if (!rateLimiter.tryAcquire(clientIp)) {
            throwError(ErrorType.CONTACT_RATE_LIMITED, "ip=$clientIp")
        }

        contactMessageRepository.save(
            ContactMessage.create(
                category = req.category,
                title = req.title,
                content = req.content,
                guestEmail = req.guestEmail.trim(),
                guestName = req.guestName?.trim()?.takeIf { it.isNotBlank() },
            )
        )
    }

    companion object {
        /** 사람이 폼을 채우는 데 걸리는 최소 시간(이보다 빠르면 봇으로 간주). */
        private const val MIN_FILL_MILLIS = 3_000L
    }
}
