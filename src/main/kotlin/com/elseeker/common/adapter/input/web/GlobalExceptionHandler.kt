package com.elseeker.common.adapter.input.web

import com.elseeker.common.domain.ServiceError
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.boot.logging.LogLevel
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice
class GlobalExceptionHandler {

    private val logger = KotlinLogging.logger {}

    @ExceptionHandler(ServiceError::class)
    fun handleBibleServiceException(ex: ServiceError): ResponseEntity<ErrorResponse> {
        val errorType = ex.errorType
        // 로그 레벨에 따라 다르게 로깅 가능
        when (errorType.logLevel) {
            LogLevel.TRACE -> logger.trace(ex) { ex.message }
            LogLevel.DEBUG -> logger.debug(ex) { ex.message }
            LogLevel.INFO -> logger.info(ex) { ex.message }
            LogLevel.WARN -> logger.warn(ex) { ex.message }
            LogLevel.ERROR -> logger.error(ex) { ex.message }
            else -> logger.info(ex) { ex.message }
        }
        val responseBody = ErrorResponse(
            status = errorType.status.value(),
            code = errorType.name,
            message = ex.message
        )
        return ResponseEntity.status(errorType.status).body(responseBody)
    }
}