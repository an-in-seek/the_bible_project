package com.elseeker.bible.application.component

import com.elseeker.bible.adapter.output.jpa.BookVerseText
import com.neovisionaries.i18n.LanguageCode
import io.kotest.matchers.shouldBe
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test

/**
 * 키워드 문자열 집계 검증.
 *
 * 이 클래스의 값어치는 **매처가 못 세는 것을 세는 것**과 **매처가 하지 않던 오검출을 하는 것**
 * 두 가지에 있다. 둘 다 의도된 성질이라 테스트로 고정한다.
 */
class BibleWordOccurrenceCounterTest {

    private val sut = BibleWordOccurrenceCounter()

    @Test
    @DisplayName("한 절에 세 번 나오면 3회로 센다")
    fun countsEveryOccurrence() {
        // given
        val verses = listOf(verse(1, 1, "하나님이 하나님을 하나님과"))

        // when
        val counted = sut.countBook(verses, listOf("하나님"), LanguageCode.ko)

        // then
        counted.chapterCounts[1] shouldBe 3
        counted.totalCount shouldBe 3
    }

    @Test
    @DisplayName("공백이 든 키워드도 센다 — 매처가 영영 세지 못하는 표제어다")
    fun countsMultiWordTerm() {
        // given
        val verses = listOf(verse(1, 1, "하나님 나라가 가까이 왔으니 하나님 나라를 구하라"))

        // when
        val counted = sut.countBook(verses, listOf("하나님 나라"), LanguageCode.ko)

        // then
        counted.totalCount shouldBe 2
    }

    @Test
    @DisplayName("띄어쓰기가 없는 언어도 센다")
    fun countsWithoutWhitespace() {
        // given
        val verses = listOf(verse(1, 1, "起初神創造天地神說"))

        // when
        val counted = sut.countBook(verses, listOf("神"), LanguageCode.zh)

        // then
        counted.totalCount shouldBe 2
    }

    @Test
    @DisplayName("별칭을 합산하되 겹치는 자리를 두 번 세지 않는다")
    fun countsAliasWithoutDoubleCounting() {
        // given — '하나님 아버지' 안에는 '하나님' 도 들어 있다
        val verses = listOf(verse(1, 1, "하나님 아버지께 하나님이"))

        // when
        val counted = sut.countBook(verses, listOf("하나님", "하나님 아버지"), LanguageCode.ko)

        // then
        counted.totalCount shouldBe 2
    }

    @Test
    @DisplayName("라틴 문자권은 대소문자를 무시한다")
    fun ignoresCaseForLatin() {
        // given
        val verses = listOf(verse(1, 1, "God created. In GOD we trust, god."))

        // when
        val counted = sut.countBook(verses, listOf("God"), LanguageCode.en)

        // then
        counted.totalCount shouldBe 3
    }

    @Test
    @DisplayName("형태소 경계를 보지 못해 '말' 이 '말씀' 을 함께 센다 — 알려진 한계")
    fun countsSubstringInsideOtherWord() {
        // given
        val verses = listOf(verse(1, 1, "말씀이 계시니라 말미암아"))

        // when
        val counted = sut.countBook(verses, listOf("말"), LanguageCode.ko)

        // then
        counted.totalCount shouldBe 2
    }

    @Test
    @DisplayName("장별로 나누어 세고 0 회인 장은 담지 않는다")
    fun countsPerChapter() {
        // given
        val verses = listOf(
            verse(1, 1, "하나님이 하나님을"),
            verse(2, 1, "사람이 있었더라"),
            verse(3, 1, "하나님이"),
        )

        // when
        val counted = sut.countBook(verses, listOf("하나님"), LanguageCode.ko)

        // then
        counted.chapterCounts shouldBe mapOf(1 to 2, 3 to 1)
        counted.totalCount shouldBe 3
    }

    @Test
    @DisplayName("잡힌 절을 장·절 순서로 돌려준다 — 조회 쿼리에 정렬이 없다")
    fun sortsSamples() {
        // given
        val verses = listOf(
            verse(2, 5, "하나님이"),
            verse(1, 3, "하나님이"),
            verse(1, 1, "하나님이"),
        )

        // when
        val counted = sut.countBook(verses, listOf("하나님"), LanguageCode.ko, sampleLimit = 2)

        // then
        counted.samples.map { it.chapterNumber to it.verseNumber } shouldBe listOf(1 to 1, 1 to 3)
    }

    @Test
    @DisplayName("한 번도 나오지 않으면 0 회이고 예시도 없다")
    fun countsNothing() {
        // given
        val verses = listOf(verse(1, 1, "태초에 천지를 창조하시니라"))

        // when
        val counted = sut.countBook(verses, listOf("하나님"), LanguageCode.ko)

        // then
        counted.totalCount shouldBe 0
        counted.samples.size shouldBe 0
    }

    private fun verse(chapterNumber: Int, verseNumber: Int, text: String) =
        BookVerseText(chapterNumber = chapterNumber, verseNumber = verseNumber, text = text)
}
