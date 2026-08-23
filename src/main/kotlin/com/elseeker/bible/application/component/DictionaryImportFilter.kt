package com.elseeker.bible.application.component

import com.neovisionaries.i18n.LanguageCode
import org.springframework.stereotype.Component

/**
 * 성경 사전(`dictionary`) 행을 어느 번역본 어휘로 가져올지 판별한다.
 *
 * ## 이 클래스는 한시적이다
 *
 * `dictionary` 에는 아직 표제어 언어 컬럼이 없다. `original_language_code` 는 `HEBREW`/`GREEK`
 * 즉 성경 원어라 표제어 언어와 무관하다. 그래서 지금은 **문자 종류로 판별**한다.
 *
 * 사전에 `language_code` 컬럼이 추가되면(확정된 계획 — 설계 문서 §3.6)
 * [matchesLanguage] 를 `dictionary.language_code = :languageCode` 조회로 바꾸고
 * [supportsLanguage] 제한을 푼다. **판별 로직을 이 클래스 밖으로 흘리지 말 것.**
 *
 * 문자 판별을 오래 두면 안 되는 이유는 라틴 문자를 쓰는 영어와 스페인어가 문자 종류로 서로
 * 구분되지 않기 때문이다. 그래서 그때까지는 한국어 외 번역본의 가져오기를 아예 막는다.
 */
@Component
class DictionaryImportFilter {

    /** 지금은 한국어 번역본만 사전 가져오기를 지원한다. */
    fun supportsLanguage(languageCode: LanguageCode): Boolean = languageCode == LanguageCode.ko

    /** 사전 표제어가 대상 언어의 것인지 판별한다. */
    fun matchesLanguage(term: String, languageCode: LanguageCode): Boolean =
        languageCode == LanguageCode.ko && HANGUL.containsMatchIn(term)

    companion object {
        private val HANGUL = Regex("[가-힣]")
    }
}
