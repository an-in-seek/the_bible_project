package com.seek.thebible.application.bible

import com.seek.thebible.application.bible.dto.*
import com.seek.thebible.domain.bible.service.BibleReader
import org.springframework.stereotype.Service

@Service
class BibleFacade(
    private val bibleReader: BibleReader
) {

    /**
     * 📌 번역본 리스트 조회
     */
    fun getTranslations(): List<TranslationResult> {
        return bibleReader.getTranslations()
    }

    /**
     * 📌 특정 번역본에 해당하는 책 리스트 조회
     */
    fun getBooks(translationId: Long): List<BookResult> {
        return bibleReader.getBooks(translationId)
    }

    /**
     * 📌 특정 책에 해당하는 장 리스트 조회
     */
    fun getChapters(translationId: Long, bookId: Long): List<ChapterResult> {
        return bibleReader.getChapters(translationId, bookId)
    }

    /**
     * 📌 특정 장에 해당하는 절 리스트 조회
     */
    fun getVerses(translationId: Long, bookId: Long, chapterId: Long): List<VerseResult> {
        return bibleReader.getVerses(translationId, bookId, chapterId)
    }

    /**
     * 📌 성경 구절 검색 (키워드 포함) - 다중 번역본에서 검색
     */
    fun searchBibleVerses(keyword: String): List<SearchVerseResult> {
        val verses = bibleReader.searchBibleVerses(keyword)
        return verses.map { verse ->
            SearchVerseResult(
                verseId = verse.id!!,
                bookName = verse.chapter.book.name,
                chapterNumber = verse.chapter.chapterNumber,
                verseNumber = verse.verseNumber,
                text = verse.text
            )
        }
    }
}
