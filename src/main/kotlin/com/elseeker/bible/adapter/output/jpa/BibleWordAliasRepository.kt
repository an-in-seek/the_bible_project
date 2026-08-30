package com.elseeker.bible.adapter.output.jpa

import com.elseeker.bible.domain.model.BibleWordAlias
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface BibleWordAliasRepository : JpaRepository<BibleWordAlias, Long> {

    fun findByTranslationId(translationId: Long): List<BibleWordAlias>

    fun findByBibleWordId(bibleWordId: Long): List<BibleWordAlias>

    fun findByBibleWordIdIn(bibleWordIds: Collection<Long>): List<BibleWordAlias>

    fun existsByTranslationIdAndAlias(translationId: Long, alias: String): Boolean

    /** 관리자가 표제어 대신 별칭을 입력했을 때 부모 표제어로 되돌리는 데 쓴다. */
    fun findByTranslationIdAndAlias(translationId: Long, alias: String): BibleWordAlias?

    @Modifying(flushAutomatically = true)
    @Query("DELETE FROM BibleWordAlias a WHERE a.bibleWordId = :bibleWordId")
    fun deleteByBibleWordId(@Param("bibleWordId") bibleWordId: Long): Int
}
