package com.elseeker.bible.application.component

import com.neovisionaries.i18n.LanguageCode
import io.kotest.matchers.collections.shouldContainExactly
import io.kotest.matchers.shouldBe
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test

/**
 * 한국어 정규화 규칙 검증.
 *
 * 이 규칙은 사용자 화면에 직접 나가지 않지만 **모든 카운트의 기준선**이다. 규칙이 바뀌면
 * 통계 숫자가 통째로 바뀌므로, 프로토타입으로 확정한 동작을 여기서 고정한다.
 */
class BibleWordTokenizerTest {

    private val sut = BibleWordTokenizer(WordStatRules())

    @Test
    @DisplayName("조사를 떼어 표제어 형태로 만든다")
    fun stripJosa() {
        // when & then
        normalize("여호와께서") shouldBe "여호와"
        normalize("모세에게") shouldBe "모세"
        normalize("이스라엘의") shouldBe "이스라엘"
        normalize("애굽으로") shouldBe "애굽"
    }

    @Test
    @DisplayName("긴 조사를 먼저 떼어 '종류대로' 가 '종류대' 로 잘리지 않는다")
    fun stripLongestJosaFirst() {
        // given — '대로' 가 목록에 없으면 '로' 만 떨어져 '종류대' 라는 없는 단어가 만들어진다
        // when & then
        normalize("종류대로") shouldBe "종류"
        normalize("형상대로") shouldBe "형상"
    }

    @Test
    @DisplayName("1음절 명사는 허용 목록에 있으면 살린다")
    fun keepAllowedOneCharNoun() {
        // when & then — 목록이 없으면 시편 최상위 단어 '주'(1235)가 통째로 사라진다
        normalize("땅에") shouldBe "땅"
        normalize("주의") shouldBe "주"
        normalize("빛이") shouldBe "빛"
        normalize("물로") shouldBe "물"
    }

    @Test
    @DisplayName("'풀'·'뭍' 도 1음절 명사로 살린다")
    fun keepPlantAndDryLandNouns() {
        // given — 목록에 없을 때는 줄기가 1음절이라 조사를 떼지 못하고
        //         '풀과'·'뭍이' 라는 어절이 그대로 통계에 올라왔다(창세기 1장에서 관측).
        // when & then
        normalize("풀과") shouldBe "풀"
        normalize("풀을") shouldBe "풀"
        normalize("뭍이") shouldBe "뭍"
        normalize("뭍을") shouldBe "뭍"
    }

    @Test
    @DisplayName("복수 접미사 '들' 은 떼지 않는다 — 알려진 한계")
    fun pluralSuffixIsNotStripped() {
        // given — '들' 은 조사가 아니라 접미사다. 조사 목록에 넣으면 '버들' 이 '버' 가 된다.
        //         그래서 '별' 이 1음절 명사 목록에 있어도 '별들을' 은 '별' 로 합쳐지지 않는다.
        // when & then
        normalize("별들을") shouldBe "별들"
        normalize("새들도") shouldBe "새들"
        normalize("물들은") shouldBe "물들"
    }

    @Test
    @DisplayName("조사를 뗀 결과가 불용어면 버린다")
    fun dropStopwordAfterStrippingJosa() {
        // given — 이 재검사가 없으면 '것을'·'때에' 가 어절 그대로 통계에 올라온다
        // when & then
        normalize("것을") shouldBe null
        normalize("때에") shouldBe null
        normalize("앞에") shouldBe null
        normalize("그의") shouldBe null
    }

    @Test
    @DisplayName("서술어 어미로 끝나는 어절은 버린다")
    fun dropVerbForms() {
        // when & then
        normalize("창조하시니라") shouldBe null
        normalize("이르시되") shouldBe null
        normalize("좋았더라") shouldBe null
        normalize("있으라") shouldBe null
    }

