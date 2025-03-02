package com.seek.thebible.domain.bible.model

enum class BibleTranslationType(val abbreviation: String, val displayName: String) {
    KRV("KRV", "개역한글"),
    KNB("KNB", "개역개정"),
    NIV("NIV", "New International Version"),
    ESV("ESV", "English Standard Version"),
    KJV("KJV", "King James Version"),
    NASB("NASB", "New American Standard Bible"),
    NLT("NLT", "New Living Translation"),
    CSB("CSB", "Christian Standard Bible"),
    GNT("GNT", "Good News Translation"),
    CEV("CEV", "Contemporary English Version"),
    MSG("MSG", "The Message"),
    NRSV("NRSV", "New Revised Standard Version"),
    AMP("AMP", "Amplified Bible"),
    HCSB("HCSB", "Holman Christian Standard Bible"),
    WEB("WEB", "World English Bible"),
    ASV("ASV", "American Standard Version"),
    DBY("DBY", "Darby Bible"),
    BBE("BBE", "Bible in Basic English"),
    YLT("YLT", "Young's Literal Translation"),
    LBLA("LBLA", "La Biblia de las Américas"),
    RVR1960("RVR1960", "Reina-Valera 1960"),
    LUTH1545("LUTH1545", "Luther Bible 1545"),
    VUL("VUL", "Biblia Sacra Vulgata");

    companion object {
        fun fromAbbreviation(abbr: String): BibleTranslationType {
            return entries.find { it.abbreviation.equals(abbr, ignoreCase = true) }
                ?: throw IllegalArgumentException("존재하지 않는 번역본: $abbr")
        }
    }
}
