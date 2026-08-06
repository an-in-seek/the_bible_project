package com.elseeker.common.security.oauth.result

import com.elseeker.member.domain.vo.MemberRole
import com.elseeker.member.domain.vo.MemberStatus
import java.util.UUID

/**
 * OAuth 로그인 과정에서 해석된 회원 정보.
 *
 * `open-in-view: false` 이므로 트랜잭션 경계 밖(=[com.elseeker.common.security.oauth.service.CustomOAuth2UserService])
 * 으로는 엔티티가 아니라 이 값을 내보낸다.
 */
data class OAuth2MemberResult(
    val uid: UUID,
    val email: String,
    val memberRole: MemberRole,
    val status: MemberStatus,
)
