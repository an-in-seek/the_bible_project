# ElSeeker

ElSeeker는 "하나님을 구하는 사람" 또는 "하나님을 찾는 사람"이라는 의미를 지닌 성경 플랫폼 서비스입니다. Kotlin과 Spring Boot 기반으로 개발되었으며, Thymeleaf 서버 렌더링 웹 UI와 REST API를 같은
애플리케이션에서 함께 제공합니다.

성경 본문 탐색·검색, 타이핑 연습, 퀴즈와 낱말 퍼즐, 사전·역사 학습 콘텐츠, 커뮤니티를 제공하며 PostgreSQL(Supabase)을 사용합니다.

---

## 브랜드/철학

ElSeeker는 "하나님을 구하는 사람/하나님을 찾는 사람"이라는 의미를 바탕으로, 성경을 통해 하나님을 알아가는 여정을 돕는 플랫폼을 지향합니다.

---

## 주요 기능

### 성경 (Bible)

| 기능           | 설명                                       |
|--------------|------------------------------------------|
| 번역본/책/장/절 탐색 | 계층 탐색 웹 UI 및 REST API (KRV 66권 전체, NKRV 일부, KJV 목록) |
| 구절 검색        | 번역본 단위 키워드 검색, 페이지네이션 지원                 |
| 검색어 랭킹       | 인기 검색어 집계·노출 (로컬 캐시 30초)                 |
| 오늘의 말씀       | 매일 변경되는 랜덤 구절 조회 API                     |
| 장 네비게이션      | 이전/다음 장 이동 API                           |
| 책 소개         | 각 성경 책의 요약 정보 페이지 (한/영)                  |
| 구절 메모        | 절·장·책 단위 메모 조회·등록·삭제 (로그인 필수)            |
| 내 메모 모음      | 작성한 메모 통합 조회 및 개수 집계 (로그인 필수)            |
| 구절 하이라이트     | 장별 하이라이트 조회·등록·삭제 (로그인 필수)               |
| 읽기 진행도       | 장 단위 읽기 기록 조회·등록 (로그인 필수)                |

### 게임 (Game)

| 기능       | 설명                                           |
|----------|----------------------------------------------|
| 성경 퀴즈    | 스테이지별 문항 풀기, 난이도 선택, 점수 기록, 진행도 초기화          |
| 성경 OX 퀴즈 | 참/거짓 문항 스테이지, 문항별 즉시 채점, 스테이지 완료 기록          |
| 성경 타자 연습 | 번역본/책/장 단위 타자 세션, 절별 진행도 저장, 정확도·속도 측정, 이어하기 |
| 성경 뽑기    | 랜덤 구절 추첨                                     |
| 성경 단어 퍼즐 | 난이도별 낱말 퍼즐, 자동 저장·이어하기, 힌트, 제출 채점 및 결과 학습    |
| 성경 이야기   | 성경 이야기 학습 페이지                                |
| 랭킹       | 게임 통합 랭킹 조회                                  |

### 학습 (Study)

| 기능        | 설명                                       |
|-----------|------------------------------------------|
| 성경 사전     | 성경 용어 키워드 검색, 상세 조회, 참조 구절 (REST API·웹 UI) |
| 사전 검색어 랭킹 | 인기 검색어 집계·노출 (로컬 캐시 30초)                 |
| 성경 역사     | 시대별 타임라인 탐색, 시대·사건 상세 (정치/문화적 배경, 성경 참조) |
| 성경 개요 영상  | 66권 유튜브 영상 목록 (클라이언트 전용, 정적 데이터)         |
| 성경 족보     | 마태복음/누가복음 족보 비교 (클라이언트 전용, 정적 데이터)       |
| 성경 역사 지도  | 지도 기반 성경 역사 탐색                           |
| 성경 주석     | 주석 학습 페이지                                |
| 천지창조      | 창조 기사 학습 페이지                             |
| 십계명       | 십계명 학습 페이지                               |
| 고난주간      | 고난주간 학습 페이지                              |
| 통독표       | 성경 통독 안내 페이지                             |
| 구약의 왕들    | 구약 왕조 학습 페이지                             |
| 12사도      | 예수님의 12제자 학습 페이지                         |
| 12지파      | 이스라엘 12지파 학습 페이지                         |
| 사도신경      | 사도신경 내용 학습 페이지                           |
| 주기도문      | 주기도문 내용 학습 페이지                           |

