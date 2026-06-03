package com.elseeker.member.application.component

import com.elseeker.member.adapter.output.jpa.MemberRepository
import com.elseeker.member.domain.model.Member
import com.elseeker.member.domain.vo.MemberRole
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

/**
 * 회원 탈퇴 시 커뮤니티 글의 작성자를 넘겨받는 익명 센티넬 계정 생성 전용 컴포넌트.
 *
 * 생성을 [Propagation.REQUIRES_NEW] 트랜잭션으로 격리하여, 동시 최초 탈퇴 레이스에서
 * 이메일 unique 제약 위반이 발생하더라도 호출자(탈퇴) 트랜잭션이 rollback-only로 오염되지 않게 한다.
 * 위반 처리(재조회)는 호출자가 담당한다.
 */
@Component
class WithdrawnSentinelProvider(
    private val memberRepository: MemberRepository,
) {

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun create(email: String, nickname: String): Member =
        memberRepository.saveAndFlush(
            Member.create(
                email = email,
                nickname = nickname,
                profileImageUrl = null,
                memberRole = MemberRole.USER,
            )
        )
}
