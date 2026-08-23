package com.elseeker.bible.application.component

import com.elseeker.bible.adapter.output.jpa.ChapterVerseText
import com.elseeker.bible.domain.model.BibleWord
import com.elseeker.bible.domain.model.BibleWordAlias
import com.elseeker.bible.domain.vo.BibleWordStatus
import com.neovisionaries.i18n.LanguageCode
import org.springframework.stereotype.Component

/**
 * 어휘 해시를 만들어 본문 어절을 표제어에 매칭하고 카운트를 집계한다.
 *
 * 매칭 순서가 이 클래스의 핵심이다. **어휘 조회를 규칙보다 먼저, 그것도 두 번 한다.**
 * 원형(`여자`) 조회만으로는 부족하다 — 본문에는 `여자를` 로 나오고, 조사를 뗀 `여자` 는
 * 2음절 어미 규칙('자')에 걸려 정규화 단계에서 버려지기 때문이다. 그래서 조사만 떼고 필터는
 * 적용하지 않은 형태로 한 번 더 조회한다. 어휘에 등록된 표제어는 어떤 규칙보다 우선한다.
 */
@Component
class BibleWordMatcher(
    private val tokenizer: BibleWordTokenizer,
) {

    /**
     * 어휘 + 별칭으로 조회용 인덱스를 만든다.
     *
     * `BLOCKED` 는 버리지 않고 **억제 집합**에 담는다. 그냥 빼면 그 단어의 어절이 아무 데도
     * 매칭되지 않아 미매칭 후보로 다시 올라오고, 관리자는 같은 단어를 무한히 다시 차단하게 된다.
     */
    fun buildIndex(
        words: List<BibleWord>,
        aliases: List<BibleWordAlias>,
        languageCode: LanguageCode,
    ): WordIndex {
        val countable = HashMap<String, Long>(words.size * 2)
        val blocked = HashSet<String>()
        val statusById = HashMap<Long, BibleWordStatus>(words.size)

        words.forEach { word ->
            val id = word.id ?: return@forEach
            statusById[id] = word.status
            val key = tokenizer.matchKey(word.term, languageCode)
            if (word.status == BibleWordStatus.BLOCKED) blocked += key else countable[key] = id
        }

        aliases.forEach { alias ->
            val key = tokenizer.matchKey(alias.alias, languageCode)
            when (statusById[alias.bibleWordId]) {
                BibleWordStatus.BLOCKED -> blocked += key
                null -> Unit // 부모가 사라진 고아 별칭은 무시한다
                else -> countable.putIfAbsent(key, alias.bibleWordId)
            }
        }

        return WordIndex(countable = countable, blocked = blocked, languageCode = languageCode)
    }

    /**
     * 책 한 권의 본문을 장별로 집계한다.
     */
    fun countBook(texts: List<ChapterVerseText>, index: WordIndex): BookWordCount {
        val chapterCounts = HashMap<Int, MutableMap<Long, Int>>()
        val unmatched = HashMap<String, Int>()

        texts.forEach { row ->
            val counts = chapterCounts.getOrPut(row.chapterNumber) { HashMap() }
            tokenizer.splitWords(row.text, index.languageCode).forEach { rawWord ->
                when (val result = match(rawWord, index)) {
                    is WordMatch.Matched -> counts.merge(result.bibleWordId, 1, Int::plus)
                    is WordMatch.Unmatched -> unmatched.merge(result.token, 1, Int::plus)
                    WordMatch.Suppressed, WordMatch.Dropped -> Unit
                }
            }
        }

        return BookWordCount(chapterCounts = chapterCounts, unmatched = unmatched)
    }

    /**
     * 어절 하나를 표제어에 매칭한다. 설계 문서 §4.1 의 순서를 그대로 구현한다.
     */
    fun match(rawWord: String, index: WordIndex): WordMatch {
        val rawKey = tokenizer.matchKey(rawWord, index.languageCode)
        if (rawKey in index.blocked) return WordMatch.Suppressed
        index.countable[rawKey]?.let { return WordMatch.Matched(it) }

        // 조사만 떼어 낸 형태로 한 번 더 조회한다. 이 단계가 없으면 어휘에 있는 '여자' 가
        // '여자를' 형태로 나올 때 어미 규칙에 걸려 버려진다 — 원형 조회만으로는 부족하다.
        tokenizer.stemOnly(rawWord, index.languageCode)?.let { stem ->
            val stemKey = tokenizer.matchKey(stem, index.languageCode)
            if (stemKey in index.blocked) return WordMatch.Suppressed
            index.countable[stemKey]?.let { return WordMatch.Matched(it) }
        }

        val normalized = tokenizer.normalize(rawWord, index.languageCode)
            ?: return WordMatch.Dropped // 불용어·서술어 어미 — 후보로도 올리지 않는다

        val normalizedKey = tokenizer.matchKey(normalized, index.languageCode)
        if (normalizedKey in index.blocked) return WordMatch.Suppressed
        index.countable[normalizedKey]?.let { return WordMatch.Matched(it) }

        // 라틴 문자권 복수형: 어휘에 있을 때만 단수형으로 센다(무조건 떼는 stemming 이 아니다)
        tokenizer.singularCandidate(normalizedKey, index.languageCode)?.let { singular ->
            if (singular in index.blocked) return WordMatch.Suppressed
            index.countable[singular]?.let { return WordMatch.Matched(it) }
        }

        return WordMatch.Unmatched(normalizedKey)
    }

    /**
     * 어휘 조회 인덱스. 표제어와 별칭이 같은 맵에 들어간다.
     */
    data class WordIndex(
        val countable: Map<String, Long>,
        val blocked: Set<String>,
        val languageCode: LanguageCode,
    )

    /**
     * 책 한 권의 집계 결과.
     *
     * @param chapterCounts 장 번호 -> (표제어 ID -> 횟수)
     * @param unmatched 매칭 실패한 정규화 토큰 -> 횟수. 후보 리포트의 재료다.
     */
    data class BookWordCount(
        val chapterCounts: Map<Int, Map<Long, Int>>,
        val unmatched: Map<String, Int>,
    )

    sealed interface WordMatch {
        data class Matched(val bibleWordId: Long) : WordMatch

        /** 차단된 어휘에 맞았다. 카운트도 후보 적립도 하지 않는다. */
        data object Suppressed : WordMatch

        /** 불용어·서술어 어미라 정규화 단계에서 버려졌다. 후보가 아니다. */
        data object Dropped : WordMatch

        /** 정규화까지 했는데 어휘에 없다. 후보 리포트로 올린다. */
        data class Unmatched(val token: String) : WordMatch
    }
}
