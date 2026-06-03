package com.elseeker.game.adapter.output.jpa

import com.elseeker.game.domain.model.WordPuzzleHintUsage
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface WordPuzzleHintUsageRepository : JpaRepository<WordPuzzleHintUsage, Long> {

    @Modifying
    @Query(
        """
        DELETE FROM WordPuzzleHintUsage h
        WHERE h.attempt IN (
            SELECT a FROM WordPuzzleAttempt a WHERE a.member.id = :memberId
        )
        """
    )
    fun deleteAllByMemberId(@Param("memberId") memberId: Long)
}
