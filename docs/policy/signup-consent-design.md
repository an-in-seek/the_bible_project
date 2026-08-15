# 회원가입 동의 프로세스 개편 설계서

> 관련 정책 근거: [`service-policy.md`](./service-policy.md)
> 대상: OAuth2(Google · Naver · Kakao) 소셜 로그인 기반 ElSeeker 웹 서비스

## 1. 배경 (Context)

`service-policy.md`는 소셜 로그인이라도 **우리 서비스 기준의 이용약관·개인정보처리방침 고지/동의 절차**가 필요하며, ElSeeker는 현재 "간편 고지형(방식 B)"으로 최소 의무만 충족 중임을 정리했다. 보완점으로 ① 명시적 동의 강화 ② 만 14세 확인 ③ 동의 이력 보관이 도출되었다.

본 설계서는 위 보완점을 반영해 **신규 가입자에 한해 OAuth 인증 직후 동의 인터스티셜 페이지**를 거치도록 가입 프로세스를 개편하는 작업의 설계를 정의한다.

### 확정된 정책 결정
| 항목 | 결정 |
| --- | --- |
| 가입 흐름 | **신규 가입자 동의 페이지**(OAuth 인증 후 최초 사용자만 인터스티셜) |
| 연령 확인 | **"만 14세 이상" 확인 체크박스**(생년월일 미수집) |
| 동의 이력 | **DB 저장(감사 추적)** — `member_consent_audit` 신설 |
| 마케팅 동의 | 현재 마케팅 발송 기능 없음 → **이번 범위 제외**(미래 확장 슬롯만 확보) |

---

## 2. 현행 흐름 (AS-IS)

```
login.html
  → /oauth2/authorization/{provider}
  → (provider 인증)
  → CustomOAuth2UserService.loadUser()         # upsert, 즉시 ACTIVE 회원 생성
  → OAuth2LoginSuccessHandler                   # Access+Refresh JWT 쿠키 발급
  → redirect(returnUrl | "/")                   # 곧바로 서비스 이용
```

확인된 핵심 사실(코드 근거):
- **회원 생성 진입점은 2개**(둘 다 동의 흐름 적용 대상):
  - ① 웹 OAuth: `common/security/oauth/service/CustomOAuth2UserService.kt:105` `Member.create(...)`
  - ② 모바일/클라이언트 API: `auth/application/service/SocialLoginService.kt:99`(`auth/adapter/input/api/client/AuthApi.kt`가 호출) — 동일하게 `Member.create(nickname="")` 후 토큰 발급.
  - ⚠️ `Member.create` 시그니처 변경은 **두 경로 모두**에 영향. 모바일 경로를 빠뜨리면 클라이언트가 동의 게이트를 우회함.
- 회원 생성/조회: provider+providerUserId → email → 신규 생성 순의 upsert. **신규 여부 신호는 `nickname == ""` 뿐.**
- 토큰/리다이렉트: `common/security/oauth/handler/OAuth2LoginSuccessHandler.kt` — JWT 발급 후 `RETURN_URL` 쿠키(180초) 기반 리다이렉트.
- `Member`(`member/domain/model/Member.kt`): `uid, email, nickname, profileImageUrl, memberRole` — **status/동의/연령 필드 없음.**
- `MemberRole`(`member/domain/vo/`): USER, ADMIN — **계정 상태 enum 없음.**
- 동의 이력 persistence: **전무.** `login.html`의 "로그인 시 …동의하게 됩니다" 문구는 UI 텍스트일 뿐.
- 감사 테이블 선례: `member/domain/model/MemberWithdrawalAudit.kt`(BaseEntity + 불변 컬럼) — 동의 감사 테이블이 따를 패턴.

---

## 3. 목표 흐름 (TO-BE)

