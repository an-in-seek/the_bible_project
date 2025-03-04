package com.seek.thebible.application.bible

import com.seek.thebible.domain.bible.dto.*
import com.seek.thebible.domain.bible.service.BibleReader
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class BibleFacade(
    private val bibleReader: BibleReader
) {

    /**
     * 📌 번역본 리스트 조회
     */
    fun getTranslations(): List<TranslationResult> = bibleReader.getTranslations()

    /**
     * 📌 특정 번역본에 해당하는 책 리스트 조회
     */
    fun getBooks(translationId: Long): List<BookResult> = bibleReader.getBooks(translationId)

    /**
     * 📌 특정 책에 해당하는 장 리스트 조회
     */
    fun getChapterView(bookId: Long): ChapterView = bibleReader.getChapterView(bookId)

    /**
     * 📌 특정 장에 해당하는 절 리스트 조회
     */
    fun getVerseView(bookId: Long, chapterId: Long): VerseView = bibleReader.getVerseView(bookId, chapterId)

    /**
     * 📌 특정 장에 해당하는 절 리스트 조회
     */
    fun getVerseView(bookId: Long, chapterNumber: Int): VerseView = bibleReader.getVerseView(bookId, chapterNumber)

    /**
     * 📌 성경 구절 검색 (키워드 포함) - 다중 번역본에서 검색
     */
    fun searchBibleVerses(keyword: String): List<SearchVerseResult> =
        bibleReader.searchBibleVerses(keyword).map { verse ->
            SearchVerseResult(
                verseId = verse.id!!,
                verseNumber = verse.verseNumber,
                text = verse.text
            )
        }
}
