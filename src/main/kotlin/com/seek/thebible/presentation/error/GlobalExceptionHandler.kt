package com.seek.thebible.presentation.error

import com.seek.thebible.application.exception.BibleServiceException
import mu.KotlinLogging
import org.springframework.boot.logging.LogLevel
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice
class GlobalExceptionHandler {

    private val logger = KotlinLogging.logger {}

    @ExceptionHandler(BibleServiceException::class)
    fun handleBibleServiceException(ex: BibleServiceException): ResponseEntity<ErrorResponse> {
        val errorType = ex.errorType
        // 로그 레벨에 따라 다르게 로깅 가능
        when (errorType.logLevel) {
            LogLevel.TRACE -> logger.trace(ex.message, ex)
            LogLevel.DEBUG -> logger.debug(ex.message, ex)
            LogLevel.INFO -> logger.info(ex.message, ex)
            LogLevel.WARN -> logger.warn(ex.message, ex)
            LogLevel.ERROR -> logger.error(ex.message, ex)
            else -> logger.info(ex.message, ex)
        }
        val responseBody = ErrorResponse(
            status = errorType.status.value(),
            message = ex.message
        )
        return ResponseEntity.status(errorType.status).body(responseBody)
    }
}