    @Test
    @DisplayName("어미 목록과 정확히 일치하는 2음절 어절도 버린다")
    fun dropTwoSyllableVerbTailExactMatch() {
        // given — 일곱 개 모두 verb-tails-ko.txt 에 있는데도 그 목록이 3음절 이상에만 적용돼
        //         후보로 올라왔다. 창세기 후보 705건에 전부 섞여 있었고, 어휘 조회가 정규화보다
        //         먼저라 등록된 뒤에는 '하라(3회)' 처럼 통계에 그대로 노출됐다.
        // when & then
        normalize("하라") shouldBe null
        normalize("하매") shouldBe null
        normalize("하여") shouldBe null
        normalize("하사") shouldBe null
        normalize("하신") shouldBe null
        normalize("하실") shouldBe null
        normalize("하기") shouldBe null
    }

    @Test
    @DisplayName("'라'·'매'로 끝나는 2음절 명사는 살아남는다")
    fun twoSyllableNounEndingWithVerbTailChar() {
        // given — '라'·'매' 를 2음절 어미 목록에 넣는 방법으로 위를 고치면 여기가 깨진다.
        //         그래서 접미사 검사가 아니라 목록 전체 일치 검사를 쓴다.
        // when & then
        normalize("사라") shouldBe "사라"
        normalize("고라") shouldBe "고라"
        normalize("자매") shouldBe "자매"
    }

    @Test
    @DisplayName("1음절 명사를 보강해 조사별로 갈라지지 않는다")
    fun oneCharNounNoLongerSplits() {
        // given — 목록에 없을 때 창세기에서 롯이 롯이(12)·롯을(6)·롯의(5)·롯도(4)·롯과(3) 로
        //         표제어 5개가 됐고, 승인 어휘 '몸' 은 0회인데 몸을(7)·몸에(4)·몸과(3) 이 따로 잡혔다.
        // when & then
        normalize("롯이") shouldBe "롯"
        normalize("롯과") shouldBe "롯"
        normalize("몸에") shouldBe "몸"
        normalize("몸을") shouldBe "몸"
        normalize("떼가") shouldBe "떼"
        normalize("딸을") shouldBe "딸"
        normalize("굴에") shouldBe "굴"
        normalize("세를") shouldBe "세"
        normalize("세에") shouldBe "세"
    }

    @Test
    @DisplayName("긴 조사가 길이 가드에 걸려도 짧은 조사로 조각을 만들지 않는다")
    fun noFragmentFromJosaFallback() {
        // given — '돈' 이 목록에 없을 때 '돈으로' 는 '으로' 가드에 걸린 뒤 '로' 만 떨어져
        //         '돈으' 라는 조각이 됐다. 같은 방식으로 '흙으'·'선으' 도 어휘에 올라왔다.
        // when & then
        normalize("돈으로") shouldBe "돈"
        normalize("몸으로") shouldBe "몸"
    }

    @Test
    @DisplayName("1음절 명사 목록에 넣지 않기로 한 글자는 2음절 명사를 깎지 않는다")
    fun deliberatelyExcludedOneCharNouns() {
        // given — '실'·'태' 를 넣으면 '실과'(열매)가 '실' 로, '태도' 가 '태' 로 깎인다.
        //         목록 추가는 그 글자로 끝나는 2음절 명사를 확인한 뒤에만 한다.
        // when & then
        normalize("실과") shouldBe "실과"
        normalize("태도") shouldBe "태도"
    }

    @Test
    @DisplayName("불용어는 그대로 버린다")
    fun dropStopwords() {
        // when & then — 정규화만으로는 절대 사라지지 않는 상위권 노이즈다
        normalize("그") shouldBe null
        normalize("가로되") shouldBe null
        normalize("이르되") shouldBe null
        normalize("가라사대") shouldBe null
        normalize("내가") shouldBe null
    }

    @Test
    @DisplayName("2음절 어미 규칙은 '여자' 같은 명사도 함께 버린다 — 알려진 오탐")
    fun twoSyllableTailFalsePositive() {
        // given — 2음절 어미 목록의 '자'·'고' 는 '여자'·'남자'·'창고' 같은 명사도 잡는다.
        //         이것이 어휘 원형 조회를 정규화보다 먼저 두는 이유다(BibleWordMatcher).
        // when & then
        normalize("여자") shouldBe null
        normalize("남자") shouldBe null
        normalize("창고") shouldBe null
    }

