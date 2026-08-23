package com.elseeker.bible.domain.result

import java.time.Instant

/**
 * 단어 하나의 빈도. JPQL 생성자 프로젝션 대상이므로 **패키지·생성자 파라미터 순서를 바꾸면
 * 런타임에 깨진다**(`BibleWordStatRepository.findStats`).
 */
data class WordFrequencyStat(
    val term: String,
    val wordCount: Int,
    val dictionaryId: Long?,
)

/**
 * 책/장 단위 단어 빈도 조회 결과.
 *
 * `shownCount` 는 **반환된 items 의 합**이지 범위 전체의 합이 아니다. 전체 합은 별도 SUM 쿼리가
 * 필요한데 화면 어디에도 쓰이지 않는다.
 */
data class BibleWordStatResult(
    val bookName: String,
    val chapterNumber: Int?,
    val shownCount: Int,
    val truncated: Boolean,
    val calculatedAt: Instant?,
    val items: List<WordFrequencyStat>,
)
