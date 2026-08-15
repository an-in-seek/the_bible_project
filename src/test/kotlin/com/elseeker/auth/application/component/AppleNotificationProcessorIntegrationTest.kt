package com.elseeker.auth.application.component

import com.elseeker.auth.adapter.output.jpa.AppleNotificationAuditRepository
import com.elseeker.auth.domain.model.AppleNotificationAudit
import com.elseeker.auth.domain.vo.AppleNotificationResult
import com.elseeker.common.IntegrationTest
import com.elseeker.common.security.oauth.apple.AppleNotificationEvent
import com.elseeker.member.adapter.output.jpa.MemberOAuthAccountRepository
import com.elseeker.member.adapter.output.jpa.MemberRepository
import com.elseeker.member.domain.vo.OAuthProvider
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.dao.DataIntegrityViolationException
import java.time.Instant

/**
 * Apple 알림 처리 통합테스트.
 *
 * 단위 테스트([com.elseeker.auth.AppleNotificationProcessorTest])는 MockK 로 분기만 검증하므로
 * **Hibernate 플러시 순서를 타지 않는다.** 이 테스트가 필요한 이유는 딱 하나다.
 *
 * [AppleNotificationProcessor] 는 `MemberOAuthAccount` 를 먼저 로드한 뒤 **같은 트랜잭션에서**
 * 부모 `Member` 를 하드 삭제한다. `Member.oauthAccounts` 는 `cascade = ALL, orphanRemoval = true`
 * 라서, 영속성 컨텍스트에 남은 자식 때문에 `ObjectDeletedException` 이나
 * "deleted object would be re-saved by cascade" 로 깨질 수 있는 구조다.
 * 실제 DB 에 커밋해 봐야만 드러난다.
 */
