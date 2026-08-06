package com.elseeker.common.adapter.input.api.response

import org.springframework.data.domain.Page

data class PageResponse<T>(
    val content: List<T>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val hasNext: Boolean,
    val hasPrevious: Boolean,
) {
    companion object {
        // Spring Data 4 의 Page 는 타입 파라미터가 non-null(T : Any)로 선언돼 있어 여기서도 상한을 맞춘다.
        fun <T : Any, R> from(page: Page<T>, mapper: (T) -> R): PageResponse<R> =
            PageResponse(
                content = page.content.map(mapper),
                page = page.number,
                size = page.size,
                totalElements = page.totalElements,
                totalPages = page.totalPages,
                hasNext = page.hasNext(),
                hasPrevious = page.hasPrevious(),
            )
    }
}
