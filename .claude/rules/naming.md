# Naming Conventions

## Method names express intent, not parameters

```kotlin
findUserBy(name, phone)      // ✅
findUserByNameAndPhone()     // ❌ the name grows every time a parameter is added
```

## Verbs by layer

These are the verbs actually used in this project. New code follows the same set.

| Action | service / component | repository |
|---|---|---|
| Read | `get*` (throws if absent) / `find*` (null if absent) | `find*` / `count*` / `exists*` |
| Create | `create*` | `save*` (Spring Data) / `insert*` |
| Update | `update*` | `update*` |
| Delete | `delete*` | `delete*` |
| Merge | `createOrUpdate*` | `upsert*` |

**The `get` vs `find` distinction is the key convention in this project.** `get*` ends with
`throwError(...)` when the target is missing; `find*` returns `null`. The caller must be able to
tell from the name alone whether a null check is required.

`modify` / `remove` are not used. Existing code is consistent on `update` / `delete`.

## Class names

| Kind | Rule | Example |
|---|---|---|
| REST controller | `{Domain}Api` (admin variants prefixed with `Admin`) | `CommunityApi`, `AdminCommunityApi` |
| Swagger doc interface | `{Domain}ApiDocument` | `CommunityApiDocument` |
| View controller | `{Domain}WebController` (admin variants prefixed with `Admin`) | `BibleWebController`, `AdminBibleWebController` |
| Service facade | `{Domain}Service` | `PostService` |
| Domain-logic helper | Name the **role**, not the domain | `BibleReader`, `SocialTokenVerifier`, `QuizStageValidator`, `BotSignatureDetector` |
| Repository | `{Entity}Repository` | `BibleVerseRepository` |
| Service return DTO | `{Purpose}Result`; aggregates use `{Purpose}Stat` | `SearchKeywordRankingResult`, `DailyVisitStat` |
| Request/response DTO | Under the `request/` and `response/` packages | — |

## Entities have no setters

```kotlin
post.updateContent(command)   // ✅ the intent is visible
post.setContent("...")        // ❌
```

State-changing methods carry what changes and why in their name. When several fields change at
once, take a command object.

## Use `entries`, not `values()`, on enums

`values()` allocates a new array on every call and the result is mutable. Kotlin 2.4's `entries`
reuses an immutable list.

```kotlin
// ✅
fun getAllTypes(): List<MemberRole> = MemberRole.entries.toList()

// ❌
fun getAllTypes(): List<MemberRole> = MemberRole.values().toList()
```

### When you must enumerate constants by hand

Enumerate by hand only for a **deliberately narrowed subset** — not for "all of them" — such as
when the order matters or when legacy / `UNKNOWN` values are intentionally excluded. In that case
adding a constant silently omits it from the list, so **add a test asserting the list matches the
enum.**

If the list is meant to be "all of them", return `entries.toList()` instead of hand-listing. No
test is needed then.
