# Tech Stack & Build

## 스택

- Kotlin 2.4.10
- Java 25 (Gradle toolchain)
- Gradle 9.6.1 (wrapper)
- Spring Boot 4.1.0 (Spring Framework 7 / Spring Security 7 / Spring Data JPA 4)
- Spring Cloud 2025.1.2 / Spring Cloud GCP 8.1.0
- PostgreSQL 17 (Supabase)
- Kotlin JDSL 3.9.0 (타입 안전 쿼리)
- springdoc-openapi 3.0.3 (Swagger UI)
- Caffeine (로컬 캐시) — [caching.md](caching.md)
- Thymeleaf + Bootstrap 5.3 (WebJars) — [frontend.md](frontend.md)
- JJWT 0.12.3
- 테스트: JUnit 5 + Kotest assertions 6.2.3 + MockK 1.13.13 + Testcontainers 2.x — [testing.md](testing.md)

## 빌드 & 실행

```bash
./gradlew bootRun     # 로컬 실행
./gradlew build       # 빌드 + 전체 테스트
./gradlew test        # 테스트만 (Docker 필요)
./gradlew bootJar     # 실행 가능한 JAR
```

`bootRun` 은 DB 접속 환경변수를 요구한다. 로컬 개발용 값은 `.env2` 에 있다(gitignore 대상).
프론트엔드만 수정했다면 빌드/테스트를 돌리지 않는다.

## Spring Boot 4 주의사항

Spring Boot 3 → 4 업그레이드 과정에서 바뀐 것들이다. **되돌리지 말 것.**

### Kotlin JDSL 은 `-boot4-` 변형을 써야 한다

```kotlin
// ✅ 올바름
implementation("com.linecorp.kotlin-jdsl:spring-data-jpa-boot4-support:${kotlinJdslVersion}")

// ❌ 런타임에 터진다
implementation("com.linecorp.kotlin-jdsl:spring-data-jpa-support:${kotlinJdslVersion}")
```

일반 `spring-data-jpa-support` 의 `QueryEnhancerFactoryAdaptor` 는 Spring Data JPA 4 에서 삭제된
`StringQuery` 를 참조한다. **컴파일은 통과하고** `findSlice`/`findPage` 를 호출하는 첫 요청에서
`NoClassDefFoundError: org/springframework/data/jpa/repository/query/StringQuery` 로 터진다.
`-boot4-` 변형은 대체 API(`QueryEnhancerFactories`, `QueryProvider`)를 참조한다.

컴파일이 아니라 런타임에 드러나는 종류라 의존성을 되돌려도 빌드는 성공한다. 주의.

### `commons-logging` 을 제외하지 말 것

Spring Framework 6 까지는 `spring-jcl` 이 `org.apache.commons.logging.Log/LogFactory` 를 대신
제공해서, 중복을 피하려 `commons-logging` 을 제외하는 것이 관용구였다. Framework 7 에서
`spring-jcl` 이 제거되고 실제 `commons-logging` 아티팩트를 직접 의존하도록 바뀌었다. 지금 제외하면
JCL API 의 유일한 공급원이 사라져 `NoClassDefFoundError: org/apache/commons/logging/Log` 로 죽는다.

### Testcontainers 2.x 좌표가 바뀌었다

모든 모듈 아티팩트명에 `testcontainers-` 접두사가 붙었다(`junit-jupiter` →
`testcontainers-junit-jupiter`). 예전 좌표는 BOM 에 없어 버전이 비어 해석에 실패한다.
컨테이너 클래스도 패키지가 옮겨졌다 — `org.testcontainers.postgresql.PostgreSQLContainer`.
`PostgreSQLContainer` 는 더 이상 제네릭이 아니다. `PostgreSQLContainer<Nothing>(...)` 이 아니라
`PostgreSQLContainer(...)` 로 쓰고, `String` 생성자보다 `DockerImageName` 생성자를 쓴다.
`GenericContainer`, `DockerImageName`, `Wait` 는 옮겨지지 않았다.

