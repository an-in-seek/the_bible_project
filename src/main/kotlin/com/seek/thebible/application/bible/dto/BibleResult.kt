package com.seek.thebible.application.bible.dto

import com.seek.thebible.domain.bible.model.BibleTestament

data class BookWithChaptersResult(
    val bookId: Long,
    val bookName: String,
    val abbreviation: String,
    val testament: BibleTestament,
    val chapters: List<ChapterSummary>
)

data class ChapterSummary(
    val chapterId: Long,
    val chapterNumber: Int
)

data class ChapterWithVersesResult(
    val chapterId: Long,
    val chapterNumber: Int,
    val verses: List<VerseSummary>
)

data class VerseSummary(
    val verseId: Long,
    val verseNumber: Int,
    val text: String
)

data class SearchVerseResult(
    val verseId: Long,
    val bookName: String,
    val chapterNumber: Int,
    val verseNumber: Int,
    val text: String
)
