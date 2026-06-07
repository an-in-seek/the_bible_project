package com.elseeker.qna.adapter.output.jpa

import com.elseeker.member.domain.model.Member
import com.elseeker.qna.domain.model.Inquiry
import com.elseeker.qna.domain.vo.InquiryCategory
import com.elseeker.qna.domain.vo.InquiryStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface InquiryRepository : JpaRepository<Inquiry, Long> {

    /** 내 문의 목록 — 작성자별 최신순. 목록 응답은 작성자 필드를 쓰지 않으므로 fetch join 불필요. */
    @Query(
        value = """
        SELECT i FROM Inquiry i
        WHERE i.author.id = :authorId
          AND i.status <> :excludedStatus
          AND (:status IS NULL OR i.status = :status)
        ORDER BY i.createdAt DESC
        """,
        countQuery = """
        SELECT count(i) FROM Inquiry i
        WHERE i.author.id = :authorId
          AND i.status <> :excludedStatus
          AND (:status IS NULL OR i.status = :status)
        """
    )
    fun findPageByAuthorId(
        @Param("authorId") authorId: Long,
        @Param("excludedStatus") excludedStatus: InquiryStatus,
        @Param("status") status: InquiryStatus?,
        pageable: Pageable,
    ): Page<Inquiry>

    /** 내 문의 상세 / 소유 검증 — 본인 소유 + 비삭제만. */
    @Query(
        """
        SELECT i FROM Inquiry i
        JOIN FETCH i.author
        LEFT JOIN FETCH i.answeredBy
        WHERE i.id = :id
          AND i.author.id = :authorId
          AND i.status <> :excludedStatus
        """
    )
    fun findByIdAndAuthorId(
        @Param("id") id: Long,
        @Param("authorId") authorId: Long,
        @Param("excludedStatus") excludedStatus: InquiryStatus,
    ): Inquiry?

    /** 관리자 상세 / 변이 대상 로드 — 비삭제만. */
    @Query(
        """
        SELECT i FROM Inquiry i
        JOIN FETCH i.author
        LEFT JOIN FETCH i.answeredBy
        WHERE i.id = :id
          AND i.status <> :excludedStatus
        """
    )
    fun findByIdWithAuthorAndAnswerer(
        @Param("id") id: Long,
        @Param("excludedStatus") excludedStatus: InquiryStatus,
    ): Inquiry?

    /** 관리자 목록 — DELETED 제외 + 동적 필터 + countQuery. */
    @Query(
        value = """
        SELECT i FROM Inquiry i
        JOIN FETCH i.author
        LEFT JOIN FETCH i.answeredBy
        WHERE i.status <> :excludedStatus
          AND (:status   IS NULL OR i.status = :status)
          AND (:category IS NULL OR i.category = :category)
          AND (:keyword  IS NULL OR i.title LIKE :keyword OR i.content LIKE :keyword)
          AND (:author   IS NULL OR i.author.nickname LIKE :author)
        ORDER BY i.createdAt DESC
        """,
        countQuery = """
        SELECT count(i) FROM Inquiry i
        WHERE i.status <> :excludedStatus
          AND (:status   IS NULL OR i.status = :status)
          AND (:category IS NULL OR i.category = :category)
          AND (:keyword  IS NULL OR i.title LIKE :keyword OR i.content LIKE :keyword)
          AND (:author   IS NULL OR i.author.nickname LIKE :author)
        """
    )
    fun findAdminPage(
        @Param("excludedStatus") excludedStatus: InquiryStatus,
        @Param("status") status: InquiryStatus?,
        @Param("category") category: InquiryCategory?,
        @Param("keyword") keyword: String?,
        @Param("author") author: String?,
        pageable: Pageable,
    ): Page<Inquiry>

    /** 회원 탈퇴 시 작성자를 익명(탈퇴 회원) 센티넬 계정으로 재지정 — 문의 보존. */
    @Modifying
    @Query("UPDATE Inquiry i SET i.author = :sentinel WHERE i.author.id = :memberId")
    fun reassignAuthor(@Param("memberId") memberId: Long, @Param("sentinel") sentinel: Member): Int

    /** 회원 탈퇴 시 답변자 참조 제거 — 답변 본문/시각은 보존하고 answeredBy만 NULL. */
    @Modifying
    @Query("UPDATE Inquiry i SET i.answeredBy = null WHERE i.answeredBy.id = :memberId")
    fun clearAnswerer(@Param("memberId") memberId: Long): Int
}