@DisplayName("AppleNotificationProcessor 통합테스트")
class AppleNotificationProcessorIntegrationTest @Autowired constructor(
    private val appleNotificationProcessor: AppleNotificationProcessor,
    private val memberRepository: MemberRepository,
    private val memberOAuthAccountRepository: MemberOAuthAccountRepository,
    private val appleNotificationAuditRepository: AppleNotificationAuditRepository,
) : IntegrationTest() {

    @Test
    @DisplayName("다른 소셜 연동이 남아 있으면 Apple 연동만 끊고 회원과 데이터를 보존한다")
    fun processConsentRevokedKeepsMultiProviderMember() {
        // given — Google 로 가입한 뒤 Apple 을 추가 연동한 회원.
        // Apple 인증 철회만으로 이 회원의 데이터를 지우면 본인이 요청한 적 없는 삭제가 된다.
        linkAppleAccount()
        linkGoogleAccount()

        // when
        appleNotificationProcessor.process(JTI, eventOf("consent-revoked"))

        // then — 회원과 Google 연동은 살아 있고, Apple 연동만 사라진다
        memberRepository.findByUid(member.uid) shouldNotBe null
        memberOAuthAccountRepository
            .findByProviderAndProviderUserId(OAuthProvider.GOOGLE, GOOGLE_SUB) shouldNotBe null
        memberOAuthAccountRepository
            .findByProviderAndProviderUserId(OAuthProvider.APPLE, APPLE_SUB) shouldBe null

        val audits = appleNotificationAuditRepository.findAll()
        audits.size shouldBe 1
        audits[0].result shouldBe AppleNotificationResult.APPLE_ACCOUNT_UNLINKED
        audits[0].memberUid shouldBe member.uid
    }

    @Test
    @DisplayName("Apple 이 마지막 연동이면 account-deleted 에 회원이 삭제되고 감사 기록이 남는다")
    fun processAccountDeleted() {
        // given — Apple 소셜 계정만 연결된 회원
        linkAppleAccount()
        memberOAuthAccountRepository.findByProviderAndProviderUserId(OAuthProvider.APPLE, APPLE_SUB) shouldNotBe null

        // when — 자식(OAuth 계정) 로드 후 같은 트랜잭션에서 부모(회원) 하드 삭제
        appleNotificationProcessor.process(JTI, eventOf("account-deleted"))

        // then — 커밋까지 완료되어야 한다(FK 위반·cascade 재저장 없이)
        memberRepository.findByUid(member.uid) shouldBe null
        memberOAuthAccountRepository.findByProviderAndProviderUserId(OAuthProvider.APPLE, APPLE_SUB) shouldBe null

        val audits = appleNotificationAuditRepository.findAll()
        audits.size shouldBe 1
        audits[0].result shouldBe AppleNotificationResult.MEMBER_WITHDRAWN
        audits[0].memberUid shouldBe member.uid
        audits[0].eventType shouldBe "account-deleted"
        audits[0].occurredAt shouldBe OCCURRED_AT
    }

    @Test
    @DisplayName("같은 알림이 재전송되면 감사 기록이 중복 생성되지 않는다")
    fun processDuplicateNotification() {
        // given
        linkAppleAccount()

        // when — Apple 은 같은 jti 로 재전송한다
        appleNotificationProcessor.process(JTI, eventOf("email-disabled"))
        appleNotificationProcessor.process(JTI, eventOf("email-disabled"))

        // then
        val audits = appleNotificationAuditRepository.findAll()
        audits.size shouldBe 1
        audits[0].result shouldBe AppleNotificationResult.NO_ACTION
        // 이메일 설정 변경은 회원을 건드리지 않는다
        memberRepository.findByUid(member.uid) shouldNotBe null
    }

    @Test
    @DisplayName("동일 이벤트가 동시에 두 번 저장되면 유니크 제약이 막는다")
    fun uniqueConstraintBlocksConcurrentDuplicate() {
        // given — 중복 검사와 저장 사이의 경쟁을 막는 최후 방어선.
        // 스키마에 제약이 실제로 존재하는지까지 확인한다.
        appleNotificationAuditRepository.saveAndFlush(auditOf())

        // when & then
        shouldThrow<DataIntegrityViolationException> {
            appleNotificationAuditRepository.saveAndFlush(auditOf())
        }
    }

    private fun linkAppleAccount() = linkAccount(OAuthProvider.APPLE, APPLE_SUB, "user@privaterelay.appleid.com")

    private fun linkGoogleAccount() = linkAccount(OAuthProvider.GOOGLE, GOOGLE_SUB, "member@elseeker.test")

    /**
     * 소셜 계정을 연동한다.
     *
     * `save` 결과를 [member] 에 **다시 담아야 한다.** 트랜잭션 밖이라 `member` 는 준영속이고,
     * `save` 는 `merge` 로 동작해 관리 상태의 **사본**을 돌려준다. 원본 인스턴스의 자식들은
     * 생성된 id 를 받지 못하므로, 그대로 두고 두 번째 연동을 추가하면 첫 연동이 다시 신규로
     * 취급돼 `uk_member_oauth_provider_user` 위반으로 INSERT 가 두 번 나간다.
     */
    private fun linkAccount(provider: OAuthProvider, providerUserId: String, email: String) {
        member.addOAuthAccount(provider = provider, providerUserId = providerUserId, email = email)
        member = memberRepository.save(member)
    }

    private fun eventOf(type: String) = AppleNotificationEvent(
        type = type,
        sub = APPLE_SUB,
        email = "user@privaterelay.appleid.com",
        isPrivateEmail = true,
        occurredAt = OCCURRED_AT,
    )

    private fun auditOf() = AppleNotificationAudit(
        jti = JTI,
        eventType = "account-deleted",
        appleSub = APPLE_SUB,
        result = AppleNotificationResult.MEMBER_NOT_FOUND,
    )

    companion object {
        private const val JTI = "0e0e0e0e-1111-2222-3333-444444444444"
        private const val APPLE_SUB = "001234.abcdef0123456789.1234"
        private const val GOOGLE_SUB = "109876543210987654321"
        private val OCCURRED_AT: Instant = Instant.ofEpochMilli(1700000000000)
    }
}
