package com.elseeker.common.adapter.input.web

data class ErrorResponse(
    val status: Int,
    val code: String,
    val message: String
)
