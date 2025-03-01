package com.seek.thebible.infrastructure.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "api.the-bible")
data class TheBibleApiProperties(
    val url: String,
    val apiKey: String
)
