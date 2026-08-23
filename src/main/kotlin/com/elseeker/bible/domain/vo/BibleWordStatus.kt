package com.elseeker.bible.domain.vo

/**
 * 성경 단어 표제어 상태.
 *
 * [BLOCKED] 는 단순히 "안 보이는" 것이 아니라 **재추출을 막는** 장치다.
 * 재계산 시 억제 집합으로 로드되어, 매칭돼도 카운트하지 않고 미매칭 후보로도 올리지 않는다.
 * 이것이 없으면 차단한 활용형이 재계산마다 후보 목록에 되살아난다.
 */
enum class BibleWordStatus(val displayName: String) {
    APPROVED("승인"),
    CANDIDATE("후보"),
    BLOCKED("차단"),
    ;

    companion object {
        /** 사용자 화면 노출 대상. 후보 포함 여부는 프로퍼티로 제어한다. */
        fun visibleStatuses(includeCandidate: Boolean): Set<BibleWordStatus> =
            if (includeCandidate) setOf(APPROVED, CANDIDATE) else setOf(APPROVED)

        /** 카운트 집계 대상. 차단만 제외한다. */
        val COUNTABLE: Set<BibleWordStatus> = setOf(APPROVED, CANDIDATE)
    }
}
