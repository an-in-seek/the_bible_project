package com.elseeker.bible.domain.vo

/**
 * 단어 통계 행이 어떻게 만들어졌는지.
 *
 * 재계산은 [AUTO] 행만 범위 단위로 지우고 다시 넣는다. [MANUAL] 행은 건드리지 않는다.
 * 이 구분이 없으면 관리자가 손으로 고친 값이 다음 재계산 한 번에 사라진다.
 */
enum class BibleWordStatSource(val displayName: String) {
    AUTO("자동"),
    MANUAL("수동"),
}
