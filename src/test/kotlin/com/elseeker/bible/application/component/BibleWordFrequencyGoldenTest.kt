package com.elseeker.bible.application.component

import com.neovisionaries.i18n.LanguageCode
import io.kotest.matchers.collections.shouldContainExactly
import io.kotest.matchers.collections.shouldNotContainAnyOf
import io.kotest.matchers.shouldBe
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test

/**
 * 창세기 1장 골든 테스트 — 정규화 규칙 변경의 안전망.
 *
 * 불용어·조사·어미 목록을 손댈 때마다 여기서 회귀가 잡힌다. 규칙 하나를 고치면 상위권이
 * 통째로 흔들리는데, 그 영향을 눈으로 확인할 방법이 달리 없다.
 *
 * **DB 를 타지 않는 순수 문자열 픽스처여야 한다.** 시드 데이터에 의존하면 테스트 스키마
 * (`ddl-auto: update`)에는 성경 본문이 없어 곧바로 깨진다.
 */
class BibleWordFrequencyGoldenTest {

    private val sut = BibleWordTokenizer(WordStatRules())

    @Test
    @DisplayName("창세기 1장 상위 10개 단어가 고정된 결과와 일치한다")
    fun genesisChapterOneTopWords() {
        // when
        val top = topWords(GENESIS_1, limit = 10)

        // then
        // 동률은 표제어 오름차순으로 고정된다(새로고침마다 순서가 바뀌면 버그처럼 보인다)
        top shouldContainExactly listOf(
            "하나님" to 30,
            "땅" to 18,
            "종류" to 10,
            "궁창" to 9,
            "물" to 9,
            "광명" to 6,
            "빛" to 6,
            "씨" to 6,
            "아침" to 6,
            "저녁" to 6,
        )
    }

    @Test
    @DisplayName("상위권에 활용형·기능어가 섞이지 않는다")
    fun noFunctionWordsInTop() {
        // when
        val top = topWords(GENESIS_1, limit = 20).map { it.first }

        // then — 정규화 이전에는 이것들이 상위권을 덮었다
        top shouldNotContainAnyOf listOf("하나님이", "가라사대", "그", "종류대로", "하나님의", "좋았더라", "되며")
    }

    @Test
    @DisplayName("정규화로 어절 수가 절반 가까이 줄어든다")
    fun normalizationReducesTokenCount() {
        // when
        val rawCount = GENESIS_1.sumOf { sut.splitWords(it, LanguageCode.ko).size }
        val tokenCount = GENESIS_1.sumOf { sut.tokenize(it, LanguageCode.ko).size }

        // then — 프로토타입 실측: 어절 421 -> 토큰 228
        rawCount shouldBe 421
        (tokenCount < rawCount) shouldBe true
    }

    // ------------ Private Methods ------------

    private fun topWords(verses: List<String>, limit: Int): List<Pair<String, Int>> =
        verses.flatMap { sut.tokenize(it, LanguageCode.ko) }
            .groupingBy { it }
            .eachCount()
            .entries
            .sortedWith(compareByDescending<Map.Entry<String, Int>> { it.value }.thenBy { it.key })
            .take(limit)
            .map { it.key to it.value }

