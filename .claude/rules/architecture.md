# Architecture

헥사고날(포트 & 어댑터)을 도메인 모듈 단위로 적용한다. 모든 코드는
`src/main/kotlin/com/elseeker/{module}/` 아래에 모듈별로 먼저 나뉘고, 그 안에서 레이어로 나뉜다.

## 모듈

| 모듈 | 책임 |
|---|---|
| `bible` | 성경 본문·장절, 번역본, 읽기 진도, 메모/하이라이트, 타이핑 세션, 검색 |
| `study` | 사전(dictionary), 사전 검색, 학습 진도 |
| `game` | 퀴즈(객관식/OX), 낱말 퍼즐, 랭킹 |
| `community` | 게시글, 댓글, 반응, 신고 |
| `member` | 회원, OAuth 계정 연결, 동의 이력, 탈퇴 이력 |
| `auth` | 로그인·토큰 발급 흐름 |
| `qna` | 문의(inquiry), 비회원 문의(contact message) |
| `analytics` | 사이트 방문·앱 설치 배너 이벤트 수집 |
| `common` | 공통 설정, 보안, 예외, 정책, 전역 컴포넌트 |

새 도메인이 생기면 기존 모듈에 끼워 넣지 말고 모듈을 하나 만든다.

## 레이어

```
{module}/
  adapter/input/api/      — REST 컨트롤러 (@RestController)
  adapter/input/api/client|admin/   — 클라이언트용/관리자용 API 분리
                          request/, response/, mapper/ 를 그 아래 둔다
  adapter/input/web/      — Thymeleaf 뷰 컨트롤러 (@Controller)
  adapter/output/jpa/     — Spring Data JPA 리포지토리, 커스텀 JPQL, 컨버터
  application/service/    — 얇은 서비스 파사드
  application/component/  — 실제 도메인 로직 헬퍼 (예: BibleReader)
  application/mapper/     — 엔티티 ↔ DTO 변환
  application/listener/   — 도메인 이벤트 리스너
  domain/model/           — JPA @Entity
  domain/vo/              — enum, 값 객체
  domain/result/          — 서비스 반환 DTO
  domain/event/           — 도메인 이벤트
  domain/policy/          — 도메인 정책
```

의존 방향은 `adapter → application → domain` 한 방향이다. `domain` 은 위쪽 레이어를 모른다.

## 핵심 패턴

**서비스는 얇게, 로직은 컴포넌트로.** `application/service` 의 서비스는 트랜잭션 경계와 흐름 제어만
맡고 실제 계산·조회 로직은 `application/component` 의 `@Component` 에 위임한다.
예: `BibleService` → `BibleReader`.

**N+1 방지는 JPQL 에서.** 엔티티 연관은 전부 `LAZY` 가 기본이다. 목록 조회 리포지토리 메서드는
JPQL 에 `JOIN FETCH` 를 명시한다. 지연 로딩에 기대어 루프에서 접근하지 않는다.

**엔티티 상속.** 모든 엔티티는 `BaseEntity`(`@MappedSuperclass`, `@Id` `IDENTITY`)를 상속한다.
생성/수정 시각이 필요하면 `BaseTimeEntity`(`@CreatedDate`/`@LastModifiedDate`)를 상속한다.

**Swagger 문서는 인터페이스로 분리.** `@Operation`/`@Schema` 같은 springdoc 애노테이션은
`*ApiDocument` 인터페이스에 두고 컨트롤러가 이를 구현한다. 컨트롤러 본문에 문서 애노테이션을
섞지 않는다 (현재 24개 인터페이스가 이 방식).

**타입 안전 쿼리는 Kotlin JDSL.** 동적 조건이 많은 조회는 Kotlin JDSL(`jpql { }`)로 쓴다.
의존성 주의사항은 [tech-stack.md](tech-stack.md) 참고.

## 인증 · 보안

- JWT(JJWT) + OAuth2 소셜 로그인(Google, Naver, Kakao)
- 세션은 stateless. Access/Refresh 토큰은 **HttpOnly 쿠키**로 주고받는다.
- 필터 순서: `JwtRefreshFilter` → `JwtAuthenticationFilter` → `ConsentGateFilter` → Spring Security
- 인증 실패 처리 경로가 갈린다:
  - **API** → 401 JSON 응답
  - **웹 화면** → `/web/auth/login?returnUrl=...` 로 리다이렉트
- 클라이언트에서는 `common-util.js` 의 `fetchWithAuthRetry()` 가 토큰 갱신을 처리한다.

관련 코드는 `common/security/` 아래에 있다 (`SecurityConfig.kt`, `jwt/`, `oauth/`).
