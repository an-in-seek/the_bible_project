# Time & Locale

## Store in UTC, aggregate by KST

`spring.jpa.properties.hibernate.jdbc.time_zone: UTC` is configured. Every timestamp column is
**stored in UTC.** The value is the same regardless of the server's time zone.

Aggregation date columns are different. A question like "which day's visit is this?" must use the
user's date, so a **date converted to Asia/Seoul** is stored in a separate column.

The event tables in the `analytics` module follow this pattern.

| Column | Meaning |
|---|---|
| `visited_at` / `occurred_at` | Event timestamp (UTC, `Instant`) |
| `visited_date` / `occurred_date` | Aggregation date (`LocalDate` converted to Asia/Seoul) |

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

**Do not derive the two values independently.** Derive both from the same `Instant`. Calling
`Instant.now()` twice can make the timestamp and the date point at different days near midnight.

## Do not use `ZoneId.systemDefault()`

Results would depend on the server's time zone. Local (Windows/KST) and Cloud Run (UTC) would
behave differently, producing date shifts that cannot be reproduced locally.

```kotlin
// ✅ explicit zone
private val KST: ZoneId = ZoneId.of("Asia/Seoul")
LocalDate.ofInstant(instant, KST)

// ❌ depends on server configuration
LocalDate.now()
LocalDate.ofInstant(instant, ZoneId.systemDefault())
```

Keep the `ZoneId` constant in the `companion object` of the class that uses it. Promote it to a
shared constant once several modules need it, but keep it local until then.

## Date boundary calculations

When querying "today's data", do not compare a `LocalDate` directly against a UTC column. Convert
the KST day into a UTC range, or use the aggregation date column (`*_date`).

```kotlin
// KST day -> UTC range
val start = date.atStartOfDay(KST).toInstant()
val end = date.plusDays(1).atStartOfDay(KST).toInstant()
// where occurredAt >= :start and occurredAt < :end
```

Use `<` for the end boundary, not `<=`. Cutting at `23:59:59` drops the intervening second.

## Type selection

| Situation | Type |
|---|---|
| Event timestamp, created/updated timestamp | `Instant` (a UTC instant) |
| Aggregation date, date shown to users | `LocalDate` (converted to KST) |
| A "date only" value entered by the user | `LocalDate` |

`LocalDateTime` carries no zone information, so the code alone cannot tell whether it is UTC or
KST. Do not use it for new columns.

## Locale

There is no multilingual request context yet (no `Accept-Language` branching). Bible translations
are distinguished by `bible_translation.language_code`, not by locale — the basis is the
translation the user picked, not the browser language.

The `nv-i18n` dependency is for country/language code validation and is unrelated to per-request
locale resolution.

If per-request locale becomes necessary, read it only in the controller (interface layer) and
**pass it down to application/domain as a parameter.** Having lower layers inspect the request
context directly creates hidden dependencies and makes testing hard.
