package com.elseeker.auth.application.component

import com.elseeker.auth.adapter.output.jpa.AppleNotificationAuditRepository
import com.elseeker.auth.domain.model.AppleNotificationAudit
import com.elseeker.auth.domain.vo.AppleNotificationResult
import com.elseeker.auth.domain.vo.AppleNotificationType
import com.elseeker.common.security.oauth.apple.AppleNotificationEvent
import com.elseeker.member.adapter.output.jpa.MemberOAuthAccountRepository
import com.elseeker.member.application.service.MemberService
import com.elseeker.member.domain.vo.OAuthProvider
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

private val log = KotlinLogging.logger {}

/**
 * 검증을 통과한 Apple 알림 이벤트 한 건을 실제로 반영한다.
 *
 * 이벤트마다 **독립된 트랜잭션**으로 처리한다. 한 토큰에 여러 이벤트가 담겼을 때 하나가 실패해도
 * 나머지의 처리 결과와 감사 기록이 함께 롤백되지 않게 하기 위함이다.
 */
@Component
class AppleNotificationProcessor(
    private val memberOAuthAccountRepository: MemberOAuthAccountRepository,
    private val memberService: MemberService,
    private val appleNotificationAuditRepository: AppleNotificationAuditRepository,
) {

    @Transactional
    fun process(jti: String, event: AppleNotificationEvent) {
        if (appleNotificationAuditRepository.existsByJtiAndEventTypeAndAppleSub(jti, event.type, event.sub)) {
            log.info { "이미 처리한 Apple 알림 재수신 — 무시한다. jti=$jti, type=${event.type}" }
            return
        }

        val type = AppleNotificationType.findByRawValue(event.type)
        if (type == null) {
            // Apple 이 새 타입을 추가했을 수 있다. 기록만 남기고 200 으로 응답해 재전송을 막는다.
            log.warn { "알 수 없는 Apple 알림 타입: ${event.type}" }
            record(jti, event, AppleNotificationResult.UNSUPPORTED_TYPE)
            return
        }

        if (!type.requiresWithdrawal) {
            // email-enabled / email-disabled. 회원 상태를 바꾸지 않고 이력만 남긴다.
            log.info { "Apple 알림 수신(상태 변경 없음): type=${type.rawValue}" }
            record(jti, event, AppleNotificationResult.NO_ACTION)
            return
        }

        val memberUid = findMemberUidByAppleSub(event.sub)
        if (memberUid == null) {
            // 이미 탈퇴했거나 애초에 가입하지 않은 사용자. 정상 상황이다.
            log.info { "Apple 탈퇴 알림 대상 회원 없음: type=${type.rawValue}" }
            record(jti, event, AppleNotificationResult.MEMBER_NOT_FOUND)
            return
        }

        // Apple 이 통보한 것은 "Apple 인증을 더는 쓰지 않겠다"이지 "서비스 계정을 지워달라"가 아니다.
        // Google 로 가입한 뒤 Apple 을 추가 연동한 사용자를 통째로 지우면, 본인이 요청한 적 없는
        // 데이터 삭제가 되고 다음 Google 로그인 때 빈 계정이 새로 생긴다.
        // 따라서 Apple 연동만 끊고, 그것이 마지막 로그인 수단일 때만 회원까지 정리한다.
        val isLastLinkedAccount = memberOAuthAccountRepository.findAllByMemberUid(memberUid).size <= 1
        if (!isLastLinkedAccount) {
            memberService.unlinkOAuthAccountByProviderNotification(memberUid, OAuthProvider.APPLE, event.sub)
            log.info { "Apple 연동만 해제(다른 소셜 연동 유지): type=${type.rawValue}, memberUid=$memberUid" }
            record(jti, event, AppleNotificationResult.APPLE_ACCOUNT_UNLINKED, memberUid)
            return
        }

        memberService.deleteMemberByProviderNotification(memberUid)
        log.info { "Apple 알림으로 회원 탈퇴 처리 완료(마지막 연동): type=${type.rawValue}, memberUid=$memberUid" }
        record(jti, event, AppleNotificationResult.MEMBER_WITHDRAWN, memberUid)
    }

    private fun findMemberUidByAppleSub(appleSub: String): UUID? =
        memberOAuthAccountRepository
            .findByProviderAndProviderUserId(OAuthProvider.APPLE, appleSub)
            ?.member
            ?.uid

    private fun record(
        jti: String,
        event: AppleNotificationEvent,
        result: AppleNotificationResult,
        memberUid: UUID? = null,
    ) {
        appleNotificationAuditRepository.save(
            AppleNotificationAudit(
                jti = jti,
                eventType = event.type,
                appleSub = event.sub,
                email = event.email,
                isPrivateEmail = event.isPrivateEmail,
                occurredAt = event.occurredAt,
                result = result,
                memberUid = memberUid,
            )
        )
    }
}