### MockMvc 테스트 지원이 분리됐다

`@AutoConfigureMockMvc` 는 더 이상 `spring-boot-test-autoconfigure` 에 없다.
`spring-boot-starter-webmvc-test` 의존성이 필요하다.

## 데이터베이스

- **운영·로컬 모두 PostgreSQL 17 (Supabase)**. H2 는 쓰지 않는다.
- `ddl-auto` 는 `application.yml`/`local`/`prod` 전부 `none` 이다. 스키마는 애플리케이션이 만들지
  않는다. 테스트 프로파일만 `update`.
- `src/main/resources/data/*.sql` 의 시드 파일들은 **자동 로딩되지 않는다.**
  `spring.sql.init` 은 꺼져 있고 `defer-datasource-initialization` 도 주석 처리돼 있다.
  초기 데이터 투입용 참고 자료로만 남아 있다.
- 시각 컬럼은 UTC 로 저장한다 (`spring.jpa.properties.hibernate.jdbc.time_zone: UTC`).
  [time-and-locale.md](time-and-locale.md) 참고.

### Supabase 접속

```
DB_HOST — aws-0-ap-northeast-2.pooler.supabase.com  (세션 풀러)
DB_PORT — 5432
DB_USER — postgres.<project-ref>
DB_NAME — postgres
```

세 가지가 실측으로 확인된 제약이다.

1. **직접 호스트 `db.<project-ref>.supabase.co` 는 IPv6 전용**이라 이름 해석부터 실패한다.
   반드시 풀러 호스트를 쓴다.
2. **포트 6543(트랜잭션 풀러)을 쓰지 않는다.** 커넥션마다 백엔드가 바뀌어 pgjdbc 가 서버측
   prepared statement 를 재사용할 때 `ERROR: prepared statement "S_1" already exists` 로 깨진다
   (6543 은 5회 중 5회 실패, 5432 는 5회 중 5회 성공). 굳이 써야 하면 JDBC URL 에
   `prepareThreshold=0` 을 붙여 서버측 prepared statement 를 꺼야 한다.
3. **`sslmode=require` 를 URL 에 명시한다.** 풀러는 평문 접속도 받아주므로(`sslmode=disable` 로도
   붙는다) 암호화는 서버가 아니라 클라이언트가 강제해야 한다. pgjdbc 기본값 `prefer` 는 협상
   실패 시 조용히 평문으로 폴백한다. `require` 는 전송 구간 암호화까지만 보장하고 서버 인증서는
   검증하지 않으므로, MITM 까지 막으려면 CA 인증서를 이미지에 넣고 `sslmode=verify-full` +
   `sslrootcert` 를 쓴다.

세션 풀러는 커넥션이 백엔드와 1:1 이라 `max_connections`(60, 내부 사용분 제외 시 약 45)를 그대로
소모한다. prod 의 Hikari 풀이 10 이므로 인스턴스 4~5개가 한계다. 스케일아웃 계획이 있으면 풀
크기부터 조정한다.

## 운영 환경변수 (Cloud Run)

`JWT_SECRET_BASE64`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`,
`GOOGLE_CLIENT_ID`/`SECRET`, `NAVER_CLIENT_ID`/`SECRET`, `KAKAO_CLIENT_ID`/`SECRET`,
`EL_SEEKER_API_BASE_URL`, `EL_SEEKER_API_KEY`

Cloud Run 서비스에 한 번만 설정해두면 배포마다 유지된다(`cloudbuild.yaml` 의 `--update-env-vars`
는 지정한 키만 덮어쓴다). 비밀값은 `--set-secrets` 로 Secret Manager 를 연결하는 편이 낫다.

## 컴파일러 옵션

`-Xjsr305=strict` 가 켜져 있다. 자바 라이브러리의 `@Nullable`/`@NonNull` 을 Kotlin 타입 시스템이
엄격하게 해석한다.

`allOpen` 이 `@Entity`, `@MappedSuperclass`, `@Embeddable` 에 적용된다 (JPA 프록시용).
