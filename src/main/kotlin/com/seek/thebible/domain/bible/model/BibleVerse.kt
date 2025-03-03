package com.seek.thebible.domain.bible.model

import jakarta.persistence.*

/**
 * 성경 절 (각 장의 구절)
 */
@Entity
@Table(name = "bible_verse")
class BibleVerse(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @JoinColumn(name = "chapter_id", nullable = false)
    val chapterId: Long, // 어떤 장에 속하는지

    @Column(nullable = false)
    val verseNumber: Int, // 절 번호 (예: 1, 2, 3절)

    @Column(nullable = false, columnDefinition = "TEXT")
    val text: String // 성경 구절 내용
)