package com.elseeker.game.adapter.output.jpa

import com.elseeker.game.domain.model.MemberDictionaryProgress
import com.elseeker.member.domain.model.Member
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface MemberDictionaryProgressRepository : JpaRepository<MemberDictionaryProgress, Long> {

    @Query(
        """
        SELECT p FROM MemberDictionaryProgress p
        WHERE p.member = :member
        AND p.dictionary.id = :dictionaryId
        """
    )
    fun findByMemberAndDictionaryId(
        @Param("member") member: Member,
        @Param("dictionaryId") dictionaryId: Long
    ): MemberDictionaryProgress?

    @Modifying
    @Query("DELETE FROM MemberDictionaryProgress p WHERE p.member.id = :memberId")
    fun deleteAllByMemberId(@Param("memberId") memberId: Long)
}
