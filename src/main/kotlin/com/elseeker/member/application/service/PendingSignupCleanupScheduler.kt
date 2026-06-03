package com.elseeker.member.application.service

import com.elseeker.member.adapter.output.jpa.MemberRepository
import com.elseeker.member.domain.vo.MemberStatus
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.temporal.ChronoUnit

/**
 * 동의를 완료하지 않고 방치된 가입 대기(PENDING_CONSENT) 회원을 주기적으로 정리한다.
 *
 * 동의 취소는 즉시 삭제로 처리되며(ConsentService), 이 배치는 브라우저 종료 등으로
 * 동의 화면을 이탈한 회원을 보조적으로 정리한다.
 */
@Component
class PendingSignupCleanupScheduler(
    private val memberRepository: MemberRepository,
) {

    private val logger = KotlinLogging.logger {}

    /** 매시 정각, 생성 후 24시간이 지난 PENDING_CONSENT 회원 삭제. */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    fun cleanupAbandonedPendingMembers() {
        val threshold = Instant.now().minus(ABANDON_HOURS, ChronoUnit.HOURS)
        val targets = memberRepository.findByStatusAndCreatedAtBefore(MemberStatus.PENDING_CONSENT, threshold)
        if (targets.isEmpty()) return

        // OAuth 계정은 Member.oauthAccounts 의 cascade=ALL/orphanRemoval 로 함께 삭제된다.
        targets.forEach { member -> memberRepository.delete(member) }
        logger.info { "Cleaned up ${targets.size} abandoned PENDING_CONSENT member(s)." }
    }

    companion object {
        private const val ABANDON_HOURS = 24L
    }
}
