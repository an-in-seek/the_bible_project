package com.seek.thebible.domain.bible.model

import jakarta.persistence.*

/**
 * 성경 책 (창세기, 마태복음 등)
 */
@Entity
@Table(name = "bible_book")
class BibleBook(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "translation_id", nullable = false)
    val translation: BibleTranslation, // 어떤 번역본에 속하는지

    @Column(nullable = false)
    val name: String, // 책 이름 (예: 창세기)

    @Column(nullable = false)
    val abbreviation: String, // 약어 (예: 창, 마)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val testamentType: BibleTestamentType, // 구약/신약 구분 (예: OLD, NEW)

    @Column(nullable = false)
    val bookOrder: Int // 성경 내 순서 (예: 창세기 = 1, 마태복음 = 40)
)