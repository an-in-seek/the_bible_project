# Tech Stack & Build

## Stack

- Kotlin 2.4.10
- Java 25 (Gradle toolchain)
- Gradle 9.6.1 (wrapper)
- Spring Boot 4.1.0 (Spring Framework 7 / Spring Security 7 / Spring Data JPA 4)
- Spring Cloud 2025.1.2 / Spring Cloud GCP 8.1.0
- PostgreSQL 17 (Supabase)
- Kotlin JDSL 3.9.0 (type-safe queries)
- springdoc-openapi 3.0.3 (Swagger UI)
- Caffeine (local cache) — [caching.md](caching.md)
- Thymeleaf + Bootstrap 5.3 (WebJars) — [frontend.md](frontend.md)
- JJWT 0.12.3
- Testing: JUnit 5 + Kotest assertions 6.2.3 + MockK 1.13.13 + Testcontainers 2.x — [testing.md](testing.md)

## Build & run

```bash
./gradlew bootRun     # run locally
./gradlew build       # build + full test suite
./gradlew test        # tests only (requires Docker)
./gradlew bootJar     # executable JAR
```

`bootRun` requires DB connection environment variables. Local development values live in `.env2`
(gitignored). If you only changed the frontend, do not run the build or the tests.

## Spring Boot 4 caveats

These changed during the Spring Boot 3 → 4 upgrade. **Do not revert them.**

### Kotlin JDSL must use the `-boot4-` variant

```kotlin
// ✅ correct
implementation("com.linecorp.kotlin-jdsl:spring-data-jpa-boot4-support:${kotlinJdslVersion}")

// ❌ blows up at runtime
implementation("com.linecorp.kotlin-jdsl:spring-data-jpa-support:${kotlinJdslVersion}")
```

The plain `spring-data-jpa-support`'s `QueryEnhancerFactoryAdaptor` references `StringQuery`, which
was removed in Spring Data JPA 4. **It compiles fine** and then fails on the first request that
calls `findSlice` / `findPage` with
`NoClassDefFoundError: org/springframework/data/jpa/repository/query/StringQuery`. The `-boot4-`
variant references the replacement API (`QueryEnhancerFactories`, `QueryProvider`).

Because it surfaces at runtime rather than compile time, reverting the dependency still produces a
successful build. Be careful.

### JSON is Jackson 3 — the Kotlin module must use the `tools.jackson` coordinates

`spring-boot-starter-web` now pulls `tools.jackson.core:jackson-databind` (Jackson 3), and the HTTP
message converter uses that mapper. The Jackson 2 module (`com.fasterxml.jackson.module:jackson-module-kotlin`)
is never registered on it, so without the Jackson 3 module the app serializes Kotlin classes with
plain JavaBean introspection.

```kotlin
implementation("tools.jackson.module:jackson-module-kotlin")        // ✅ runtime JSON
implementation("com.fasterxml.jackson.module:jackson-module-kotlin") // springdoc/swagger-core only
```

The visible symptom is `is`-prefixed booleans. `val isCorrect: Boolean` compiles to an `isCorrect()`
getter, which JavaBean naming reads as the property `correct`:

```json
{"correct": true}    // ❌ no Kotlin module — the frontend's result.isCorrect is undefined
{"isCorrect": true}  // ✅ with tools.jackson module
```

Nothing fails at build time and the endpoint still returns 200 — only the key name changes, so it
shows up as a feature quietly behaving as if the flag were always `false`. Kotlin default values and
non-null constructor parameters are silently lost the same way.

`JacksonAutoConfiguration` calls `findAndAddModules()`, so having the artifact on the classpath is
enough — no configuration. `JacksonKotlinModuleTest` pins the behavior.

### Do not exclude `commons-logging`

Through Spring Framework 6, `spring-jcl` provided `org.apache.commons.logging.Log/LogFactory`, so
excluding `commons-logging` to avoid duplicates was the idiom. In Framework 7 `spring-jcl` was
removed and the real `commons-logging` artifact is depended on directly. Excluding it now removes
the only provider of the JCL API and kills the app with
`NoClassDefFoundError: org/apache/commons/logging/Log`.

### Testcontainers 2.x coordinates changed

