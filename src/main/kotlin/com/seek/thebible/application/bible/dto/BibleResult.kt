package com.seek.thebible.application.bible.dto

import com.seek.thebible.domain.bible.model.*

data class TranslationResult(
    val translationId: Long,
    val translationType: BibleTranslationType,
    val displayName: String
)

data class BookResult(
    val bookId: Long,
    val bookName: String,
    val abbreviation: String,
    val testamentType: BibleTestamentType
) {
    companion object {
        fun from(book: BibleBook) = with(book) {
            BookResult(
                bookId = id!!,
                bookName = name,
                abbreviation = abbreviation,
                testamentType = testamentType
            )
        }
    }
}

data class ChapterResult(
    val chapterId: Long,
    val chapterNumber: Int
) {
    companion object {
        fun from(chapter: BibleChapter) = with(chapter) {
            ChapterResult(
                chapterId = id!!,
                chapterNumber = chapterNumber
            )
        }
    }
}

data class ChaptersResult(
    val book: BookResult,
    val chapters: List<ChapterResult>
) {
    companion object {
        fun from(book: BibleBook, chapters: List<BibleChapter>) =
            ChaptersResult(
                book = BookResult.from(book),
                chapters = chapters.map(ChapterResult::from)
            )
    }
}

data class VerseResult(
    val verseId: Long,
    val verseNumber: Int,
    val text: String
) {
    companion object {
        fun from(verse: BibleVerse) = with(verse) {
            VerseResult(
                verseId = id!!,
                verseNumber = verseNumber,
                text = text
            )
        }
    }
}

data class VersesResult(
    val chapter: ChapterResult,
    val verses: List<VerseResult>,
    val totalChapterCount: Int
) {
    companion object {
        fun from(
            chapter: ChapterResult,
            verses: List<BibleVerse>,
            totalChapterCount: Int
        ) = VersesResult(
            chapter = chapter,
            verses = verses.map(VerseResult::from),
            totalChapterCount = totalChapterCount
        )
    }
}


data class SearchVerseResult(
    val verseId: Long,
    val bookName: String,
    val chapterNumber: Int,
    val verseNumber: Int,
    val text: String
)
