package com.seek.thebible.domain.bible.model

import jakarta.persistence.*

/**
 * 성경 장 (1장, 2장 등)
 */
@Entity
@Table(name = "bible_chapter")
class BibleChapter(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @JoinColumn(name = "book_id", nullable = false)
    val bookId: Long,

    @Column(nullable = false)
    val chapterNumber: Int,

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "chapterId")
    val verses: MutableList<BibleVerse> = mutableListOf()
)