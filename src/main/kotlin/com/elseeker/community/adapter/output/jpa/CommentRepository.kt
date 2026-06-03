package com.elseeker.community.adapter.output.jpa

import com.elseeker.community.domain.model.Comment
import com.elseeker.community.domain.vo.CommentStatus
import com.elseeker.member.domain.model.Member
import jakarta.persistence.LockModeType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Slice
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface CommentRepository : JpaRepository<Comment, Long> {

    @Query(
        """
        SELECT c FROM Comment c
        JOIN FETCH c.author
        WHERE c.post.id = :postId
          AND c.status = :status
        ORDER BY c.createdAt ASC
        """
    )
    fun findByPostIdWithAuthor(
        @Param("postId") postId: Long,
        @Param("status") status: CommentStatus,
        pageable: Pageable,
    ): Slice<Comment>

    @Query(
        """
        SELECT c FROM Comment c
        JOIN FETCH c.author
        WHERE c.id = :id
        """
    )
    fun findByIdWithAuthor(@Param("id") id: Long): Comment?

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(
        """
        SELECT c FROM Comment c
        JOIN FETCH c.author
        JOIN FETCH c.post
        WHERE c.id = :id
        """
    )
    fun findByIdWithAuthorAndPostForUpdate(@Param("id") id: Long): Comment?

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(
        """
        SELECT c FROM Comment c
        WHERE c.id = :id AND c.status <> :excludedStatus
        """
    )
    fun findByIdAndStatusNotForUpdate(
        @Param("id") id: Long,
        @Param("excludedStatus") excludedStatus: CommentStatus,
    ): Comment?

    @Query(
        value = """
        SELECT c FROM Comment c
        JOIN FETCH c.author
        JOIN FETCH c.post p
        WHERE (:status IS NULL OR c.status = :status)
          AND (:postId IS NULL OR p.id = :postId)
          AND (:commentId IS NULL OR c.id = :commentId)
          AND (:keyword IS NULL OR c.content LIKE :keyword)
          AND (:author IS NULL OR c.author.nickname LIKE :author)
        ORDER BY c.createdAt DESC
        """,
        countQuery = """
        SELECT count(c) FROM Comment c
        WHERE (:status IS NULL OR c.status = :status)
          AND (:postId IS NULL OR c.post.id = :postId)
          AND (:commentId IS NULL OR c.id = :commentId)
          AND (:keyword IS NULL OR c.content LIKE :keyword)
          AND (:author IS NULL OR c.author.nickname LIKE :author)
        """
    )
    fun findAdminPage(
        @Param("status") status: CommentStatus?,
        @Param("postId") postId: Long?,
        @Param("commentId") commentId: Long?,
        @Param("keyword") keyword: String?,
        @Param("author") author: String?,
        pageable: Pageable,
    ): Page<Comment>

    /** 회원 탈퇴 시 작성자를 익명(탈퇴 회원) 센티넬 계정으로 재지정 — 댓글은 보존. */
    @Modifying
    @Query("UPDATE Comment c SET c.author = :sentinel WHERE c.author.id = :memberId")
    fun reassignAuthor(@Param("memberId") memberId: Long, @Param("sentinel") sentinel: Member): Int

}
