package com.seek.thebible.application.bible.dto

import com.seek.thebible.domain.bible.model.BibleTestamentType
import com.seek.thebible.domain.bible.model.BibleTranslationType

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
)

data class ChapterResult(
    val chapterId: Long,
    val chapterNumber: Int
)

data class VerseResult(
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