    @Test
    @DisplayName("2음절 어미 목록에 없는 꼬리는 그대로 살아남는다")
    fun twoSyllableTailNotOverreaching() {
        // given — '다'·'기' 는 목록에 없다. 오탐 범위를 좁게 유지한 결과다.
        // when & then
        normalize("바다") shouldBe "바다"
        normalize("고기") shouldBe "고기"
    }

    @Test
    @DisplayName("'와/과' 조사가 '여호와' 를 '여호' 로 깎는다 — 알려진 결함, 어휘로 방어한다")
    fun waJosaDamagesYahweh() {
        // given — 로컬 화면 확인에서 '여호와(132)' 와 '여호(28)' 이 함께 잡혀 드러난 케이스.
        //         조사가 붙은 형태는 긴 조사가 먼저 매칭돼 멀쩡하다.
        normalize("여호와께서") shouldBe "여호와"
        normalize("여호와의") shouldBe "여호와"

        // when & then — 조사 없이 홀로 나온 '여호와' 만 '와' 가 떨어진다
        normalize("여호와") shouldBe "여호"

        // 어휘에 '여호와' 를 등록하면 BibleWordMatcher 의 원형 조회가 먼저 잡아 이 문제가 사라진다.
        // 정규화 결함이 화면 오류가 아니라 후보 리포트의 한 줄이 되는 구조다.
    }

    @Test
    @DisplayName("영어는 소문자화하고 고어 불용어를 제거한다")
    fun tokenizeEnglish() {
        // when
        val tokens = sut.tokenize("Thou hast made the Heaven and the Earth, saith the LORD.", LanguageCode.en)

        // then
        tokens shouldContainExactly listOf("made", "heaven", "earth", "lord")
    }

    @Test
    @DisplayName("영어 소유격은 잘라 내고 3자 미만은 버린다")
    fun tokenizeEnglishPossessive() {
        // when
        val tokens = sut.tokenize("God's own son is he", LanguageCode.en)

        // then — 'is'/'he' 는 불용어, 'own' 도 불용어
        tokens shouldContainExactly listOf("god", "son")
    }

    @Test
    @DisplayName("'하다' 동사 어근 후보를 뽑는다 — 어휘 확인 전용")
    fun verbStemCandidate() {
        // when & then
        sut.verbStemCandidate("창조하시니라", LanguageCode.ko) shouldBe "창조"
        sut.verbStemCandidate("충만하라", LanguageCode.ko) shouldBe "충만"
        sut.verbStemCandidate("주관하게", LanguageCode.ko) shouldBe "주관"
    }

    @Test
    @DisplayName("어근이 1음절이거나 '하'가 없으면 후보를 만들지 않는다")
    fun verbStemCandidateGuards() {
        // given — '말하니' 를 '말' 로 만들면 1음절 명사 목록에 있는 '말'(word)로 잘못 집계된다
        // when & then
        sut.verbStemCandidate("말하니", LanguageCode.ko) shouldBe null
        sut.verbStemCandidate("하나님이", LanguageCode.ko) shouldBe null   // '하' 가 맨 앞
        sut.verbStemCandidate("천하의", LanguageCode.ko) shouldBe null     // 어근이 1음절
        sut.verbStemCandidate("형상대로", LanguageCode.ko) shouldBe null   // '하' 가 없음
        sut.verbStemCandidate("creating", LanguageCode.en) shouldBe null
    }

    @Test
    @DisplayName("복수형 후보는 어휘 확인 전용이며 무조건 자르지 않는다")
    fun singularCandidate() {
        // when & then
        sut.singularCandidate("heavens", LanguageCode.en) shouldBe "heaven"
        sut.singularCandidate("houses", LanguageCode.en) shouldBe "hous"
        sut.singularCandidate("god", LanguageCode.en) shouldBe null
        sut.singularCandidate("하나님", LanguageCode.ko) shouldBe null
    }

    @Test
    @DisplayName("한국어 매칭 키는 원형을 유지하고 라틴 문자는 소문자로 맞춘다")
    fun matchKey() {
        // when & then
        sut.matchKey("하나님", LanguageCode.ko) shouldBe "하나님"
        sut.matchKey(" God ", LanguageCode.en) shouldBe "god"
    }

    // ------------ Private Methods ------------

    private fun normalize(word: String): String? = sut.normalize(word, LanguageCode.ko)
}
