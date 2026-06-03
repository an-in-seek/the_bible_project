package com.elseeker.member.adapter.output.jpa

import com.elseeker.member.domain.model.MemberConsentAudit
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface MemberConsentAuditRepository : JpaRepository<MemberConsentAudit, Long> {
    fun findAllByMemberUid(memberUid: UUID): List<MemberConsentAudit>
}
