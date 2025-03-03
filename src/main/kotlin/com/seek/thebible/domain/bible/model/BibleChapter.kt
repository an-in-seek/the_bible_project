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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    val book: BibleBook,

    @Column(nullable = false)
    val chapterNumber: Int,

    @OneToMany(fetch = FetchType.EAGER, mappedBy = "chapterId")
    val verses: MutableList<BibleVerse> = mutableListOf()
)