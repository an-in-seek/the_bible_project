package com.elseeker.bible.application.component

import com.elseeker.bible.adapter.input.api.client.response.BibleApiResponse
import com.elseeker.bible.adapter.input.api.client.response.BibleSearchResponse
import com.elseeker.bible.adapter.input.api.client.response.BibleSearchSliceResponse
import com.elseeker.bible.adapter.output.jpa.*
import com.elseeker.bible.domain.event.BibleSearchPerformedEvent
import com.elseeker.bible.domain.result.BibleResult
import com.elseeker.bible.domain.vo.BibleTranslationType
import com.elseeker.bible.domain.vo.DirectionType
import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.throwError
import com.neovisionaries.i18n.LanguageCode
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.*

@Component
@Transactional(readOnly = true)
class BibleReader(
    private val bibleTranslationRepository: BibleTranslationRepository,
    private val bibleBookRepository: BibleBookRepository,
    private val bibleBookDescriptionRepository: BibleBookDescriptionRepository,
    private val bibleChapterRepository: BibleChapterRepository,
    private val bibleVerseRepository: BibleVerseRepository,
    private val applicationEventPublisher: ApplicationEventPublisher,
) {

    private val logger = KotlinLogging.logger {}

    fun getTranslations(): List<BibleResult.Translation> =
        bibleTranslationRepository.findAllByTranslationTypeInOrderByTranslationOrder(
            setOf(
                BibleTranslationType.KRV,
                BibleTranslationType.NKRV,
                BibleTranslationType.KJV,
                BibleTranslationType.WEB,
                BibleTranslationType.ASV,
                BibleTranslationType.RVR1909,
                BibleTranslationType.SBLM,
            )
        ).map(BibleResult.Translation::from)

    fun getTranslation(translationId: Long): BibleResult.Translation =
        bibleTranslationRepository.findById(translationId).orElse(null)
            ?.let(BibleResult.Translation::from)
            ?: throwError(ErrorType.TRANSLATION_NOT_FOUND, "translationId=$translationId")

    fun getBook(translationId: Long, bookOrder: Int): BibleApiResponse.BookDetail? {
        val book = bibleBookRepository.findByTranslationAndBook(translationId, bookOrder) ?: return null
        val languageCode = getTranslationLanguage(translationId) ?: return null
        val description = bibleBookDescriptionRepository.findByBookKeyAndLanguageCode(book.bookKey, languageCode) ?: return null
        return BibleApiResponse.BookDetail.from(book, description)
    }

    fun getBooks(translationId: Long): List<BibleResult.Book> =
        bibleBookRepository.findByTranslationId(translationId)
            .map(BibleResult.Book::from)

    fun getChapters(translationId: Long, bookOrder: Int): BibleApiResponse.Chapters =
        bibleBookRepository.findByTranslationAndBook(translationId, bookOrder)
            ?.let { book ->
                val languageCode = getTranslationLanguage(translationId)
                    ?: throwError(ErrorType.TRANSLATION_NOT_FOUND)
                val description = bibleBookDescriptionRepository.findByBookKeyAndLanguageCode(book.bookKey, languageCode)
                    ?: throwError(ErrorType.BOOK_DESCRIPTION_NOT_FOUND)
                BibleApiResponse.Chapters.from(book, description)
            }
            ?: throwError(ErrorType.BOOK_NOT_FOUND)

    fun getChapterVerses(
        translationId: Long,
        bookOrder: Int,
        chapterNumber: Int
    ): BibleApiResponse.Verses {
        val translation = bibleTranslationRepository.findByIdWithBooks(translationId)
            ?: throwError(ErrorType.TRANSLATION_NOT_FOUND)

        val books = translation.books.sortedBy { it.bookOrder }
        val book = books.firstOrNull { it.bookOrder == bookOrder } ?: throwError(ErrorType.BOOK_NOT_FOUND)
        val bookId = book.id!!

        val chapter = bibleChapterRepository.findByBookAndChapter(bookId, chapterNumber)
            ?: throwError(ErrorType.CHAPTER_NOT_FOUND)

        val totalChapterCount = bibleChapterRepository.findMaxChapterNumberByBookId(bookId)
            ?: throwError(ErrorType.CHAPTER_NOT_FOUND)

        return BibleApiResponse.Verses.of(
            books = books,
            currentBook = book,
            totalChapterCount = totalChapterCount,
            chapter = chapter
        )
    }

    fun getAdjacentChapterVerses(
        translationId: Long,
        bookOrder: Int,
        chapterNumber: Int,
        direction: DirectionType
    ): BibleApiResponse.Verses {
        val translation = bibleTranslationRepository.findByIdWithBooks(translationId)
            ?: throwError(ErrorType.TRANSLATION_NOT_FOUND)

        val books = translation.books.sortedBy { it.bookOrder }
        val currentBookIndex = books.indexOfFirst { it.bookOrder == bookOrder }
        val currentBook = books.getOrNull(currentBookIndex) ?: throwError(ErrorType.BOOK_NOT_FOUND)
        val currentBookId = currentBook.id ?: throw IllegalStateException("Book has no ID")
        val currentMaxChapterNumber = bibleChapterRepository.findMaxChapterNumberByBookId(currentBookId)
            ?: throwError(ErrorType.CHAPTER_NOT_FOUND)

        var targetBook = currentBook
        var targetChapterNumber = chapterNumber
        var targetMaxChapterNumber = currentMaxChapterNumber

        when (direction) {
            DirectionType.NEXT -> {
                if (chapterNumber < currentMaxChapterNumber) {
                    targetChapterNumber += 1
                } else if (currentBookIndex < books.lastIndex) {
                    targetBook = books[currentBookIndex + 1]
                    targetChapterNumber = 1
                    val nextBookId = targetBook.id ?: throw IllegalStateException("Book has no ID")
                    targetMaxChapterNumber = bibleChapterRepository.findMaxChapterNumberByBookId(nextBookId)
                        ?: throwError(ErrorType.CHAPTER_NOT_FOUND)
                }
            }

            DirectionType.PREV -> {
                if (chapterNumber > 1) {
                    targetChapterNumber -= 1
                } else if (currentBookIndex > 0) {
                    targetBook = books[currentBookIndex - 1]
                    val prevBookId = targetBook.id ?: throw IllegalStateException("Book has no ID")
                    targetMaxChapterNumber = bibleChapterRepository.findMaxChapterNumberByBookId(prevBookId)
                        ?: throwError(ErrorType.CHAPTER_NOT_FOUND)
                    targetChapterNumber = targetMaxChapterNumber
                }
            }
        }

        val targetBookId = targetBook.id ?: throw IllegalStateException("Book has no ID")
        val chapter = bibleChapterRepository.findByBookAndChapter(targetBookId, targetChapterNumber)
            ?: throwError(ErrorType.CHAPTER_NOT_FOUND)

        return BibleApiResponse.Verses.of(
            books = books,
            currentBook = targetBook,
            totalChapterCount = targetMaxChapterNumber,
            chapter = chapter
        )
    }

    fun searchBibleVersesSlice(
        translationId: Long,
        keyword: String,
        bookOrder: Int?,
        page: Int,
        size: Int,
        track: Boolean = true
    ): BibleSearchSliceResponse {
        if (keyword.isBlank()) throwError(ErrorType.INVALID_PARAMETER, "keyword is blank")
        if (keyword.length > MAX_SEARCH_KEYWORD_LENGTH) {
            throwError(ErrorType.INVALID_PARAMETER, "keyword too long: ${keyword.length}")
        }
        if (page < 0 || size <= 0) throwError(ErrorType.INVALID_PARAMETER, "page=$page, size=$size")
        return try {
            val slice = bibleVerseRepository.searchSliceByTranslationAndText(
                translationId,
                keyword,
                bookOrder,
                PageRequest.of(page, size)
            )
            val totalCount = if (page == 0) {
                bibleVerseRepository.countByTranslationAndText(translationId, keyword, bookOrder)
            } else {
                null
            }
            if (page == 0 && track) {
                runCatching {
                    applicationEventPublisher.publishEvent(BibleSearchPerformedEvent(keyword))
                }.onFailure { e ->
                    logger.warn(e) { "Failed to publish BibleSearchPerformedEvent for keyword='$keyword'" }
                }
            }
            BibleSearchSliceResponse(
                content = slice.content,
                hasNext = slice.hasNext(),
                totalCount = totalCount
            )
        } catch (e: Exception) {
            throwError(ErrorType.SEARCH_ERROR, "keyword=$keyword", e.message ?: "Unknown error")
        }
    }

    private fun getTranslationLanguage(translationId: Long): LanguageCode? =
        bibleTranslationRepository.findById(translationId)
            .orElse(null)
            ?.languageCode

    fun getDailyRandomVerse(
        translationType: BibleTranslationType,
        date: LocalDate
    ): BibleSearchResponse {
        val translation = bibleTranslationRepository.findByTranslationType(translationType)
            ?: throwError(ErrorType.TRANSLATION_NOT_FOUND)
        val translationId = translation.id ?: throwError(ErrorType.TRANSLATION_NOT_FOUND)
        val totalCount = bibleVerseRepository.countByTranslationId(translationId)
        if (totalCount <= 0) {
            throwError(ErrorType.DB_ERROR, "No verses found for translationId=$translationId")
        }

        val seed = date.toEpochDay() + (translationId * 31L)
        val randomIndex = Random(seed).nextInt(totalCount.toInt())
        val slice = bibleVerseRepository.findSliceByTranslation(
            translationId,
            PageRequest.of(randomIndex, 1)
        )

        return slice.content.firstOrNull()
            ?: throwError(ErrorType.DB_ERROR, "No verse found for translationId=$translationId")
    }

    fun getVerseText(
        translationId: Long,
        bookOrder: Int,
        chapterNumber: Int,
        verseNumber: Int
    ): String {
        val verseText = bibleVerseRepository.findVerseText(
            translationId,
            bookOrder,
            chapterNumber,
            verseNumber
        ) ?: throwError(ErrorType.VERSE_NOT_FOUND)
        return verseText
    }

    companion object {
        private const val MAX_SEARCH_KEYWORD_LENGTH = 200
    }
}
