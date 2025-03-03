package com.seek.thebible.presentation.bible.dto

import com.seek.thebible.application.bible.dto.*
import com.seek.thebible.domain.bible.model.BibleTestamentType
import com.seek.thebible.domain.bible.model.BibleTranslationType

data class TranslationResponse(
    val translationId: Long,
    val translationType: BibleTranslationType,
    val displayName: String
) {
    companion object {
        fun from(result: TranslationResult): TranslationResponse {
            return TranslationResponse(
                translationId = result.translationId,
                translationType = result.translationType,
                displayName = result.displayName
            )
        }
    }
}

data class BookResponse(
    val bookId: Long,
    val bookName: String,
    val abbreviation: String,
    val testamentType: BibleTestamentType
) {
    companion object {
        fun from(result: BookResult): BookResponse {
            return BookResponse(
                bookId = result.bookId,
                bookName = result.bookName,
                abbreviation = result.abbreviation,
                testamentType = result.testamentType
            )
        }
    }
}

data class ChaptersResponse(
    val book: BookResult,
    val chapters: List<ChapterResult>
) {
    companion object {
        fun from(result: ChaptersResult) = with(result) {
            ChaptersResponse(
                book = book,
                chapters = chapters
            )
        }
    }
}

data class VersesResponse(
    val chapter: ChapterResult,
    val verses: List<VerseResult>,
    val totalChapterCount: Int
) {
    companion object {
        fun from(result: VersesResult) = with(result) {
            VersesResponse(
                chapter = chapter,
                verses = verses,
                totalChapterCount = totalChapterCount
            )
        }
    }
}

data class SearchVerseResponse(
    val verseId: Long,
    val bookName: String,
    val chapterNumber: Int,
    val verseNumber: Int,
    val text: String
) {
    companion object {
        fun from(result: SearchVerseResult): SearchVerseResponse {
            return SearchVerseResponse(
                verseId = result.verseId,
                bookName = result.bookName,
                chapterNumber = result.chapterNumber,
                verseNumber = result.verseNumber,
                text = result.text
            )
        }
    }
}
