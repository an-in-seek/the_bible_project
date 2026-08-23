package com.elseeker.bible.domain.vo

/**
 * 성경 단어 표제어 분류.
 *
 * 본문에서 자동 추출한 후보는 분류를 알 수 없으므로 [ETC] 로 등록하고,
 * 관리자가 검수하며 실제 분류를 지정한다.
 */
enum class BibleWordCategory(val displayName: String) {
    PERSON("인물"),
    PLACE("장소"),
    CONCEPT("개념"),
    OBJECT("사물"),
    MEASURE("도량형"),
    ETC("기타"),
}