Every module artifact name gained a `testcontainers-` prefix (`junit-jupiter` →
`testcontainers-junit-jupiter`). The old coordinates are absent from the BOM, so the version comes
out empty and resolution fails. Container classes moved packages too —
`org.testcontainers.postgresql.PostgreSQLContainer`. `PostgreSQLContainer` is no longer generic:
write `PostgreSQLContainer(...)`, not `PostgreSQLContainer<Nothing>(...)`, and prefer the
`DockerImageName` constructor over the `String` one. `GenericContainer`, `DockerImageName`, and
`Wait` did not move.

### MockMvc test support was split out

`@AutoConfigureMockMvc` is no longer in `spring-boot-test-autoconfigure`. It requires the
`spring-boot-starter-webmvc-test` dependency.

## Database

- **PostgreSQL 17 (Supabase) in both production and local.** H2 is not used.
- `ddl-auto` is `none` in `application.yml`, `local`, and `prod`. The application does not create
  the schema. Only the test profile uses `update`.
- The seed files in `src/main/resources/data/*.sql` are **not loaded automatically.**
  `spring.sql.init` is off and `defer-datasource-initialization` is commented out. They remain only
  as reference material for seeding initial data.
- Timestamp columns are stored in UTC (`spring.jpa.properties.hibernate.jdbc.time_zone: UTC`).
  See [time-and-locale.md](time-and-locale.md).

### Supabase connection

```
DB_HOST — aws-0-ap-northeast-2.pooler.supabase.com  (session pooler)
DB_PORT — 5432
DB_USER — postgres.<project-ref>
DB_NAME — postgres
```

Three constraints confirmed by measurement.

1. **The direct host `db.<project-ref>.supabase.co` is IPv6-only**, so even name resolution fails.
   Always use the pooler host.
2. **Do not use port 6543 (the transaction pooler).** The backend changes per connection, so pgjdbc
   breaks with `ERROR: prepared statement "S_1" already exists` when it reuses a server-side
   prepared statement (6543 failed 5 out of 5 times; 5432 succeeded 5 out of 5). If you must use
   it, append `prepareThreshold=0` to the JDBC URL to disable server-side prepared statements.
3. **Specify `sslmode=require` in the URL.** The pooler also accepts plaintext connections
   (`sslmode=disable` connects fine), so encryption must be enforced by the client, not the server.
   pgjdbc's default `prefer` silently falls back to plaintext when negotiation fails. `require`
   only guarantees transport encryption and does not verify the server certificate — to also
   prevent MITM, bake the CA certificate into the image and use `sslmode=verify-full` +
   `sslrootcert`.

The session pooler maps connections 1:1 to backends, so it consumes `max_connections` directly
(60, roughly 45 excluding internal usage). Production's Hikari pool is 10, capping us at 4–5
instances. Adjust the pool size first if you plan to scale out.

### Korean sorting uses the ICU collation (`ko-KR-x-icu`)

The Supabase DB is initialized with `en_US.UTF-8` / the ICU provider and **has no libc Korean
locale.** It is managed, so the OS locale cannot be added and
`CREATE COLLATION ... (locale = 'ko_KR.utf8')` does not help either.

```sql
ORDER BY d.term COLLATE "ko-KR-x-icu"    -- ✅
ORDER BY d.term COLLATE "ko_KR.utf8"     -- ❌ collation ... does not exist (SQLState 42704)
```

This is not caught at compile time — it **fails with a 500 on the first request that runs the
query.** ICU collations are carried by PostgreSQL itself, independent of OS locales, so they exist
both on Supabase and in the `postgres:17` test container (both verified by measurement). The usable
names are `ko-KR-x-icu`, `ko-x-icu`, `ko-KP-x-icu`, and `ko-CN-x-icu`.

## Production environment variables (Cloud Run)

`JWT_SECRET_BASE64`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`,
`GOOGLE_CLIENT_ID`/`SECRET`, `NAVER_CLIENT_ID`/`SECRET`, `KAKAO_CLIENT_ID`/`SECRET`,
`EL_SEEKER_API_BASE_URL`, `EL_SEEKER_API_KEY`

Set them once on the Cloud Run service and they persist across deployments (`cloudbuild.yaml`'s
`--update-env-vars` only overwrites the keys it names). For secrets, prefer wiring up Secret
Manager with `--set-secrets`.

## Compiler options

`-Xjsr305=strict` is enabled. Kotlin's type system interprets Java libraries' `@Nullable` /
`@NonNull` strictly.

`allOpen` applies to `@Entity`, `@MappedSuperclass`, and `@Embeddable` (for JPA proxies).
