package com.elseeker.bible.domain.vo

enum class BibleTranslationType(val abbreviation: String, val displayName: String) {
    KRV("KRV", "개역한글"),
    NKRV("NKRV", "개역개정"),
    RNKSV("RNKSV", "새번역"),
    KOERV("KOERV", "읽기 쉬운 성경"),
    KLB("KLB", "현대인의 성경"),
    NLTNK("NLTNK", "하나님의 약속: 평양말 NLT"),
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
    RVR1909("RVR1909", "Santa Biblia: Reina-Valera (Revisión de 1909)"),
    RVR1960("RVR1960", "Santa Biblia: Reina-Valera (Revisión de 1960)"),
    SBLM("SBLM", "Santa Biblia libre para el mundo"),
    LUTH1545("LUTH1545", "Luther Bible 1545"),
    VUL("VUL", "Biblia Sacra Vulgata"),
    JPNMEB("JPNMEB", "Japanese Freedom Bible"),
    JPN1965("JPN", "The New Testament in Japanese, 1965 Shinkaiyaku Seisho (New Japanese Bible) Translation");

    companion object {
        fun fromAbbreviation(abbr: String): BibleTranslationType {
            return entries.find { it.abbreviation.equals(abbr, ignoreCase = true) }
                ?: throw IllegalArgumentException("존재하지 않는 번역본: $abbr")
        }
    }
}