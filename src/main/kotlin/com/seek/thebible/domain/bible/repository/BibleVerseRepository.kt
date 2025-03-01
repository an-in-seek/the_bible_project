package com.seek.thebible.domain.bible.repository

import com.seek.thebible.domain.bible.model.BibleChapter
import com.seek.thebible.domain.bible.model.BibleVerse
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface BibleVerseRepository : JpaRepository<BibleVerse, Long> {

    fun findByChapterAndVerseNumber(chapter: BibleChapter, verseNumber: Int): BibleVerse?

    fun findByChapter(chapter: BibleChapter): List<BibleVerse>

    fun findByTextContaining(keyword: String): List<BibleVerse>
}
