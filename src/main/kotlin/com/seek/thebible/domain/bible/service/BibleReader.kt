package com.seek.thebible.domain.bible.service

import com.seek.thebible.application.bible.dto.BookResult
import com.seek.thebible.application.bible.dto.ChapterResult
import com.seek.thebible.application.bible.dto.TranslationResult
import com.seek.thebible.application.bible.dto.VerseResult
import com.seek.thebible.application.exception.BibleServiceException
import com.seek.thebible.application.exception.ErrorType
import com.seek.thebible.domain.bible.model.BibleTranslationType
import com.seek.thebible.domain.bible.model.BibleVerse
import com.seek.thebible.domain.bible.repository.BibleBookRepository
import com.seek.thebible.domain.bible.repository.BibleChapterRepository
import com.seek.thebible.domain.bible.repository.BibleTranslationRepository
import com.seek.thebible.domain.bible.repository.BibleVerseRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class BibleReader(
    private val bibleTranslationRepository: BibleTranslationRepository,
    private val bibleBookRepository: BibleBookRepository,
    private val bibleChapterRepository: BibleChapterRepository,
    private val bibleVerseRepository: BibleVerseRepository
) {

    /**
     * 📌 번역본 리스트 조회
     */
    fun getTranslations(): List<TranslationResult> {
        return bibleTranslationRepository.findAll().map {
            TranslationResult(it.id!!, it.translationType, it.translationType.displayName)
        }
    }

    /**
     * 📌 특정 번역본에 해당하는 책 리스트 조회
     */
    fun getBooks(translationType: BibleTranslationType): List<BookResult> {
        val translation = bibleTranslationRepository.findByTranslationType(translationType)
            ?: throw BibleServiceException(ErrorType.BIBLE_NOT_FOUND, "translationType=$translationType")

        return bibleBookRepository.findByTranslation(translation).map {
            BookResult(it.id!!, it.name, it.abbreviation, it.testamentType)
        }
    }

    /**
     * 📌 특정 책에 해당하는 장 리스트 조회
     */
    fun getChapters(translationType: BibleTranslationType, bookId: Long): List<ChapterResult> {
        val book = bibleBookRepository.findById(bookId)
            .orElseThrow { BibleServiceException(ErrorType.BIBLE_NOT_FOUND, "bookId=$bookId") }

        return bibleChapterRepository.findByBook(book).map {
            ChapterResult(it.id!!, it.chapterNumber)
        }
    }

    /**
     * 📌 특정 장에 해당하는 절 리스트 조회
     */
    fun getVerses(translationType: BibleTranslationType, bookId: Long, chapterId: Long): List<VerseResult> {
        val chapter = bibleChapterRepository.findById(chapterId)
            .orElseThrow { BibleServiceException(ErrorType.BIBLE_NOT_FOUND, "chapterId=$chapterId") }

        return bibleVerseRepository.findByChapter(chapter).map {
            VerseResult(it.id!!, it.verseNumber, it.text)
        }
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