### 커뮤니티 (Community)

| 기능     | 설명                             |
|--------|--------------------------------|
| 게시글    | 작성·수정·삭제, 목록 조회(페이지네이션), 상세 조회 |
| 인기 게시글 | Top Posts 조회                   |
| 댓글     | 작성·수정·삭제                       |
| 리액션    | 좋아요 등 등록·취소                    |
| 신고     | 게시글·댓글 신고                      |

### 회원 (Member) · 인증 (Auth)

| 기능            | 설명                                                    |
|---------------|-------------------------------------------------------|
| 소셜 로그인        | OAuth2 (Google, Naver, Kakao)                         |
| 인증            | JWT 기반 무상태 인증, Access/Refresh 토큰 HttpOnly 쿠키 발급·자동 갱신 |
| 약관 동의         | 가입 시 동의 수집, 동의 이력 저장, `ConsentGateFilter` 로 미동의 접근 차단 |
| 마이페이지         | 프로필(닉네임·프로필 이미지) 조회·수정                                |
| OAuth 계정 관리   | 연동 계정 목록 조회, 추가 연동, 연동 해제 (최초 가입 계정 보호)               |
| OAuth 프로필 초기화 | 특정 연동 계정의 닉네임·이메일로 프로필 설정                             |
| 회원 탈퇴         | 계정 및 연관 데이터 영구 삭제, 탈퇴 이력 기록                           |

### 문의 (QnA)

| 기능     | 설명                            |
|--------|-------------------------------|
| 회원 문의  | 문의 등록·수정·조회 (마이페이지 내 내 문의 목록) |
| 비회원 문의 | 로그인 없이 보내는 연락 메시지             |

### 분석 (Analytics)

| 기능           | 설명                                        |
|--------------|-------------------------------------------|
| 사이트 방문 수집    | 인터셉터 기반 방문 이벤트 적재 (집계 기준일은 Asia/Seoul)    |
| 앱 설치 배너 이벤트  | 배너 노출·클릭 이벤트 수집 API                       |
| 방문자 통계 (관리자) | 일자별 방문 통계 조회 API                          |

### 관리자 (Admin)

| 기능       | 설명                                       |
|----------|------------------------------------------|
| 성경 관리    | 번역본, 책, 책 소개, 장, 절 CRUD, 검색어 조회          |
| 사전 관리    | 사전 항목 CRUD, 참조 구절 CRUD, 검색어 조회           |
| 단어 퍼즐 관리 | 퍼즐 CRUD, 퍼즐 항목(Entry) CRUD               |
| 퀴즈 관리    | 퀴즈 스테이지·문항 CRUD                          |
| OX 퀴즈 관리 | OX 스테이지·문항 CRUD                          |
| 커뮤니티 관리  | 게시글 CRUD·상태 변경, 댓글 상태 변경·삭제·복원, 신고 목록 조회 |
| 회원 관리    | 회원 목록 조회(검색), 회원 정보 수정                   |
| 문의 관리    | 회원 문의·비회원 문의 목록 및 상세 조회                  |
| 방문자 통계   | 방문 통계 API                                |

### 기타

| 기능     | 설명                                |
|--------|-----------------------------------|
| 소개/검색  | 사이트 소개 페이지, 통합 검색 페이지             |
| 법적 페이지 | 이용약관 및 개인정보처리방침                   |
| 고객지원   | 문의하기 페이지                          |
| API 문서 | SpringDoc 기반 OpenAPI 및 Swagger UI |

---

## 기술 스택

> **Kotlin 2.4.10** · **Java 25** · **Gradle 9.6.1** · **Spring Boot 4.1.0**

### Backend

- **Spring Boot 4.1.0** (Spring Framework 7 / Spring Security 7 / Spring Data JPA 4) — Web, Data JPA,
  Security, Validation, OAuth2 Client, Thymeleaf, Cache
- **Spring Cloud 2025.1.2** / **Spring Cloud GCP 8.1.0** — GCP core, logging, trace
- **Kotlin JDSL 3.9.0** — 타입 안전 동적 쿼리 (⚠️ `spring-data-jpa-boot4-support` 변형 필수)
- **Caffeine** — 로컬(인메모리) 캐시. Redis는 사용하지 않음
- **Jackson Kotlin Module** — JSON 직렬화
- **kotlin-logging 8.0.02** — 로깅
- **nv-i18n 1.29** — 국가/언어 코드 검증

