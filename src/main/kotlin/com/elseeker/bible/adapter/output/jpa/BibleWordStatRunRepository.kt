package com.elseeker.bible.adapter.output.jpa

import com.elseeker.bible.domain.model.BibleWordStatRun
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface BibleWordStatRunRepository : JpaRepository<BibleWordStatRun, Long> {

    fun findByTranslationIdAndBookOrder(translationId: Long, bookOrder: Int): BibleWordStatRun?

    fun findByTranslationIdOrderByBookOrder(translationId: Long): List<BibleWordStatRun>
}
