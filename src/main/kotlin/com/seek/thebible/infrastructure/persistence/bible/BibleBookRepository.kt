package com.seek.thebible.infrastructure.persistence.bible

import com.seek.thebible.domain.bible.model.BibleBook
import com.seek.thebible.domain.bible.model.BibleTranslation
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository

@Repository
interface BibleBookRepository : JpaRepository<BibleBook, Long> {

    fun findByTranslation(translation: BibleTranslation): List<BibleBook>

    @Query(
        """
            SELECT b
            FROM BibleBook b
            LEFT JOIN FETCH b.chapters
            WHERE b.id = :bookId
        """
    )
    fun findByIdWithChapters(bookId: Long): BibleBook?
}