### Database

- **PostgreSQL 17 (Supabase)** — 로컬/운영 공통. H2는 사용하지 않음
- `ddl-auto` 는 모든 프로필에서 `none` (테스트 프로필만 `update`). 스키마는 애플리케이션이 만들지 않음
- 시각 컬럼은 UTC 저장 (`hibernate.jdbc.time_zone: UTC`)

### 인증

- **OAuth2 Client** — Google, Naver, Kakao
- **JJWT 0.12.3** — Access/Refresh 토큰, HttpOnly 쿠키
- **Google API Client 2.7.2** — ID Token 검증
- 필터 순서: `JwtRefreshFilter` → `JwtAuthenticationFilter` → `ConsentGateFilter` → Spring Security

### Frontend

- **Thymeleaf** — SSR 템플릿 엔진
- **Bootstrap 5.3.0** / **jQuery 3.6.0** — WebJars
- **JavaScript (ES6)** — 번들러 없음, 모듈 방식

### 문서화

- **SpringDoc OpenAPI 3.0.3** — Swagger UI

### 테스트

- **JUnit 5** · **Kotest assertions 6.2.3** — 테스트 프레임워크 (Kotest Spec DSL은 사용하지 않음)
- **MockK 1.13.13** — Docker 없이 도는 단위 테스트용 모킹
- **Testcontainers 2.x** — PostgreSQL 17 통합 테스트

---

## 프로젝트 구조

헥사고날(포트-어댑터)을 **도메인 모듈 단위**로 적용합니다. 모듈로 먼저 나누고, 그 안에서 레이어로 나눕니다.
의존 방향은 `adapter → application → domain` 한 방향입니다.

```
{module}/
  adapter/input/api/{client|admin}/   REST 컨트롤러 (+ request/, response/, mapper/)
  adapter/input/web/{client|admin}/   Thymeleaf 뷰 컨트롤러
  adapter/output/jpa/                 JPA 리포지토리, 커스텀 쿼리, 컨버터
  application/service/                얇은 서비스 파사드 (트랜잭션 경계·흐름 제어)
  application/component/              실제 도메인 로직 헬퍼
  application/mapper/                 엔티티 ↔ DTO 변환
  application/listener/               도메인 이벤트 리스너
  domain/model/                       JPA 엔티티
  domain/vo/                          enum, 값 객체
  domain/result/                      서비스 반환 DTO
  domain/event/                       도메인 이벤트
  domain/policy/                      도메인 정책
```

### 모듈

`src/main/kotlin/com/elseeker/`

| 모듈          | 책임                                                       |
|-------------|----------------------------------------------------------|
| `bible`     | 성경 본문·장절, 번역본, 읽기 진도, 메모/하이라이트, 타이핑 조회, 검색 및 검색어 랭킹      |
| `study`     | 사전, 사전 참조, 사전 검색어 랭킹, 역사                                 |
| `game`      | 퀴즈(객관식/OX), 타이핑 세션·진행도, 낱말 퍼즐, 랭킹                         |
| `community` | 게시글, 댓글, 반응, 신고                                          |
| `member`    | 회원, OAuth 계정 연결, 탈퇴 이력                                   |
| `auth`      | 로그인·토큰 발급 흐름, 약관 동의                                      |
| `qna`       | 문의(inquiry), 비회원 문의(contact message)                     |
| `analytics` | 사이트 방문·앱 설치 배너 이벤트 수집                                    |
| `common`    | 공통 설정(`config`), 보안(`security`), 예외·공통 엔티티(`domain`), 정책(`policy`), 전역 컴포넌트 |

`common/config` 에는 `CacheConfig`, `ElSeekerProperties`, `JpaConfig`, `SchedulingConfig`,
`SwaggerConfig` 가 있습니다.

새 도메인이 생기면 기존 모듈에 끼워 넣지 않고 모듈을 새로 만듭니다.

### 리소스

`src/main/resources/`

| 경로                                                     | 내용                                     |
|--------------------------------------------------------|----------------------------------------|
| `application.yml`, `application-local.yml`, `application-prod.yml` | 프로필별 설정                                |
| `logback-spring-local.xml`, `logback-spring-prod.xml`   | 프로필별 로깅 설정                             |
| `data/`                                                | SQL 시드 데이터 (자동 로딩되지 않음 — 아래 참고)        |
| `templates/`                                           | Thymeleaf 템플릿 (101개)                   |
| `static/css/`                                          | CSS (62개)                              |
| `static/js/`                                           | JavaScript ES6 모듈 (69개)                |
| `static/`                                              | `robots.txt`, `sitemap.xml`, `images/`, `videos/`, `vendor/`, `data/` |

