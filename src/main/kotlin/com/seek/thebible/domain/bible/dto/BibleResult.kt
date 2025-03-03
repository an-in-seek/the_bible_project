package com.seek.thebible.domain.bible.dto

import com.seek.thebible.domain.bible.model.*

data class TranslationResult(
    val translationId: Long,
    val translationType: BibleTranslationType,
    val translationName: String
) {
    companion object {
        fun from(translation: BibleTranslation) = with(translation) {
            TranslationResult(
                translationId = id!!,
                translationType = translationType,
                translationName = name
            )
        }
    }
}

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
    val book: BookResult,
    val chapterId: Long,
    val chapterNumber: Int
) {
    companion object {
        fun from(chapter: BibleChapter) = with(chapter) {
            ChapterResult(
                book = chapter.book.let(BookResult::from),
                chapterId = id!!,
                chapterNumber = chapterNumber
            )
        }
    }
}

data class ChaptersResult(
    val chapters: List<ChapterResult>
) {
    companion object {
        fun from(chapters: List<BibleChapter>) =
            ChaptersResult(
                chapters = chapters.map(ChapterResult::from)
            )
    }
}

data class VersesView(
    val chapter: ChapterDetailResult,
    val totalChapterCount: Int
) {
    companion object {
        fun of(chapter: BibleChapter, totalChapterCount: Int) =
            VersesView(
                chapter = chapter.let(ChapterDetailResult::from),
                totalChapterCount = totalChapterCount
            )
    }
}

data class ChapterDetailResult(
    val chapterId: Long,
    val chapterNumber: Int,
    val verses: List<VerseResult>
) {
    companion object {
        fun from(chapter: BibleChapter) = with(chapter) {
            ChapterDetailResult(
                chapterId = id!!,
                chapterNumber = chapterNumber,
                verses = verses.map(VerseResult::from)
            )
        }
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

data class SearchVerseResult(
    val verseId: Long,
    val verseNumber: Int,
    val text: String
)
