# Testing

## 스타일

**JUnit 5 애노테이션 + Kotest assertion** 조합이다. Kotest 의 Spec DSL(`ShouldSpec`,
`FunSpec` 등)은 쓰지 않는다.

```kotlin
class BibleTypingSessionServiceTest : IntegrationTest() {

    @Test
    @DisplayName("세션을 종료하면 정확도와 CPM 이 계산된다")
    fun endSession() {
        // given
        val session = createSession()

        // when
        val result = sut.endSession(session.sessionKey)

        // then
        result.accuracy shouldBe 100
        result.endedAt shouldNotBe null
    }
}
```

- `@Test` + `@DisplayName`(한글) 로 의도를 적는다. 현재 131개 `@Test`, 75개 `@DisplayName`.
- 단언은 Kotest 의 `shouldBe` / `shouldNotBe` / `shouldThrow` 를 쓴다. JUnit 의
  `assertEquals`/`assertTrue` 는 쓰지 않는다 (기존 잔재 몇 개는 옮겨갈 대상이지 따라할 대상이 아니다).
- given–when–then 주석으로 구간을 나눈다.
- 테스트 하나는 동작 하나만 검증한다.

## 베이스 클래스

| 클래스 | 용도 |
|---|---|
| `IntegrationTest` | 통합 테스트. `@SpringBootTest(MOCK)` + Testcontainers + 테스트 회원 생성 + DB 정리 |
| `TestContainers` | PostgreSQL 17 컨테이너 기동, `spring.datasource.*` 동적 주입 |
| `DatabaseCleaner` | 엔티티 메타모델에서 테이블명을 모아 dirty 테이블만 truncate |
| `TestProfileResolver` | `test` 프로파일 강제 |

`IntegrationTest` 를 상속하면 `@BeforeEach` 에서 `member` 필드에 테스트 회원이 생성되고
`@AfterEach` 에서 DB 가 정리된다. 이 두 가지를 직접 다시 구현하지 않는다.

```kotlin
@ActiveProfiles(resolver = TestProfileResolver::class)   // 변경하지 말 것
```

**이 줄을 절대 바꾸지 않는다.** 바꾸면 테스트가 개발/운영 데이터를 향해 실행될 수 있다.

## 무엇을 어디서 검증하나

| 대상 | 방식 | 정책 |
|---|---|---|
| 도메인 로직 (계산, 상태 전이, 경계 조건) | 순수 단위 테스트 (Spring Context 없음) | 가장 두껍게 |
| 핵심 업무 흐름 (요청 → DB → 응답) | `IntegrationTest` | 해피 패스 위주로 최소한만 |
| 어댑터·단순 위임 | 원칙적으로 작성하지 않음 | 필요하면 MockK 로 격리 |

Spring Context 기동과 Testcontainers 가 CI 시간의 대부분을 차지한다. **통합 테스트를 늘리기 전에
같은 것을 단위 테스트로 검증할 수 있는지 먼저 본다.**

## 금지

- 같은 검증을 여러 계층에서 중복하지 않는다.
- 내부 호출 구조에 의존하는 테스트를 쓰지 않는다.
- **Spring Context 캐시를 깨는 것들을 쓰지 않는다**: `@MockBean`, `@DirtiesContext`,
  클래스마다 다른 `@TestPropertySource`. 하나만 있어도 컨텍스트가 새로 뜬다.
- 새로운 `@SpringBootTest` 조합을 만들지 않는다. `IntegrationTest` 를 상속한다.
- 통합 테스트에 예외·경계 케이스를 무분별하게 추가하지 않는다.

## 실행

**Docker 가 떠 있어야 한다** — Testcontainers 가 PostgreSQL 17 컨테이너를 띄운다.

```bash
./gradlew test
./gradlew test --tests "com.elseeker.game.application.service.BibleTypingSessionServiceTest"
./gradlew test --tests "*Community*"
```

컨테이너는 `withReuse(false)` 라 JVM 종료 시 제거된다. 반복 실행이 잦으면
`TestContainers.CONTAINER_REUSE` 를 켤 수 있지만, 켜 둔 채 커밋하지 않는다.

## 테스트 프로파일 설정

`src/test/resources/application-test.yml`:

- GCP(core/logging/trace) 비활성화 — Application Default Credentials 없이 부팅되도록
- OAuth 등록정보 비움 — 소셜 로그인 비활성화
- `ddl-auto: update` — 컨테이너 DB 에 스키마를 만들어야 하므로 여기만 `none` 이 아니다
- 시드 데이터 없음
