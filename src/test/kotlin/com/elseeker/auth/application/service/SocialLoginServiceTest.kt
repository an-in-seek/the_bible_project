package com.elseeker.auth.application.service

import com.elseeker.auth.adapter.input.api.client.request.SocialLoginRequest
import com.elseeker.auth.application.component.SocialTokenVerifier
import com.elseeker.auth.application.component.SocialUserInfo
import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.ServiceError
import com.elseeker.common.security.jwt.JwtProvider
import com.elseeker.member.adapter.output.jpa.MemberOAuthAccountRepository
import com.elseeker.member.adapter.output.jpa.MemberRepository
import com.elseeker.member.domain.model.Member
import com.elseeker.member.domain.model.MemberOAuthAccount
import com.elseeker.member.domain.vo.OAuthProvider
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.shouldBe
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Test
import java.util.UUID

/**
 * SocialLoginService 연동/로그인 가드 단위 테스트.
 *
 * Spring 컨텍스트/Testcontainers 없이 MockK 로 의존성을 모킹하므로 Docker 없이 실행된다.
 * 핵심 검증: intent=link 연동 충돌(409) 가드, 이메일 미인증 자동병합 차단.
 */
class SocialLoginServiceTest {

    private val socialTokenVerifier = mockk<SocialTokenVerifier>()
    private val memberRepository = mockk<MemberRepository>()
    private val memberOAuthAccountRepository = mockk<MemberOAuthAccountRepository>()
    private val jwtProvider = mockk<JwtProvider>()

    private val service = SocialLoginService(
        socialTokenVerifier,
        memberRepository,
        memberOAuthAccountRepository,
        jwtProvider,
    )

    private fun naverUserInfo(
        providerUserId: String = "naver-123",
        email: String = "user@example.com",
        emailVerified: Boolean = true,
    ) = SocialUserInfo(OAuthProvider.NAVER, providerUserId, email, "사용자", null, emailVerified)

    private fun linkRequest() = SocialLoginRequest(provider = "naver", token = "tok", intent = "link")

    @Test
    fun `linkAccount - 소셜계정이 다른 회원 소유면 OAUTH_ACCOUNT_ALREADY_LINKED 로 차단`() {
        val uidA = UUID.randomUUID()
        val memberA = mockk<Member> { every { id } returns 1L }
        val memberB = mockk<Member> { every { id } returns 2L }
        val existing = mockk<MemberOAuthAccount> { every { member } returns memberB }

        every { socialTokenVerifier.verify(OAuthProvider.NAVER, "tok") } returns naverUserInfo()
        every { memberRepository.findWithOAuthAccountsByUid(uidA) } returns memberA
        every {
            memberOAuthAccountRepository.findByProviderAndProviderUserId(OAuthProvider.NAVER, "naver-123")
        } returns existing

        val ex = shouldThrow<ServiceError> { service.linkAccount(linkRequest(), uidA) }
        ex.errorType shouldBe ErrorType.OAUTH_ACCOUNT_ALREADY_LINKED
    }

    @Test
    fun `linkAccount - 이미 본인 계정이면 멱등 처리(본인 반환 + 프로필 동기화)`() {
        val uidA = UUID.randomUUID()
        val memberA = mockk<Member> { every { id } returns 1L }
        val existing = mockk<MemberOAuthAccount>(relaxed = true) { every { member } returns memberA }

        every { socialTokenVerifier.verify(OAuthProvider.NAVER, "tok") } returns naverUserInfo()
        every { memberRepository.findWithOAuthAccountsByUid(uidA) } returns memberA
        every {
            memberOAuthAccountRepository.findByProviderAndProviderUserId(OAuthProvider.NAVER, "naver-123")
        } returns existing

        val result = service.linkAccount(linkRequest(), uidA)

        result shouldBe memberA
        verify { existing.syncOAuthProfile(any(), any(), any()) }
    }

    @Test
    fun `linkAccount - 신규 소셜계정이면 본인 계정에 연동 후 저장`() {
        val uidA = UUID.randomUUID()
        val memberA = mockk<Member>(relaxed = true)

        every { socialTokenVerifier.verify(OAuthProvider.NAVER, "tok") } returns naverUserInfo()
        every { memberRepository.findWithOAuthAccountsByUid(uidA) } returns memberA
        every {
            memberOAuthAccountRepository.findByProviderAndProviderUserId(OAuthProvider.NAVER, "naver-123")
        } returns null
        every { memberRepository.save(memberA) } returns memberA

        val result = service.linkAccount(linkRequest(), uidA)

        result shouldBe memberA
        verify {
            memberA.addOAuthAccount(OAuthProvider.NAVER, "naver-123", "user@example.com", "사용자", null)
        }
    }

    @Test
    fun `linkAccount - 대상 회원이 없으면 MEMBER_NOT_FOUND`() {
        val uidA = UUID.randomUUID()
        every { socialTokenVerifier.verify(OAuthProvider.NAVER, "tok") } returns naverUserInfo()
        every { memberRepository.findWithOAuthAccountsByUid(uidA) } returns null

        val ex = shouldThrow<ServiceError> { service.linkAccount(linkRequest(), uidA) }
        ex.errorType shouldBe ErrorType.MEMBER_NOT_FOUND
    }

    @Test
    fun `login - 이메일 미인증 소셜로 기존 이메일 계정 자동병합 시도하면 SOCIAL_LOGIN_EMAIL_NOT_VERIFIED 로 차단`() {
        val existingMember = mockk<Member>()
        every {
            socialTokenVerifier.verify(OAuthProvider.NAVER, "tok")
        } returns naverUserInfo(emailVerified = false)
        every {
            memberOAuthAccountRepository.findByProviderAndProviderUserId(OAuthProvider.NAVER, "naver-123")
        } returns null
        every { memberRepository.findByEmail("user@example.com") } returns existingMember

        val req = SocialLoginRequest(provider = "naver", token = "tok", intent = "login")
        val ex = shouldThrow<ServiceError> { service.login(req) }
        ex.errorType shouldBe ErrorType.SOCIAL_LOGIN_EMAIL_NOT_VERIFIED
    }

    @Test
    fun `isLinkIntent - link(대소문자 무시)만 연동 의도, 그 외와 미지정은 로그인`() {
        SocialLoginRequest("naver", "t", "link").isLinkIntent() shouldBe true
        SocialLoginRequest("naver", "t", "LINK").isLinkIntent() shouldBe true
        SocialLoginRequest("naver", "t", "login").isLinkIntent() shouldBe false
        SocialLoginRequest("naver", "t", null).isLinkIntent() shouldBe false
    }
}
