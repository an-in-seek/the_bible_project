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
    val book: BibleBook, // 어떤 책에 속하는지

    @Column(nullable = false)
    val chapterNumber: Int // 장 번호 (예: 1, 2, 3장)
)