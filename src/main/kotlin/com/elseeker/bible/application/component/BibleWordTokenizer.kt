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
     * `하다` 동사로 쓰인 어근 후보. `창조하시니라` → `창조`.
     *
     * **반드시 어휘에 있는지 확인한 뒤에만 써야 한다.** 무조건 자르면 명사가 아닌 것을 명사로
     * 만든다. 라틴 문자권 복수형([singularCandidate])과 같은 구조다.
     *
     * 어근이 2음절 미만이면 돌려주지 않는다. `말하니` → `말`, `서하고` → `서` 처럼
     * 1음절 어근은 오탐이 크고, 그 1음절들은 대개 1음절 명사 허용 목록에 들어 있어 더 위험하다.
     */
    fun verbStemCandidate(word: String, languageCode: LanguageCode): String? {
        if (languageCode != LanguageCode.ko) return null
        val index = word.indexOf(HA)
        if (index < MIN_KOREAN_LENGTH) return null
        return word.substring(0, index)
    }

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

    /**
     * 서술어 활용형인지 본다.
     *
     * 2음절은 [WordStatRules.verbTails2Ko] 의 접미사 검사에 **어미 목록 전체 일치 검사를 더한다.**
     * 접미사 검사만 하면 `하라`·`하매`·`하여`·`하사`·`하신`·`하실`·`하기` 가 빠져나간다 —
     * 일곱 개 모두 `verb-tails-ko.txt` 에 그대로 들어 있는데도 그 목록이 3음절 이상에만
     * 적용되기 때문이다. (창세기 후보 추출에서 실제로 전부 어휘로 올라왔다.)
     *
     * 대신 `라`·`매` 를 [WordStatRules.verbTails2Ko] 에 넣는 방법은 쓸 수 없다. `사라`·`고매` 처럼
     * 그 글자로 끝나는 2음절 명사가 통째로 사라진다. 그래서 **접미사가 아니라 정확히 일치할
     * 때만** 버린다.
     */
    private fun isKoreanVerbForm(word: String): Boolean = when {
        word.length >= 3 -> rules.verbTailsKo.any { word.endsWith(it) }
        word.length == 2 -> word in rules.verbTailsKo || rules.verbTails2Ko.any { word.endsWith(it) }
        else -> false
    }

    companion object {
        private const val MIN_KOREAN_LENGTH = 2

        /** `X하다` 활용형에서 어근과 어미를 가르는 글자 */
        private const val HA = '하'
        private const val MIN_LATIN_LENGTH = 3

        private val NON_HANGUL = Regex("[^가-힣\\s]")
        private val NON_ALPHA = Regex("[^a-záéíóúüñç\\s]")
        private val POSSESSIVE = Regex("'s\\b")
        private val WHITESPACE = Regex("\\s+")
    }
}
