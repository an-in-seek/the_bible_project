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
import java.time.Instant

/** 부모 댓글별 PUBLISHED 대댓글 수 집계 projection. */
interface ReplyCountProjection {
    val parentId: Long
    val count: Long
}

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

    /** 4-2-1 최상위 댓글만 작성순 페이징 (parent IS NULL). */
    @Query(
        """
        SELECT c FROM Comment c
        JOIN FETCH c.author
        WHERE c.post.id = :postId
          AND c.parent IS NULL
          AND c.status = :status
        ORDER BY c.createdAt ASC, c.id ASC
        """
    )
    fun findTopLevelByPostId(
        @Param("postId") postId: Long,
        @Param("status") status: CommentStatus,
        pageable: Pageable,
    ): Slice<Comment>

    /** 4-2-2 부모당 대댓글 미리보기(DB-side LIMIT) / 4-2-4 더보기 첫 페이지. parent도 페치해 응답 매핑 시 N+1 회피. */
    @Query(
        """
        SELECT c FROM Comment c
        JOIN FETCH c.author
        JOIN FETCH c.parent
        WHERE c.parent.id = :parentId
          AND c.status = :status
        ORDER BY c.createdAt ASC, c.id ASC
        """
    )
    fun findRepliesByParentId(
        @Param("parentId") parentId: Long,
        @Param("status") status: CommentStatus,
        pageable: Pageable,
    ): Slice<Comment>

    /** 4-2-4 "더 보기" keyset 커서 — (createdAt, id) 이후. parent도 페치해 응답 매핑 시 N+1 회피. */
    @Query(
        """
        SELECT c FROM Comment c
        JOIN FETCH c.author
        JOIN FETCH c.parent
        WHERE c.parent.id = :parentId
          AND c.status = :status
          AND (c.createdAt > :afterCreatedAt
               OR (c.createdAt = :afterCreatedAt AND c.id > :afterId))
        ORDER BY c.createdAt ASC, c.id ASC
        """
    )
    fun findRepliesByParentIdAfter(
        @Param("parentId") parentId: Long,
        @Param("status") status: CommentStatus,
        @Param("afterCreatedAt") afterCreatedAt: Instant,
        @Param("afterId") afterId: Long,
        pageable: Pageable,
    ): Slice<Comment>

    /** 7-3 cascade hide 대상 — 부모들의 PUBLISHED 자식 전량. (상태 변경 전용 — author 페치 불필요) */
    @Query(
        """
        SELECT c FROM Comment c
        WHERE c.parent.id IN :parentIds
          AND c.status = :status
        """
    )
    fun findRepliesByParentIds(
        @Param("parentIds") parentIds: Collection<Long>,
        @Param("status") status: CommentStatus,
    ): List<Comment>

    /** 7-3 cascade delete 대상 — 부모의 비-DELETED 자식 전량. */
    @Query(
        """
        SELECT c FROM Comment c
        WHERE c.parent.id = :parentId
          AND c.status <> :excluded
        """
    )
    fun findRepliesByParentIdAndStatusNot(
        @Param("parentId") parentId: Long,
        @Param("excluded") excluded: CommentStatus,
    ): List<Comment>

    /** 4-2-3 부모별 PUBLISHED 대댓글 수 집계. */
    @Query(
        """
        SELECT c.parent.id AS parentId, COUNT(c) AS count FROM Comment c
        WHERE c.parent.id IN :parentIds
          AND c.status = :status
        GROUP BY c.parent.id
        """
    )
    fun countRepliesByParentIds(
        @Param("parentIds") parentIds: Collection<Long>,
        @Param("status") status: CommentStatus,
    ): List<ReplyCountProjection>

    /**
     * 4-3 C1 — 대댓글 작성 가드 / 댓글 수정용. author·post·parent를 함께 페치해 LAZY N+1 회피.
     * 최상위 부모는 parent가 null이므로 LEFT FETCH.
     */
    @Query(
        """
        SELECT c FROM Comment c
        JOIN FETCH c.author
        JOIN FETCH c.post
        LEFT JOIN FETCH c.parent
        WHERE c.id = :id
        """
    )
    fun findByIdWithParentAndPost(@Param("id") id: Long): Comment?

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
