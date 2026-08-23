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
