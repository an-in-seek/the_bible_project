# Caching

**Caffeine 기반 로컬(인메모리) 캐시**를 쓴다. Redis 는 쓰지 않는다.

Spring 표준 애노테이션(`@Cacheable`, `@CacheEvict`)을 그대로 쓴다. 커스텀 애노테이션은 없다.

## 캐시 등록

캐시는 `common/config/CacheConfig.kt` 에서 **이름별로 명시 등록**한다.
`CaffeineCacheManager` 의 기본 동작(요청 시 자동 생성)에 기대지 않는다 — 이름을 오타 내면
TTL 없는 캐시가 조용히 생겨 무한정 자란다.

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

**캐시 이름은 반드시 `CacheConfig` 의 상수로 두고 참조한다.** 문자열 리터럴을 애노테이션에
직접 쓰면 설정과 사용처가 조용히 어긋난다.

```kotlin
@Cacheable(value = [CacheConfig.CACHE_BIBLE_SEARCH_KEYWORD_RANKING], key = "#limit")
@Transactional(readOnly = true)
fun getRanking(limit: Int): List<SearchKeywordRankingResult>
```

## 새 캐시를 추가할 때

- [ ] `CacheConfig` 에 `registerCustomCache` 로 등록하고 이름 상수를 만든다.
- [ ] `expireAfterWrite` 와 `maximumSize` 를 **반드시** 지정한다. 둘 다 없으면 메모리 누수다.
- [ ] 키는 캐시 값에 영향을 주는 모든 파라미터를 포함해야 한다. 파라미터가 하나면
      `key = "#limit"` 처럼 단순하게, 여러 개면 `"#a + '::' + #b"` 로 구분자를 넣는다.
      구분자 없이 이어 붙이면 `(1, 23)` 과 `(12, 3)` 이 같은 키가 된다.
- [ ] 캐시 대상 메서드는 프록시를 통해 호출돼야 한다. **같은 빈 안에서 자기 자신을 호출하면
      캐시가 동작하지 않는다.**

## TTL 이 곧 정합성 한계다

이 프로젝트의 캐시는 **로컬 캐시라 인스턴스마다 따로 존재한다.** 무효화 이벤트를 인스턴스 간에
전파할 방법이 없다. 그래서 캐시된 데이터가 낡을 수 있는 최대 시간은 TTL 그 자체다.

현재 캐시가 둘 다 30초인 이유가 이것이다. 검색어 랭킹은 30초쯤 낡아도 사용자가 알아채지 못하고,
쓰기 직후 자기 변경을 즉시 되읽는 흐름이 아니다.

따라서:

- **읽은 직후 자기 쓰기를 확인해야 하는 데이터는 캐시하지 않는다.** 인스턴스가 여럿이면
  방금 쓴 값이 안 보이는 창이 반드시 생긴다.
- **회원별 데이터는 캐시하지 않는다.** 히트율이 낮고 낡은 값의 대가가 크다.
- 집계·랭킹처럼 원래 근사값인 읽기 전용 데이터에만 쓴다.
- TTL 을 늘리기 전에 "이 데이터가 그만큼 낡아도 되는가"를 먼저 판단한다. 메모리 문제가 아니라
  정합성 문제다.

`@CacheEvict` 는 자기 인스턴스의 캐시만 비운다. 여러 인스턴스가 뜨는 운영 환경에서는 무효화
수단으로 신뢰할 수 없다. 정확한 무효화가 필요하면 캐시를 걷어내거나 공유 캐시 도입을 먼저
논의한다.

`recordStats()` 는 켜 두었으니 히트율이 궁금하면 `CacheManager` 에서 통계를 볼 수 있다.
