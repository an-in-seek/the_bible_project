package com.elseeker.bible.application.component

import com.neovisionaries.i18n.LanguageCode
import org.springframework.stereotype.Component

/**
 * 성경 본문을 단어 빈도 집계용 토큰으로 바꾼다. 순수 함수이며 DB 를 보지 않는다.
 *
 * **이 결과는 사용자 화면에 직접 나가지 않는다.** 카운트 계산기와 후보 추출기 안에서만 쓰이고,
 * 화면에는 관리자가 승인한 어휘(`bible_word`)에 매칭된 것만 나간다. 그래서 규칙이 과하게 자른
 * `종류대` 같은 형태가 나와도 화면 오류가 아니라 후보 리포트의 한 줄이 될 뿐이다.
 *
 * 형태소 분석기를 도입하게 되면 이 클래스만 교체하면 된다(설계 문서 §4.2).
 */
@Component
class BibleWordTokenizer(
    private val rules: WordStatRules,
) {

    /**
     * 본문을 어절로 자른다. 정규화 전 원형이며, 매칭은 이 원형부터 조회한다(설계 문서 §4.1).
     *
     * 라틴 문자권은 이 단계에서 소문자화까지 마친다.
     */
    fun splitWords(text: String, languageCode: LanguageCode): List<String> =
        when (languageCode) {
            LanguageCode.ko -> NON_HANGUL.replace(text, " ").split(WHITESPACE).filter { it.isNotEmpty() }
            else -> NON_ALPHA.replace(POSSESSIVE.replace(text.lowercase(), ""), " ")
                .split(WHITESPACE)
                .filter { it.isNotEmpty() }
        }

    /**
     * 어절 하나를 정규화한다. 집계 대상이 아니면 null.
     */
    fun normalize(word: String, languageCode: LanguageCode): String? =
        when (languageCode) {
            LanguageCode.ko -> normalizeKorean(word)
            else -> normalizeLatin(word, languageCode)
        }

    /**
     * 본문 전체를 정규화 토큰 목록으로 바꾼다. 후보 추출에 쓴다.
     */
    fun tokenize(text: String, languageCode: LanguageCode): List<String> =
        splitWords(text, languageCode).mapNotNull { normalize(it, languageCode) }

    /**
     * **조사만** 떼어 낸 형태. 불용어·어미 필터를 적용하지 않는다.
     *
     * 매처가 어휘 조회에 쓴다. 원형 조회만으로는 조사가 붙은 어절(`여자를`)을 지킬 수 없다 —
     * 조사를 뗀 `여자` 가 2음절 어미 규칙('자')에 걸려 [normalize] 단계에서 버려지기 때문이다.
     * 어휘에 등록된 표제어는 어떤 규칙보다 우선해야 하므로, 규칙을 적용하기 전에 이 형태로
     * 한 번 더 조회할 기회를 준다.
     *
     * 조사를 떼지 못했으면 null (원형 조회와 중복이므로).
     */
    fun stemOnly(word: String, languageCode: LanguageCode): String? {
        if (languageCode != LanguageCode.ko) return null
        return stripJosa(word).takeIf { it != word }
    }

    /**
     * 어휘 해시의 키. 라틴 문자권은 대소문자를 무시해야 하므로 소문자로 맞춘다.
     */
    fun matchKey(term: String, languageCode: LanguageCode): String =
        if (languageCode == LanguageCode.ko) term.trim() else term.trim().lowercase()

    /**
     * 라틴 문자권 복수형 후보. `-s`/`-es` 를 떼어 본 형태를 돌려준다.
     *
     * **반드시 어휘에 있는지 확인한 뒤에만 써야 한다.** 무조건 떼는 stemming 은
     * `moses` → `mose` 처럼 없는 단어를 만든다(설계 문서 §4.5).
     */
    fun singularCandidate(word: String, languageCode: LanguageCode): String? {
        if (languageCode == LanguageCode.ko) return null
        if (word.length >= 5 && word.endsWith("es")) return word.dropLast(2)
        if (word.length >= 4 && word.endsWith("s") && !word.endsWith("ss")) return word.dropLast(1)
        return null
    }

    // ------------ Private Methods ------------

    private fun normalizeKorean(word: String): String? {
        if (word in rules.stopwordsKo) return null
        if (isKoreanVerbForm(word)) return null

        val stem = stripJosa(word)
        if (stem in rules.stopwordsKo) return null
        if (isKoreanVerbForm(stem)) return null
        if (stem.length < MIN_KOREAN_LENGTH && stem !in rules.oneCharNounsKo) return null

        return stem
    }

    private fun normalizeLatin(word: String, languageCode: LanguageCode): String? {
        if (word.length < MIN_LATIN_LENGTH) return null
        if (word in rules.stopwordsOf(languageCode)) return null
        return word
    }

    /**
     * 조사를 뗀다. 긴 것부터 시도하되, **길이 가드에 걸려도 중단하지 않고 짧은 후보로 계속 간다.**
     * 여기서 `break` 하면 '그대로' 가 '대로' 에서 걸린 뒤 '로' 를 시도하지 못한다.
     */
    private fun stripJosa(word: String): String {
        for (josa in rules.josaKo) {
            if (!word.endsWith(josa)) continue
            val candidate = word.dropLast(josa.length)
            if (candidate.isEmpty()) continue
            if (candidate.length >= MIN_KOREAN_LENGTH || candidate in rules.reducibleKo) {
                return candidate
            }
        }
        return word
    }

    private fun isKoreanVerbForm(word: String): Boolean = when {
        word.length >= 3 -> rules.verbTailsKo.any { word.endsWith(it) }
        word.length == 2 -> rules.verbTails2Ko.any { word.endsWith(it) }
        else -> false
    }

    companion object {
        private const val MIN_KOREAN_LENGTH = 2
        private const val MIN_LATIN_LENGTH = 3

        private val NON_HANGUL = Regex("[^가-힣\\s]")
        private val NON_ALPHA = Regex("[^a-záéíóúüñç\\s]")
        private val POSSESSIVE = Regex("'s\\b")
        private val WHITESPACE = Regex("\\s+")
    }
}
