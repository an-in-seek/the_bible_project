package com.seek.thebible.domain.bible.repository

import com.seek.thebible.domain.bible.model.BibleTranslation
import com.seek.thebible.domain.bible.model.BibleTranslationType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface BibleTranslationRepository : JpaRepository<BibleTranslation, Long> {

    fun findByTranslationType(translationType: BibleTranslationType): BibleTranslation?
}
