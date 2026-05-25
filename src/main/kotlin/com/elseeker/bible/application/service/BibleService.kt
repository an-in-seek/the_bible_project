package com.elseeker.bible.application.service

import com.elseeker.bible.adapter.input.api.client.response.BibleApiResponse
import com.elseeker.bible.adapter.input.api.client.response.BibleSearchSliceResponse
import com.elseeker.bible.application.component.BibleReader
import com.elseeker.bible.domain.result.BibleResult
import com.elseeker.bible.domain.vo.BibleTranslationType
import com.elseeker.bible.domain.vo.DirectionType
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.time.ZoneOffset

@Service
class BibleService(
    private val bibleReader: BibleReader
) {

    fun getTranslations(): List<BibleResult.Translation> =
        bibleReader.getTranslations()

    fun getBook(translationId: Long, bookOrder: Int): BibleApiResponse.BookDetail? =
        bibleReader.getBook(translationId, bookOrder)

    fun getBooks(translationId: Long): List<BibleResult.Book> =
        bibleReader.getBooks(translationId)

    fun getChapters(translationId: Long, bookOrder: Int): BibleApiResponse.Chapters =
        bibleReader.getChapters(translationId, bookOrder)

    fun getChapterVerses(translationId: Long, bookOrder: Int, chapterNumber: Int): BibleApiResponse.Verses =
        bibleReader.getChapterVerses(translationId, bookOrder, chapterNumber)

    fun getAdjacentChapterVerses(translationId: Long, bookOrder: Int, chapterNumber: Int, direction: DirectionType): BibleApiResponse.Verses =
        bibleReader.getAdjacentChapterVerses(translationId, bookOrder, chapterNumber, direction)

    fun searchBibleVersesSlice(
        translationId: Long,
        keyword: String,
        bookOrder: Int?,
        page: Int,
        size: Int,
        track: Boolean = true
    ): BibleSearchSliceResponse =
        bibleReader.searchBibleVersesSlice(translationId, keyword, bookOrder, page, size, track)

    fun getDailyVerse(
        translationType: BibleTranslationType,
        date: LocalDate = LocalDate.now(ZoneOffset.UTC)
    ) = bibleReader.getDailyRandomVerse(translationType, date)
}
