package com.elseeker.bible.adapter.output.jpa

import com.elseeker.bible.domain.model.BibleWord
import com.elseeker.bible.domain.vo.BibleWordCategory
import com.elseeker.bible.domain.vo.BibleWordStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface BibleWordRepository : JpaRepository<BibleWord, Long> {

    /** 재계산 시 어휘 전량을 한 번에 로드한다. 번역본당 6천~1만 행이라 부담이 없다. */
    fun findByTranslationId(translationId: Long): List<BibleWord>

    fun findByTranslationIdAndTerm(translationId: Long, term: String): BibleWord?

    fun existsByTranslationIdAndTerm(translationId: Long, term: String): Boolean

    fun countByTranslationIdAndStatus(translationId: Long, status: BibleWordStatus): Long

    @Query("SELECT w.term FROM BibleWord w WHERE w.translationId = :translationId")
    fun findTermsByTranslationId(@Param("translationId") translationId: Long): List<String>

    @Query(
        """
        SELECT w
        FROM BibleWord w
        WHERE w.translationId = :translationId
          AND (:status IS NULL OR w.status = :status)
          AND (:category IS NULL OR w.category = :category)
          AND (:term IS NULL OR w.term LIKE CONCAT('%', :term, '%'))
        """
    )
    fun findAllBy(
        @Param("translationId") translationId: Long,
        @Param("status") status: BibleWordStatus?,
        @Param("category") category: BibleWordCategory?,
        @Param("term") term: String?,
        pageable: Pageable,
    ): Page<BibleWord>
}
