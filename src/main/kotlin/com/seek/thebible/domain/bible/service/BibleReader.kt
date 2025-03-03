package com.seek.thebible.domain.bible.service

import com.seek.thebible.domain.BibleServiceException
import com.seek.thebible.domain.ErrorType
import com.seek.thebible.domain.bible.dto.BookResult
import com.seek.thebible.domain.bible.dto.ChapterView
import com.seek.thebible.domain.bible.dto.TranslationResult
import com.seek.thebible.domain.bible.dto.VerseView
import com.seek.thebible.domain.bible.model.BibleVerse
import com.seek.thebible.infrastructure.persistence.bible.BibleBookRepository
import com.seek.thebible.infrastructure.persistence.bible.BibleChapterRepository
import com.seek.thebible.infrastructure.persistence.bible.BibleTranslationRepository
import com.seek.thebible.infrastructure.persistence.bible.BibleVerseRepository
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service

@Service
class BibleReader(
    private val bibleTranslationRepository: BibleTranslationRepository,
    private val bibleBookRepository: BibleBookRepository,
    private val bibleChapterRepository: BibleChapterRepository,
    private val bibleVerseRepository: BibleVerseRepository
) {

    fun getTranslations(): List<TranslationResult> =
        bibleTranslationRepository.findAll().map(TranslationResult::from)

    fun getBooks(translationId: Long): List<BookResult> {
        val translation = bibleTranslationRepository.findByIdOrNull(translationId)
            ?: throw BibleServiceException(ErrorType.TRANSLATION_NOT_FOUND, "translationId=$translationId")
        return bibleBookRepository.findByTranslation(translation).map(BookResult::from)
    }

    fun getChapterView(bookId: Long): ChapterView {
        val book = bibleBookRepository.findByIdWithChapters(bookId)
            ?: throw BibleServiceException(ErrorType.BOOK_NOT_FOUND, "bookId=$bookId")
        return ChapterView.from(book)
    }

    fun getVerseView(bookId: Long, chapterId: Long): VerseView {
        val chapter = bibleChapterRepository.findByIdWithVerses(chapterId)
            ?: throw BibleServiceException(ErrorType.CHAPTER_NOT_FOUND, "chapterId=$chapterId")
        val totalChapterCount = bibleChapterRepository.countByBookId(bookId)
        return VerseView.of(chapter, totalChapterCount)
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
