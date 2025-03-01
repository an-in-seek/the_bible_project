package com.seek.thebible.application.bible

import com.seek.thebible.application.bible.dto.*
import com.seek.thebible.domain.bible.model.BibleTranslationType
import com.seek.thebible.domain.bible.service.BibleService
import org.springframework.stereotype.Service

@Service
class BibleFacade(
    private val bibleService: BibleService
) {

    /**
     * 📌 특정 번역본에서 책을 가져오고, 해당 책의 모든 장을 함께 조회
     */
    fun getBookWithChapters(translationType: BibleTranslationType, bookName: String): BookWithChaptersResult {
        val book = bibleService.getBookByTranslationAndName(translationType, bookName)
        val chapters = bibleService.getChaptersByBook(book.id!!)

        return BookWithChaptersResult(
            bookId = book.id!!,
            bookName = book.name,
            abbreviation = book.abbreviation,
            testament = book.testament,
            chapters = chapters.map { ChapterSummary(it.id!!, it.chapterNumber) }
        )
    }

    /**
     * 📌 특정 장을 가져오고, 해당 장의 모든 절을 함께 조회
     */
    fun getChapterWithVerses(bookId: Long, chapterNumber: Int): ChapterWithVersesResult {
        val chapter = bibleService.getChapterByBookAndNumber(bookId, chapterNumber)
        val verses = bibleService.getVersesByChapter(chapter.id!!)

        return ChapterWithVersesResult(
            chapterId = chapter.id!!,
            chapterNumber = chapter.chapterNumber,
            verses = verses.map { VerseSummary(it.id!!, it.verseNumber, it.text) }
        )
    }

    /**
     * 📌 성경 구절 검색 (키워드 포함) - 다중 번역본에서 검색
     */
    fun searchBibleVerses(keyword: String): List<SearchVerseResult> {
        val verses = bibleService.searchBibleVerses(keyword)

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

    /**
     * 📌 특정 성경 구절 조회
     */
    fun getBibleVerse(translationType: BibleTranslationType, bookName: String, chapterNumber: Int, verseNumber: Int): String {
        return bibleService.getBibleVerse(translationType, bookName, chapterNumber, verseNumber)
    }
}
