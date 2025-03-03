package com.seek.thebible.domain.bible.repository

import com.seek.thebible.domain.bible.model.BibleBook
import com.seek.thebible.domain.bible.model.BibleChapter
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface BibleChapterRepository : JpaRepository<BibleChapter, Long> {

    fun findByBook(book: BibleBook): List<BibleChapter>
    fun countByBookId(bookId: Long): Int
}
