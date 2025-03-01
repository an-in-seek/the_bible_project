package com.seek.thebible.domain.bible.model

import jakarta.persistence.*

@Entity
@Table(name = "bible_translation")
class BibleTranslation(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    val type: BibleTranslationType, // 번역본을 Enum으로 저장

    @Column(nullable = false, unique = true)
    val name: String, // 번역본 이름 (예: 개역개정, NIV)

    @Column(nullable = false, unique = true)
    val abbreviation: String // 번역본 약어 (예: KRV, NIV)
)