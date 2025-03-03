package com.seek.thebible.domain

class BibleServiceException(
    val errorType: ErrorType,
    vararg val data: Any
) : RuntimeException() {

    /**
     * 메시지를 생성해서 반환하거나, errorType 자체의 message를 사용해도 됩니다.
     * 필요하다면 'data'를 활용해 메시지 템플릿 치환도 가능합니다.
     */
    override val message: String
        get() = if (data.isNotEmpty()) {
            // 예: "성경 리소스를 찾을 수 없습니다. [책 ID: 123]" 등으로 확장
            "${errorType.message} - ${data.joinToString(", ")}"
        } else {
            errorType.message
        }
}