```
login.html
  → /oauth2/authorization/{provider}
  → (provider 인증)
  → CustomOAuth2UserService.loadUser()
        · 기존 회원(ACTIVE)  → 그대로
        · 신규 회원          → status = PENDING_CONSENT 로 생성(nickname 은 OAuth 값으로 초기화)
  → OAuth2LoginSuccessHandler
        · ACTIVE          → (현행) Access+Refresh 발급 → redirect(returnUrl | "/")
        · PENDING_CONSENT → 단기 Access 토큰만 발급(scope=SIGNUP) + returnUrl 보존
                            → redirect("/web/auth/consent")
  → [동의 페이지] /web/auth/consent
        · [필수] 만 14세 이상  [필수] 이용약관  [필수] 개인정보 수집·이용
        · "동의하고 시작하기"(모든 필수 체크 시 활성)  /  "취소"
  → POST /api/v1/auth/consent   (SIGNUP 토큰 인증)
        · 필수 동의 검증 → member_consent_audit 기록
        · Member.status PENDING_CONSENT → ACTIVE
        · 정식 Access+Refresh 발급(쿠키 교체)
        · 200 + redirectTo(returnUrl | "/")
  → 서비스 이용
```

미동의(PENDING_CONSENT) 상태에서는 **동의 관련 경로 외 서비스 접근을 차단**한다(§6).

### 3-1. 모바일/클라이언트 API 경로(`SocialLoginService` / `AuthApi`)

웹 OAuth 핸들러와 별개로, 모바일·클라이언트용 소셜 로그인 API(`POST` 계열, `AuthApi.kt` → `SocialLoginService.login()`)도 동일 정책을 따라야 한다.

- 신규 회원은 `status = PENDING_CONSENT`로 생성한다(웹과 동일).
- 응답으로 **정식 토큰을 즉시 발급하지 않고**, `consentRequired = true`(+ 동의용 단기 토큰)를 반환해 클라이언트가 동의 화면을 띄우도록 한다.
- 동의 제출은 동일한 `POST /api/v1/auth/consent`를 사용한다.
- `SocialLoginResponse`에 `consentRequired` 플래그(또는 status) 추가 필요.

> 이 경로를 누락하면 클라이언트가 동의 게이트를 우회하므로 **반드시 함께 변경**한다.

---

## 4. 데이터 모델 변경

### 4-1. `Member` — 계정 상태 필드 추가
`member/domain/model/Member.kt`
```kotlin
@Enumerated(EnumType.STRING)
@Column(nullable = false, length = 32)
var status: MemberStatus = MemberStatus.ACTIVE
```
- 신규 가입 시 `Member.create(...)`에서 `status = PENDING_CONSENT`로 생성하도록 변경.
- 기존 행은 마이그레이션에서 `ACTIVE`로 백필(§7).

### 4-2. `MemberStatus` (신규 enum)
`member/domain/vo/MemberStatus.kt`
```kotlin
enum class MemberStatus {
    PENDING_CONSENT,  // OAuth 인증 완료, 약관 동의 대기
    ACTIVE            // 동의 완료, 정상 이용
    // (확장) SUSPENDED 등
}
```

### 4-3. `MemberConsentAudit` (신규 엔티티 — `MemberWithdrawalAudit` 패턴)
`member/domain/model/MemberConsentAudit.kt` / 테이블 `member_consent_audit`
| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | PK | BaseEntity |
| member_uid | UUID, not null | 동의 주체 |
| consent_type | varchar(32) | `TERMS` / `PRIVACY` / `AGE_OVER_14` (확장: `MARKETING`) |
| policy_version | varchar(32) | 동의 시점 약관/방침 버전(예: `2026-06-03`) |
| agreed | boolean | 필수 항목은 항상 true(선택 항목 대비 보관) |
| agreed_at | Instant, not null | 동의 시각(UTC) |
| ip_address | varchar(45), nullable | 동의 시점 접속 IP(분쟁 증빙, **저장 결정**). 개인정보처리방침에 '접속 IP' 수집이 이미 명시됨 |

- 가입 1회당 필수 항목 수만큼 행 생성(TERMS/PRIVACY/AGE_OVER_14 = 3행).
- `BaseEntity` 상속, **write-once**(updatedAt 불필요).
- `consent_type`는 enum `ConsentType`(`member/domain/vo/ConsentType.kt`)로 관리.
- `policy_version`은 **약관/방침 항목(TERMS·PRIVACY)에만 의미**가 있다. `AGE_OVER_14`는 버전이 무관하므로 고정 센티넬(예: `"N/A"`)을 저장한다.

