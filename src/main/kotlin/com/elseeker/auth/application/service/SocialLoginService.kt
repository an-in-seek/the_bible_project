package com.elseeker.auth.application.service

import com.elseeker.auth.adapter.input.api.client.request.SocialLoginRequest
import com.elseeker.auth.adapter.input.api.client.response.SocialLoginResponse
import com.elseeker.auth.application.component.SocialTokenVerifier
import com.elseeker.auth.application.component.SocialUserInfo
import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.throwError
import com.elseeker.common.security.jwt.JwtProvider
import com.elseeker.member.adapter.output.jpa.MemberOAuthAccountRepository
import com.elseeker.member.adapter.output.jpa.MemberRepository
import com.elseeker.member.domain.model.Member
import com.elseeker.member.domain.vo.MemberRole
import com.elseeker.member.domain.vo.MemberStatus
import com.elseeker.member.domain.vo.OAuthProvider
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * 모바일 앱 소셜 로그인 서비스.
 *
 * 앱에서 네이티브 SDK로 획득한 소셜 토큰을 검증하고,
 * 회원을 조회하거나 신규 생성한 뒤 자체 JWT를 발급합니다.
 *
 * [동작 흐름]
 * 1. 소셜 토큰 검증 (Provider API 호출)
 * 2. OAuth 계정으로 기존 회원 조회 → 없으면 이메일로 조회 → 없으면 신규 생성
 * 3. JWT Access/Refresh Token 발급
 * 4. JSON body로 토큰 응답 (쿠키 미사용)
 */
@Service
class SocialLoginService(
    private val socialTokenVerifier: SocialTokenVerifier,
    private val memberRepository: MemberRepository,
    private val memberOAuthAccountRepository: MemberOAuthAccountRepository,
    private val jwtProvider: JwtProvider,
) {

    @Transactional
    fun login(request: SocialLoginRequest): SocialLoginResponse {
        val provider = OAuthProvider.fromRegistrationId(request.provider)
        val userInfo = socialTokenVerifier.verify(provider, request.token)

        if (userInfo.email.isBlank()) {
            throwError(ErrorType.OAUTH_EMAIL_MISSING, provider.registrationId)
        }

        val member = findOrCreateMember(userInfo)

        // 신규 가입자(동의 대기) — 동의 전용 단기 토큰만 발급하고 consentRequired 반환
        if (member.isPendingConsent) {
            val signupToken = jwtProvider.generateSignupToken(member.uid.toString(), member.email)
            return SocialLoginResponse(
                consentRequired = true,
                accessToken = signupToken,
                refreshToken = null,
            )
        }

        val accessToken = jwtProvider.generateAccessToken(
            member.uid.toString(),
            member.email,
            listOf(member.memberRole),
        )
        val refreshToken = jwtProvider.generateRefreshToken(member.uid.toString())

        return SocialLoginResponse(
            consentRequired = false,
            accessToken = accessToken,
            refreshToken = refreshToken,
        )
    }

    /**
     * 현재 로그인한 회원(currentMemberUid)에게 소셜 계정을 연동한다. (intent=link)
     *
     * - 소셜 토큰을 검증해 서버가 providerUserId를 도출한다(클라이언트 신뢰 X).
     * - 해당 소셜 계정이 '다른 회원'에 이미 연동돼 있으면 OAUTH_ACCOUNT_ALREADY_LINKED(409)로 차단.
     * - 이미 본인에게 연동돼 있으면 프로필만 동기화(멱등).
     */
    @Transactional
    fun linkAccount(request: SocialLoginRequest, currentMemberUid: UUID): Member {
        val provider = OAuthProvider.fromRegistrationId(request.provider)
        val userInfo = socialTokenVerifier.verify(provider, request.token)
        if (userInfo.email.isBlank()) {
            throwError(ErrorType.OAUTH_EMAIL_MISSING, provider.registrationId)
        }

        val current = memberRepository.findWithOAuthAccountsByUid(currentMemberUid)
            ?: throwError(ErrorType.MEMBER_NOT_FOUND, currentMemberUid)

        val existingAccount = memberOAuthAccountRepository.findByProviderAndProviderUserId(
            provider = provider,
            providerUserId = userInfo.providerUserId,
        )
        if (existingAccount != null) {
            if (existingAccount.member.id != current.id) {
                throwError(ErrorType.OAUTH_ACCOUNT_ALREADY_LINKED, provider.registrationId)
            }
            existingAccount.syncOAuthProfile(
                email = userInfo.email,
                nickname = userInfo.name,
                profileImageUrl = userInfo.imageUrl,
            )
            return current
        }

        current.addOAuthAccount(
            provider = provider,
            providerUserId = userInfo.providerUserId,
            email = userInfo.email,
            oauthNickname = userInfo.name,
            oauthProfileImageUrl = userInfo.imageUrl,
        )
        return memberRepository.save(current)
    }

    /**
     * OAuth 계정 기준으로 기존 회원을 조회하거나 신규 생성합니다.
     *
     * 1. provider + providerUserId로 기존 OAuth 계정 조회 → 프로필 동기화 후 반환
     * 2. 동일 이메일의 기존 회원이 있으면 OAuth 계정을 연결 (소셜 provider는 이메일 인증 보장)
     * 3. 완전히 새로운 사용자면 회원 + OAuth 계정 생성
     */
    private fun findOrCreateMember(userInfo: SocialUserInfo): Member {
        // 1. 기존 OAuth 계정 조회
        val existingAccount = memberOAuthAccountRepository.findByProviderAndProviderUserId(
            provider = userInfo.provider,
            providerUserId = userInfo.providerUserId,
        )
        if (existingAccount != null) {
            existingAccount.syncOAuthProfile(
                email = userInfo.email,
                nickname = userInfo.name,
                profileImageUrl = userInfo.imageUrl,
            )
            return existingAccount.member
        }

        // 2. 동일 이메일 회원이 있으면 OAuth 계정 연결
        //    단, provider가 이메일 미인증 상태면 자동 병합을 차단(계정 탈취 방지).
        val existingMember = memberRepository.findByEmail(userInfo.email)
        if (existingMember != null) {
            if (!userInfo.emailVerified) {
                throwError(ErrorType.SOCIAL_LOGIN_EMAIL_NOT_VERIFIED, userInfo.provider.registrationId)
            }
            existingMember.addOAuthAccount(
                provider = userInfo.provider,
                providerUserId = userInfo.providerUserId,
                email = userInfo.email,
                oauthNickname = userInfo.name,
                oauthProfileImageUrl = userInfo.imageUrl,
            )
            existingMember.initializeProfileFromOAuth(userInfo.name, userInfo.imageUrl)
            return existingMember
        }

        // 3. 신규 회원 생성 (동의 대기 상태)
        val newMember = Member.create(
            email = userInfo.email,
            nickname = "",
            memberRole = MemberRole.USER,
            profileImageUrl = null,
            status = MemberStatus.PENDING_CONSENT,
        ).also {
            it.addOAuthAccount(
                provider = userInfo.provider,
                providerUserId = userInfo.providerUserId,
                email = userInfo.email,
                oauthNickname = userInfo.name,
                oauthProfileImageUrl = userInfo.imageUrl,
            )
            it.initializeProfileFromOAuth(userInfo.name, userInfo.imageUrl)
        }
        return memberRepository.save(newMember)
    }
}
