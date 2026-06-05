package com.elseeker.auth.adapter.input.api.client

import com.elseeker.auth.adapter.input.api.client.request.ReissueRequest
import com.elseeker.auth.adapter.input.api.client.request.SocialLoginRequest
import com.elseeker.auth.adapter.input.api.client.response.AuthMeResponse
import com.elseeker.auth.adapter.input.api.client.response.ReissueResponse
import com.elseeker.auth.adapter.input.api.client.response.SocialLoginResponse
import com.elseeker.auth.application.service.SocialLoginService
import com.elseeker.common.config.ElSeekerProperties
import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.throwError
import com.elseeker.common.security.jwt.JwtPrincipal
import com.elseeker.common.security.jwt.JwtProvider
import com.elseeker.common.security.oauth.util.CookieUtils
import com.elseeker.member.application.service.MemberService
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.*

@RestController
@RequestMapping("/api/v1/auth")
class AuthApi(
    private val memberService: MemberService,
    private val jwtProvider: JwtProvider,
    private val properties: ElSeekerProperties,
    private val socialLoginService: SocialLoginService,
) : AuthApiDocument {

    @GetMapping("/me")
    override fun me(
        @AuthenticationPrincipal principal: JwtPrincipal
    ): AuthMeResponse {
        val member = memberService.getMemberWithOAuthAccounts(principal.memberUid)
        return AuthMeResponse.Companion.from(member)
    }

    @PostMapping("/refresh")
    override fun refresh(
        request: HttpServletRequest,
        response: HttpServletResponse,
    ): ResponseEntity<Void> {
        val refreshToken = jwtProvider.resolveRefreshToken(request)
        val claims = refreshToken?.let(jwtProvider::resolveRefreshClaims)
        val cookieSecure = cookieSecure(request)
        if (claims == null) {
            CookieUtils.deleteCookie(response, JwtProvider.ACCESS_TOKEN_COOKIE_NAME, cookieSecure)
            CookieUtils.deleteCookie(response, JwtProvider.REFRESH_TOKEN_COOKIE_NAME, cookieSecure)
            return ResponseEntity.status(401).build()
        }

        val memberUid = runCatching { UUID.fromString(claims.subject) }.getOrNull()
            ?: run {
                CookieUtils.deleteCookie(response, JwtProvider.ACCESS_TOKEN_COOKIE_NAME, cookieSecure)
                CookieUtils.deleteCookie(response, JwtProvider.REFRESH_TOKEN_COOKIE_NAME, cookieSecure)
                return ResponseEntity.status(401).build()
            }
        val member = memberService.getMember(memberUid)
        val roles = listOf(member.memberRole)
        val newAccessToken = jwtProvider.generateAccessToken(member.uid.toString(), member.email, roles)
        CookieUtils.addCookie(
            response,
            JwtProvider.ACCESS_TOKEN_COOKIE_NAME,
            newAccessToken,
            properties.jwt.accessTokenTtl.seconds,
            cookieSecure
        )
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/social-login")
    override fun socialLogin(
        @Valid @RequestBody request: SocialLoginRequest,
        @AuthenticationPrincipal principal: JwtPrincipal?,
    ): ResponseEntity<Any> {
        // intent=link: 현재 로그인 사용자에게 연동(충돌 시 409). 미인증이면 401.
        if (request.isLinkIntent()) {
            val currentMemberUid = principal?.memberUid
                ?: throwError(ErrorType.AUTHENTICATION_REQUIRED, "link")
            val member = socialLoginService.linkAccount(request, currentMemberUid)
            return ResponseEntity.ok<Any>(AuthMeResponse.from(member))
        }
        // intent=login(기본): 기존 로그인 동작.
        return ResponseEntity.ok<Any>(socialLoginService.login(request))
    }

    @PostMapping("/reissue")
    override fun reissue(
        @Valid @RequestBody request: ReissueRequest,
    ): ReissueResponse {
        val claims = jwtProvider.resolveRefreshClaims(request.refreshToken)
            ?: throwError(ErrorType.AUTHENTICATION_REQUIRED, "refresh")
        val memberUid = runCatching { UUID.fromString(claims.subject) }.getOrNull()
            ?: throwError(ErrorType.AUTHENTICATION_REQUIRED, "refresh")
        val member = memberService.getMember(memberUid)
        if (member.isPendingConsent) {
            // 동의 미완료 회원에게는 정식 토큰을 재발급하지 않는다(소셜 재로그인 → 동의 플로우로 유도).
            throwError(ErrorType.AUTHENTICATION_REQUIRED, "consent")
        }
        val newAccessToken = jwtProvider.generateAccessToken(
            member.uid.toString(),
            member.email,
            listOf(member.memberRole),
        )
        return ReissueResponse(
            accessToken = newAccessToken,
            refreshToken = request.refreshToken,
        )
    }

    private fun cookieSecure(request: HttpServletRequest): Boolean {
        return properties.jwt.cookieSecure ?: request.isSecure
    }
}