### 4-4. 약관 버전 상수
`policy_version`은 약관/방침 화면의 **최종 개정일**(`2026-06-03`)을 기준값으로 사용한다. 상수 정의 위치 예: `common/policy/PolicyVersion.kt`
```kotlin
object PolicyVersion {
    const val TERMS = "2026-06-03"
    const val PRIVACY = "2026-06-03"
}
```
> 향후 약관 개정 시 이 값을 올리면, ACTIVE 회원에 대한 **재동의 유도**(버전 불일치 감지)로 확장 가능(이번 범위 외).

---

## 5. API / 화면 설계

### 5-1. 동의 페이지 (web)
- **라우트**: `GET /web/auth/consent` → 신규 web 컨트롤러(`auth/adapter/input/web/...` 또는 `common/.../web`).
- 접근 제어: PENDING_CONSENT 회원만. ACTIVE/비로그인 접근 시 홈/로그인으로 리다이렉트.
- **템플릿**: `templates/auth/consent.html` (신규)
  - PENDING 사용자 전용 화면이므로 `login.html`과 동일하게 **최소 셸**(전체 헤더 메뉴·네비 미노출)로 구성한다.
  - 브랜드 + "약관에 동의하고 시작하세요"
  - 체크박스(전체 동의 토글 + 개별):
    - `[필수]` 만 14세 이상입니다
    - `[필수]` 서비스 이용약관 동의 — `[보기]` → `/web/legal/terms`
    - `[필수]` 개인정보 수집 및 이용 동의 — `[보기]` → `/web/legal/privacy`
    - (마케팅 항목은 현재 미표시)
  - `[동의하고 시작하기]` 버튼: 모든 필수 체크 시 활성.
  - `[취소하고 돌아가기]`: 로그아웃 → 로그인 화면.
  - 다크모드 적응형 클래스(`bg-body-secondary`, `text-body-*` 등)만 사용, `?v=` 캐시 버스팅 준수.
  - JS: `common-util.js`의 `fetchWithAuthRetry()` 재사용해 동의 API 호출.

### 5-2. 동의 제출 (REST)
- **`POST /api/v1/auth/consent`** — SIGNUP 스코프 토큰으로 인증.
- 요청:
  ```json
  { "agreeTerms": true, "agreePrivacy": true, "ageOver14": true }
  ```
- 처리:
  1. 필수 3개 모두 true 검증(아니면 `400 ServiceError`).
  2. `MemberConsentAudit` 3행 저장(각 `policy_version`, `agreed_at`, `ip_address`).
  3. `Member.status` → `ACTIVE`.
  4. 정식 Access+Refresh 발급(응답에서 쿠키 교체) — `JwtProvider`/`CookieUtils` 재사용.
  5. `200 { "redirectTo": "<returnUrl|/>" }`.
- 멱등성: 이미 ACTIVE면 `200`(동의 페이지 재요청 방어).

### 5-3. 취소
- `[취소]`는 기존 로그아웃 흐름 사용 + 미완 PENDING 회원 정리(§8).

### 5-4. 응답 DTO 영향
- `AuthMeResponse`(`auth/adapter/input/api/client/response/AuthMeResponse.kt`)에 `status` 필드 추가 고려(프론트가 PENDING 판단 가능하도록). 단, 라우팅 차단은 서버(게이트)가 담당하므로 필수는 아님.

---

## 6. 보안 / 인증 게이트

### 6-1. 토큰 스코프
- PENDING_CONSENT 회원에게는 **단기 Access 토큰만** 발급, **Refresh 미발급**. 토큰 클레임에 `scope = "SIGNUP"` 부여.
- 동의 완료 후 정식 토큰(스코프 없음/`SERVICE`)으로 교체.
- 구현: `JwtProvider`에 스코프 클레임 추가, `OAuth2LoginSuccessHandler` 분기에서 PENDING 시 SIGNUP 토큰 생성.
- ⚠️ **만료 처리**: Refresh를 발급하지 않으므로 SIGNUP 토큰 TTL은 사용자가 약관을 정독할 시간을 감안해 넉넉히(예: **30분**) 둔다. 그래도 만료된 채 동의를 제출하면 `POST /api/v1/auth/consent`는 401 → 프론트는 "다시 로그인" 안내로 처리(재로그인 시 동일 PENDING 회원으로 동의 페이지 재진입).

