package com.seek.thebible.presentation.bible.dto

import com.seek.thebible.application.bible.dto.*
import com.seek.thebible.domain.bible.model.BibleTestament
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
    val testament: BibleTestament
) {
    companion object {
        fun from(result: BookResult): BookResponse {
            return BookResponse(
                bookId = result.bookId,
                bookName = result.bookName,
                abbreviation = result.abbreviation,
                testament = result.testament
            )
        }
    }
}

data class ChapterResponse(
    val chapterId: Long,
    val chapterNumber: Int
) {
    companion object {
        fun from(result: ChapterResult): ChapterResponse {
            return ChapterResponse(
                chapterId = result.chapterId,
                chapterNumber = result.chapterNumber
            )
        }
    }
}

data class VerseResponse(
    val verseId: Long,
    val verseNumber: Int,
    val text: String
) {
    companion object {
        fun from(result: VerseResult): VerseResponse {
            return VerseResponse(
                verseId = result.verseId,
                verseNumber = result.verseNumber,
                text = result.text
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