### 테스트

`src/test/kotlin/com/elseeker/`

* `common`: 테스트 인프라 (`IntegrationTest`, `DatabaseCleaner`, `TestContainers`, `TestProfileResolver`)
* 도메인별 테스트: `auth`, `bible`, `game`, `member`, `qna`, `study`

### 문서

* `docs/`: 도메인별 설계 문서 (`analytics`, `auth`, `bible`, `common`, `community`, `contact`,
  `game`, `member`, `policy`, `qna`, `study`, `support`) 및 앱/스토어 관련 문서(`android`,
  `googleplay`, `mobile`), `social-login-api.md`
* `.claude/rules/`: 주제별 개발 규칙 (아래 "개발 가이드" 참고)

---

## 개발 가이드

주제별 상세 규칙은 `.claude/rules/` 에 있습니다. 작업 전에 해당 문서를 먼저 읽습니다.

| 문서                                                   | 언제 읽나                                |
|------------------------------------------------------|--------------------------------------|
| [architecture.md](.claude/rules/architecture.md)      | 모듈·레이어 구조, 패키지 배치, 인증/보안 필터 체인       |
| [tech-stack.md](.claude/rules/tech-stack.md)          | 빌드·실행, 의존성 변경, Spring Boot 4 주의사항, DB 설정 |
| [naming.md](.claude/rules/naming.md)                  | 클래스·메서드 이름 결정                        |
| [error-handling.md](.claude/rules/error-handling.md)  | 예외 발생, 에러 응답 생성                      |
| [testing.md](.claude/rules/testing.md)                | 테스트 작성·수정                            |
| [caching.md](.claude/rules/caching.md)                | 캐시 추가, 만료 정책 변경                      |
| [time-and-locale.md](.claude/rules/time-and-locale.md) | 날짜·시각·타임존 처리                         |
| [frontend.md](.claude/rules/frontend.md)              | Thymeleaf 템플릿, CSS, JavaScript       |

핵심 규칙 요약:

* Commit 메시지는 AngularJS 컨벤션 prefix를 따릅니다: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`, `build:`
* 서비스는 얇게 유지하고 실제 로직은 `application/component` 의 `@Component` 에 위임합니다.
* Swagger/OpenAPI 어노테이션은 `*ApiDocument` 인터페이스에 작성하고, 컨트롤러는 해당 인터페이스를 구현합니다.
* 비즈니스 오류는 메시지를 하드코딩하지 않고 `ErrorType` 에 정의한 뒤 `throwError(...)` 로 던집니다.
* CSS/JS를 수정하면 이를 참조하는 템플릿의 `?v=` 쿼리 파라미터를 반드시 올립니다(캐시 버스팅).
* 웹 UI의 뒤로가기 동작은 공통 네비게이션바의 백버튼(`topNavBackButton`)을 사용합니다. 커스텀 이동 경로가 필요하면 `<body>`에 `data-back-link`를 지정합니다.
* Hover 스타일은 데스크톱(마우스) 환경에서만 적용합니다. 모든 hover CSS는 `@media (hover: hover) and (pointer: fine)` 내부에 작성하고, 모바일/터치 UI에서는 hover 기반 UX를 설계하지 않습니다.
* **Active 메뉴 처리**: Thymeleaf 3.1부터 템플릿 내 `#request` 직접 접근이 차단되므로, `@ControllerAdvice` + `@ModelAttribute("currentPath")`로 서버에서 현재 경로를 주입합니다. 템플릿에서는 `th:classappend="${#strings.startsWith(currentPath, '/경로')} ? 'active'"` 패턴을 사용합니다. JS
  `location.pathname`으로 active 클래스를 토글하는 방식은 SSR 원칙 위배로 사용하지 않습니다. (참고: `GlobalModelAttribute.kt`)
* 인증이 필요한 fetch는 `common-util.js` 의 `fetchWithAuthRetry()` 를 사용합니다. 직접 `fetch` 를 쓰면 액세스 토큰 만료 시 재시도 없이 401로 끝납니다.

린터·포매터는 설정돼 있지 않습니다.

---

## SEO 가이드

