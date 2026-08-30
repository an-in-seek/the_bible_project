package com.elseeker.bible.domain.vo

/**
 * 단어 통계 행이 어떻게 만들어졌는지.
 *
 * 재계산은 [AUTO] 행만 범위 단위로 지우고 다시 넣는다. 나머지는 건드리지 않는다.
 * 이 구분이 없으면 관리자가 손으로 고친 값이 다음 재계산 한 번에 사라진다.
 */
enum class BibleWordStatSource(val displayName: String) {
    AUTO("자동"),
    MANUAL("수동"),

    /**
     * 관리자가 키워드를 직접 세어 저장한 값(`AdminBibleWordStatService.saveKeywordStat`).
     *
     * 어절을 표제어에 매칭하는 재계산과 **계산 방식 자체가 다르다** — 본문에 그 문자열이 나온
     * 횟수다. 재계산이 덮으면 관리자가 결과를 확인하고 저장한 값이 조용히 다른 수로 바뀐다.
     * 자동값으로 돌리고 싶으면 관리자 화면에서 행을 지우면 된다(다음 재계산이 채운다).
     */
    KEYWORD("키워드"),
    ;

    companion object {
        /**
         * 재계산이 건드리지 않는 출처. **[AUTO] 를 뺀 나머지 전부**로 정의한다.
         * 출처가 늘었을 때 목록에 넣는 것을 잊어도 지워지지 않는 쪽이 안전하다.
         */
        val PRESERVED_ON_RECALCULATION: Set<BibleWordStatSource> = entries.toSet() - AUTO
    }
}
