# Naming Conventions

## 메서드 이름은 파라미터가 아니라 의도를 드러낸다

```kotlin
findUserBy(name, phone)      // ✅
findUserByNameAndPhone()     // ❌ 파라미터가 늘 때마다 이름이 따라 늘어난다
```

## 레이어별 동사

이 프로젝트에서 실제로 쓰는 동사다. 새 코드도 여기에 맞춘다.

| 동작 | service / component | repository |
|---|---|---|
| 조회 | `get*` (없으면 예외) / `find*` (없으면 null) | `find*` / `count*` / `exists*` |
| 생성 | `create*` | `save*` (Spring Data) / `insert*` |
| 수정 | `update*` | `update*` |
| 삭제 | `delete*` | `delete*` |
| 병합 | `createOrUpdate*` | `upsert*` |

**`get` 과 `find` 의 차이가 이 프로젝트의 핵심 구분이다.** `get*` 은 대상이 없으면
`throwError(...)` 로 끝내고, `find*` 는 `null` 을 돌려준다. 호출부가 널 체크를 해야 하는지
이름만 보고 알 수 있어야 한다.

`modify`/`remove` 는 쓰지 않는다. 기존 코드가 `update`/`delete` 로 통일돼 있다.

## 클래스 이름

| 종류 | 규칙 | 예 |
|---|---|---|
| REST 컨트롤러 | `{Domain}Api` (관리자용은 `Admin` 접두) | `CommunityApi`, `AdminCommunityApi` |
| Swagger 문서 인터페이스 | `{Domain}ApiDocument` | `CommunityApiDocument` |
| 뷰 컨트롤러 | `{Domain}WebController` (관리자용은 `Admin` 접두) | `BibleWebController`, `AdminBibleWebController` |
| 서비스 파사드 | `{Domain}Service` | `PostService` |
| 도메인 로직 헬퍼 | 도메인명이 아니라 **역할**을 이름에 담는다 | `BibleReader`, `SocialTokenVerifier`, `QuizStageValidator`, `BotSignatureDetector` |
| 리포지토리 | `{Entity}Repository` | `BibleVerseRepository` |
| 서비스 반환 DTO | `{목적}Result`, 집계는 `{목적}Stat` | `SearchKeywordRankingResult`, `DailyVisitStat` |
| 요청/응답 DTO | `request/`, `response/` 패키지 아래 | — |

## 엔티티는 setter 를 두지 않는다

```kotlin
post.updateContent(command)   // ✅ 의도가 드러나는 메서드
post.setContent("...")        // ❌
```

상태 변경 메서드는 무엇이 왜 바뀌는지 이름에 담는다. 여러 필드를 한 번에 바꾸는 경우
커맨드 객체를 받는다.

## Enum 은 `values()` 대신 `entries`

`values()` 는 호출할 때마다 새 배열을 할당하고 그 결과가 가변이다. Kotlin 2.4 의 `entries` 는
불변 리스트를 재사용한다.

```kotlin
// ✅
fun getAllTypes(): List<MemberRole> = MemberRole.entries.toList()

// ❌
fun getAllTypes(): List<MemberRole> = MemberRole.values().toList()
```

### 상수를 손으로 나열해야 할 때

"전체"가 아니라 **의도적으로 좁힌 부분집합**일 때만 손으로 나열한다(순서를 정해야 하거나,
레거시·`UNKNOWN` 값을 일부러 뺄 때). 이 경우 상수가 추가되면 목록이 조용히 누락되므로
**목록이 enum 과 일치하는지 검증하는 테스트를 함께 둔다.**

"전체"를 뜻하는 목록이라면 손으로 나열하지 말고 `entries.toList()` 를 반환한다. 테스트도 필요 없다.
