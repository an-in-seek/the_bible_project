package com.elseeker.auth

import com.elseeker.auth.adapter.output.jpa.AppleNotificationAuditRepository
import com.elseeker.auth.application.component.AppleNotificationProcessor
import com.elseeker.auth.domain.model.AppleNotificationAudit
import com.elseeker.auth.domain.vo.AppleNotificationResult
import com.elseeker.common.security.oauth.apple.AppleNotificationEvent
import com.elseeker.member.adapter.output.jpa.MemberOAuthAccountRepository
import com.elseeker.member.application.service.MemberService
import com.elseeker.member.domain.model.Member
import com.elseeker.member.domain.model.MemberOAuthAccount
import com.elseeker.member.domain.vo.MemberRole
import com.elseeker.member.domain.vo.OAuthProvider
import io.kotest.matchers.shouldBe
import io.mockk.every
import io.mockk.justRun
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test

/**
 * Apple 알림 이벤트 처리 분기 검증.
 *
 * 이 클래스가 회원 하드 삭제를 호출하므로, **어떤 이벤트에서 삭제가 일어나고 어떤 이벤트에서
 * 일어나지 않는지**가 이 프로젝트에서 가장 되돌리기 어려운 판단이다.
 */
class AppleNotificationProcessorTest {

    private val memberOAuthAccountRepository = mockk<MemberOAuthAccountRepository>()
    private val memberService = mockk<MemberService>()
    private val appleNotificationAuditRepository = mockk<AppleNotificationAuditRepository>()

    private val sut = AppleNotificationProcessor(
        memberOAuthAccountRepository = memberOAuthAccountRepository,
        memberService = memberService,
        appleNotificationAuditRepository = appleNotificationAuditRepository,
    )

    @Test
    @DisplayName("account-deleted 이면 연결된 회원을 탈퇴 처리한다")
    fun processAccountDeleted() {
        // given
        val member = memberOf()
        givenNotProcessed()
        every {
            memberOAuthAccountRepository.findByProviderAndProviderUserId(OAuthProvider.APPLE, APPLE_SUB)
        } returns oauthAccountOf(member)
        justRun { memberService.deleteMemberByProviderNotification(member.uid) }
        val saved = givenAuditSaved()

        // when
        sut.process(JTI, eventOf("account-deleted"))

        // then
        verify(exactly = 1) { memberService.deleteMemberByProviderNotification(member.uid) }
        saved.captured.result shouldBe AppleNotificationResult.MEMBER_WITHDRAWN
        saved.captured.memberUid shouldBe member.uid
    }

    @Test
    @DisplayName("consent-revoked 도 동일하게 탈퇴 처리한다")
    fun processConsentRevoked() {
        // given
        val member = memberOf()
        givenNotProcessed()
        every {
            memberOAuthAccountRepository.findByProviderAndProviderUserId(OAuthProvider.APPLE, APPLE_SUB)
        } returns oauthAccountOf(member)
        justRun { memberService.deleteMemberByProviderNotification(member.uid) }
        val saved = givenAuditSaved()

        // when
        sut.process(JTI, eventOf("consent-revoked"))

        // then
        verify(exactly = 1) { memberService.deleteMemberByProviderNotification(member.uid) }
        saved.captured.result shouldBe AppleNotificationResult.MEMBER_WITHDRAWN
    }

    @Test
    @DisplayName("이메일 전달 설정 변경은 회원을 건드리지 않는다")
    fun processEmailEvent() {
        // given
        givenNotProcessed()
        val saved = givenAuditSaved()

        // when
        sut.process(JTI, eventOf("email-disabled"))

        // then
        verify(exactly = 0) { memberService.deleteMemberByProviderNotification(any()) }
        saved.captured.result shouldBe AppleNotificationResult.NO_ACTION
    }

    @Test
    @DisplayName("탈퇴 대상인데 연결된 회원이 없으면 기록만 남긴다")
    fun processWithoutLinkedMember() {
        // given — 이미 탈퇴했거나 애초에 가입하지 않은 사용자
        givenNotProcessed()
        every {
            memberOAuthAccountRepository.findByProviderAndProviderUserId(OAuthProvider.APPLE, APPLE_SUB)
        } returns null
        val saved = givenAuditSaved()

        // when
        sut.process(JTI, eventOf("account-deleted"))

        // then
        verify(exactly = 0) { memberService.deleteMemberByProviderNotification(any()) }
        saved.captured.result shouldBe AppleNotificationResult.MEMBER_NOT_FOUND
        saved.captured.memberUid shouldBe null
    }

    @Test
    @DisplayName("모르는 이벤트 타입은 회원을 건드리지 않고 원본 타입만 기록한다")
    fun processUnsupportedType() {
        // given — Apple 이 새 타입을 추가해도 회원 데이터를 건드려서는 안 된다
        givenNotProcessed()
        val saved = givenAuditSaved()

        // when
        sut.process(JTI, eventOf("some-future-event"))

        // then
        verify(exactly = 0) { memberService.deleteMemberByProviderNotification(any()) }
        saved.captured.result shouldBe AppleNotificationResult.UNSUPPORTED_TYPE
        saved.captured.eventType shouldBe "some-future-event"
    }

    @Test
    @DisplayName("이미 처리한 이벤트가 재전송되면 아무것도 하지 않는다")
    fun processDuplicate() {
        // given
        every {
            appleNotificationAuditRepository.existsByJtiAndEventTypeAndAppleSub(JTI, "account-deleted", APPLE_SUB)
        } returns true

        // when
        sut.process(JTI, eventOf("account-deleted"))

        // then
        verify(exactly = 0) { memberService.deleteMemberByProviderNotification(any()) }
        verify(exactly = 0) { appleNotificationAuditRepository.save(any()) }
    }

    private fun givenNotProcessed() {
        every {
            appleNotificationAuditRepository.existsByJtiAndEventTypeAndAppleSub(any(), any(), any())
        } returns false
    }

    private fun givenAuditSaved() = slot<AppleNotificationAudit>().also { captured ->
        every { appleNotificationAuditRepository.save(capture(captured)) } answers { firstArg() }
    }

    private fun eventOf(type: String) = AppleNotificationEvent(
        type = type,
        sub = APPLE_SUB,
        email = "user@privaterelay.appleid.com",
        isPrivateEmail = true,
        occurredAt = null,
    )

    private fun memberOf() = Member.create(
        email = "member@elseeker.test",
        nickname = "테스터",
        profileImageUrl = null,
        memberRole = MemberRole.USER,
    )

    private fun oauthAccountOf(member: Member) = MemberOAuthAccount.create(
        member = member,
        provider = OAuthProvider.APPLE,
        providerUserId = APPLE_SUB,
        email = null,
        nickname = null,
        profileImageUrl = null,
    )

    companion object {
        private const val JTI = "0e0e0e0e-1111-2222-3333-444444444444"
        private const val APPLE_SUB = "001234.abcdef0123456789.1234"
    }
}
