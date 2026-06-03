package com.elseeker.bible.adapter.output.jpa

import com.elseeker.bible.domain.model.BibleVerseMemo
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
interface BibleMemoRepository : JpaRepository<BibleVerseMemo, Long> {

    fun deleteAllByMember(member: Member)

    @Modifying(flushAutomatically = true)
    @Query("DELETE FROM BibleVerseMemo memo WHERE memo.member.id = ?1")
    fun deleteAllByMemberId(memberId: Long)

    fun countByMemberUid(memberUid: UUID): Long

    fun countByMemberUidAndBookOrder(memberUid: UUID, bookOrder: Int): Long

    @Query(
        """
            SELECT
                m.id AS memoId,
                m.translationId AS translationId,
                m.bookOrder AS bookOrder,
                b.name AS bookName,
                m.chapterNumber AS chapterNumber,
                m.verseNumber AS verseNumber,
                m.content AS content,
                m.updatedAt AS updatedAt
            FROM BibleVerseMemo m
            JOIN BibleBook b
                ON b.translationId = m.translationId
               AND b.bookOrder = m.bookOrder
            WHERE m.member.uid = :memberUid
        """
    )
    fun findMemoItemsByMemberUid(memberUid: UUID, pageable: Pageable): Slice<BibleMemoItemProjection>

    @Query(
        """
            SELECT
                m.id AS memoId,
                m.translationId AS translationId,
                m.bookOrder AS bookOrder,
                b.name AS bookName,
                m.chapterNumber AS chapterNumber,
                m.verseNumber AS verseNumber,
                m.content AS content,
                m.updatedAt AS updatedAt
            FROM BibleVerseMemo m
            JOIN BibleBook b
                ON b.translationId = m.translationId
               AND b.bookOrder = m.bookOrder
            WHERE m.member.uid = :memberUid
              AND m.bookOrder = :bookOrder
        """
    )
    fun findMemoItemsByMemberUidAndBookOrder(
        memberUid: UUID,
        bookOrder: Int,
        pageable: Pageable
    ): Slice<BibleMemoItemProjection>

    @Query(
        """
            SELECT
                m.id AS memoId,
                m.translationId AS translationId,
                m.bookOrder AS bookOrder,
                b.name AS bookName,
                m.chapterNumber AS chapterNumber,
                m.verseNumber AS verseNumber,
                m.content AS content,
                m.updatedAt AS updatedAt
            FROM BibleVerseMemo m
            JOIN BibleBook b
                ON b.translationId = m.translationId
               AND b.bookOrder = m.bookOrder
            WHERE m.member.uid = :memberUid
              AND m.translationId = :translationId
        """
    )
    fun findMemoItemsByMemberUidAndTranslationId(
        memberUid: UUID,
        translationId: Long,
        pageable: Pageable
    ): Slice<BibleMemoItemProjection>

    @Query(
        """
            SELECT
                m.id AS memoId,
                m.translationId AS translationId,
                m.bookOrder AS bookOrder,
                b.name AS bookName,
                m.chapterNumber AS chapterNumber,
                m.verseNumber AS verseNumber,
                m.content AS content,
                m.updatedAt AS updatedAt
            FROM BibleVerseMemo m
            JOIN BibleBook b
                ON b.translationId = m.translationId
               AND b.bookOrder = m.bookOrder
            WHERE m.member.uid = :memberUid
              AND m.translationId = :translationId
              AND m.bookOrder = :bookOrder
        """
    )
    fun findMemoItemsByMemberUidAndTranslationIdAndBookOrder(
        memberUid: UUID,
        translationId: Long,
        bookOrder: Int,
        pageable: Pageable
    ): Slice<BibleMemoItemProjection>

    @Query("SELECT DISTINCT m.translationId FROM BibleVerseMemo m WHERE m.member.uid = :memberUid ORDER BY m.translationId")
    fun findDistinctTranslationIdsByMemberUid(memberUid: UUID): List<Long>

    @Query("SELECT DISTINCT m.bookOrder FROM BibleVerseMemo m WHERE m.member.uid = :memberUid AND m.translationId = :translationId ORDER BY m.bookOrder")
    fun findDistinctBookOrdersByMemberUidAndTranslationId(memberUid: UUID, translationId: Long): List<Int>

    fun countByMemberUidAndTranslationId(memberUid: UUID, translationId: Long): Long

    fun countByMemberUidAndTranslationIdAndBookOrder(memberUid: UUID, translationId: Long, bookOrder: Int): Long

    fun findAllByMemberUidAndTranslationIdAndBookOrderAndChapterNumber(
        memberUid: UUID,
        translationId: Long,
        bookOrder: Int,
        chapterNumber: Int
    ): List<BibleVerseMemo>

    fun findByMemberAndTranslationIdAndBookOrderAndChapterNumberAndVerseNumber(
        member: Member,
        translationId: Long,
        bookOrder: Int,
        chapterNumber: Int,
        verseNumber: Int
    ): BibleVerseMemo?

}

interface BibleMemoItemProjection {
    val memoId: Long
    val translationId: Long
    val bookOrder: Int
    val bookName: String
    val chapterNumber: Int
    val verseNumber: Int
    val content: String
    val updatedAt: Instant
}
