package com.elseeker.common.config

import com.github.benmanes.caffeine.cache.Caffeine
import org.springframework.cache.CacheManager
import org.springframework.cache.annotation.EnableCaching
import org.springframework.cache.caffeine.CaffeineCacheManager
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.time.Duration

@Configuration
@EnableCaching
class CacheConfig {

    @Bean
    fun cacheManager(): CacheManager = CaffeineCacheManager().apply {
        registerCustomCache(
            CACHE_BIBLE_SEARCH_KEYWORD_RANKING,
            Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofSeconds(30))
                .maximumSize(16)
                .recordStats()
                .build()
        )
        registerCustomCache(
            CACHE_DICTIONARY_SEARCH_KEYWORD_RANKING,
            Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofSeconds(30))
                .maximumSize(16)
                .recordStats()
                .build()
        )
    }

    companion object {
        const val CACHE_BIBLE_SEARCH_KEYWORD_RANKING = "bible-search-keyword-ranking"
        const val CACHE_DICTIONARY_SEARCH_KEYWORD_RANKING = "dictionary-search-keyword-ranking"
    }
}
