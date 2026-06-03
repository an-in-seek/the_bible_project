package com.elseeker.game.adapter.output.jpa

import com.elseeker.game.domain.model.OxMemberQuestionAttempt
import com.elseeker.game.domain.model.OxMemberStageAttempt
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface OxMemberQuestionAttemptRepository : JpaRepository<OxMemberQuestionAttempt, Long> {

    @Query(
        """
        SELECT qa FROM OxMemberQuestionAttempt qa
        WHERE qa.stageAttempt = :stageAttempt
        ORDER BY qa.answeredAt ASC
        """
    )
    fun findByStageAttempt(@Param("stageAttempt") stageAttempt: OxMemberStageAttempt): List<OxMemberQuestionAttempt>

    @Query(
        """
        SELECT qa FROM OxMemberQuestionAttempt qa
        WHERE qa.stageAttempt = :stageAttempt
        AND qa.question.id = :questionId
        """
    )
    fun findByStageAttemptAndQuestionId(
        @Param("stageAttempt") stageAttempt: OxMemberStageAttempt,
        @Param("questionId") questionId: Long
    ): OxMemberQuestionAttempt?

    @Query(
        """
        SELECT COUNT(qa) FROM OxMemberQuestionAttempt qa
        WHERE qa.stageAttempt = :stageAttempt
        AND qa.isCorrect = true
        """
    )
    fun countCorrectByStageAttempt(@Param("stageAttempt") stageAttempt: OxMemberStageAttempt): Long

    fun existsByStageAttemptAndQuestionId(stageAttempt: OxMemberStageAttempt, questionId: Long): Boolean

    @Modifying
    @Query(
        """
        DELETE FROM OxMemberQuestionAttempt qa
        WHERE qa.stageAttempt IN (
            SELECT sa FROM OxMemberStageAttempt sa WHERE sa.member.id = :memberId
        )
        """
    )
    fun deleteAllByMemberId(@Param("memberId") memberId: Long)
}
