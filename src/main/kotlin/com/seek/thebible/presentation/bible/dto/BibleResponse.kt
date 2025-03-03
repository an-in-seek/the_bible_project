package com.seek.thebible.presentation.bible.dto

import com.seek.thebible.domain.bible.dto.*
import com.seek.thebible.domain.bible.model.BibleTestamentType
import com.seek.thebible.domain.bible.model.BibleTranslationType

data class TranslationResponse(
    val translationId: Long,
    val translationType: BibleTranslationType,
    val translationName: String
) {
    companion object {
        fun from(result: TranslationResult) =
            TranslationResponse(
                translationId = result.translationId,
                translationType = result.translationType,
                translationName = result.translationName
            )
    }
}

data class BookResponse(
    val bookId: Long,
    val bookName: String,
    val abbreviation: String,
    val testamentType: BibleTestamentType
) {
    companion object {
        fun from(result: BookResult) =
            BookResponse(
                bookId = result.bookId,
                bookName = result.bookName,
                abbreviation = result.abbreviation,
                testamentType = result.testamentType
            )
    }
}

data class ChapterViewResponse(
    val book: BookDetailResult
) {
    companion object {
        fun from(result: ChapterView) =
            ChapterViewResponse(book = result.book)
    }
}

data class VerseViewResponse(
    val chapter: ChapterDetailResult,
    val totalChapterCount: Int
) {
    companion object {
        fun from(result: VerseView) =
            VerseViewResponse(chapter = result.chapter, totalChapterCount = result.totalChapterCount)
    }
}

data class SearchVerseResponse(
    val verseId: Long,
    val verseNumber: Int,
    val text: String
) {
    companion object {
        fun from(result: SearchVerseResult) =
            SearchVerseResponse(
                verseId = result.verseId,
                verseNumber = result.verseNumber,
                text = result.text
            )
    }
}
