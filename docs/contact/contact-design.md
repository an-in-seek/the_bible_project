# 공개 문의하기(Contact) — 비로그인 사용자 문의 채널

> 회원 1:1 문의(`docs/qna/qna-design.md`)와 **분리된** 공개 채널. 로그인 없이 문의를 남기고, 답변은 이메일로 회신받는다.

## 1. 기능 목적

기존 "내 문의"(`/web/member/my-inquiries`)는 **로그인 전용 개인 계정 기능**이다(`Inquiry` 엔티티가 `author` 회원 FK를 non-nullable로 강제). 그러나:

- **로그인 자체가 막힌 사용자**(OAuth 오류, 계정 문제)가 지원을 요청할 채널이 없는 catch-22 가 발생한다.
- 가입 전 잠재 사용자의 사전 문의를 받을 수 없다.

→ 모범사례는 "내 문의" 메뉴를 비로그인에 노출하는 것이 아니라(보여줄 "내" 데이터가 없음), **별도의 공개 "문의하기" 폼**을 두는 것이다. 본 기능이 그 채널이다.

### 범위 (MVP)
- 비로그인 누구나 문의 등록 가능. 회신용 이메일 수집.
- 답변 전달: **수동 회신** — 메일 발송 인프라(SMTP/JavaMailSender)가 없으므로, 관리자가 admin 콘솔에서 문의를 확인하고 `mailto:` 로 직접 회신한다. `reply_content` 는 회신 본문 **기록(보관)**용이며 자동 발송은 하지 않는다.
- 스팸 방어: 외부 의존성 없이 **허니팟 + 제출시간 트랩 + IP rate-limit**.

### 향후 승급 (범위 외)
- 자동 접수확인/답변 **이메일** → 전용 프로바이더(AWS SES / SendGrid / Postmark) + SPF/DKIM/DMARC. raw SMTP 금지.
- 스팸 증가 시 **Cloudflare Turnstile**(프라이버시 친화, reCAPTCHA보다 권장).

## 2. 사용자 흐름

```
[비로그인 사용자]
  footer "문의하기" / 로그인 화면 "로그인이 안 되시나요? 문의하기"
        └─> GET  /web/support/contact            (공개 폼)
              └─ 작성·제출 ─> POST /api/v1/qna/contacts  (permitAll, 201)
                    └─> GET /web/support/contact/complete (접수 완료)

[관리자]
  admin 사이드바 "문의하기 접수"
        └─> GET /web/admin/qna/contacts          (목록, ADMIN)
              └─> GET /web/admin/qna/contacts/{id} (상세)
                    ├─ "메일로 회신" (mailto:guest_email) ── 실제 발송(수동)
                    ├─ 회신 본문 기록 ─> POST .../reply  (status → REPLIED)
                    └─ 상태 토글     ─> PATCH .../status (REPLIED ↔ CLOSED)
```

## 3. 데이터 모델

### 3-1. 접근 방식
기존 `Inquiry` 와 **별도 엔티티**(`ContactMessage`)로 분리한다. 이유:
- `Inquiry.author` 는 회원 FK non-nullable — 게스트를 담을 수 없다. 엔티티를 nullable 로 바꾸면 기존 1:1 문의 도메인 규칙(소유 검증·답변 가시성)이 흔들린다.
- 게스트 문의는 "내 목록" 개념이 없고(계정 없음), 회신 경로(이메일)와 상태 모델이 다르다.

`InquiryCategory` enum 은 **재사용**한다.

### 3-2. 엔티티 (`qna/domain/model/ContactMessage.kt`)

| 필드 | 타입 | 비고 |
|---|---|---|
| `id` | Long | PK (IDENTITY) |
| `category` | `InquiryCategory` | 재사용 enum |
| `title` | String(200) | |
| `content` | String(TEXT) | |
| `guestName` | String(100)? | 선택 |
| `guestEmail` | String(255) | 회신용, 필수 |
| `status` | `ContactStatus` | RECEIVED/REPLIED/CLOSED |
| `replyContent` | String(TEXT)? | 회신 본문 기록(보관) |
| `repliedBy` | Member? (LAZY) | 회신 관리자, 탈퇴 시 NULL |
| `repliedAt` | Instant? | |
| `createdAt`/`updatedAt` | Instant | `BaseTimeEntity` |

