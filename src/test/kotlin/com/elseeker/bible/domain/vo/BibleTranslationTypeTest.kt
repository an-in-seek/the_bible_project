package com.elseeker.bible.domain.vo

import com.neovisionaries.i18n.LanguageCode
import io.kotest.matchers.collections.shouldBeEmpty
import io.kotest.matchers.collections.shouldContainExactlyInAnyOrder
import io.kotest.matchers.shouldBe
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test

/**
 * 번역본 종류의 식별자 규약 검증.
 *
 * 이 테스트가 막을 수 있는 것과 없는 것을 구분해 둔다. **상수 이름과 DB 값이 어긋나는 것은
 * 여기서 잡히지 않는다** — 테스트 DB 는 컨테이너에 새로 만들어져 비어 있기 때문이다.
 * 잡을 수 있는 것은 "같은 번역본을 가리키는 식별자가 두 갈래로 갈라지는 것"까지다.
 */
class BibleTranslationTypeTest {

    @Test
    @DisplayName("약어는 상수 이름과 같다")
    fun abbreviationMatchesConstantName() {
        // given — DB 에 저장되는 값은 `abbreviation` 이 아니라 상수 이름이다(@Enumerated(STRING)).
        //         둘이 다르면 약어를 보고 DB 값을 짐작한 사람이 없는 값을 넣게 된다.
        //         실제로 JPN1965("JPN") 이 그렇게 어긋나 있었고, DB 에는 세 번째 값이 들어갔다.
        // when
        val mismatched = BibleTranslationType.entries.filter { it.abbreviation != it.name }

        // then
        mismatched.shouldBeEmpty()
    }

    @Test
    @DisplayName("약어는 중복되지 않는다")
    fun abbreviationIsUnique() {
        // given — 중복되면 fromAbbreviation 이 둘 중 하나를 조용히 고른다
        // when
        val distinctCount = BibleTranslationType.entries.map { it.abbreviation.lowercase() }.distinct().size

        // then
        distinctCount shouldBe BibleTranslationType.entries.size
    }

    @Test
    @DisplayName("약어로 번역본을 찾는다")
    fun fromAbbreviation() {
        // when & then
        BibleTranslationType.fromAbbreviation("KRV") shouldBe BibleTranslationType.KRV
        BibleTranslationType.fromAbbreviation("kougo") shouldBe BibleTranslationType.KOUGO
    }

    @Test
    @DisplayName("일본어 번역본은 KOUGO 와 JPNMEB 두 개다")
    fun japaneseTranslations() {
        // given — 본문이 실려 있는 번역본이다. 상수 이름이 곧 bible_translation.translation_type 이므로
        //         이 목록이 바뀌면 DB 도 함께 바뀌어야 한다.
        // when
        val japanese = BibleTranslationType.entries.filter { it.language == LanguageCode.ja }

        // then
        japanese shouldContainExactlyInAnyOrder listOf(
            BibleTranslationType.KOUGO,
            BibleTranslationType.JPNMEB
        )
    }

    @Test
    @DisplayName("중국어 번역본은 CUVT 와 CUVS 두 개다")
    fun chineseTranslations() {
        // given — 본문은 실려 있으나 아직 선택 화면에 내보내지 않는다(BibleTranslationType 주석 참고).
        //         노출을 시작할 때 이 목록을 다시 보게 하려고 고정해 둔다.
        // when
        val chinese = BibleTranslationType.entries.filter { it.language == LanguageCode.zh }

        // then
        chinese shouldContainExactlyInAnyOrder listOf(
            BibleTranslationType.CUVT,
            BibleTranslationType.CUVS
        )
    }
}
