package com.elseeker.auth.application.service

import com.elseeker.auth.application.component.AppleNotificationProcessor
import com.elseeker.auth.domain.model.APPLE_NOTIFICATION_AUDIT_UNIQUE_CONSTRAINT
import com.elseeker.common.security.oauth.apple.AppleNotificationVerifier
import io.github.oshai.kotlinlogging.KotlinLogging
import org.hibernate.exception.ConstraintViolationException
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.stereotype.Service

private val log = KotlinLogging.logger {}

/**
 * Apple 서버-대-서버 알림 수신 흐름.
 *
 * **의도적으로 `@Transactional` 을 붙이지 않는다.** 서명 검증이 Apple JWKS 를 원격 조회할 수 있어,
 * 트랜잭션 안에서 하면 HTTP 왕복 동안 DB 커넥션을 잡고 있게 된다(운영 Hikari 풀 10). 트랜잭션은
 * 이벤트 단위로 [AppleNotificationProcessor.process] 가 연다.
 */
@Service
class AppleNotificationService(
    private val appleNotificationVerifier: AppleNotificationVerifier,
    private val appleNotificationProcessor: AppleNotificationProcessor,
) {

    fun handleNotification(payload: String) {
        val notification = appleNotificationVerifier.verify(payload)
        if (notification.events.isEmpty()) {
            log.warn { "Apple 알림에 처리할 이벤트가 없다: jti=${notification.jti}" }
            return
        }

        notification.events.forEach { event ->
            try {
                appleNotificationProcessor.process(notification.jti, event)
            } catch (ex: DataIntegrityViolationException) {
                // 동일 알림이 동시에 두 번 도착해 감사 유니크 제약에 걸린 경우에만 성공으로 간주한다.
                //
                // 이 catch 는 트랜잭션 경계 바깥이라 **탈퇴 과정 전체의 제약 위반**을 받는다.
                // 예를 들어 최초 탈퇴가 동시에 일어나면 탈퇴 센티넬 계정 생성이 uk_member_email 에
                // 걸리는데(MemberService.getOrCreateWithdrawnSentinel 참고), 이것까지 삼키면
                // 회원은 남고 감사 기록도 없는 채로 Apple 에 200 을 돌려주게 된다.
                // Apple 은 재시도하지 않으므로 그대로 영구 누락이다.
                //
                // 그래서 제약명을 확인해 감사 중복일 때만 무시하고, 나머지는 다시 던져 5xx 로
                // 나가게 한다. 제약명을 얻지 못하면 판별 불가이므로 안전한 쪽(재시도)으로 던진다.
                if (!isDuplicateAuditInsert(ex)) {
                    throw ex
                }
                log.info { "Apple 알림 중복 처리 감지 — 무시한다. jti=${notification.jti}, type=${event.type}" }
            }
        }
    }

    /** 예외 원인 사슬을 따라가 감사 테이블의 재전송 방지 제약 위반인지 확인한다. */
    private fun isDuplicateAuditInsert(ex: DataIntegrityViolationException): Boolean {
        var cause: Throwable? = ex
        while (cause != null) {
            if (cause is ConstraintViolationException) {
                return cause.constraintName
                    ?.equals(APPLE_NOTIFICATION_AUDIT_UNIQUE_CONSTRAINT, ignoreCase = true) == true
            }
            cause = cause.cause
        }
        return false
    }
}