도메인 메서드(관리자 전용, `ensureAdmin` 가드):
- `replyByAdmin(actor, content)` — 회신 본문 기록 + `status = REPLIED` (재호출 시 본문 갱신)
- `changeStatusByAdmin(actor, target)` — `REPLIED ↔ CLOSED` 만 허용

### 3-3. 상태 모델

```
RECEIVED ──replyByAdmin──> REPLIED ──changeStatus──> CLOSED
                              ^───────changeStatus──────┘
```
삭제(soft-delete) 개념은 두지 않는다 — 게스트 본인 수정/삭제 경로가 없고, 보존이 기본.

### 3-4. DDL
`db/schema/contact_message.sql` 참조. prod(`ddl-auto: none`)에 **수동 적용** 필요. 로컬/테스트(`ddl-auto: create/update`)는 자동 생성.

## 4. 리포지토리 (`qna/adapter/output/jpa/ContactMessageRepository.kt`)
- `findAdminPage(status, category, keyword, pageable)` — 최신순 + 동적 필터(키워드는 title/content/email LIKE), `repliedBy` fetch join, countQuery 분리.
- `findByIdWithReplier(id)` — 상세/변이 대상 로드.
- `clearReplier(memberId)` — 회신 관리자 탈퇴 시 `repliedBy` NULL 처리(회신 본문/시각 보존). `MemberService` 탈퇴 트랜잭션에서 호출.

## 5. 서비스

### 5-1. `ContactService` (공개 등록)
`createContact(req, clientIp)` — 스팸 방어 3단 후 저장:
1. **허니팟**: `website` 필드가 차 있으면 봇 → 정상 응답을 흉내내며 **조용히 폐기**(저장·rate-limit 호출 없음). 봇에게 단서를 주지 않기 위해 예외 대신 silent drop.
2. **제출시간 트랩**: `formRenderedAt`(폼 렌더 epoch ms) 기준 경과시간이 `MIN_FILL_MILLIS`(3초) 미만이면 봇 → 조용히 폐기.
3. **IP rate-limit**: `ContactRateLimiter.tryAcquire(ip)` 실패 시 `CONTACT_RATE_LIMITED`(429).

검증 통과분만 `ContactMessage.create(...)` 로 저장. 입력 형식 검증(@NotBlank/@Email/@Size)은 DTO Bean Validation 으로 선처리.

### 5-2. `ContactRateLimiter` (`qna/application/component`)
인메모리 고정 윈도우. `ConcurrentHashMap<ip, Window>`, **시간당 5건**. 외부 의존성 0. 단일 인스턴스 기준 스팸 억제용 — 다중 인스턴스/정밀 제한 필요 시 Redis/Bucket4j 로 승급. 맵 무한 증식은 `MAX_TRACKED_KEYS`(10만) 초과 시 **만료된 윈도우만 제거**한다(전체 clear 시 모든 IP 카운터가 동시에 0으로 리셋되어 우회에 악용될 수 있으므로 지양).

### 5-3. 스팸 방어의 한계 (의도된 트레이드오프 — 코드리뷰 반영)
"외부 의존성 0" MVP 제약상 아래 방어는 **best-effort**이며 견고한 보안 통제가 아니다. 스팸이 실제로 문제화되면 향후 승급 항목(Turnstile 등)으로 강화한다.

- **제출시간 트랩(`formRenderedAt`)은 클라이언트 제어값**이다. 봇이 과거 timestamp 를 보내거나 필드를 생략하면(현재 구현은 `null` 시 통과) 우회된다. 견고화하려면 서버가 렌더 시각을 HMAC 서명(키: `JWT_SECRET_BASE64`)해 발급·검증해야 한다.
- **IP rate-limit 은 `X-Forwarded-For` 스푸핑에 취약**하다. `ContactApi.clientIp()` 가 XFF 첫 토큰을 신뢰하므로, 신뢰된 리버스 프록시가 XFF 를 덮어쓰는(overwrite) 토폴로지에서만 안전하다. **배포 전제: prod ingress 가 XFF 를 덮어쓴다.** 앱이 직접 노출되면 헤더 회전으로 우회 가능 — 이 경우 `ForwardedHeaderFilter` + 신뢰 프록시 allowlist 또는 `remoteAddr` 폴백으로 보완해야 한다.
- **허니팟 silent-drop(201)**: 봇에게 탐지 단서를 주지 않기 위해 성공을 흉내낸다. 극히 드물게 자동완성이 허니팟을 채우거나 3초 미만 정상 제출 시 정상 문의가 조용히 폐기될 수 있다(IP 로깅으로 오탐 패턴 관측 가능).