새 페이지를 추가하거나 기존 페이지를 수정할 때 아래 규칙을 따릅니다.

### 공통 head fragment

모든 페이지는 `fragments/head.html`의 공통 fragment를 사용합니다. fragment가 자동으로 처리하는 항목:

* `<title>` — 첫 번째 파라미터로 전달
* `<meta description>` — `pageDescription` 변수 (미설정 시 사이트 기본 설명 사용)
* `<link rel="canonical">` — 현재 요청 URI 기반 자동 생성
* Open Graph / Twitter Card 메타 태그 — title, description, image 자동 매핑
* JSON-LD 구조화 데이터 — Organization, WebSite, WebPage 3중 구조

### 새 페이지 추가 시 필수 작업

1. **`pageDescription` 설정** — 페이지 고유의 설명을 50~160자(한글) 이내로 작성합니다.
   ```html
   <head th:replace="~{fragments/head :: head('페이지명 | ElSeeker', true, '/css/feature.css')}"
         th:with="pageDescription='이 페이지의 고유한 설명을 작성합니다.'"></head>
   ```

2. **로그인 필수 페이지는 `noindex` 설정** — 크롤러가 접근할 수 없는 페이지는 반드시 noindex를 지정합니다.
   ```html
   <head th:replace="~{fragments/head :: head('제목 | ElSeeker', true, '/css/feature.css')}"
         th:with="robotsContent='noindex'"></head>
   ```

3. **sitemap.xml 업데이트** — 공개 페이지를 추가한 경우 `src/main/resources/static/sitemap.xml`에 URL을 추가합니다.

4. **SecurityConfig permitAll 확인** — 공개 페이지인 경우 `SecurityConfig.kt`의 `permitAll()` 규칙에 포함되는지 확인합니다.

### th:with 변수 목록

| 변수                | 용도                                            | 예시                                         |
|-------------------|-----------------------------------------------|--------------------------------------------|
| `pageDescription` | 페이지 meta description                          | `'성경 66권의 개요를 영상으로 학습합니다.'`                |
| `robotsContent`   | robots 메타 태그                                  | `'noindex'`                                |
| `schemaType`      | JSON-LD @type (기본: `WebPage`)                 | `'CollectionPage'`, `'Article'`            |
| `ogType`          | Open Graph type (기본: `website`)               | `'article'`                                |
| `ogImage`         | Open Graph 이미지 URL                            | `'https://elseeker.com/images/custom.png'` |
| `canonicalUrl`    | canonical URL 직접 지정                           | `'https://elseeker.com/web/bible/search'`  |
| `twitterCard`     | Twitter Card type (기본: `summary_large_image`) | `'summary'`                                |

복수 변수를 콤마로 조합할 수 있습니다:

```html
th:with="pageDescription='설명', schemaType='CollectionPage'"
```

### 페이지 분류별 SEO 정책

| 분류                       | pageDescription |    noindex     | sitemap 포함 |
|--------------------------|:---------------:|:--------------:|:----------:|
| 공개 페이지 (성경, 학습, 커뮤니티 목록) |       필수        |       X        |     O      |
| 로그인 필수 페이지 (게임, 마이페이지)   |       선택        |       O        |     X      |
| 관리자 페이지                  |       불필요       | robots.txt로 차단 |     X      |
| 에러 페이지                   |       불필요       |       O        |     X      |

### robots.txt 규칙

`src/main/resources/static/robots.txt`에서 크롤러 접근을 관리합니다:

* `/web/admin/` — 관리자 페이지 차단
* `/web/member/` — 회원 전용 페이지 차단
* `/web/auth/` — 인증 페이지 차단
* `/api/` — API 엔드포인트 차단
* `Sitemap` — sitemap.xml 위치 명시

---

## 로컬 실행 방법

```bash
./gradlew bootRun
```

로컬도 **Supabase의 PostgreSQL 17**에 접속합니다. 로컬 PostgreSQL을 따로 띄우지 않으며, 아래 환경변수가 필요합니다.
로컬 개발용 값은 `.env2` 에 있습니다(gitignore 대상).

