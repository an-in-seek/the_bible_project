package com.elseeker.bible.adapter.output.jpa

import com.elseeker.bible.domain.model.BibleReadingProgress
import com.elseeker.member.domain.model.Member
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface BibleReadingProgressRepository : JpaRepository<BibleReadingProgress, Long> {

    fun findAllByMemberAndTranslationIdAndBookOrder(
        member: Member,
        translationId: Long,
        bookOrder: Int
    ): List<BibleReadingProgress>

    fun findAllByMemberUidAndTranslationIdAndBookOrder(
        memberUid: UUID,
        translationId: Long,
        bookOrder: Int
    ): List<BibleReadingProgress>

    fun existsByMemberAndTranslationIdAndBookOrderAndChapterNumber(
        member: Member,
        translationId: Long,
        bookOrder: Int,
        chapterNumber: Int
    ): Boolean

    fun existsByMemberUidAndTranslationIdAndBookOrderAndChapterNumber(
        memberUid: UUID,
        translationId: Long,
        bookOrder: Int,
        chapterNumber: Int
    ): Boolean

    fun deleteAllByMember(member: Member)

    @Modifying(flushAutomatically = true)
    @Query("DELETE FROM BibleReadingProgress progress WHERE progress.member.id = ?1")
    fun deleteAllByMemberId(memberId: Long)
}