### 6-2. ConsentGateFilter (신규)
- 위치: `JwtAuthenticationFilter` 직후 필터 체인.
- 규칙: 인증 주체의 토큰 `scope == SIGNUP`(=미동의)일 때, **허용 목록 외 요청 차단.**
  - 허용: `/web/auth/consent`, `POST /api/v1/auth/consent`, `/web/legal/**`, `/logout`, `GET /api/v1/auth/me`, 정적 리소스.
  - 웹 요청 → `302 /web/auth/consent` 리다이렉트, API 요청 → `403 { code: CONSENT_REQUIRED }`.
- 클레임 기반 판정으로 **DB 조회 없이** 동작.

> 이로써 "동의 전 회원이 서비스 데이터를 생성/이용"하는 상태를 원천 차단한다.

### 6-3. returnUrl 보존
- 현행 `RETURN_URL` 쿠키 TTL 180초는 동의 단계에 부족. PENDING 리다이렉트 시 **`SIGNUP_RETURN_URL` 쿠키(예: 30분, HttpOnly)** 로 재저장하고, 동의 API 성공 시 읽어 최종 리다이렉트에 사용 후 제거.

---

## 7. 마이그레이션 (prod 스키마)

> 로컬/테스트는 `ddl-auto: create/update`로 자동 반영. **prod는 `ddl-auto: none`이며 별도 마이그레이션 도구(Flyway 등) 미사용** → 배포 전 수동 DDL 적용.
>
> **방식(결정): 수동 SQL 스크립트 + 문서화.** 스크립트를 [`db/`](../../db/README.md) 에 보관하고 배포 직전 1회 수동 실행한다.

📄 **마이그레이션 스크립트**: [`db/migration/member_consent_migration.sql`](../../db/migration/member_consent_migration.sql)

적용 순서(스크립트 내용 요약):
1. `member.status` 컬럼 추가(`DEFAULT 'ACTIVE'`로 **기존 행 백필**) — 기존 회원은 ACTIVE 그랜드패더링.
2. `member_consent_audit` 테이블 생성(컬럼은 §4-3, `ip_address` 포함).
3. (선택) 백필 검증 후 `DEFAULT 'ACTIVE'` 제거 → 신규 행은 애플리케이션이 `PENDING_CONSENT`로 명시 설정.

> **소급 재동의 없음(결정)**: 기존 회원은 ACTIVE로 그랜드패더링(과거 간편 고지형에 따라 가입). 소급 동의 이력 생성·재동의 유도는 이번 범위 외이며, 향후 약관 개정 시 `policy_version` 비교로 확장한다.

---

## 8. 엣지 케이스

| 상황 | 처리 |
| --- | --- |
| 동의 중도 이탈(브라우저 종료) | PENDING 회원 잔존 → 재로그인 시 동일 OAuth 매칭으로 **동의 페이지 재진입**. 24h 초과 PENDING은 정리 배치로 삭제. |
| 미완 PENDING 회원 재로그인 | status 여전히 PENDING → 게이트가 동의 페이지로 유도. |
| 기존 이메일에 새 provider 연결 | 신규 회원 아님 → ACTIVE 유지, 동의 페이지 미노출. |
| 동의 취소 | **로그아웃 + 해당 PENDING 회원·OAuth 링크 즉시 삭제**(결정). 재시도 시 동일 소셜로 신규 생성. |
| 기존(마이그레이션 이전) 회원 | ACTIVE 백필 → 동의 페이지 미노출. |
| 만 14세 미체크 | 버튼 비활성 → 제출 불가(서버도 400 검증). |

### 정리 배치
- PENDING_CONSENT + `createdAt`이 24시간 초과한 회원을 주기 삭제(스케줄러). `MemberService`의 탈퇴 삭제 로직 일부 재사용 가능(`MemberService.kt`).

---

## 9. 영향받는 파일 (요약)

