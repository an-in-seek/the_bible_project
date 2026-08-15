package com.elseeker.auth.adapter.output.jpa

import com.elseeker.auth.domain.model.AppleNotificationAudit
import org.springframework.data.jpa.repository.JpaRepository

interface AppleNotificationAuditRepository : JpaRepository<AppleNotificationAudit, Long> {

    /**
     * 같은 이벤트를 이미 처리했는지 확인한다. Apple 재전송에 대한 멱등성 확보용.
     *
     * 한 토큰(`jti`)에 여러 이벤트가 담길 수 있으므로 `jti` 단독으로 판단하면 두 번째 이벤트가
     * 첫 번째 때문에 통째로 건너뛰어진다. 유니크 제약과 같은 세 컬럼으로 판별해야 한다.
     */
    fun existsByJtiAndEventTypeAndAppleSub(jti: String, eventType: String, appleSub: String): Boolean
}