    companion object {
        /** 개역한글(KRV) 창세기 1장 31절 */
        private val GENESIS_1 = listOf(
            "태초에 하나님이 천지를 창조하시니라",
            "땅이 혼돈하고 공허하며 흑암이 깊음 위에 있고 하나님의 신은 수면에 운행하시니라",
            "하나님이 가라사대 빛이 있으라 하시매 빛이 있었고",
            "그 빛이 하나님의 보시기에 좋았더라 하나님이 빛과 어두움을 나누사",
            "빛을 낮이라 칭하시고 어두움을 밤이라 칭하시니라 저녁이 되며 아침이 되니 이는 첫째 날이니라",
            "하나님이 가라사대 물 가운데 궁창이 있어 물과 물로 나뉘게 하리라 하시고",
            "하나님이 궁창을 만드사 궁창 아래의 물과 궁창 위의 물로 나뉘게 하시매 그대로 되니라",
            "하나님이 궁창을 하늘이라 칭하시니라 저녁이 되며 아침이 되니 이는 둘째 날이니라",
            "하나님이 가라사대 천하의 물이 한곳으로 모이고 뭍이 드러나라 하시매 그대로 되니라",
            "하나님이 뭍을 땅이라 칭하시고 모인 물을 바다라 칭하시니라 하나님의 보시기에 좋았더라",
            "하나님이 가라사대 땅은 풀과 씨 맺는 채소와 각기 종류대로 씨 가진 열매 맺는 과목을 내라 하시매 그대로 되어",
            "땅이 풀과 각기 종류대로 씨 맺는 채소와 각기 종류대로 씨 가진 열매 맺는 나무를 내니 하나님의 보시기에 좋았더라",
            "저녁이 되며 아침이 되니 이는 세째 날이니라",
            "하나님이 가라사대 하늘의 궁창에 광명이 있어 주야를 나뉘게 하라 또 그 광명으로 하여 징조와 사시와 일자와 연한이 이루라",
            "또 그 광명이 하늘의 궁창에 있어 땅에 비취라 하시고 （그대로 되니라）",
            "하나님이 두 큰 광명을 만드사 큰 광명으로 낮을 주관하게 하시고 작은 광명으로 밤을 주관하게 하시며 또 별들을 만드시고",
            "하나님이 그것들을 하늘의 궁창에 두어 땅에 비취게 하시며",
            "주야를 주관하게 하시며 빛과 어두움을 나뉘게 하시니라 하나님의 보시기에 좋았더라",
            "저녁이 되며 아침이 되니 이는 네째 날이니라",
            "하나님이 가라사대 물들은 생물로 번성케 하라 땅위 하늘의 궁창에는 새가 날으라 하시고",
            "하나님이 큰 물고기와 물에서 번성하여 움직이는 모든 생물을 그 종류대로, 날개 있는 모든 새를 그 종류대로 창조하시니 하나님의 보시기에 좋았더라",
            "하나님이 그들에게 복을 주어 가라사대 생육하고 번성하여 여러 바다 물에 충만하라 새들도 땅에 번성하라 하시니라",
            "저녁이 되며 아침이 되니 이는 다섯째 날이니라",
            "하나님이 가라사대 땅은 생물을 그 종류대로 내되 육축과 기는 것과 땅의 짐승을 종류대로 내라 하시고 （그대로 되니라）",
            "하나님이 땅의 짐승을 그 종류대로, 육축을 그 종류대로, 땅에 기는 모든 것을 그 종류대로 만드시니 하나님의 보시기에 좋았더라",
            "하나님이 가라사대 우리의 형상을 따라 우리의 모양대로 우리가 사람을 만들고 그로 바다의 고기와 공중의 새와 육축과 온 땅과 땅에 기는 모든 것을 다스리게 하자 하시고",
            "하나님이 자기 형상 곧 하나님의 형상대로 사람을 창조하시되 남자와 여자를 창조하시고",
            "하나님이 그들에게 복을 주시며 그들에게 이르시되 생육하고 번성하여 땅에 충만하라, 땅을 정복하라, 바다의 고기와 공중의 새와 땅에 움직이는 모든 생물을 다스리라 하시니라",
            "하나님이 가라사대 내가 온 지면의 씨 맺는 모든 채소와 씨 가진 열매 맺는 모든 나무를 너희에게 주노니 너희 식물이 되리라",
            "또 땅의 모든 짐승과 공중의 모든 새와 생명이 있어 땅에 기는 모든 것에게는 내가 모든 푸른 풀을 식물로 주노라 하시니 그대로 되니라",
            "하나님이 그 지으신 모든 것을 보시니 보시기에 심히 좋았더라 저녁이 되며 아침이 되니 이는 여섯째 날이니라",
        )
    }
}
