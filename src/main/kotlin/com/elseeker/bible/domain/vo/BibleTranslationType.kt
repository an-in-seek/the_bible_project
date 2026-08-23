package com.elseeker.bible.domain.vo

import com.neovisionaries.i18n.LanguageCode

enum class BibleTranslationType(
    val abbreviation: String,
    val displayName: String,
    val language: LanguageCode
) {
    KRV("KRV", "개역한글", LanguageCode.ko),
    NKRV("NKRV", "개역개정", LanguageCode.ko),
    RNKSV("RNKSV", "새번역", LanguageCode.ko),
    KOERV("KOERV", "읽기 쉬운 성경", LanguageCode.ko),
    KLB("KLB", "현대인의 성경", LanguageCode.ko),
    NLTNK("NLTNK", "하나님의 약속: 평양말 NLT", LanguageCode.ko),
    NIV("NIV", "New International Version", LanguageCode.en),
    ESV("ESV", "English Standard Version", LanguageCode.en),
    KJV("KJV", "King James Version", LanguageCode.en),
    NASB("NASB", "New American Standard Bible", LanguageCode.en),
    NLT("NLT", "New Living Translation", LanguageCode.en),
    CSB("CSB", "Christian Standard Bible", LanguageCode.en),
    GNT("GNT", "Good News Translation", LanguageCode.en),
    CEV("CEV", "Contemporary English Version", LanguageCode.en),
    MSG("MSG", "The Message", LanguageCode.en),
    NRSV("NRSV", "New Revised Standard Version", LanguageCode.en),
    AMP("AMP", "Amplified Bible", LanguageCode.en),
    HCSB("HCSB", "Holman Christian Standard Bible", LanguageCode.en),
    WEB("WEB", "World English Bible", LanguageCode.en),
    ASV("ASV", "American Standard Version", LanguageCode.en),
    DBY("DBY", "Darby Bible", LanguageCode.en),
    BBE("BBE", "Bible in Basic English", LanguageCode.en),
    YLT("YLT", "Young's Literal Translation", LanguageCode.en),
    LBLA("LBLA", "La Biblia de las Américas", LanguageCode.es),
    RVR1909("RVR1909", "Santa Biblia: Reina-Valera (Revisión de 1909)", LanguageCode.es),
    RVR1960("RVR1960", "Santa Biblia: Reina-Valera (Revisión de 1960)", LanguageCode.es),
    SBLM("SBLM", "Santa Biblia libre para el mundo", LanguageCode.es),
    LUTH1545("LUTH1545", "Luther Bible 1545", LanguageCode.de),
    VUL("VUL", "Biblia Sacra Vulgata", LanguageCode.la),
    JPNMEB("JPNMEB", "Japanese Freedom Bible", LanguageCode.ja),
    JPN1965("JPN", "The New Testament in Japanese, 1965 Shinkaiyaku Seisho (New Japanese Bible) Translation", LanguageCode.ja);

    companion object {
        fun fromAbbreviation(abbr: String): BibleTranslationType {
            return entries.find { it.abbreviation.equals(abbr, ignoreCase = true) }
                ?: throw IllegalArgumentException("존재하지 않는 번역본: $abbr")
        }
    }
}
