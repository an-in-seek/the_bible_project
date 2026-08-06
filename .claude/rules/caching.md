# Caching

We use a **Caffeine-based local (in-memory) cache**. Redis is not used.

Standard Spring annotations (`@Cacheable`, `@CacheEvict`) are used as-is. There are no custom
annotations.

## Registering a cache

Caches are **registered explicitly by name** in `common/config/CacheConfig.kt`. Do not rely on
`CaffeineCacheManager`'s default behavior of creating caches on demand — a typo in the name
silently creates a TTL-less cache that grows without bound.

```kotlin
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
    }

    companion object {
        const val CACHE_BIBLE_SEARCH_KEYWORD_RANKING = "bible-search-keyword-ranking"
    }
}
```

**Cache names must be constants on `CacheConfig` and referenced from there.** Writing string
literals directly into annotations lets the configuration and the usage site drift apart silently.

```kotlin
@Cacheable(value = [CacheConfig.CACHE_BIBLE_SEARCH_KEYWORD_RANKING], key = "#limit")
@Transactional(readOnly = true)
fun getRanking(limit: Int): List<SearchKeywordRankingResult>
```

## When adding a new cache

- [ ] Register it with `registerCustomCache` in `CacheConfig` and add a name constant.
- [ ] **Always** specify `expireAfterWrite` and `maximumSize`. Missing both is a memory leak.
- [ ] The key must include every parameter that affects the cached value. With a single parameter
      keep it simple (`key = "#limit"`); with several, add a separator (`"#a + '::' + #b"`).
      Concatenating without a separator makes `(1, 23)` and `(12, 3)` the same key.
- [ ] The cached method must be invoked through the proxy. **Self-invocation within the same bean
      bypasses the cache entirely.**

## TTL is the consistency bound

This project's caches are **local, so each instance has its own copy.** There is no way to
propagate invalidation events between instances. The maximum staleness of cached data is therefore
exactly the TTL.

That is why both current caches use 30 seconds. Search keyword rankings can be 30 seconds stale
without users noticing, and no flow reads back its own write immediately.

So:

- **Do not cache data where a caller must observe its own write immediately.** With multiple
  instances there will always be a window where the just-written value is invisible.
- **Do not cache per-member data.** Hit rate is low and the cost of a stale value is high.
- Use it only for read-only data that is approximate by nature, such as aggregates and rankings.
- Before raising a TTL, decide whether the data may be that stale. It is a consistency question,
  not a memory question.

`@CacheEvict` only clears the local instance's cache. In production with multiple instances it
cannot be trusted as an invalidation mechanism. If precise invalidation is required, remove the
cache or first discuss introducing a shared cache.

`recordStats()` is enabled, so hit rates can be inspected through the `CacheManager`.
