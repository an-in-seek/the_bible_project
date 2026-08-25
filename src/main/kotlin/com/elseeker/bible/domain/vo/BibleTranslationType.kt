package com.elseeker.bible.domain.vo

import com.neovisionaries.i18n.LanguageCode

/**
 * 번역본 종류.
 *
 * **상수 이름이 곧 저장 값이다.** `BibleTranslation.translationType` 이 `@Enumerated(STRING)` 이라
 * `bible_translation.translation_type` 컬럼에 상수 이름 그대로 들어간다. 따라서 상수를 rename 하는 것은
 * 코드 리팩터링이 아니라 **데이터 마이그레이션**이다. 이름만 바꾸면 이미 저장된 행을 읽는 순간
 * `IllegalArgumentException: No enum constant ...` 로 500 이 난다. Hibernate 가 행을 엔티티로
 * 만드는 시점에 터지므로 `GlobalExceptionHandler` 도 손대지 못하고, 컴파일과 테스트는 멀쩡히 통과한다.
 * (테스트 DB 는 컨테이너에 새로 만들어져 비어 있으므로 이 어긋남을 잡아 주지 못한다.)
 *
 * 상수를 바꿔야 한다면 `UPDATE bible_translation SET translation_type = ...` 를 함께 적용하고
 * `db/migration/` 에 스크립트를 남긴다.
 */
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

    /**
     * 口語訳聖書. 신약만 있는 新改訳(1965)이 아니라 **구약까지 갖춘 1954/1955 구어역**이다.
     * DB 에 실린 본문으로 확인했다 — 요한복음 3:16 이 "神はそのひとり子を賜わったほどに…"(구어역)이고
     * 창세기 1:1 도 들어 있다(구약 23,146절 + 신약 7,958절, 66권).
     *
     * 구어역은 일본에서 퍼블릭 도메인이고 新改訳 은 저작권이 살아 있다. 이 상수 이름과 설명은
     * 어떤 본문을 싣고 있는지에 대한 기록이므로 본문을 바꾸지 않는 한 함께 바꾸지 않는다.
     */
    KOUGO("KOUGO", "Japanese Colloquial Bible (1954/1955)", LanguageCode.ja),

    /**
     * 和合本(Chinese Union Version). [CUVT] 는 번체, [CUVS] 는 간체다.
     *
     * **읽기만 열려 있다.** 본문 66권과 `bible_book_description` 의 `zh` 66행이 갖춰져
     * `BibleReader.getTranslations()` 의 허용 목록에 들어가 있지만, **단어 통계는 나오지 않는다.**
     * [com.elseeker.bible.application.component.BibleWordTokenizer.splitWords] 가 한국어가 아니면
     * `[^a-záéíóúüñç\s]` 를 공백으로 바꾸므로 한자가 통째로 지워진다. 오류 없이 0건이 되므로
     * "왜 통계가 비어 있지" 를 여기서 찾을 수 있게 적어 둔다. 중국어는 띄어쓰기가 없어
     * 어절 분할 자체가 성립하지 않으니, 열려면 n-gram 분할이나 사전 기반 분사가 필요하다.
     *
     * 책 소개는 `zh` 한 벌뿐이다. `language_code` 가 ISO 639-1 [LanguageCode] 이고
     * `(book_key, language_code)` 유니크 제약이 있어 번체·간체를 갈라 담을 수 없다.
     * **지금 실린 것은 간체자**라 번체 본문을 읽는 독자도 간체 소개를 보게 된다.
     * 갈라야 한다면 `LocaleCode`(zh-TW/zh-CN)로 바꾸거나 script 컬럼을 더하는 스키마 변경이 필요하다.
     *
     * 상수 이름은 노출 여부와 무관하게 DB 와 맞춰 두어야 한다. 없으면 `bible_translation` 의
     * 해당 행을 읽는 순간 `No enum constant` 로 500 이 난다.
     *
     * 간체(29,963절)가 번체(31,102절)보다 1,139절 적다. 원본 자료의 차이이며 확인이 필요하다.
     */
    CUVT("CUVT", "Chinese Union Version (Traditional)", LanguageCode.zh),
    CUVS("CUVS", "Chinese Union Version (Simplified)", LanguageCode.zh);

    companion object {
        fun fromAbbreviation(abbr: String): BibleTranslationType {
            return entries.find { it.abbreviation.equals(abbr, ignoreCase = true) }
                ?: throw IllegalArgumentException("존재하지 않는 번역본: $abbr")
        }
    }
}