| 환경변수                                                | 비고                                            |
|-----------------------------------------------------|-----------------------------------------------|
| `DB_HOST`                                           | 세션 풀러 호스트 (`aws-0-...pooler.supabase.com`)    |
| `DB_PORT`                                           | `5432` (트랜잭션 풀러 `6543` 은 사용하지 않음)             |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`                 | `DB_USER` 는 `postgres.<project-ref>` 형식        |
| `JWT_SECRET_BASE64`                                 | JWT 서명 키                                      |
| `GOOGLE_/NAVER_/KAKAO_CLIENT_ID`·`SECRET`           | 소셜 로그인 (미설정 시 기본 placeholder 값으로 부팅)          |
| `EL_SEEKER_API_BASE_URL`, `EL_SEEKER_API_KEY`       | 기본값 `http://localhost:8080`, `TEST_API_KEY`   |

JDBC URL에는 `sslmode=require` 가 명시돼 있습니다. 접속 관련 제약(IPv6 전용 직접 호스트, 포트 6543의 prepared statement 충돌 등)은
[tech-stack.md](.claude/rules/tech-stack.md) 를 참고하세요.

* 애플리케이션 접속: `http://localhost:8080`
* Swagger UI: `http://localhost:8080/swagger-ui/index.html`

---

## 빌드 및 테스트

```bash
./gradlew build       # 빌드 + 전체 테스트
./gradlew test        # 테스트만 (Docker 필요 — Testcontainers)
./gradlew bootJar     # 실행 가능한 JAR
```

`test` 는 Testcontainers로 PostgreSQL 17 컨테이너를 띄우므로 **Docker가 실행 중이어야 합니다.**
프론트엔드(HTML/CSS/JS/Thymeleaf)만 수정했다면 빌드·테스트를 돌리지 않습니다.

---

## 시간대 정책

시각 컬럼은 모두 **UTC로 저장**되고(`hibernate.jdbc.time_zone: UTC`), API는 UTC 기준 ISO-8601 형식으로 응답합니다.
예: `2024-01-01T10:00:00Z`

집계 기준 날짜(예: `analytics` 의 `visited_date`, `occurred_date`)는 **Asia/Seoul 로 변환한 `LocalDate`** 를 별도 컬럼에 저장합니다.
사용자 타임존에 따른 표시 변환은 클라이언트에서 수행합니다. 자세한 내용은
[time-and-locale.md](.claude/rules/time-and-locale.md) 를 참고하세요.

---

## 인증 및 토큰 갱신

* OAuth2 로그인 성공 시 Access/Refresh JWT가 HttpOnly 쿠키로 발급됩니다 (Access 1시간, Refresh 14일).
* Access 토큰이 만료되면 서버 `JwtRefreshFilter`가 Refresh 토큰으로 자동 재발급을 시도합니다.
* 명시적 재발급은 `POST /api/v1/auth/refresh`로 수행합니다(실패 시 401).
* 약관 미동의 상태에서는 `ConsentGateFilter` 가 접근을 차단하고 동의 페이지로 유도합니다.
* 인증 실패 처리 경로가 갈립니다 — **API는 401 JSON**, **웹 화면은 `/web/auth/login?returnUrl=...` 리다이렉트**.
* 클라이언트에서는 `common-util.js` 의 `fetchWithAuthRetry()` 가 토큰 갱신을 처리합니다.

---

## REST API

전체 엔드포인트와 요청/응답 스키마는 **Swagger UI**(`/swagger-ui/index.html`)를 정본으로 참고하세요.
아래는 컨트롤러 기준 base path 목록입니다.

### 클라이언트 API

| 모듈          | Base path                                                                                                                                                                                                       |
|-------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `bible`     | `/api/v1/bibles`, `/api/v1/bibles/translations`, `/api/v1/bibles/translations/{translationId}/books/{bookOrder}`, `.../chapters/{chapterNumber}` (조회·메모·하이라이트), `/api/v1/bibles/my-memos`, `/my-book-memos`, `/my-chapter-memos`, `/my-memo-counts`, `/api/v1/bibles/search-keywords`, `/api/v1/bible`, `/api/v1/bible/reading` |
| `study`     | `/api/v1/study/dictionaries`, `/api/v1/study/dictionaries/search-keywords`                                                                                                                                        |
| `game`      | `/api/v1/game/bible-quiz`, `/api/v1/game/bible-ox-quiz`, `/api/v1/game/bible-typing/sessions`, `/api/v1/game/bible-typing/progress`, `/api/v1/game/word-puzzles`, `/api/v1/game/ranking`                            |
| `community` | `/api/v1/community`                                                                                                                                                                                               |
| `member`    | `/api/v1/members`                                                                                                                                                                                                 |
| `auth`      | `/api/v1/auth`, `/api/v1/auth/consent`                                                                                                                                                                            |
| `qna`       | `/api/v1/qna/inquiries`, `/api/v1/qna/contacts`                                                                                                                                                                   |
| `analytics` | `/api/v1/analytics/app-install-banner/events`                                                                                                                                                                     |

