package com.elseeker.community.adapter.output.jpa

import com.elseeker.community.domain.model.Post
import com.elseeker.community.domain.vo.PostStatus
import com.elseeker.member.domain.model.Member
import com.linecorp.kotlinjdsl.support.spring.data.jpa.repository.KotlinJdslJpqlExecutor
import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface PostRepository : JpaRepository<Post, Long>, KotlinJdslJpqlExecutor {

    @Query(
        """
        SELECT p FROM Post p
        JOIN FETCH p.author
        WHERE p.id = :id AND p.status <> :excludedStatus
        """
    )
    fun findByIdAndStatusNot(
        @Param("id") id: Long,
        @Param("excludedStatus") excludedStatus: PostStatus,
    ): Post?

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(
        """
        SELECT p FROM Post p
        WHERE p.id = :id AND p.status <> :excludedStatus
        """
    )
    fun findByIdAndStatusNotForUpdate(
        @Param("id") id: Long,
        @Param("excludedStatus") excludedStatus: PostStatus,
    ): Post?

    @Query(
        """
        SELECT p FROM Post p
        JOIN FETCH p.author
        WHERE p.id = :id
        """
    )
    fun findByIdWithAuthor(@Param("id") id: Long): Post?

    @Modifying
    @Query("UPDATE Post p SET p.statistics.viewCount = p.statistics.viewCount + 1 WHERE p.id = :postId")
    fun incrementViewCount(@Param("postId") postId: Long): Int

    @Modifying
    @Query("UPDATE Post p SET p.statistics.commentCount = p.statistics.commentCount + 1 WHERE p.id = :postId")
    fun incrementCommentCount(@Param("postId") postId: Long): Int

    @Modifying
    @Query("UPDATE Post p SET p.statistics.commentCount = p.statistics.commentCount - 1 WHERE p.id = :postId AND p.statistics.commentCount > 0")
    fun decrementCommentCount(@Param("postId") postId: Long): Int

    /** 7-3 부모+자식 N건 1회 벌크 차감. GREATEST 가드로 음수 방지 (H2/PostgreSQL 모두 지원). */
    @Modifying
    @Query("UPDATE Post p SET p.statistics.commentCount = GREATEST(p.statistics.commentCount - :n, 0) WHERE p.id = :postId")
    fun decrementCommentCountBy(@Param("postId") postId: Long, @Param("n") n: Long): Int

    /** 5-2-1 벌크 UPDATE 후 fresh scalar 조회 (findById는 L1 stale). */
    @Query("SELECT p.statistics.commentCount FROM Post p WHERE p.id = :postId")
    fun findCommentCountByPostId(@Param("postId") postId: Long): Long

    @Modifying
    @Query(
        """
        UPDATE Post p
        SET p.statistics.score = p.statistics.viewCount + (p.statistics.reactionCount * 5) + (p.statistics.commentCount * 3)
        WHERE p.id = :postId
        """
    )
    fun updateScore(@Param("postId") postId: Long): Int

    /** 회원 탈퇴 시 작성자를 익명(탈퇴 회원) 센티넬 계정으로 재지정 — 게시글은 보존. */
    @Modifying
    @Query("UPDATE Post p SET p.author = :sentinel WHERE p.author.id = :memberId")
    fun reassignAuthor(@Param("memberId") memberId: Long, @Param("sentinel") sentinel: Member): Int
}
