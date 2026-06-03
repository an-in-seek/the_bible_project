package com.elseeker.game.adapter.output.jpa

import com.elseeker.game.domain.model.WordPuzzleAttemptCell
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface WordPuzzleAttemptCellRepository : JpaRepository<WordPuzzleAttemptCell, Long> {

    @Query(
        """
        SELECT c FROM WordPuzzleAttemptCell c
        WHERE c.attempt.id = :attemptId
        ORDER BY c.rowIndex ASC, c.colIndex ASC
        """
    )
    fun findAllByAttemptId(@Param("attemptId") attemptId: Long): List<WordPuzzleAttemptCell>

    @Query(
        """
        SELECT c FROM WordPuzzleAttemptCell c
        WHERE c.attempt.id = :attemptId
        AND c.rowIndex = :row
        AND c.colIndex = :col
        """
    )
    fun findByAttemptIdAndPosition(
        @Param("attemptId") attemptId: Long,
        @Param("row") row: Int,
        @Param("col") col: Int
    ): WordPuzzleAttemptCell?

    @Modifying
    @Query(
        """
        DELETE FROM WordPuzzleAttemptCell c
        WHERE c.attempt IN (
            SELECT a FROM WordPuzzleAttempt a WHERE a.member.id = :memberId
        )
        """
    )
    fun deleteAllByMemberId(@Param("memberId") memberId: Long)
}
