package com.elseeker.auth.application.service

import com.elseeker.auth.application.component.AppleNotificationProcessor
import com.elseeker.common.security.oauth.apple.AppleNotificationVerifier
import io.github.oshai.kotlinlogging.KotlinLogging
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
                // 동일 알림이 동시에 두 번 도착해 유니크 제약(jti+type+sub)에 걸린 경우.
                // 다른 쪽 트랜잭션이 이미 처리했다는 뜻이므로 성공으로 간주한다.
                log.info(ex) { "Apple 알림 중복 처리 감지 — 무시한다. jti=${notification.jti}" }
            }
        }
    }
}