### 관리자 API

`/api/v1/admin/**` 경로이며 `ADMIN` 권한이 필요합니다.

| 모듈          | Base path                                                                                                                                                                                     |
|-------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `bible`     | `/api/v1/admin/bible/translations`, `.../translations/{translationId}/books`, `/api/v1/admin/bible/book-descriptions`, `/api/v1/admin/bible/books/{bookId}/chapters`, `/api/v1/admin/bible/chapters/{chapterId}/verses`, `/api/v1/admin/bible/search-keywords` |
| `study`     | `/api/v1/admin/dictionaries`, `/api/v1/admin/dictionaries/{dictionaryId}/references`, `/api/v1/admin/dictionaries/search-keywords`                                                               |
| `game`      | `/api/v1/admin/quiz`, `/api/v1/admin/ox`, `/api/v1/admin/word-puzzles`                                                                                                                          |
| `community` | `/api/v1/admin/community`                                                                                                                                                                       |
| `member`    | `/api/v1/admin/members`                                                                                                                                                                         |
| `qna`       | `/api/v1/admin/qna/inquiries`, `/api/v1/admin/qna/contacts`                                                                                                                                     |
| `analytics` | `/api/v1/admin/analytics/visitors`                                                                                                                                                              |

---

## 웹 UI 라우트

### 공통 · 인증

```text
GET /
GET /web/about
GET /web/search
GET /web/legal/terms
GET /web/legal/privacy
GET /web/support/contact
GET /web/support/contact/complete
GET /web/auth/login
GET /web/auth/logout
GET /web/auth/consent
```

### 성경 · 게임 · 학습

```text
GET /web/bible/translation
GET /web/bible/book
GET /web/bible/book/description
GET /web/bible/chapter
GET /web/bible/verse
GET /web/bible/search

GET /web/game
GET /web/game/ranking
GET /web/game/bible-quiz
GET /web/game/bible-quiz/map
GET /web/game/bible-ox-quiz
GET /web/game/bible-ox-quiz/map
GET /web/game/bible-typing
GET /web/game/bible-casting-lots
GET /web/game/bible-word-puzzle
GET /web/game/bible-word-puzzle/play
GET /web/game/bible-story

GET /web/study
GET /web/study/bible-overview-video
GET /web/study/bible-genealogy
GET /web/study/bible-history-map
GET /web/study/bible-commentary
GET /web/study/creation
GET /web/study/ten-commandments
GET /web/study/holy-week
GET /web/study/public-reading-of-scripture
GET /web/study/old-testament-kings
GET /web/study/twelve-disciples
GET /web/study/twelve-tribes
GET /web/study/lords-prayer
GET /web/study/apostles-creed
GET /web/study/history
GET /web/study/history/{era}
GET /web/study/history/event/{id}
GET /web/study/dictionary
GET /web/study/dictionary/{id}
```

### 커뮤니티 · 회원

```text
GET /web/community
GET /web/community/write
GET /web/community/{postId}

GET /web/member/mypage
GET /web/member/my-memo
GET /web/member/my-inquiries
GET /web/member/my-inquiries/new
GET /web/member/my-inquiries/{id}
GET /web/member/my-inquiries/{id}/edit
GET /web/member/withdraw
GET /web/member/withdraw/complete
```

### 관리자

```text
GET /web/admin
GET /web/admin/bible/translations[/new | /{id}/edit]
GET /web/admin/bible/translations/{translationId}/books[/new | /{id}/edit]
GET /web/admin/bible/book-descriptions[/new | /{id}/edit]
GET /web/admin/bible/books/{bookId}/chapters[/new | /{id}/edit]
GET /web/admin/bible/chapters/{chapterId}/verses[/new | /{id}/edit]
GET /web/admin/dictionaries[/new | /{id}/edit]
GET /web/admin/word-puzzles[/new | /{id}/edit]
GET /web/admin/word-puzzles/{puzzleId}/entries[/new | /{entryId}/edit]
GET /web/admin/quiz/stages[/new | /{id}/edit]
GET /web/admin/quiz/stages/{stageId}/questions[/new]
GET /web/admin/quiz/questions/{id}/edit
GET /web/admin/ox-quiz/stages[/new | /{id}/edit]
GET /web/admin/ox-quiz/stages/{stageId}/questions[/new]
GET /web/admin/ox-quiz/questions/{id}/edit
GET /web/admin/members[/{id}/edit]
GET /web/admin/community[/posts | /posts/new | /posts/{postId} | /posts/{postId}/edit | /comments | /reports]
GET /web/admin/qna/inquiries[/{id}]
GET /web/admin/qna/contacts[/{id}]
```

