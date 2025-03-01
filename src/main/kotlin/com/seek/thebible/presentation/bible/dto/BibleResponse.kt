package com.seek.thebible.presentation.bible.dto

import com.seek.thebible.application.bible.dto.*

data class BookWithChaptersResponse(
    val bookId: Long,
    val bookName: String,
    val abbreviation: String,
    val testament: String,
    val chapters: List<ChapterSummary>
) {
    companion object {
        fun from(result: BookWithChaptersResult): BookWithChaptersResponse {
            return BookWithChaptersResponse(
                bookId = result.bookId,
                bookName = result.bookName,
                abbreviation = result.abbreviation,
                testament = result.testament.name,
                chapters = result.chapters
            )
        }
    }
}

data class ChapterWithVersesResponse(
    val chapterId: Long,
    val chapterNumber: Int,
    val verses: List<VerseSummary>
) {
    companion object {
        fun from(result: ChapterWithVersesResult): ChapterWithVersesResponse {
            return ChapterWithVersesResponse(
                chapterId = result.chapterId,
                chapterNumber = result.chapterNumber,
                verses = result.verses
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

data class BibleVerseResponse(
    val translation: String,
    val bookName: String,
    val chapterNumber: Int,
    val verseNumber: Int,
    val text: String
)

