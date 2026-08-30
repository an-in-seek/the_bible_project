package com.elseeker.bible.application.component

import com.elseeker.bible.adapter.output.jpa.BookVerseText
import com.neovisionaries.i18n.LanguageCode
import org.springframework.stereotype.Component

/**
 * 키워드가 본문에 나온 **문자열 등장 횟수**를 센다. 순수 함수이며 DB 를 보지 않는다.
 *
 * [BibleWordMatcher] 와 세는 단위가 다르다. 매처는 어절을 정규화해 표제어에 매칭하므로 형태소
 * 경계를 지키는 대신, 공백이 든 표제어(`하나님 나라`)와 띄어쓰기가 없는 언어(중국어)를 영영
 * 세지 못한다. 이 클래스는 정반대다 — 무엇이든 세는 대신 경계를 보지 못해서 `말` 이
 * `말씀`·`말미암아` 까지 함께 센다.
 *
 * **그래서 이 결과는 사람이 확인한 뒤에 저장된다**(설계 문서 §3.2). 오검출을 코드가 걸러 줄
 * 방법이 없으므로 [samples] 로 실제 잡힌 절을 함께 돌려준다.
 */
@Component
class BibleWordOccurrenceCounter {

    /**
     * @param keywords 표제어와 별칭. 매처가 별칭을 표제어 id 로 접어서 세므로 여기서도 합산한다.
     */
    fun countBook(
        verses: List<BookVerseText>,
        keywords: List<String>,
        languageCode: LanguageCode,
        sampleLimit: Int = DEFAULT_SAMPLE_LIMIT,
    ): KeywordCount {
        val needles = keywords.asSequence()
            .map { it.normalizeFor(languageCode) }
            .filter { it.isNotEmpty() }
            .distinct()
            // 긴 것부터 본다. `하나님` 과 별칭 `하나님 아버지` 가 함께 있을 때 짧은 쪽을 먼저
            // 맞히면 한 자리를 두 번 세거나 긴 쪽이 영영 잡히지 않는다.
            .sortedByDescending { it.length }
            .toList()
        if (needles.isEmpty()) return KeywordCount(emptyMap(), emptyList())

        val chapterCounts = HashMap<Int, Int>()
        val matched = ArrayList<BookVerseText>()

        verses.forEach { verse ->
            val hits = countIn(verse.text.normalizeFor(languageCode), needles)
            if (hits == 0) return@forEach
            chapterCounts.merge(verse.chapterNumber, hits, Int::plus)
            matched += verse
        }

        // 조회 쿼리에 ORDER BY 가 없다. 여기서 정렬해야 관리자가 보는 예시가 매번 달라지지 않는다.
        val samples = matched
            .sortedWith(compareBy({ it.chapterNumber }, { it.verseNumber }))
            .take(sampleLimit)
            .map { Sample(it.bookOrder, it.chapterNumber, it.verseNumber, it.text) }

        return KeywordCount(chapterCounts = chapterCounts, samples = samples)
    }

    /**
     * 겹치는 자리는 세지 않는다. 맞힌 자리에서 그 길이만큼 건너뛴다.
     */
    private fun countIn(text: String, needles: List<String>): Int {
        var count = 0
        var i = 0
        while (i < text.length) {
            val hit = needles.firstOrNull { text.startsWith(it, i) }
            if (hit == null) {
                i++
                continue
            }
            count++
            i += hit.length
        }
        return count
    }

    /**
     * 라틴 문자권은 대소문자를 무시한다([BibleWordTokenizer.matchKey] 와 같은 판단이다).
     * 한국어는 본문을 그대로 본다 — 구두점을 지우지 않으므로 공백이 든 키워드는 줄바꿈이나
     * 중간 구두점이 끼면 맞지 않는다.
     */
    private fun String.normalizeFor(languageCode: LanguageCode): String =
        if (languageCode == LanguageCode.ko) trim() else trim().lowercase()

    /**
     * @param chapterCounts 장 번호 -> 횟수. 0 회인 장은 담지 않는다.
     * @param samples 실제로 잡힌 절. 오검출 확인용이다.
     */
    data class KeywordCount(
        val chapterCounts: Map<Int, Int>,
        val samples: List<Sample>,
    ) {
        val totalCount: Int
            get() = chapterCounts.values.sum()
    }

    data class Sample(
        val bookOrder: Int,
        val chapterNumber: Int,
        val verseNumber: Int,
        val text: String,
    )

    companion object {
        const val DEFAULT_SAMPLE_LIMIT = 5
    }
}
