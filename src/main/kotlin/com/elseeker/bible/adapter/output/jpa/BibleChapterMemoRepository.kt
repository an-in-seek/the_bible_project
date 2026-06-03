package com.elseeker.bible.adapter.output.jpa

import com.elseeker.bible.domain.model.BibleChapterMemo
import com.elseeker.member.domain.model.Member
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Slice
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.*

@Repository
interface BibleChapterMemoRepository : JpaRepository<BibleChapterMemo, Long> {

    fun findByMemberUidAndTranslationIdAndBookOrderAndChapterNumber(
        memberUid: UUID,
        translationId: Long,
        bookOrder: Int,
        chapterNumber: Int
    ): BibleChapterMemo?

    fun findByMemberAndTranslationIdAndBookOrderAndChapterNumber(
        member: Member,
        translationId: Long,
        bookOrder: Int,
        chapterNumber: Int
    ): BibleChapterMemo?

    fun deleteAllByMember(member: Member)

    @Modifying(flushAutomatically = true)
    @Query("DELETE FROM BibleChapterMemo memo WHERE memo.member.id = ?1")
    fun deleteAllByMemberId(memberId: Long)

    fun countByMemberUid(memberUid: UUID): Long

    fun countByMemberUidAndTranslationId(memberUid: UUID, translationId: Long): Long

    fun countByMemberUidAndTranslationIdAndBookOrder(
        memberUid: UUID,
        translationId: Long,
        bookOrder: Int
    ): Long

    @Query(
        """
            SELECT
                m.id AS chapterMemoId,
                m.translationId AS translationId,
                m.bookOrder AS bookOrder,
                b.name AS bookName,
                m.chapterNumber AS chapterNumber,
                m.content AS content,
                m.updatedAt AS updatedAt
            FROM BibleChapterMemo m
            JOIN BibleBook b
                ON b.translationId = m.translationId
               AND b.bookOrder = m.bookOrder
            WHERE m.member.uid = :memberUid
        """
    )
    fun findChapterMemoItemsByMemberUid(memberUid: UUID, pageable: Pageable): Slice<BibleChapterMemoItemProjection>

    @Query(
        """
            SELECT
                m.id AS chapterMemoId,
                m.translationId AS translationId,
                m.bookOrder AS bookOrder,
                b.name AS bookName,
                m.chapterNumber AS chapterNumber,
                m.content AS content,
                m.updatedAt AS updatedAt
            FROM BibleChapterMemo m
            JOIN BibleBook b
                ON b.translationId = m.translationId
               AND b.bookOrder = m.bookOrder
            WHERE m.member.uid = :memberUid
              AND m.translationId = :translationId
        """
    )
    fun findChapterMemoItemsByMemberUidAndTranslationId(
        memberUid: UUID,
        translationId: Long,
        pageable: Pageable
    ): Slice<BibleChapterMemoItemProjection>

    @Query(
        """
            SELECT
                m.id AS chapterMemoId,
                m.translationId AS translationId,
                m.bookOrder AS bookOrder,
                b.name AS bookName,
                m.chapterNumber AS chapterNumber,
                m.content AS content,
                m.updatedAt AS updatedAt
            FROM BibleChapterMemo m
            JOIN BibleBook b
                ON b.translationId = m.translationId
               AND b.bookOrder = m.bookOrder
            WHERE m.member.uid = :memberUid
              AND m.translationId = :translationId
              AND m.bookOrder = :bookOrder
        """
    )
    fun findChapterMemoItemsByMemberUidAndTranslationIdAndBookOrder(
        memberUid: UUID,
        translationId: Long,
        bookOrder: Int,
        pageable: Pageable
    ): Slice<BibleChapterMemoItemProjection>

    @Query("SELECT DISTINCT m.translationId FROM BibleChapterMemo m WHERE m.member.uid = :memberUid ORDER BY m.translationId")
    fun findDistinctTranslationIdsByMemberUid(memberUid: UUID): List<Long>

    @Query("SELECT DISTINCT m.bookOrder FROM BibleChapterMemo m WHERE m.member.uid = :memberUid AND m.translationId = :translationId ORDER BY m.bookOrder")
    fun findDistinctBookOrdersByMemberUidAndTranslationId(memberUid: UUID, translationId: Long): List<Int>
}

interface BibleChapterMemoItemProjection {
    val chapterMemoId: Long
    val translationId: Long
    val bookOrder: Int
    val bookName: String
    val chapterNumber: Int
    val content: String
    val updatedAt: Instant
}
