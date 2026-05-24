package com.elseeker.analytics.adapter.input.web

import com.elseeker.analytics.application.service.SiteVisitTrackingService
import com.elseeker.common.security.jwt.JwtPrincipal
import io.github.oshai.kotlinlogging.KotlinLogging
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.ResponseCookie
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.method.HandlerMethod
import org.springframework.web.servlet.HandlerInterceptor
import org.springframework.web.servlet.HandlerMapping
import java.time.Duration
import java.util.*

@Component
class SiteVisitTrackingInterceptor(
    private val siteVisitTrackingService: SiteVisitTrackingService,
) : HandlerInterceptor {

    private val logger = KotlinLogging.logger {}

    override fun preHandle(
        request: HttpServletRequest,
        response: HttpServletResponse,
        handler: Any,
    ): Boolean {
        val visitorId = resolveOrIssueVisitorId(request, response)
        request.setAttribute(ATTR_VISITOR_ID, visitorId)
        resolveMemberUid()?.let { request.setAttribute(ATTR_MEMBER_UID, it) }
        return true
    }

    override fun afterCompletion(
        request: HttpServletRequest,
        response: HttpServletResponse,
        handler: Any,
        ex: Exception?,
    ) {
        try {
            if (!shouldTrack(request, response, handler, ex)) return

            val visitorId = request.getAttribute(ATTR_VISITOR_ID) as? String ?: return
            val pageKey = resolvePageKey(request)
            val memberUid = request.getAttribute(ATTR_MEMBER_UID) as? UUID

            siteVisitTrackingService.track(
                visitorId = visitorId,
                memberUid = memberUid,
                pageKey = pageKey,
                requestUri = request.requestURI,
                referer = request.getHeader(HttpHeaders.REFERER),
                userAgent = request.getHeader(HttpHeaders.USER_AGENT),
            )
        } catch (e: Exception) {
            logger.warn(e) { "Failed to track site visit" }
        }
    }

    private fun shouldTrack(
        request: HttpServletRequest,
        response: HttpServletResponse,
        handler: Any,
        ex: Exception?,
    ): Boolean {
        if (ex != null) return false
        if (handler !is HandlerMethod) return false
        if (!HttpMethod.GET.name().equals(request.method, ignoreCase = true)) return false
        if (response.status !in 200..299) return false
        return true
    }

    private fun resolveOrIssueVisitorId(
        request: HttpServletRequest,
        response: HttpServletResponse,
    ): String {
        val existing = request.cookies?.firstOrNull { it.name == VISITOR_COOKIE_NAME }?.value
        if (!existing.isNullOrBlank() && isValidUuid(existing)) return existing

        val newId = UUID.randomUUID().toString()
        val cookie = ResponseCookie.from(VISITOR_COOKIE_NAME, newId)
            .path("/")
            .maxAge(Duration.ofDays(365))
            .httpOnly(true)
            .sameSite("Lax")
            .secure(request.isSecure)
            .build()
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString())
        return newId
    }

    private fun isValidUuid(value: String): Boolean =
        runCatching { UUID.fromString(value) }.isSuccess

    private fun resolvePageKey(request: HttpServletRequest): String {
        val pattern = request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE) as? String
        return pattern ?: request.requestURI
    }

    private fun resolveMemberUid(): UUID? {
        val authentication = SecurityContextHolder.getContext().authentication ?: return null
        val principal = authentication.principal as? JwtPrincipal ?: return null
        return principal.memberUid
    }

    companion object {
        private const val VISITOR_COOKIE_NAME = "es_visitor_id"
        private const val ATTR_VISITOR_ID = "ANALYTICS_VISITOR_ID"
        private const val ATTR_MEMBER_UID = "ANALYTICS_MEMBER_UID"
    }
}
