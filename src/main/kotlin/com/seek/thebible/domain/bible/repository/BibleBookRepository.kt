package com.seek.thebible.domain.bible.repository

import com.seek.thebible.domain.bible.model.BibleBook
import com.seek.thebible.domain.bible.model.BibleTestament
import com.seek.thebible.domain.bible.model.BibleTranslation
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface BibleBookRepository : JpaRepository<BibleBook, Long> {

    fun findByTranslationAndName(translation: BibleTranslation, name: String): BibleBook?

    fun findByTranslationAndTestament(translation: BibleTranslation, testament: BibleTestament): List<BibleBook>

    fun findByTranslation(translation: BibleTranslation): List<BibleBook>
}