**신규**
- `member/domain/vo/MemberStatus.kt`, `ConsentType.kt`
- `member/domain/model/MemberConsentAudit.kt`
- `member/adapter/output/jpa/MemberConsentAuditRepository.kt`
- `common/policy/PolicyVersion.kt`
- `common/security/filter/ConsentGateFilter.kt`
- `auth/adapter/input/api/.../ConsentApi.kt`(+ ApiDocument), 요청/응답 DTO
- `auth/adapter/input/web/...ConsentWebController.kt`
- `templates/auth/consent.html`, `static/css/auth/consent.css`, `static/js/auth/consent.js`

**수정**
- `member/domain/model/Member.kt`(status 필드, create 시그니처 — 두 진입점 공통)
- `common/security/oauth/service/CustomOAuth2UserService.kt`(웹: 신규=PENDING 생성)
- `auth/application/service/SocialLoginService.kt` + `auth/adapter/input/api/client/AuthApi.kt`(모바일: 신규=PENDING 생성, `consentRequired` 응답)
- `auth/.../SocialLoginResponse.kt`(`consentRequired` 플래그)
- `common/security/oauth/handler/OAuth2LoginSuccessHandler.kt`(PENDING 분기·SIGNUP 토큰·SIGNUP_RETURN_URL)
- `common/security/jwt/JwtProvider.kt`(scope 클레임)
- Security 설정(필터 체인에 ConsentGateFilter 등록)
- `templates/login/login.html`(고지 문구 소폭 조정, 선택)
- `auth/.../AuthMeResponse.kt`(status 노출, 선택)
- prod 스키마 DDL

---

## 10. 단계별 작업 (Phasing)

1. **데이터 모델**: MemberStatus / ConsentType / MemberConsentAudit / Member.status / PolicyVersion + 로컬 스키마 확인.
2. **백엔드 흐름**: CustomOAuth2UserService + SocialLoginService(두 진입점 PENDING 생성) → SuccessHandler 분기 / AuthApi `consentRequired` 응답 → JwtProvider scope → ConsentGateFilter → Consent REST API → returnUrl 보존.
3. **프론트**: consent.html/css/js, login.html 문구, 다크모드·캐시버스팅 점검.
4. **운영**: PENDING 정리 배치, prod DDL, 테스트, 회귀 점검.

---

## 11. 검증 (Verification)

- **통합 테스트**(`IntegrationTest` 기반):
  - 신규 가입 → 보호 엔드포인트 접근 시 `CONSENT_REQUIRED`/리다이렉트 확인.
  - 동의 제출 → `member_consent_audit` 3행 생성 + status ACTIVE + 정식 토큰 발급 확인.
  - 필수 누락 제출 → 400.
  - 기존 회원 로그인 → 동의 페이지 건너뜀.
  - PENDING 재로그인 → 동의 페이지 재진입.
- **수동 검증**: `./gradlew bootRun`(local)에서 3개 provider 각각 신규 가입 → 동의 → 재방문(동의 미노출) 흐름, 다크/라이트 + 모바일 폭에서 `consent.html` 렌더 확인.
- Kotlin 변경 포함이므로 `./gradlew build`(테스트 포함) 수행.

---

## 12. 결정 사항 (Resolved)

| 항목 | 결정 | 반영 |
| --- | --- | --- |
| 동의 취소 시 처리 | **즉시 삭제** — 취소 시 PENDING 회원·OAuth 링크를 바로 삭제(잔여 데이터 없음). 24h 방치 정리 배치는 보조로 병행. | §8 |
| 동의 이력 IP 저장 | **저장함** — `member_consent_audit.ip_address`에 동의 시점 IP 기록(분쟁 증빙). 개인정보처리방침에 '접속 IP' 수집이 이미 명시되어 추가 부담 없음. | §4-3, DDL |
| 기존 회원 소급 재동의 | **소급 안 함** — 마이그레이션 이전 회원은 ACTIVE 그랜드패더링(과거 간편 고지로 동의 간주). 향후 약관 개정 시 `policy_version` 비교로 재동의 유도는 별도 과제. | §7 |
| prod 마이그레이션 | **수동 SQL 스크립트 + 문서화** — 마이그레이션 도구 미도입. DDL 스크립트를 리포에 두고 배포 직전 1회 수동 적용. 스크립트: [`db/migration/member_consent_migration.sql`](../../db/migration/member_consent_migration.sql) | §7 |
