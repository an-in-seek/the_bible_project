package com.elseeker.auth.application.service

import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.throwError
import com.elseeker.common.policy.PolicyVersion
import com.elseeker.member.adapter.output.jpa.MemberConsentAuditRepository
import com.elseeker.member.adapter.output.jpa.MemberRepository
import com.elseeker.member.domain.model.Member
import com.elseeker.member.domain.model.MemberConsentAudit
import com.elseeker.member.domain.vo.ConsentType
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

/**
 * 회원가입 동의 처리 서비스.
 *
 * 가입 동의 대기(PENDING_CONSENT) 회원의 필수 동의를 검증·기록하고 계정을 활성화하거나,
 * 동의 취소 시 미완 회원을 즉시 삭제한다.
 */
@Service
class ConsentService(
    private val memberRepository: MemberRepository,
    private val memberConsentAuditRepository: MemberConsentAuditRepository,
) {

    /**
     * 필수 동의(이용약관·개인정보·만14세)를 검증하고 동의 이력을 기록한 뒤 계정을 활성화한다.
     *
     * - 회원 행을 잠금(PESSIMISTIC_WRITE)으로 조회해 동시 제출 시 동의 이력 중복을 방지한다.
     * - 이미 활성(ACTIVE) 회원이면 멱등적으로 무시하고 false 를 반환한다.
     * - 필수 항목 중 하나라도 미동의면 [ErrorType.CONSENT_REQUIRED].
     *
     * @return 이번 호출로 PENDING_CONSENT → ACTIVE 로 실제 전환되었으면 true, 이미 활성이면 false.
     */
    @Transactional
    fun submitConsent(memberUid: UUID, command: ConsentCommand, ipAddress: String?): Boolean {
        val member = memberRepository.findByUidForUpdate(memberUid)
            ?: throwError(ErrorType.MEMBER_NOT_FOUND, memberUid)

        if (!member.isPendingConsent) {
            return false // 이미 동의 완료된 회원 — 멱등 처리(토큰 재발급 없음)
        }

        if (!command.allRequiredAgreed) {
            throwError(ErrorType.CONSENT_REQUIRED)
        }

        val now = Instant.now()
        memberConsentAuditRepository.saveAll(
            listOf(
                MemberConsentAudit(
                    memberUid = member.uid,
                    consentType = ConsentType.TERMS,
                    policyVersion = PolicyVersion.TERMS,
                    agreed = command.agreeTerms,
                    agreedAt = now,
                    ipAddress = ipAddress,
                ),
                MemberConsentAudit(
                    memberUid = member.uid,
                    consentType = ConsentType.PRIVACY,
                    policyVersion = PolicyVersion.PRIVACY,
                    agreed = command.agreePrivacy,
                    agreedAt = now,
                    ipAddress = ipAddress,
                ),
                MemberConsentAudit(
                    memberUid = member.uid,
                    consentType = ConsentType.AGE_OVER_14,
                    policyVersion = PolicyVersion.AGE_SENTINEL,
                    agreed = command.ageOver14,
                    agreedAt = now,
                    ipAddress = ipAddress,
                ),
            )
        )

        member.activate()
        memberRepository.save(member)
        return true
    }

    /**
     * 동의 취소 — 가입 동의 대기(PENDING_CONSENT) 회원을 즉시 삭제한다.
     * 활성 회원은 안전을 위해 삭제하지 않는다.
     * OAuth 계정은 Member.oauthAccounts 의 cascade=ALL/orphanRemoval 로 함께 삭제된다.
     */
    @Transactional
    fun cancelSignup(memberUid: UUID) {
        val member = memberRepository.findByUid(memberUid) ?: return
        if (!member.isPendingConsent) return
        memberRepository.delete(member)
    }

    @Transactional(readOnly = true)
    fun getMember(memberUid: UUID): Member = memberRepository.findByUid(memberUid)
        ?: throwError(ErrorType.MEMBER_NOT_FOUND, memberUid)

    data class ConsentCommand(
        val agreeTerms: Boolean,
        val agreePrivacy: Boolean,
        val ageOver14: Boolean,
    ) {
        val allRequiredAgreed: Boolean
            get() = agreeTerms && agreePrivacy && ageOver14
    }
}
