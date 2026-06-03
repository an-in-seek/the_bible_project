package com.elseeker.auth.application.service

import com.elseeker.common.IntegrationTest
import com.elseeker.common.domain.ServiceError
import com.elseeker.member.adapter.output.jpa.MemberConsentAuditRepository
import com.elseeker.member.adapter.output.jpa.MemberRepository
import com.elseeker.member.domain.model.Member
import com.elseeker.member.domain.vo.ConsentType
import com.elseeker.member.domain.vo.MemberRole
import com.elseeker.member.domain.vo.MemberStatus
import com.elseeker.member.domain.vo.OAuthProvider
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.collections.shouldContainExactlyInAnyOrder
import io.kotest.matchers.nulls.shouldBeNull
import io.kotest.matchers.nulls.shouldNotBeNull
import io.kotest.matchers.shouldBe
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired

@DisplayName("ConsentService 통합테스트")
class ConsentServiceTest @Autowired constructor(
    private val consentService: ConsentService,
    private val memberRepository: MemberRepository,
    private val memberConsentAuditRepository: MemberConsentAuditRepository,
) : IntegrationTest() {

    private fun savePendingMember(email: String = "pending@elseeker.com"): Member {
        val pending = Member.create(
            email = email,
            nickname = "",
            profileImageUrl = null,
            memberRole = MemberRole.USER,
            status = MemberStatus.PENDING_CONSENT,
        ).also {
            it.addOAuthAccount(
                provider = OAuthProvider.GOOGLE,
                providerUserId = "google-$email",
                email = email,
            )
        }
        return memberRepository.save(pending)
    }

    @Test
    fun `필수 동의를 제출하면 계정이 활성화되고 동의 이력 3건이 기록된다`() {
        // given
        val pending = savePendingMember()

        // when
        consentService.submitConsent(
            pending.uid,
            ConsentService.ConsentCommand(agreeTerms = true, agreePrivacy = true, ageOver14 = true),
            ipAddress = "127.0.0.1",
        )

        // then
        val activated = memberRepository.findByUid(pending.uid)
        activated.shouldNotBeNull()
        activated.status shouldBe MemberStatus.ACTIVE

        val audits = memberConsentAuditRepository.findAllByMemberUid(pending.uid)
        audits.map { it.consentType } shouldContainExactlyInAnyOrder listOf(
            ConsentType.TERMS, ConsentType.PRIVACY, ConsentType.AGE_OVER_14
        )
        audits.forEach { it.agreed shouldBe true }
    }

    @Test
    fun `필수 항목 누락 시 CONSENT_REQUIRED 예외가 발생하고 상태가 유지된다`() {
        // given
        val pending = savePendingMember()

        // when & then
        shouldThrow<ServiceError> {
            consentService.submitConsent(
                pending.uid,
                ConsentService.ConsentCommand(agreeTerms = true, agreePrivacy = false, ageOver14 = true),
                ipAddress = null,
            )
        }
        memberRepository.findByUid(pending.uid)!!.status shouldBe MemberStatus.PENDING_CONSENT
        memberConsentAuditRepository.findAllByMemberUid(pending.uid).size shouldBe 0
    }

    @Test
    fun `동의 취소 시 가입 대기 회원이 즉시 삭제된다`() {
        // given
        val pending = savePendingMember()

        // when
        consentService.cancelSignup(pending.uid)

        // then
        memberRepository.findByUid(pending.uid).shouldBeNull()
    }

    @Test
    fun `이미 활성화된 회원은 동의 취소로 삭제되지 않는다`() {
        // given — IntegrationTest 의 기본 member 는 ACTIVE 상태
        consentService.cancelSignup(member.uid)

        // then
        memberRepository.findByUid(member.uid).shouldNotBeNull()
    }
}
