package com.elseeker.qna.adapter.output.jpa

import com.elseeker.member.domain.model.Member
import com.elseeker.qna.domain.model.ContactMessage
import com.elseeker.qna.domain.vo.ContactStatus
import com.elseeker.qna.domain.vo.InquiryCategory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface ContactMessageRepository : JpaRepository<ContactMessage, Long> {

    /** 관리자 목록 — 최신순 + 동적 필터(상태/카테고리/키워드). 회신자 fetch join. */
    @Query(
        value = """
        SELECT c FROM ContactMessage c
        LEFT JOIN FETCH c.repliedBy
        WHERE (:status   IS NULL OR c.status = :status)
          AND (:category IS NULL OR c.category = :category)
          AND (:keyword  IS NULL OR c.title LIKE :keyword OR c.content LIKE :keyword OR c.guestEmail LIKE :keyword)
        ORDER BY c.createdAt DESC
        """,
        countQuery = """
        SELECT count(c) FROM ContactMessage c
        WHERE (:status   IS NULL OR c.status = :status)
          AND (:category IS NULL OR c.category = :category)
          AND (:keyword  IS NULL OR c.title LIKE :keyword OR c.content LIKE :keyword OR c.guestEmail LIKE :keyword)
        """
    )
    fun findAdminPage(
        @Param("status") status: ContactStatus?,
        @Param("category") category: InquiryCategory?,
        @Param("keyword") keyword: String?,
        pageable: Pageable,
    ): Page<ContactMessage>

    /** 관리자 상세 / 변이 대상 로드. */
    @Query(
        """
        SELECT c FROM ContactMessage c
        LEFT JOIN FETCH c.repliedBy
        WHERE c.id = :id
        """
    )
    fun findByIdWithReplier(@Param("id") id: Long): ContactMessage?

    /** 회원(관리자) 탈퇴 시 회신자 참조 제거 — 회신 본문/시각은 보존하고 repliedBy만 NULL. */
    @Modifying
    @Query("UPDATE ContactMessage c SET c.repliedBy = null WHERE c.repliedBy.id = :memberId")
    fun clearReplier(@Param("memberId") memberId: Long): Int
}
