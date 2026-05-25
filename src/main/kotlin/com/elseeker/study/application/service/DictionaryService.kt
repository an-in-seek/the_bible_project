package com.elseeker.study.application.service

import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.throwError
import com.elseeker.study.adapter.output.jpa.DictionaryRepository
import com.elseeker.study.domain.event.DictionarySearchPerformedEvent
import com.elseeker.study.domain.model.Dictionary
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * 성경 사전 서비스
 */
@Service
@Transactional(readOnly = true)
class DictionaryService(
    private val dictionaryRepository: DictionaryRepository,
    private val applicationEventPublisher: ApplicationEventPublisher,
) {

    private val logger = KotlinLogging.logger {}

    fun getDictionaries(keyword: String?, pageable: Pageable, track: Boolean = true): Page<Dictionary> {
        val normalizedKeyword = keyword?.trim()?.takeIf { it.isNotBlank() }
        val page = if (normalizedKeyword == null) {
            dictionaryRepository.findAllOrderByKo(pageable)
        } else {
            dictionaryRepository.findByTermContainingKo(normalizedKeyword, pageable)
        }

        if (normalizedKeyword != null && pageable.pageNumber == 0 && page.totalElements > 0 && track) {
            runCatching {
                applicationEventPublisher.publishEvent(DictionarySearchPerformedEvent(normalizedKeyword))
            }.onFailure { e ->
                logger.warn(e) { "Failed to publish DictionarySearchPerformedEvent for keyword='$normalizedKeyword'" }
            }
        }

        return page
    }

    fun getDictionary(id: Long): Dictionary =
        dictionaryRepository.findByIdOrNull(id) ?: throwError(ErrorType.DICTIONARY_NOT_FOUND, "id=$id")
}
