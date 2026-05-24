package com.elseeker.study.application.listener

import com.elseeker.study.application.service.DictionarySearchKeywordService
import com.elseeker.study.domain.event.DictionarySearchPerformedEvent
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

@Component
class DictionarySearchKeywordListener(
    private val dictionarySearchKeywordService: DictionarySearchKeywordService,
) {

    private val logger = KotlinLogging.logger {}

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun onSearchPerformed(event: DictionarySearchPerformedEvent) {
        try {
            dictionarySearchKeywordService.increment(event.keyword)
        } catch (e: Exception) {
            logger.warn(e) { "Failed to increment dictionary search keyword count for keyword='${event.keyword}'" }
        }
    }
}
