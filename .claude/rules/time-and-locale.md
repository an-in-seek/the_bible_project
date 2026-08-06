# Time & Locale

## 저장은 UTC, 집계 기준은 KST

`spring.jpa.properties.hibernate.jdbc.time_zone: UTC` 가 설정돼 있다. 모든 시각 컬럼은 **UTC 로
저장된다.** 서버가 어느 타임존에서 돌든 값이 같다.

집계용 날짜 컬럼은 다르다. "며칠자 방문인가" 같은 질문은 사용자 기준 날짜여야 하므로
**Asia/Seoul 로 변환한 날짜**를 별도 컬럼에 저장한다.

`analytics` 모듈의 이벤트 테이블이 이 방식이다.

| 컬럼 | 의미 |
|---|---|
| `visited_at` / `occurred_at` | 이벤트 발생 시각 (UTC, `Instant`) |
| `visited_date` / `occurred_date` | 집계 기준 날짜 (Asia/Seoul 로 변환한 `LocalDate`) |

```kotlin
class SiteVisitTrackingService(...) {

    fun track(...) {
        val visitedAt = Instant.now()
        val visitedDate = LocalDate.ofInstant(visitedAt, KST)
        // ...
    }

    companion object {
        private val KST: ZoneId = ZoneId.of("Asia/Seoul")
    }
}
```

**두 값을 각각 따로 구하지 않는다.** 같은 `Instant` 하나에서 파생시킨다. `Instant.now()` 를 두 번
부르면 자정 근처에서 시각과 날짜가 서로 다른 날을 가리킬 수 있다.

## `ZoneId.systemDefault()` 를 쓰지 않는다

서버 타임존에 따라 결과가 달라진다. 로컬(Windows/KST)과 Cloud Run(UTC)에서 다르게 동작해
로컬에서는 재현되지 않는 날짜 밀림이 생긴다.

```kotlin
// ✅ 명시적 존
private val KST: ZoneId = ZoneId.of("Asia/Seoul")
LocalDate.ofInstant(instant, KST)

// ❌ 서버 설정에 의존
LocalDate.now()
LocalDate.ofInstant(instant, ZoneId.systemDefault())
```

`ZoneId` 상수는 사용하는 클래스의 `companion object` 에 둔다. 여러 모듈에서 필요해지면
공용 상수로 승격하되, 그전까지는 지역 상수로 둔다.

## 날짜 경계 계산

"오늘의 데이터"를 조회할 때 `LocalDate` 를 그대로 UTC 컬럼과 비교하지 않는다. KST 기준 하루를
UTC 구간으로 변환해서 비교하거나, 집계용 날짜 컬럼(`*_date`)을 쓴다.

```kotlin
// KST 하루 → UTC 구간
val start = date.atStartOfDay(KST).toInstant()
val end = date.plusDays(1).atStartOfDay(KST).toInstant()
// where occurredAt >= :start and occurredAt < :end
```

끝 경계는 `<=` 가 아니라 `<` 를 쓴다. `23:59:59` 로 자르면 그 사이 1초가 누락된다.

## 타입 선택

| 상황 | 타입 |
|---|---|
| 이벤트 발생 시각, 생성/수정 시각 | `Instant` (UTC 시점) |
| 집계 기준 날짜, 사용자에게 보여줄 날짜 | `LocalDate` (KST 기준으로 변환한 값) |
| 사용자가 입력한 "날짜만" 값 | `LocalDate` |

`LocalDateTime` 은 존 정보가 없어 UTC 인지 KST 인지 코드만 봐서는 알 수 없다. 새 컬럼에는
쓰지 않는다.

## 로케일

다국어 요청 컨텍스트(`Accept-Language` 기반 분기)는 아직 없다. 성경 번역본은 로케일이 아니라
`bible_translation.language_code` 로 구분한다 — 사용자의 브라우저 언어가 아니라 사용자가 고른
번역본이 기준이다.

`nv-i18n` 의존성은 국가/언어 코드 검증용이며 요청별 로케일 해석과는 무관하다.

앞으로 요청별 로케일이 필요해지면, 컨트롤러(interface 레이어)에서만 읽고 application/domain 으로는
**파라미터로 내려보낸다.** 하위 레이어에서 요청 컨텍스트를 직접 들여다보면 숨은 의존성이 생겨
테스트가 어려워진다.
