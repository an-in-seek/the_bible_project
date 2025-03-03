package com.seek.thebible.domain.bible.service

import com.seek.thebible.application.bible.dto.ChapterResult
import com.seek.thebible.application.bible.dto.TranslationResult
import com.seek.thebible.application.exception.BibleServiceException
import com.seek.thebible.application.exception.ErrorType
import com.seek.thebible.domain.bible.model.BibleBook
import com.seek.thebible.domain.bible.model.BibleChapter
import com.seek.thebible.domain.bible.model.BibleVerse
import com.seek.thebible.domain.bible.repository.BibleBookRepository
import com.seek.thebible.domain.bible.repository.BibleChapterRepository
import com.seek.thebible.domain.bible.repository.BibleTranslationRepository
import com.seek.thebible.domain.bible.repository.BibleVerseRepository
import org.springframework.data.repository.findByIdOrNull
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

    fun getTranslations(): List<TranslationResult> {
        return bibleTranslationRepository.findAll().map {
            TranslationResult(it.id!!, it.translationType, it.translationType.displayName)
        }
    }

    fun getBook(bookId: Long): BibleBook {
        return bibleBookRepository.findByIdOrNull(bookId)
            ?: throw BibleServiceException(ErrorType.BOOK_NOT_FOUND, "bookId=$bookId")
    }

    fun getBooks(translationId: Long): List<BibleBook> {
        val translation = bibleTranslationRepository.findByIdOrNull(translationId)
            ?: throw BibleServiceException(ErrorType.TRANSLATION_NOT_FOUND, "translationId=$translationId")
        return bibleBookRepository.findByTranslation(translation)
    }

    fun getChapter(chapterId: Long): ChapterResult {
        return bibleChapterRepository.findByIdOrNull(chapterId)
            ?.let(ChapterResult::from)
            ?: throw BibleServiceException(ErrorType.CHAPTER_NOT_FOUND, "chapterId=$chapterId")
    }

    fun getChapters(bookId: Long): List<BibleChapter> {
        val book = bibleBookRepository.findByIdOrNull(bookId)
            ?: throw BibleServiceException(ErrorType.BOOK_NOT_FOUND, "bookId=$bookId")
        return bibleChapterRepository.findByBook(book)
    }

    fun getChapterCount(bookId: Long): Int = bibleChapterRepository.countByBookId(bookId)

    fun getVerses(chapterId: Long): List<BibleVerse> {
        val chapter = bibleChapterRepository.findByIdOrNull(chapterId)
            ?: throw BibleServiceException(ErrorType.CHAPTER_NOT_FOUND, "chapterId=$chapterId")
        return bibleVerseRepository.findByChapter(chapter)
    }

    fun searchBibleVerses(keyword: String): List<BibleVerse> {
        if (keyword.isBlank()) throw BibleServiceException(ErrorType.INVALID_PARAMETER, "keyword is blank")
        return try {
            bibleVerseRepository.findByTextContaining(keyword)
        } catch (e: Exception) {
            throw BibleServiceException(ErrorType.SEARCH_ERROR, "keyword=$keyword", e.message ?: "Unknown error")
        }
    }

}
