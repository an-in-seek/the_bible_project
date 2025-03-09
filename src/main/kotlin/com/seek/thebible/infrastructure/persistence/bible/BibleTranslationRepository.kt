package com.seek.thebible.infrastructure.persistence.bible

import com.seek.thebible.domain.bible.model.BibleTranslation
import com.seek.thebible.domain.bible.model.BibleTranslationType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface BibleTranslationRepository : JpaRepository<BibleTranslation, Long> {

    fun findAllByTranslationTypeInOrderByTranslationOrder(translationTypes: Set<BibleTranslationType>): List<BibleTranslation>
}
