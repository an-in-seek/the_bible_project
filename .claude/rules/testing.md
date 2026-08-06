# Testing

## Style

**JUnit 5 annotations + Kotest assertions.** Kotest's Spec DSLs (`ShouldSpec`, `FunSpec`, etc.) are
not used.

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

- State intent with `@Test` + `@DisplayName` (written in Korean). Currently 131 `@Test` and
  75 `@DisplayName`.
- Assert with Kotest's `shouldBe` / `shouldNotBe` / `shouldThrow`. Do not use JUnit's
  `assertEquals` / `assertTrue` (the few remaining ones are leftovers to migrate, not examples to
  follow).
- Separate sections with given–when–then comments.
- One test verifies one behavior.

## Base classes

| Class | Purpose |
|---|---|
| `IntegrationTest` | Integration tests. `@SpringBootTest(MOCK)` + Testcontainers + test member creation + DB cleanup |
| `TestContainers` | Starts the PostgreSQL 17 container, injects `spring.datasource.*` dynamically |
| `DatabaseCleaner` | Collects table names from the entity metamodel and truncates only dirty tables |
| `TestProfileResolver` | Forces the `test` profile |

Extending `IntegrationTest` creates a test member in the `member` field via `@BeforeEach` and
cleans the DB via `@AfterEach`. Do not reimplement either.

```kotlin
@ActiveProfiles(resolver = TestProfileResolver::class)   // do not change
```

**Never change this line.** Changing it can point tests at development or production data.

## What is verified where

| Target | Approach | Policy |
|---|---|---|
| Domain logic (calculations, state transitions, boundary conditions) | Pure unit tests (no Spring context) | Thickest coverage |
| Core business flows (request → DB → response) | `IntegrationTest` | Minimal, happy path only |
| Adapters and simple delegation | Not written as a rule | Isolate with MockK if needed |

Spring context startup and Testcontainers dominate CI time. **Before adding an integration test,
check whether the same thing can be verified with a unit test.**

## Prohibited

- Do not duplicate the same verification across multiple layers.
- Do not write tests that depend on internal call structure.
- **Do not use anything that breaks the Spring context cache**: `@MockBean`, `@DirtiesContext`,
  or a different `@TestPropertySource` per class. One of them is enough to spin up a fresh context.
- Do not create new `@SpringBootTest` combinations. Extend `IntegrationTest`.
- Do not indiscriminately add exception and edge cases to integration tests.

## Running

**Docker must be running** — Testcontainers starts a PostgreSQL 17 container.

```bash
./gradlew test
./gradlew test --tests "com.elseeker.game.application.service.BibleTypingSessionServiceTest"
./gradlew test --tests "*Community*"
```

The container uses `withReuse(false)`, so it is removed when the JVM exits. For frequent repeated
runs you can turn on `TestContainers.CONTAINER_REUSE`, but do not commit it enabled.

## Test profile configuration

`src/test/resources/application-test.yml`:

- GCP (core/logging/trace) disabled — so it boots without Application Default Credentials
- OAuth registrations emptied — social login disabled
- `ddl-auto: update` — the only place that is not `none`, since the schema must be created in the
  container DB
- No seed data
