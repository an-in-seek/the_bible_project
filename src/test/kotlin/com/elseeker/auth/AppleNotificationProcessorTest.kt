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
    @DisplayName("Apple 이 마지막 연동이면 account-deleted 에 회원을 탈퇴 처리한다")
    fun processAccountDeletedWithOnlyAppleLinked() {
        // given
        val member = memberOf()
        givenNotProcessed()
        givenAppleLinked(member, alsoLinked = emptyList())
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
    @DisplayName("consent-revoked 도 마지막 연동이면 동일하게 탈퇴 처리한다")
    fun processConsentRevokedWithOnlyAppleLinked() {
        // given
        val member = memberOf()
        givenNotProcessed()
        givenAppleLinked(member, alsoLinked = emptyList())
        justRun { memberService.deleteMemberByProviderNotification(member.uid) }
        val saved = givenAuditSaved()

        // when
        sut.process(JTI, eventOf("consent-revoked"))

        // then
        verify(exactly = 1) { memberService.deleteMemberByProviderNotification(member.uid) }
        saved.captured.result shouldBe AppleNotificationResult.MEMBER_WITHDRAWN
    }

    @Test
    @DisplayName("다른 소셜 연동이 남아 있으면 Apple 연동만 해제하고 회원은 유지한다")
    fun processConsentRevokedWithOtherProviderLinked() {
        // given — Google 로 가입한 뒤 Apple 을 추가 연동한 회원.
        // Apple 인증 철회를 이유로 Google 사용자의 데이터까지 지워서는 안 된다.
        val member = memberOf()
        givenNotProcessed()
        givenAppleLinked(member, alsoLinked = listOf(OAuthProvider.GOOGLE))
        justRun {
            memberService.unlinkOAuthAccountByProviderNotification(member.uid, OAuthProvider.APPLE, APPLE_SUB)
        }
        val saved = givenAuditSaved()

        // when
        sut.process(JTI, eventOf("consent-revoked"))

        // then
        verify(exactly = 0) { memberService.deleteMemberByProviderNotification(any()) }
        verify(exactly = 1) {
            memberService.unlinkOAuthAccountByProviderNotification(member.uid, OAuthProvider.APPLE, APPLE_SUB)
        }
        saved.captured.result shouldBe AppleNotificationResult.APPLE_ACCOUNT_UNLINKED
        saved.captured.memberUid shouldBe member.uid
    }

    @Test
    @DisplayName("account-deleted 여도 다른 연동이 남아 있으면 회원을 삭제하지 않는다")
    fun processAccountDeletedWithOtherProviderLinked() {
        // given — Apple ID 자체가 삭제돼도 그 사용자의 Google 신원까지 사라진 것은 아니다
        val member = memberOf()
        givenNotProcessed()
        givenAppleLinked(member, alsoLinked = listOf(OAuthProvider.KAKAO))
        justRun {
            memberService.unlinkOAuthAccountByProviderNotification(member.uid, OAuthProvider.APPLE, APPLE_SUB)
        }
        val saved = givenAuditSaved()

        // when
        sut.process(JTI, eventOf("account-deleted"))

        // then
        verify(exactly = 0) { memberService.deleteMemberByProviderNotification(any()) }
        saved.captured.result shouldBe AppleNotificationResult.APPLE_ACCOUNT_UNLINKED
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

    /** Apple 을 연동한 회원을 세우고, [alsoLinked] 로 함께 연동된 다른 provider 를 지정한다. */
    private fun givenAppleLinked(member: Member, alsoLinked: List<OAuthProvider>) {
        val appleAccount = oauthAccountOf(member)
        every {
            memberOAuthAccountRepository.findByProviderAndProviderUserId(OAuthProvider.APPLE, APPLE_SUB)
        } returns appleAccount
        val others = alsoLinked.map { provider ->
            MemberOAuthAccount.create(
                member = member,
                provider = provider,
                providerUserId = "${provider.registrationId}-user-id",
                email = null,
                nickname = null,
                profileImageUrl = null,
            )
        }
        every { memberOAuthAccountRepository.findAllByMemberUid(member.uid) } returns listOf(appleAccount) + others
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
