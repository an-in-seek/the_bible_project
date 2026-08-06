package com.elseeker.study.adapter.output.jpa

import com.elseeker.study.domain.model.Dictionary
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

/**
 * 한글 사전 정렬에는 ICU 콜레이션 `ko-KR-x-icu` 를 쓴다.
 *
 * libc 콜레이션(`ko_KR.utf8`)은 OS 에 해당 로케일이 생성돼 있어야 하는데, Supabase 의 DB 는
 * `en_US.UTF-8` 로만 초기화돼 있고 관리형이라 로케일을 추가할 수 없다. 그대로 두면 조회 시점에
 * `collation "ko_KR.utf8" for encoding "UTF8" does not exist` 로 터진다.
 * ICU 콜레이션은 OS 로케일과 무관하게 PostgreSQL 이 들고 있어 Supabase 와 테스트용 `postgres:17`
 * 컨테이너 양쪽에 모두 존재한다 (실측 확인).
 */
@Repository
interface DictionaryRepository : JpaRepository<Dictionary, Long> {

    @Query(
        value = """
        SELECT *
        FROM dictionary d
        ORDER BY d.term COLLATE "ko-KR-x-icu"
        """,
        countQuery = "SELECT count(*) FROM dictionary",
        nativeQuery = true
    )
    fun findAllOrderByKo(pageable: Pageable): Page<Dictionary>

    @Query(
        value = """
        SELECT *
        FROM dictionary d
        WHERE d.term ILIKE CONCAT('%', :term, '%')
        ORDER BY d.term COLLATE "ko-KR-x-icu"
        """,
        countQuery = """
        SELECT count(*)
        FROM dictionary d
        WHERE d.term ILIKE CONCAT('%', :term, '%')
        """,
        nativeQuery = true
    )
    fun findByTermContainingKo(@Param("term") term: String, pageable: Pageable): Page<Dictionary>

    @Query(
        """
        SELECT CASE WHEN COUNT(d) > 0 THEN true ELSE false END
        FROM Dictionary d
        WHERE LOWER(d.term) = LOWER(:term)
        """
    )
    fun existsByExactTermIgnoreCase(@Param("term") term: String): Boolean

    @Query(
        """
        SELECT d FROM Dictionary d
        LEFT JOIN FETCH d.references
        WHERE d.id IN :ids
        ORDER BY d.term ASC
        """
    )
    fun findAllByIdWithReferences(@Param("ids") ids: List<Long>): List<Dictionary>
}
