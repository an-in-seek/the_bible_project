package com.elseeker.bible.adapter.output.jpa

import com.elseeker.bible.domain.model.BibleBookMemo
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
interface BibleBookMemoRepository : JpaRepository<BibleBookMemo, Long> {

    fun findByMemberUidAndTranslationIdAndBookOrder(
        memberUid: UUID,
        translationId: Long,
        bookOrder: Int
    ): BibleBookMemo?

    fun findByMemberAndTranslationIdAndBookOrder(
        member: Member,
        translationId: Long,
        bookOrder: Int
    ): BibleBookMemo?

    fun deleteAllByMember(member: Member)

    @Modifying(flushAutomatically = true)
    @Query("DELETE FROM BibleBookMemo memo WHERE memo.member.id = ?1")
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
                m.id AS bookMemoId,
                m.translationId AS translationId,
                m.bookOrder AS bookOrder,
                b.name AS bookName,
                m.content AS content,
                m.updatedAt AS updatedAt
            FROM BibleBookMemo m
            JOIN BibleBook b
                ON b.translationId = m.translationId
               AND b.bookOrder = m.bookOrder
            WHERE m.member.uid = :memberUid
        """
    )
    fun findBookMemoItemsByMemberUid(memberUid: UUID, pageable: Pageable): Slice<BibleBookMemoItemProjection>

    @Query(
        """
            SELECT
                m.id AS bookMemoId,
                m.translationId AS translationId,
                m.bookOrder AS bookOrder,
                b.name AS bookName,
                m.content AS content,
                m.updatedAt AS updatedAt
            FROM BibleBookMemo m
            JOIN BibleBook b
                ON b.translationId = m.translationId
               AND b.bookOrder = m.bookOrder
            WHERE m.member.uid = :memberUid
              AND m.translationId = :translationId
        """
    )
    fun findBookMemoItemsByMemberUidAndTranslationId(
        memberUid: UUID,
        translationId: Long,
        pageable: Pageable
    ): Slice<BibleBookMemoItemProjection>

    @Query(
        """
            SELECT
                m.id AS bookMemoId,
                m.translationId AS translationId,
                m.bookOrder AS bookOrder,
                b.name AS bookName,
                m.content AS content,
                m.updatedAt AS updatedAt
            FROM BibleBookMemo m
            JOIN BibleBook b
                ON b.translationId = m.translationId
               AND b.bookOrder = m.bookOrder
            WHERE m.member.uid = :memberUid
              AND m.translationId = :translationId
              AND m.bookOrder = :bookOrder
        """
    )
    fun findBookMemoItemsByMemberUidAndTranslationIdAndBookOrder(
        memberUid: UUID,
        translationId: Long,
        bookOrder: Int,
        pageable: Pageable
    ): Slice<BibleBookMemoItemProjection>

    @Query("SELECT DISTINCT m.translationId FROM BibleBookMemo m WHERE m.member.uid = :memberUid ORDER BY m.translationId")
    fun findDistinctTranslationIdsByMemberUid(memberUid: UUID): List<Long>

    @Query("SELECT DISTINCT m.bookOrder FROM BibleBookMemo m WHERE m.member.uid = :memberUid AND m.translationId = :translationId ORDER BY m.bookOrder")
    fun findDistinctBookOrdersByMemberUidAndTranslationId(memberUid: UUID, translationId: Long): List<Int>
}

interface BibleBookMemoItemProjection {
    val bookMemoId: Long
    val translationId: Long
    val bookOrder: Int
    val bookName: String
    val content: String
    val updatedAt: Instant
}