### 템플릿 구조

`src/main/resources/templates` (101개 파일)

```text
index.html, about.html, search.html, error.html

bible/      translation-list, book-list, book-description, chapter-list, verse-list, verse-search
game/       game, game-ranking, bible-quiz, bible-quiz-map, bible-ox-quiz, bible-ox-quiz-map,
            bible-typing, bible-casting-lots, bible-story,
            bible-word-puzzle, bible-word-puzzle-play
study/      study, bible-overview-video, bible-genealogy, bible-history-map, bible-commentary,
            creation, ten-commandments, holy-week, public-reading-of-scripture,
            old-testament-kings, twelve-disciples, twelve-tribes, lords-prayer, apostles-creed,
            history, history-era, history-event, dictionary-list, dictionary-detail
community/  community, community-write, community-detail
member/     mypage, my-memo, my-inquiries, my-inquiry-form, my-inquiry-detail,
            withdraw, withdraw-complete
auth/       consent
login/      login
legal/      terms, privacy
support/    contact, contact-complete
admin/      admin-dashboard
            bible/     translation·book·book-description·chapter·verse 의 list/form
            study/     admin-dictionary-list, admin-dictionary-form
            game/      word-puzzle·word-puzzle-entry·quiz-stage·quiz-question·
                       ox-stage·ox-question 의 list/form
            member/    admin-member-list, admin-member-form
            community/ admin-community-post-list/form/detail,
                       admin-community-comment-list, admin-community-report-list
            qna/       admin-inquiry-list/detail, admin-contact-list/detail
            fragments/ admin-sidebar
fragments/  head, header, footer, community-widgets, app-install-banner,
            confirm-dialog, popular-search-dialog, section-nav
```

---

## 데이터 로딩 방식

> ⚠️ **시드 데이터는 자동으로 로딩되지 않습니다.**

`ddl-auto` 가 모든 프로필에서 `none` 이라 애플리케이션은 스키마를 만들지 않고, `spring.sql.init` 은 꺼져 있으며
`defer-datasource-initialization` 도 주석 처리돼 있습니다. `db/seed` 의 SQL 파일들은
**초기 데이터 투입용 참고 자료**로만 남아 있으며, 필요할 때 직접 실행합니다.

* `bible_translation.sql` — 번역본 정의
* `bible_book_description_ko.sql`, `bible_book_description_en.sql` — 책 소개 (한/영)
* `krv/bible_krv_book.sql`, `krv/bible_krv_01_genesis.sql` ~ `krv/bible_krv_66_revelation.sql` — KRV 66권 전체 본문
* `nkrv/bible_nkrv_book.sql` + 창세기·출애굽기 — NKRV 책 목록 및 일부 본문
* `kjv/bible_kjv_book.sql` — KJV 책 목록 (본문 미포함)
* `bible_quiz.sql` — 성경 퀴즈 데이터
* `quiz_ox_quiz.sql` — OX 퀴즈 데이터
* `word_puzzle_step1.sql`, `word_puzzle_step2.sql` — 단어 퍼즐 데이터
* `dictionary.sql` — 성경 사전 데이터
* `db_backup_Cloud_SQL_Export.sql` — 백업 덤프

테스트 프로파일만 예외로 `ddl-auto: update` 를 써서 Testcontainers 컨테이너 DB에 스키마를 만듭니다(시드 데이터 없음).

---

## 배포

Cloud Build → Cloud Run 파이프라인(`cloudbuild.yaml`)으로 배포합니다. 운영 환경변수는 Cloud Run 서비스에
한 번 설정해두면 배포마다 유지됩니다(`--update-env-vars` 는 지정한 키만 덮어씀). 비밀값은 Secret Manager
연결(`--set-secrets`)을 권장합니다. 자세한 내용은 [tech-stack.md](.claude/rules/tech-stack.md) 참고.
