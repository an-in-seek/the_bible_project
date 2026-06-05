# 소셜 로그인 / 연동 API 계약

안드로이드 네이티브 앱과 서버 간 소셜 로그인·연동 계약 문서입니다.

## 배경

앱은 모든 소셜 동작(로그인/연동)을 단일 `POST /api/v1/auth/social-login`(`{provider, token}`)으로 전송하여,
"로그인"과 "연동" 의도를 구분할 수단이 없었습니다. 그 결과 *이미 다른 계정에 연동된 소셜 ID*로 들어와도
충돌 없이 그대로 로그인되는 문제가 있었습니다.

해결: 요청에 **`intent`** 를 추가하고, 연동(link) 의도일 때 서버가 **현재 사용자(Authorization)** 를 식별하여
타 회원 소유 소셜 계정이면 **409 + 에러코드**로 차단합니다.

> 웹 브라우저는 별도의 OAuth2 redirect 플로우(`CustomOAuth2UserService`)를 타며 이미 충돌 가드가 동작합니다.
> 본 계약은 앱이 사용하는 REST 경로(`/api/v1/auth/social-login`)를 웹과 동일한 규칙으로 맞추는 것입니다.

---

## 1. `POST /api/v1/auth/social-login`

소셜 SDK 토큰으로 로그인하거나, 현재 로그인한 계정에 소셜 계정을 연동합니다.

### Request

```jsonc
POST /api/v1/auth/social-login
Content-Type: application/json
Authorization: Bearer <기존 accessToken>      // intent="link" 일 때만 필수

{
  "provider": "google" | "kakao" | "naver",
  "token": "<SDK 토큰>",                       // google=idToken, kakao/naver=accessToken
  "intent": "login" | "link"                  // 생략 시 "login"
}
```

### Response — intent 별로 바디가 다릅니다 (앱 파서 분기 필요)

| intent | 성공 | HTTP | 바디 |
|---|---|---|---|
| `login` (또는 생략) | 로그인 | `200` | `{ "consentRequired", "accessToken", "refreshToken" }` (현행 그대로) |
| `link` | 연동 | `200` | `AuthMeResponse` — **토큰 없음** |

`intent=link` 성공 응답(`AuthMeResponse`) 예시 — `/api/v1/auth/me` 와 동일한 평면 DTO:

```jsonc
{
  "memberUid": "....",
  "email": "user@example.com",
  "role": "USER",
  "nickname": "홍길동",
  "profileImageUrl": null,
  "provider": "naver",          // 대표(첫) 연동 provider
  "status": "ACTIVE",
  "createdAt": "2026-06-05T12:00:00Z"
}
```

> 연동 성공 시 사용자는 그대로 본인(A)이므로 **새 토큰을 발급하지 않습니다.** 앱은 토큰을 변경하지 말고
> 연동 상태 UI / WebView 만 갱신하세요.

### 실패 응답

| 상황 | HTTP | code |
|---|---|---|
| 이미 다른 계정에 연동된 소셜 계정 | **409** | **`OAUTH_ACCOUNT_ALREADY_LINKED`** |
| `intent=link` 인데 Authorization 누락/만료 | **401** | `AUTHENTICATION_REQUIRED` |
| 이메일 미인증 소셜로 기존 이메일 계정 자동병합 시도 | **409** | `SOCIAL_LOGIN_EMAIL_NOT_VERIFIED` |
| 소셜 토큰 검증 실패 | 401 | `SOCIAL_LOGIN_INVALID_TOKEN` |

---

## 2. 에러 응답 포맷 — `code` 필드

모든 에러 응답은 다음 형태입니다. **한글 `message` 파싱 대신 `code` 로 분기하세요.**

```jsonc
{
  "status": 409,
  "code": "OAUTH_ACCOUNT_ALREADY_LINKED",
  "message": "해당 소셜 계정은 이미 다른 사용자에 연결되어 있습니다."
}
```

`message` 는 사용자에게 그대로 노출해도 무방하지만, 분기/처리는 반드시 `code` 기준으로 합니다.

---

## 3. `POST /api/v1/auth/reissue` — 토큰 재발급 (바디 기반)

네이티브 앱용 바디 기반 재발급 엔드포인트입니다.
(기존 `/api/v1/auth/refresh` 는 쿠키 기반(Set-Cookie/204)이라 웹 SSR 전용 — 앱에서는 사용하지 마세요.)

```jsonc
POST /api/v1/auth/reissue
Content-Type: application/json

{ "refreshToken": "<저장된 refreshToken>" }

// 200 OK
{ "accessToken": "<신규>", "refreshToken": "<신규 또는 동일>" }

// refreshToken 만료/무효 → 401 (code 포함) → 재로그인 유도
```

---

## 4. 연동 진입 신호 (웹과 동일)

WebView 인터셉트에서 **query 의 `link=true` 유무**로 intent 를 결정합니다.

| 진입점 | URL | intent |
|---|---|---|
| 마이페이지 **연동** 버튼 | `/oauth2/authorization/{provider}?...&link=true` | `link` |
| 로그인 화면 **로그인** 버튼 | `/oauth2/authorization/{provider}` (link 없음) | `login` |

인터셉트가 path 만 읽고 있다면 query string 도 읽어 `link=true` 를 REST 호출까지 전파해야 합니다.

---

## 5. 앱 구현 체크리스트

- [ ] 인터셉트가 `link=true` query 를 읽어 `intent` 전파
- [ ] `social-login` 요청에 `intent` 추가, `intent=link` 면 `Authorization: Bearer <accessToken>` 부착
- [ ] 응답 파서 intent 분기: `login`=토큰 저장 / `link`=`AuthMeResponse` 로 연동 UI 갱신(토큰 미변경)
- [ ] **409 `OAUTH_ACCOUNT_ALREADY_LINKED`** → 충돌 안내
- [ ] **401(연동 중)** → `POST /auth/reissue` 재발급 후 연동 1회 자동 재시도, 그래도 401 이면 재로그인 유도

---

## 6. 핵심 시나리오

```
[로그인]      social-login {intent:"login"}                 → 200 {accessToken, refreshToken}
[연동 성공]   social-login {intent:"link"} + Bearer A토큰   → 200 AuthMeResponse (토큰 없음)
[연동 충돌]   social-login {intent:"link"} + Bearer A토큰   → 409 OAUTH_ACCOUNT_ALREADY_LINKED
[토큰 만료]   social-login {intent:"link"} + 만료 A토큰     → 401 AUTHENTICATION_REQUIRED
              → reissue {refreshToken} → 200 {신규 토큰}
              → social-login {intent:"link"} 재시도         → 200 / 409
```

> 서버는 본 계약을 **하위호환**으로 배포합니다. 앱이 `intent` 를 보내지 않는 동안에는 기존 로그인 동작과 동일하며,
> 앱이 `intent` 를 반영하는 시점부터 연동 충돌이 정상 차단됩니다.