### 5-3. `AdminContactService` (관리자)
`getAdminContacts` / `getAdminContactDetail` / `reply` / `changeStatus`. `Inquiry`/`AdminInquiryService` 패턴 미러링.

## 6. API

| Method | Path | 인증 | 설명 |
|---|---|---|---|
| POST | `/api/v1/qna/contacts` | **permitAll** | 공개 문의 등록 (201) |
| GET | `/api/v1/admin/qna/contacts` | ADMIN | 목록(상태/카테고리/키워드 필터) |
| GET | `/api/v1/admin/qna/contacts/{id}` | ADMIN | 상세 |
| POST | `/api/v1/admin/qna/contacts/{id}/reply` | ADMIN | 회신 본문 기록 → REPLIED |
| PATCH | `/api/v1/admin/qna/contacts/{id}/status` | ADMIN | 상태 토글(REPLIED/CLOSED) |

요청 DTO `CreateContactRequest`: `category`, `title`, `content`, `guestEmail`(@Email), `guestName`(선택), `website`(허니팟, hidden), `formRenderedAt`(hidden).

## 7. 화면

| 경로 | 템플릿 | 비고 |
|---|---|---|
| `/web/support/contact` | `support/contact.html` (+ `js/support/contact.js`, `css/support/contact.css`) | 공개 폼. 일반 `fetch`(인증 불필요). 허니팟 화면밖 처리, `robotsContent=noindex` |
| `/web/support/contact/complete` | `support/contact-complete.html` | 접수 완료 |
| `/web/admin/qna/contacts` | `admin/qna/admin-contact-list.html` | 목록(데스크톱 테이블 + 모바일 카드) |
| `/web/admin/qna/contacts/{id}` | `admin/qna/admin-contact-detail.html` | 상세 + `mailto:` 회신 + 본문 기록 + 상태 토글 |

진입점: `fragments/footer.html`("문의하기"), `login/login.html`("로그인이 안 되시나요? 문의하기" — catch-22 해소), `admin/fragments/admin-sidebar.html` Q&A 그룹("문의하기 접수").

## 8. 보안 설정 변경 (`common/security/SecurityConfig.kt`)
```kotlin
// /api/v1/qna/** authenticated 규칙보다 "먼저" 와야 함 (Spring Security 는 첫 매칭 우선)
.requestMatchers(HttpMethod.POST, "/api/v1/qna/contacts").permitAll()
```
`/web/support/**` 는 기존 `/web/**` permitAll 로 커버. admin 경로는 기존 `/web/admin/**`·`/api/v1/admin/**` ADMIN 게이트로 커버. `ConsentGateFilter` 는 principal 이 있을 때만 동작하므로 익명 등록에 영향 없음.

## 9. 도메인 규칙 / 엣지 케이스
- 게스트 본인 수정/삭제 경로 없음(계정 없음). 작성 후 변이는 관리자만.
- 회신 관리자 탈퇴 → `repliedBy` NULL, 회신 본문/시각 보존(`clearReplier`).
- SIGNUP 스코프(가입 동의 대기) 사용자는 `ConsentGateFilter`에 의해 동의 페이지로 유도됨 — 비로그인 타깃과 무관한 드문 엣지.

## 10. 테스트
- `ContactServiceTest` (MockK 단위, Docker 불필요): 정상 저장 / 허니팟 폐기 / 제출시간 트랩 폐기 / rate-limit 429.
- (향후) 관리자 회신·상태 전이 통합테스트는 Testcontainers 환경에서.

## 부록. 결정 로그
- **별도 엔티티 vs Inquiry 확장**: 별도(`ContactMessage`) 선택 — 기존 1:1 문의 도메인 불변. 
- **자동 메일 vs 수동 회신**: 수동 MVP — 메일 인프라 부재 상태에서 raw SMTP 신설은 안티패턴(딜리버러빌리티/스팸함). 프로바이더 도입 시 자동화로 승급.
- **허니팟 처리**: 400 거부 대신 silent drop(201) — 봇에게 탐지 단서를 주지 않음.
- **rate-limit 인메모리**: 외부 의존성 0 우선. 다중 인스턴스 확장 시 Redis 로 승급.
