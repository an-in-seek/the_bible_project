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
    @DisplayName("account-deleted 알림을 받으면 회원이 삭제되고 감사 기록이 남는다")
    fun processAccountDeleted() {
        // given — Apple 소셜 계정이 연결된 회원
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

    private fun linkAppleAccount() {
        member.addOAuthAccount(
            provider = OAuthProvider.APPLE,
            providerUserId = APPLE_SUB,
            email = "user@privaterelay.appleid.com",
        )
        memberRepository.save(member)
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
        private val OCCURRED_AT: Instant = Instant.ofEpochMilli(1700000000000)
    }
}
