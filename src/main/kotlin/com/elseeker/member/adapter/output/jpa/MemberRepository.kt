package com.elseeker.member.adapter.output.jpa

import com.elseeker.member.domain.model.Member
import com.elseeker.member.domain.vo.MemberStatus
import jakarta.persistence.LockModeType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant
import java.util.UUID

interface MemberRepository : JpaRepository<Member, Long> {
    fun findByEmail(email: String): Member?
    fun findByUid(uid: UUID): Member?
    fun existsByNicknameIgnoreCaseAndIdNot(nickname: String, id: Long): Boolean

    /**
     * 동의 처리 동시성 방어용 — 행 잠금(PESSIMISTIC_WRITE)으로 회원 조회.
     * 동일 회원에 대한 동시 동의 제출이 직렬화되어 동의 이력 중복/중복 활성화를 막는다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM Member m WHERE m.uid = :uid")
    fun findByUidForUpdate(@Param("uid") uid: UUID): Member?

    /** 정리 배치용 — 특정 상태이면서 생성 시각이 기준 이전인 회원 조회. */
    fun findByStatusAndCreatedAtBefore(status: MemberStatus, threshold: Instant): List<Member>

    @Query(
        """
        SELECT member.id
        FROM Member member
        WHERE member.uid = :uid
        """
    )
    fun findIdByUid(@Param("uid") uid: UUID): Long?

    @Query(
        """
        SELECT member
        FROM Member member
        LEFT JOIN FETCH member.oauthAccounts
        WHERE member.uid = :uid
        """
    )
    fun findWithOAuthAccountsByUid(@Param("uid") uid: UUID): Member?

    @Query(
        value = """
            SELECT
                (SELECT COUNT(*) FROM bible_book_memo book_memo WHERE book_memo.member_id = m.id) AS book,
                (SELECT COUNT(*) FROM bible_chapter_memo chapter_memo WHERE chapter_memo.member_id = m.id) AS chapter,
                (SELECT COUNT(*) FROM bible_verse_memo verse_memo WHERE verse_memo.member_id = m.id) AS verse
            FROM member m
            WHERE m.uid = :uid
        """,
        nativeQuery = true
    )
    fun findMemoCountsByUid(@Param("uid") uid: UUID): MemberMemoCountsProjection?

    @Query(
        """
        SELECT member
        FROM Member member
        WHERE (:keyword IS NULL OR :keyword = '' OR
            LOWER(member.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(member.nickname) LIKE LOWER(CONCAT('%', :keyword, '%')))
        """
    )
    fun searchByKeyword(@Param("keyword") keyword: String?, pageable: Pageable): Page<Member>

    @Query(
        """
        SELECT member
        FROM Member member
        LEFT JOIN FETCH member.oauthAccounts
        WHERE member.id = :id
        """
    )
    fun findWithOAuthAccountsById(@Param("id") id: Long): Member?
}

interface MemberMemoCountsProjection {
    val book: Long
    val chapter: Long
    val verse: Long
}
