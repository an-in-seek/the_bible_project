package com.seek.thebible.domain.bible.model

enum class BibleTranslationType(val abbreviation: String, val displayName: String) {
    KJV("KJV", "King James Version"),
    NIV("NIV", "New International Version"),
    ESV("ESV", "English Standard Version"),
    KRV("KRV", "개역한글"),
    KNB("KNB", "개역개정"),
    ASV("ASV", "American Standard Version");

    companion object {
        fun fromAbbreviation(abbr: String): BibleTranslationType {
            return entries.find { it.abbreviation.equals(abbr, ignoreCase = true) }
                ?: throw IllegalArgumentException("존재하지 않는 번역본: $abbr")
        }
    }
}
