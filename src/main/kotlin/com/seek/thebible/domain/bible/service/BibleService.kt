package com.seek.thebible.domain.bible.service

import com.seek.thebible.application.exception.BibleServiceException
import com.seek.thebible.application.exception.ErrorType
import com.seek.thebible.domain.bible.model.*
import com.seek.thebible.domain.bible.repository.BibleBookRepository
import com.seek.thebible.domain.bible.repository.BibleChapterRepository
import com.seek.thebible.domain.bible.repository.BibleTranslationRepository
import com.seek.thebible.domain.bible.repository.BibleVerseRepository
import org.springframework.stereotype.Service

@Service
class BibleService(
    private val bibleTranslationRepository: BibleTranslationRepository,
    private val bibleBookRepository: BibleBookRepository,
    private val bibleChapterRepository: BibleChapterRepository,
    private val bibleVerseRepository: BibleVerseRepository
) {

    /**
     * 📌 번역본 조회 (Enum 기반)
     */
    fun getTranslationByType(type: BibleTranslationType): BibleTranslation {
        return bibleTranslationRepository.findByType(type)
            ?: throw BibleServiceException(ErrorType.BIBLE_NOT_FOUND, "translationType=$type")
    }

    /**
     * 📌 특정 번역본에서 책 조회
     */
    fun getBookByTranslationAndName(translationType: BibleTranslationType, bookName: String): BibleBook {
        val translation = getTranslationByType(translationType)
        return bibleBookRepository.findByTranslationAndName(translation, bookName)
            ?: throw BibleServiceException(ErrorType.BIBLE_NOT_FOUND, "bookName=$bookName")
    }

    /**
     * 📌 특정 번역본에서 구약/신약 책 목록 조회
     */
    fun getBooksByTestament(translationType: BibleTranslationType, testament: BibleTestament): List<BibleBook> {
        val translation = getTranslationByType(translationType)
        return bibleBookRepository.findByTranslationAndTestament(translation, testament)
    }

    /**
     * 📌 특정 책에서 특정 장 조회
     */
    fun getChapterByBookAndNumber(bookId: Long, chapterNumber: Int): BibleChapter {
        val book = bibleBookRepository.findById(bookId)
            .orElseThrow { BibleServiceException(ErrorType.BIBLE_NOT_FOUND, "bookId=$bookId") }

        return bibleChapterRepository.findByBookAndChapterNumber(book, chapterNumber)
            ?: throw BibleServiceException(ErrorType.BIBLE_NOT_FOUND, "chapterNumber=$chapterNumber")
    }

    /**
     * 📌 특정 장에서 특정 절 조회
     */
    fun getVerseByChapterAndNumber(chapterId: Long, verseNumber: Int): BibleVerse {
        val chapter = bibleChapterRepository.findById(chapterId)
            .orElseThrow { BibleServiceException(ErrorType.BIBLE_NOT_FOUND, "chapterId=$chapterId") }

        return bibleVerseRepository.findByChapterAndVerseNumber(chapter, verseNumber)
            ?: throw BibleServiceException(ErrorType.BIBLE_NOT_FOUND, "verseNumber=$verseNumber")
    }

    /**
     * 📌 특정 책의 모든 장 조회
     */
    fun getChaptersByBook(bookId: Long): List<BibleChapter> {
        val book = bibleBookRepository.findById(bookId)
            .orElseThrow { BibleServiceException(ErrorType.BIBLE_NOT_FOUND, "bookId=$bookId") }

        return bibleChapterRepository.findByBook(book)
    }

    /**
     * 📌 특정 장의 모든 절 조회
     */
    fun getVersesByChapter(chapterId: Long): List<BibleVerse> {
        val chapter = bibleChapterRepository.findById(chapterId)
            .orElseThrow { BibleServiceException(ErrorType.BIBLE_NOT_FOUND, "chapterId=$chapterId") }

        return bibleVerseRepository.findByChapter(chapter)
    }

    /**
     * 📌 특정 성경 구절 조회
     */
    fun getBibleVerse(translationType: BibleTranslationType, bookName: String, chapterNumber: Int, verseNumber: Int): String {
        val book = getBookByTranslationAndName(translationType, bookName)
        val chapter = getChapterByBookAndNumber(book.id!!, chapterNumber)
        val verse = getVerseByChapterAndNumber(chapter.id!!, verseNumber)

        return verse.text
    }

    /**
     * 📌 성경 구절 검색 (키워드 포함)
     */
    fun searchBibleVerses(keyword: String): List<BibleVerse> {
        if (keyword.isBlank()) {
            throw BibleServiceException(ErrorType.INVALID_PARAMETER, "keyword is blank")
        }
        return try {
            bibleVerseRepository.findByTextContaining(keyword)
        } catch (e: Exception) {
            throw BibleServiceException(ErrorType.SEARCH_ERROR, "keyword=$keyword", e.message ?: "Unknown error")
        }
    }
}
