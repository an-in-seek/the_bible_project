package com.elseeker.bible.application.component

import com.neovisionaries.i18n.LanguageCode
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Component

/**
 * 단어 빈도 통계용 정규화 규칙(조사·어미·불용어·1음절 명사)을 클래스패스에서 읽어 둔다.
 *
 * 규칙은 코드가 아니라 **반복적으로 손보게 될 데이터**라 리소스 파일에 둔다(설계 문서 §3.4).
 * 대신 클래스패스 리소스는 오타가 나도 컴파일이 통과하므로, **비어 있으면 기동에 실패**시킨다.
 * 조용히 빈 목록으로 도는 것이 가장 나쁘다 — 통계가 전부 쓰레기로 채워지고 아무도 모른다.
 */
@Component
class WordStatRules {

    private val logger = KotlinLogging.logger {}

    /** 긴 것부터 매칭해야 한다. '대로' 를 놓치면 '종류대로' 가 '종류대' 가 된다. */
    val josaKo: List<String> = loadRequired("josa-ko.txt").sortedByDescending { it.length }

    /** 3음절 이상 어절에 적용하는 서술어 어미 */
    val verbTailsKo: Set<String> = loadRequired("verb-tails-ko.txt").toSet()

    /** 2음절 어절에만 적용하는 서술어 어미. 오탐 위험이 커서 분리했다. */
    val verbTails2Ko: Set<String> = loadRequired("verb-tails2-ko.txt").toSet()

    val oneCharNounsKo: Set<String> = loadRequired("one-char-nouns-ko.txt").toSet()

    val stopwordsKo: Set<String> = loadRequired("stopwords-ko.txt").toSet()

    private val stopwordsEn: Set<String> = loadRequired("stopwords-en.txt").toSet()

    private val stopwordsEs: Set<String> = loadRequired("stopwords-es.txt").toSet()

    /**
     * 조사를 뗀 뒤 1음절이어도 살려 두는 집합.
     *
     * 1음절 명사(`땅`, `주`)뿐 아니라 **1음절 불용어(`것`, `때`)도 포함**한다.
     * 불용어를 여기 넣지 않으면 `것을` 이 `것` 으로 줄지 못해 어절 그대로 남고,
     * 불용어 검사에도 걸리지 않아 통계에 그대로 올라온다.
     */
    val reducibleKo: Set<String> = oneCharNounsKo + stopwordsKo.filter { it.length == 1 }

    fun stopwordsOf(languageCode: LanguageCode): Set<String> = when (languageCode) {
        LanguageCode.ko -> stopwordsKo
        LanguageCode.es -> stopwordsEs
        else -> stopwordsEn
    }

    private fun loadRequired(fileName: String): List<String> {
        val resource = ClassPathResource("$RESOURCE_DIR/$fileName")
        if (!resource.exists()) {
            throw IllegalStateException("단어 통계 규칙 파일이 없습니다: $RESOURCE_DIR/$fileName")
        }
        val entries = resource.inputStream.bufferedReader(Charsets.UTF_8).useLines { lines ->
            lines.map { it.trim() }
                .filter { it.isNotEmpty() && !it.startsWith("#") }
                .distinct()
                .toList()
        }
        if (entries.isEmpty()) {
            throw IllegalStateException("단어 통계 규칙 파일이 비어 있습니다: $RESOURCE_DIR/$fileName")
        }
        logger.info { "단어 통계 규칙 로드: $fileName (${entries.size}건)" }
        return entries
    }

    companion object {
        private const val RESOURCE_DIR = "word-stats"
    }
}
