package com.elseeker.bible.application.component

import com.elseeker.bible.adapter.output.jpa.ChapterVerseText
import com.elseeker.bible.domain.model.BibleWord
import com.elseeker.bible.domain.model.BibleWordAlias
import com.elseeker.bible.domain.vo.BibleWordCategory
import com.elseeker.bible.domain.vo.BibleWordStatus
import com.neovisionaries.i18n.LanguageCode
import io.kotest.matchers.maps.shouldContainKey
import io.kotest.matchers.maps.shouldNotContainKey
import io.kotest.matchers.shouldBe
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test

/**
 * 어휘 매칭 검증.
 *
 * 매칭 **순서**가 이 클래스의 핵심이다. 원형 조회가 정규화보다 먼저여야 어휘에 등록된 표제어가
 * 어미 규칙에 잡아먹히지 않는다.
 */
class BibleWordMatcherTest {

    private val tokenizer = BibleWordTokenizer(WordStatRules())
    private val sut = BibleWordMatcher(tokenizer)

    @Test
    @DisplayName("별칭으로 등록한 표기가 표제어 카운트에 합산된다")
    fun aliasCountsIntoTerm() {
        // given
        val index = sut.buildIndex(
            words = listOf(word(1L, "하나님")),
            aliases = listOf(alias(1L, "하느님")),
            languageCode = LanguageCode.ko,
        )

        // when
        val counted = sut.countBook(listOf(text(1, "하나님이 하느님을 하나님과")), index)

        // then
        counted.chapterCounts[1]!![1L] shouldBe 3
    }

    @Test
    @DisplayName("어휘의 표제어가 '하다' 동사로 쓰인 형태도 합산된다")
    fun countsHadaVerbFormOfTerm() {
        // given — 창세기 1장에 '창조' 는 한 번도 홀로 나오지 않는다. 전부 활용형이다.
        val index = sut.buildIndex(
            words = listOf(word(1L, "창조")),
            aliases = emptyList(),
            languageCode = LanguageCode.ko,
        )

        // when
        val counted = sut.countBook(listOf(text(1, "천지를 창조하시니라 창조하시되 창조하시고")), index)

        // then — 이 단계가 없으면 셋 다 서술어로 버려져 0 이 된다
        counted.chapterCounts[1]!![1L] shouldBe 3
    }

    @Test
    @DisplayName("어휘에 없는 어근은 '하다' 활용형이어도 만들어 내지 않는다")
    fun doesNotInventStemsOutsideVocabulary() {
        // given — 무분별한 어간 추출이 아니라 어휘 조회 전용이라는 계약이다
        val index = sut.buildIndex(
            words = listOf(word(1L, "하나님")),
            aliases = emptyList(),
            languageCode = LanguageCode.ko,
        )

        // when
        val counted = sut.countBook(listOf(text(1, "번성하여 생육하고")), index)

        // then
        counted.chapterCounts[1].orEmpty() shouldNotContainKey 1L
        counted.unmatched shouldNotContainKey "번성"
        counted.unmatched shouldNotContainKey "생육"
    }

    @Test
    @DisplayName("차단한 어휘는 카운트도 후보 리포트도 되지 않는다")
    fun blockedWordIsSuppressed() {
        // given — 그냥 로드하지 않으면 미매칭 후보로 되살아나 관리자가 무한히 다시 차단하게 된다
        val index = sut.buildIndex(
            words = listOf(word(1L, "나뉘게", status = BibleWordStatus.BLOCKED)),
            aliases = emptyList(),
            languageCode = LanguageCode.ko,
        )

        // when
        val counted = sut.countBook(listOf(text(1, "물로 나뉘게 하리라")), index)

        // then
        counted.chapterCounts[1].orEmpty() shouldNotContainKey 1L
        counted.unmatched shouldNotContainKey "나뉘게"
    }

    @Test
    @DisplayName("어휘에 등록된 2음절 명사는 어미 규칙보다 우선한다")
    fun registeredTermBeatsVerbTailRule() {
        // given — '여자' 는 2음절 어미 '자' 에 걸려 정규화 단계에서 버려진다
        tokenizer.normalize("여자", LanguageCode.ko) shouldBe null
        val index = sut.buildIndex(listOf(word(1L, "여자")), emptyList(), LanguageCode.ko)

        // when
        val counted = sut.countBook(listOf(text(1, "남자와 여자를 창조하시고 여자가")), index)

        // then — 원형 조회가 먼저라 살아남는다
        counted.chapterCounts[1]!![1L] shouldBe 2
    }

    @Test
    @DisplayName("한 절에 같은 단어가 두 번 나오면 2로 센다")
    fun countsRepeatedWordsInOneVerse() {
        // given
        val index = sut.buildIndex(listOf(word(1L, "빛")), emptyList(), LanguageCode.ko)

        // when
        val counted = sut.countBook(listOf(text(1, "빛이 있으라 하시매 빛이 있었고")), index)

        // then
        counted.chapterCounts[1]!![1L] shouldBe 2
    }

    @Test
    @DisplayName("어휘에 없는 정규화 토큰은 미매칭 후보로 적립된다")
    fun unmatchedTokensBecomeCandidates() {
        // given
        val index = sut.buildIndex(listOf(word(1L, "하나님")), emptyList(), LanguageCode.ko)

        // when
        val counted = sut.countBook(listOf(text(1, "하나님이 궁창을 만드시니라 하시니라")), index)

        // then
        counted.unmatched shouldContainKey "궁창"
        // 불용어·서술어 어미는 후보가 아니다. 그러면 리포트가 '그'·'가로되' 로 뒤덮인다
        counted.unmatched shouldNotContainKey "하시니라"
    }

    @Test
    @DisplayName("장별로 따로 집계한다")
    fun countsPerChapter() {
        // given
        val index = sut.buildIndex(listOf(word(1L, "하나님")), emptyList(), LanguageCode.ko)

        // when
        val counted = sut.countBook(
            listOf(text(1, "하나님이 이르시되"), text(2, "하나님이 하나님을")),
            index,
        )

        // then
        counted.chapterCounts[1]!![1L] shouldBe 1
        counted.chapterCounts[2]!![1L] shouldBe 2
    }

    @Test
    @DisplayName("영어 복수형은 어휘에 단수형이 있을 때만 합산한다")
    fun englishPluralMatchesOnlyWhenSingularExists() {
        // given
        val index = sut.buildIndex(listOf(word(1L, "heaven")), emptyList(), LanguageCode.en)

        // when
        val counted = sut.countBook(listOf(text(1, "the heavens declare heaven")), index)

        // then
        counted.chapterCounts[1]!![1L] shouldBe 2
    }

    // ------------ Private Methods ------------

    private fun word(
        id: Long,
        term: String,
        status: BibleWordStatus = BibleWordStatus.APPROVED,
    ) = BibleWord(
        id = id,
        translationId = TRANSLATION_ID,
        term = term,
        category = BibleWordCategory.ETC,
        status = status,
    )

    private fun alias(bibleWordId: Long, alias: String) = BibleWordAlias(
        id = bibleWordId * 100,
        bibleWordId = bibleWordId,
        translationId = TRANSLATION_ID,
        alias = alias,
    )

    private fun text(chapterNumber: Int, text: String) = ChapterVerseText(chapterNumber, text)

    companion object {
        private const val TRANSLATION_ID = 1L
    }
}
