package com.elseeker.bible.adapter.input.api.admin.request

import com.elseeker.bible.domain.vo.BibleWordCategory
import com.elseeker.bible.domain.vo.BibleWordStatus

data class AdminBibleWordRequest(
    val term: String,
    val category: BibleWordCategory = BibleWordCategory.ETC,
    val status: BibleWordStatus = BibleWordStatus.CANDIDATE,
    val dictionaryId: Long? = null,
    val note: String? = null,
    /**
     * 표기 자체가 다른 경우만 넣는다(`하나님`/`하느님`).
     * 조사 결합형(`땅에`, `땅을`)은 별칭이 아니다 — 정규화 규칙에서 고칠 문제다.
     */
    val aliases: List<String> = emptyList(),
)

data class AdminBibleWordStatusRequest(
    val status: BibleWordStatus,
)

/** 초기 구축용 후보 일괄 등록. 6천 건 규모라 한 건씩 누를 수 없다. */
/**
 * @param status 등록 상태. 생략하면 `CANDIDATE`.
 *               후보 화면에서 **골라서** 넣을 때는 `APPROVED`, 쓰레기를 쓸어 담을 때는 `BLOCKED` 다.
 */
data class AdminBibleWordBulkRequest(
    val terms: List<String>,
    val status: BibleWordStatus = BibleWordStatus.CANDIDATE,
)

/** 같은 언어의 다른 번역본에서 어휘를 복사한다. */
data class AdminBibleWordCopyRequest(
    val sourceTranslationId: Long,
)
