package com.elseeker.bible.application.listener

import com.elseeker.bible.application.service.BibleSearchKeywordService
import com.elseeker.bible.domain.event.BibleSearchPerformedEvent
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

@Component
class BibleSearchKeywordListener(
    private val bibleSearchKeywordService: BibleSearchKeywordService,
) {

    private val logger = KotlinLogging.logger {}

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun onSearchPerformed(event: BibleSearchPerformedEvent) {
        try {
            bibleSearchKeywordService.increment(event.keyword)
        } catch (e: Exception) {
            logger.warn(e) { "Failed to increment search keyword count for keyword='${event.keyword}'" }
        }
    }
}
