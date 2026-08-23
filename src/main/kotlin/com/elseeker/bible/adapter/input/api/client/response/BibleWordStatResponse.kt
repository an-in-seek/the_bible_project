package com.elseeker.bible.adapter.input.api.client.response

import com.elseeker.bible.domain.result.BibleWordStatResult
import java.time.Instant

/**
 * 책/장 단위 단어 빈도 응답.
 *
 * 글자 크기용 가중치는 서버가 주지 않는다. 폰트 크기는 화면 폭에 따라 달라지는 표현 계층의
 * 문제이고, `items[0].count` 가 최댓값이므로 클라이언트가 스스로 정규화한다.
 */
data class BibleWordStatResponse(
    val bookName: String,
    val chapterNumber: Int?,
    /** 반환된 items 의 카운트 합. 범위 전체의 합이 아니다. */
    val shownCount: Int,
    val truncated: Boolean,
    /** 아직 재계산하지 않았으면 null */
    val calculatedAt: Instant?,
    val items: List<Item>,
) {
    data class Item(
        val rank: Int,
        val word: String,
        val count: Int,
        /** 성경 사전에 연결된 경우에만 값이 있다. 프론트가 뜻풀이 링크를 붙인다. */
        val dictionaryId: Long?,
    )

    companion object {
        fun from(result: BibleWordStatResult) = BibleWordStatResponse(
            bookName = result.bookName,
            chapterNumber = result.chapterNumber,
            shownCount = result.shownCount,
            truncated = result.truncated,
            calculatedAt = result.calculatedAt,
            items = result.items.mapIndexed { index, stat ->
                Item(
                    rank = index + 1,
                    word = stat.term,
                    count = stat.wordCount,
                    dictionaryId = stat.dictionaryId,
                )
            },
        )
    }
}
