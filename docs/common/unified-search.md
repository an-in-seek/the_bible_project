# 통합 검색 (Unified Search) — 기획 및 설계 문서

> 작성일: 2026-05-25
> 담당 도메인: common (홈 화면 노출 + 전용 결과 페이지)
> 상태: 설계 완료 (구현 전)

---

## 1. 개요 (Overview)

### 1-1. 목적

홈 화면(`/`)에 **서비스 내 모든 콘텐츠를 한 번에 탐색할 수 있는 통합 검색바**를 노출한다.
사용자는 카테고리·메뉴 위치를 모르더라도 "원하는 단어 하나"만 입력하면 다음을 즉시 발견할 수 있다.

- 성경 본문 구절 (KRV 기준)
- 성경 책·장 (예: "창세기", "요한복음 3")
- 성경 사전 표제어
- 학습/게임/커뮤니티의 모든 메뉴 (예: "족보", "퀴즈", "주석")

### 1-2. 비목적 (Non-goals)

- 게시글 본문 전문 검색 (커뮤니티는 메뉴 진입까지만 안내)
- 사용자별 마이페이지 콘텐츠 검색 (메모, 즐겨찾기)
- 다국어 검색 (KRV 한국어 본문만 대상)
- 음성/이미지 검색

### 1-3. URL 및 라우팅

| 항목 | 값 |
|---|---|
| 검색바 노출 위치 | `templates/index.html` 의 hero 배너 아래 / 메뉴 카드 위 |
| 전용 결과 페이지 URL | `/web/search?q={keyword}` |
| Thymeleaf 템플릿 (신규) | `templates/search.html` |
| 컨트롤러 (신규) | `RootWebController.kt` 에 `@GetMapping("/web/search")` 추가 |
| 인증 | 불필요 (공개 페이지) |

### 1-4. 대상 사용자

- 메뉴 트리 위치를 모르는 신규 방문자
- 특정 구절(예: "양과 같이")이나 단어를 곧장 찾고 싶은 정독자
- 외부 검색엔진을 거치지 않고 ElSeeker 내부에서 학습 도구를 빠르게 찾고 싶은 학습자

---

## 2. 요구사항 해석

| # | 요구사항 | 해석 |
|---|---|---|
| R1 | 서비스 내 **모든** 콘텐츠 검색 | 4개 카테고리로 정규화: ① 성경(책·장·구절) ② 성경 사전 ③ 학습/게임/커뮤니티 메뉴 ④ (확장) 게시글 — 본 단계에서 ①~③ 구현. |
| R2 | 한 번의 입력으로 통합 노출 | 단일 입력바 → 4개 카테고리 병렬 호출 → 카테고리 그룹화 드롭다운. |
| R3 | 입력 즉시 미리보기 | debounce 200ms 후 자동완성 드롭다운. 각 카테고리 상위 N건만 표시. |
| R4 | 전용 결과 페이지 진입 | Enter 또는 "더보기" 클릭 시 `/web/search?q=...` 로 이동. 카테고리 탭으로 분리 표시. |
| R5 | 부분 실패 허용 | 4개 데이터 소스 중 일부가 실패해도 나머지 결과는 정상 노출. 실패 카테고리는 해당 그룹만 숨김. |
| R6 | 백엔드 신규 API 최소화 | 신규 엔드포인트 0개. 기존 검색 API 재사용 + 정적 JS 인덱스 (메뉴/책 이름). 단, 기존 검색 API 에 `track: Boolean = true` 파라미터 1개를 추가하여 자동완성 호출이 인기검색어 랭킹을 오염시키지 않도록 한다 (§5-2). |
| R7 | 비로그인 포함 모든 사용자 노출 | **검색 데이터 API 호출**(구절·사전)은 SecurityConfig `permitAll` 대상이라 `fetchWithAuthRetry` 없이 일반 `fetch` 사용. **인증 상태 확인 호출**(`checkAuthStatus()` → `/api/v1/auth/me`)은 `authenticated()` 엔드포인트이므로 비로그인 시 401 응답을 정상 흐름으로 처리(기존 `auth-check.js:87` 의 `onUnauthenticated` 콜백 활용). 두 흐름을 혼동하지 말 것. |

### 비기능 요구사항

- **초기 렌더 지연 금지**: 입력 전에는 외부 호출 0건. 정적 인덱스도 lazy load (드롭다운 첫 열림 시).
- **모바일 우선**: iOS 키보드 확대 방지(`font-size: 16px`), 가상 키보드 가림 대응(스크롤 fix).
- **IME(한글 입력) 안전**: `compositionstart` ~ `compositionend` 사이에는 검색 트리거 금지.
- **접근성**: WAI-ARIA `combobox` + `listbox` 패턴 (Section 11 참조).
- **SEO**: 결과 페이지는 동적이지만 `<title>` 만 `q` 값으로 변경, `noindex` 메타로 검색 결과 페이지 인덱싱 차단.

---

## 3. 검색 대상 카테고리 (Search Scope)

### 3-1. 카테고리 매트릭스

| 카테고리 | 매칭 대상 필드 | 데이터 소스 | 결과 진입 URL 템플릿 |
|---|---|---|---|
| **성경 구절** | KRV 본문 텍스트 | `GET /api/v1/bibles/translations/{id}/search?keyword=` (기존) | `/web/bible/verse?translationId=...&bookOrder=...&chapterNumber=...&verseNumber={n}` |
| **성경 책** | 책 이름(`name`), 약어(`abbr`), 영문 풀네임(`nameEn`) | 정적 JS 인덱스 (66권, `bible-book-index.js`) | `/web/bible/chapter?translationId=1&bookOrder={n}` (책의 장 목록 페이지) |
| **성경 장** | "창세기 3", "요 3:16" 등 자유 입력 파싱 | 클라이언트 prefix-match + 잔여 정규식 (`bible-book-index.js` 기반) | `/web/bible/verse?translationId=1&bookOrder={n}&chapterNumber={c}` (절 지정 시 `&verseNumber={v}`) |
| **성경 사전** | 표제어(`term`) | `GET /api/v1/study/dictionaries?keyword=` (기존, `term ILIKE %kw%`) | `/web/study/dictionary/{id}` |
| **메뉴 (학습/게임/커뮤니티)** | 한국어 제목, 영문 제목, 키워드, URL slug | 정적 JS 인덱스 (`menu-index.js`) | 각 메뉴의 web URL |

### 3-2. 메뉴 정적 인덱스 항목 (32개)

`requiresAuth=Y` 항목은 비로그인 시 클릭하면 `/web/auth/login?returnUrl=...` 로 리다이렉트되므로, 드롭다운/결과 페이지에서 **"로그인 필요" 뱃지**를 표시한다 (Section 3-2-1 참조).

**인증 강제 출처는 두 곳**:
1. `SecurityConfig.kt:123-128` — `/web/game/**`, `/web/community/write` (단, `/web/game`, `/web/game/ranking` 만 permitAll 예외)
2. **컨트롤러 레벨 `redirectIfUnauthenticated`** — `MemberWebController.kt:21,37` 의 `/web/member/mypage`, `/web/member/my-memo`. SecurityConfig 의 `/web/**` permitAll 을 통과해도 컨트롤러가 강제 리다이렉트

| 카테고리 | 항목 | 키워드(매칭용) | URL | requiresAuth |
|---|---|---|---|---|
| 성경 | 성경 번역본 | bible, translation, krv, nkrv, kjv, 개역, 번역 | `/web/bible/translation` | N |
| 성경 | 성경 검색 | search, 구절, 본문 | `/web/bible/search` | N |
| 성경 | 성경책 목록 | book, 책 | `/web/bible/book` | N |
| 성경 | 책 개요 | book-description, 개요, 저자, 배경 | `/web/bible/book/description` | N |
| 학습 | 학습 홈 | study, 공부 | `/web/study` | N |
| 학습 | 성경 사전 | dictionary, 사전, 용어 | `/web/study/dictionary` | N |
| 학습 | 7일 창조 | creation, 창조, 7일 | `/web/study/creation` | N |
| 학습 | 성경 족보 | genealogy, 족보, 계보 | `/web/study/bible-genealogy` | N |
| 학습 | 성경 역사 | history, 역사, 연대 | `/web/study/history` | N |
| 학습 | 성경 개요 영상 | overview, 영상, 개요 | `/web/study/bible-overview-video` | N |
| 학습 | 십계명 | ten-commandments, 십계명, 모세 | `/web/study/ten-commandments` | N |
| 학습 | 12지파 | twelve-tribes, 12지파, 지파 | `/web/study/twelve-tribes` | N |
| 학습 | 12제자 | twelve-disciples, 12제자, 제자 | `/web/study/twelve-disciples` | N |
| 학습 | 주기도문 | lords-prayer, 주기도문, 기도 | `/web/study/lords-prayer` | N |
| 학습 | 사도신경 | apostles-creed, 사도신경, 신앙고백 | `/web/study/apostles-creed` | N |
| 학습 | 성주간 타임라인 | holy-week, 성주간, 고난주간, 부활 | `/web/study/holy-week` | N |
| 학습 | 공동체 성경읽기 | public-reading, 공동체, 통독 | `/web/study/public-reading-of-scripture` | N |
| 학습 | 성경 주석 | commentary, 주석, 해설 | `/web/study/bible-commentary` | N |
| 게임 | 게임 홈 | game, 게임 | `/web/game` | N |
| 게임 | 게임 랭킹 | ranking, 랭킹, 순위 | `/web/game/ranking` | N |
| 게임 | 성경 퀴즈 | quiz, 퀴즈 | `/web/game/bible-quiz` | **Y** |
| 게임 | 성경 퀴즈 맵 | quiz, map, 지도, 스테이지 | `/web/game/bible-quiz/map` | **Y** |
| 게임 | 성경 타이핑 | typing, 타이핑, 타자 | `/web/game/bible-typing` | **Y** |
| 게임 | OX 퀴즈 | ox-quiz, ox, 퀴즈 | `/web/game/bible-ox-quiz` | **Y** |
| 게임 | OX 퀴즈 맵 | ox-quiz, map, 지도 | `/web/game/bible-ox-quiz/map` | **Y** |
| 게임 | 제비뽑기 | casting-lots, 제비뽑기, 추첨 | `/web/game/bible-casting-lots` | **Y** |
| 게임 | 성경 단어 퍼즐 | word-puzzle, 퍼즐, 단어 | `/web/game/bible-word-puzzle` | **Y** |
| 커뮤니티 | 커뮤니티 홈 | community, 커뮤니티, 게시판, 나눔 | `/web/community` | N |
| 커뮤니티 | 글쓰기 | write, 글쓰기, 작성 | `/web/community/write` | **Y** |
| 마이 | 마이페이지 | mypage, 마이페이지, 내정보 | `/web/member/mypage` | **Y** |
| 마이 | 나의 성경 메모 | my-memo, 메모, 노트 | `/web/member/my-memo` | **Y** |
| 인증 | 로그인 | login, 로그인 | `/web/auth/login` | N |

> **운영 규칙**: 새 메뉴 추가 시 본 표와 `menu-index.js`를 동시 업데이트. 키워드는 사용자가 입력할 가능성이 높은 한·영 동의어 포함. **SecurityConfig 또는 컨트롤러 레벨 인증 정책(`redirectIfUnauthenticated`) 변경 시 `requiresAuth` 컬럼도 함께 갱신** — 두 출처 중 어느 쪽이 바뀌어도 검색 뱃지 표시 정확도가 깨질 수 있음.

> **누락 라우트(의도적 제외)**:
> - `/web/study/history/{era}`, `/web/study/history/event/{id}` — 동적 ID 라우트로 메뉴 인덱스에는 부적합. 사용자가 "에라" 또는 "이벤트 ID" 로 검색할 가능성 낮음. 향후 별도 인덱싱 전략 검토
> - `/web/auth/logout` — **상태 변경 액션** 이므로 콘텐츠 탐색 결과로 노출하면 우연 클릭으로 즉시 로그아웃되는 위험이 있음 (`AuthWebController.kt:28` 의 `@GetMapping` 이 클릭 한 번에 access/refresh 쿠키 삭제). 로그아웃은 top-nav 의 계정 메뉴에서 일관되게 접근 가능하므로 검색 인덱스에서 제외

### 3-2-1. requiresAuth 항목 UI 처리

```
드롭다운 항목:
  🎮 성경 퀴즈                              [로그인 필요]
  → 클릭 시: 비로그인이면 /web/auth/login?returnUrl=/web/game/bible-quiz
            로그인이면 바로 /web/game/bible-quiz
```

클라이언트는 `checkAuthStatus()` (기존 `auth/auth-check.js`) 결과를 캐시하여 매칭 시점에 뱃지 노출 여부 결정. 로그인 상태가 미확정이면 뱃지 표시(보수적 처리).

### 3-3. 자유 입력 파싱 (Bible Reference Parser)

다음 패턴을 클라이언트에서 **책 이름 prefix-match + 잔여 장·절 정규식** 의 2단계로 파싱하여 **즉시 책/장/절 결과**로 변환한다.

| 입력 예시 | 인식 결과 | 동작 |
|---|---|---|
| `창세기` | 책: 창세기 | "창세기 장 목록 보기" 항목 노출 (`/web/bible/chapter?...`) |
| `창` | 책 약어: 창세기 | 동일 |
| `창세기 3` | 책+장: 창세기 3장 | "창세기 3장 보기" |
| `창3` | 책+장 (공백 생략) | 동일 |
| `창 3:16` / `창3:16` / `창3장16절` | 책+장+절 | "창세기 3:16 절로 이동" |
| `요 3:16` | 책 약어+장+절 | "요한복음 3:16 절로 이동" |
| `genesis` | 영문 책 풀네임 | `bible-book-index.js` 의 `nameEn` 필드로 매칭 → 책 카드로 노출 |

**파싱 전략: 정규식이 아닌 "책 이름 prefix-match"**

정규식만으로는 공백·숫자 prefix 가 들어간 책 이름을 안정적으로 추출할 수 없다 (예: KRV "예레미야 애가", KJV "1 Samuel", "Song of Solomon"). 따라서 `bible-book-index.js` 의 모든 책 이름 표기(`name`/`abbr`/`nameEn`)를 **길이 내림차순** 으로 정렬한 lookup table 을 만들고 입력 문자열의 prefix 와 매칭한다.

**파싱 절차**:

1. **정규화**: 입력 트림 + 다중 공백을 단일 공백으로 축소 (NFC 정규화) + **소문자화**(영문 책 이름 매칭용). 정규화된 사본만 비교에 사용하고, 결과 라벨·URL 에는 원본 book 데이터의 표기(`name`/`abbr`/`nameEn`)를 사용
2. **책 prefix 매칭**: `BOOK_TOKENS` (모든 `name`/`abbr`/`nameEn` 을 길이 내림차순 정렬한 배열, 각 토큰의 **소문자 사본** `tokenLower` 도 함께 보관) 를 순회하며 정규화된 입력(`inputLower`)의 시작 부분이 `tokenLower` 와 일치하는지 검사. 가장 긴 매칭이 우선 (예: "예레미야 애가 3:1" 입력 시 "예레미야 애가" 먼저 매칭 → 잔여 " 3:1", "GENESIS 1:1" 입력 시 `nameEn="Genesis"` 매칭)
   - **이유**: "예레미야" 토큰이 "예레미야 애가" 토큰보다 먼저 시도되지 않도록 longest-first 필수. 한글은 대소문자 개념이 없으므로 소문자화가 무해, 영문은 `Genesis`/`genesis`/`GENESIS` 모두 동일하게 매칭
3. **잔여 토큰 파싱**: 책 매칭 후 남은 잔여 문자열에 대해 장·절 정규식 적용
   ```
   /^\s*(\d+)?\s*(?:[:장]\s*(\d+))?(?:절)?\s*$/
   ```
   - 그룹 1: 장 번호 (선택)
   - 그룹 2: 절 번호 (선택, `:` 또는 `장` 뒤)
4. **유효성 검사**:
   - **장 번호**: 매칭된 책의 `chapters` 필드와 비교하여 범위 확인 (예: 창세기는 50장까지). 범위 초과 시 본 파서 결과 0건 반환
   - **절 번호**: **best-effort 정책 채택**. 절별 개수(`verseCountByChapter`)는 정적 인덱스에 포함하지 않는다 (66권 × 평균 25장의 메타 데이터를 클라이언트 번들에 싣는 비용 대비 이득 낮음). 절 번호 sanity range 만 검사(1–200, 성경 최장 시편 119편 176절 기준). 초과 시 `verseNumber` 파라미터 제거하고 장 이동으로 처리
5. **결과 분기**:
   - **책만 매칭 → parser 는 결과를 만들지 않는다** (책 단독 진입은 `searchBibleBooks` 가 동일 라벨·URL 로 이미 제공하므로 중복 방지). "{책이름} 장 목록 보기" 항목은 책 카드 경로로만 노출
   - 책+장 → "{책이름} {장}장 보기" 항목 (`/web/bible/verse?translationId=1&bookOrder={n}&chapterNumber={c}`)
   - 책+장+절 (sanity 통과) → "{책이름} {장}:{절} 절로 이동" 항목 (`/web/bible/verse?translationId=1&bookOrder={n}&chapterNumber={c}&verseNumber={v}`). `verse-list.js:150,474` 가 `verseNumber` 쿼리 파라미터를 읽어 해당 절을 하이라이트 + 스크롤. **존재하지 않는 절 번호 전달 시** `verse-list.js:543` 의 `id="verse-text-{v}"` 요소를 찾지 못해 하이라이트만 실패하고 페이지는 장 상단에 머무름 (UX 허용 수준)
   - 책+장+절 (sanity 실패, 예: `창1:300`) → `verseNumber` 파라미터 제거하고 책+장 결과로 진입
   - 책 prefix 매칭 실패 또는 장 범위 초과 → 본 파서는 결과 0건 반환. "구절 검색" 카테고리는 별도로 원본 입력을 검색 API 로 전달

> **책임 분리**: parser 는 **장·절이 명시된 deep link** 만 책임지고, **책 단독 진입은 `searchBibleBooks`** 가 책임진다. 동일 입력에 대해 두 소스가 같은 항목을 만들지 않도록 분담했다 (예: "요한복음" 입력 시 parser 는 null 반환, `searchBibleBooks` 가 score 100 으로 "요한복음 장 목록 보기" 항목 1건만 노출).

> **deep link 메커니즘**: 기존 성경 검색(`search.js:480`)도 동일한 `verseNumber` 쿼리 파라미터 방식으로 절 이동을 처리. URL fragment(`#v{n}`)는 본 프로젝트에서 사용되지 않는다.

> **절 검증 정책 결정 근거**: 정확한 절 번호 한계를 클라이언트가 알려면 verse-count-by-chapter 메타데이터(~1.5KB 추가)가 필요. 잘못된 `verseNumber` 의 실제 피해는 "스크롤이 잘못된 위치로 가는" 것이 아니라 "하이라이트만 안 되는" 정도 — 페이지 자체는 정상 렌더링. 따라서 데이터 부담 없이 sanity range 만 적용.

**`BOOK_TOKENS` 구성 예**:
```javascript
// bible-book-index.js 에서 파생
export const BOOK_TOKENS = BIBLE_BOOKS.flatMap(b => [
  { token: b.name,   tokenLower: b.name.toLowerCase(),   book: b },
  { token: b.abbr,   tokenLower: b.abbr.toLowerCase(),   book: b },
  { token: b.nameEn, tokenLower: b.nameEn.toLowerCase(), book: b },
]).sort((a, b) => b.token.length - a.token.length);  // longest-first

// 매칭 시: inputLower.startsWith(t.tokenLower)
// 라벨·URL 에는 t.book.name / t.book.abbr / t.book.bookOrder 등 원본 사용
```

이 방식은 KRV의 "예레미야 애가", KJV의 "1 Samuel", "Song of Solomon" 같은 공백/숫자 prefix 책 이름을 정규식 변경 없이 자연스럽게 처리한다.

---

## 4. 화면 구성 (UI Design)

### 4-1. 홈(`index.html`) 검색바 배치

```
[home-hero (기존 그대로)]
[★ 통합 검색바 (신규) ★]    ← Section 4-2
[home-menu-grid (기존 4개 카드)]
[home-popular-search (기존 인기 검색어)]
[universe-section (기존)]
```

새 섹션 ID: `home-unified-search`. `home-hero` 와 `home-menu-grid` 사이에 삽입.

### 4-2. 검색바 마크업 (요약)

```html
<section class="home-unified-search" aria-label="통합 검색">
  <div class="us-search-wrap" role="combobox"
       aria-haspopup="listbox" aria-expanded="false"
       aria-owns="usDropdown">
    <span class="us-search-icon" aria-hidden="true">🔍</span>
    <input id="usInput" type="search"
           class="us-search-input"
           placeholder="성경 구절·책·사전·메뉴 한 번에 검색"
           autocomplete="off" inputmode="search"
           aria-label="통합 검색"
           aria-autocomplete="list"
           aria-controls="usDropdown">
    <button id="usClear" type="button" class="us-search-clear d-none"
            aria-label="검색어 지우기">×</button>
  </div>

  <div id="usDropdown" class="us-dropdown d-none"
       role="listbox" aria-label="검색 결과 미리보기">
    <!-- 카테고리 그룹 (4개) - JS 동적 렌더링 -->
  </div>
</section>
```

### 4-3. 드롭다운 (자동완성) 구조

```
┌────────────────────────────────────────────┐
│ 🔍 [입력어]                                  │
├────────────────────────────────────────────┤
│ 📖 성경 (구절·책·장)             전체 결과 ▸  │
│   • 창세기 1:1 — 태초에 하나님이…              │
│   • 창세기 3장 보기                          │
│   • 창세기 장 목록 보기                       │
├────────────────────────────────────────────┤
│ 📚 성경 사전                       전체 결과 ▸  │
│   • 창조                                    │
│   • 창세기 (Genesis)                         │
├────────────────────────────────────────────┤
│ 🧭 메뉴                                       │
│   • 7일 창조 체험                            │
│   • 성경 족보                                │
└────────────────────────────────────────────┘
```

- 각 카테고리 헤더 우측에 "전체 결과 ▸" 링크 → `/web/search?q=...&tab={category}`
- 카테고리당 최대 5건 (구절은 3건)
- 모든 결과 합계 0건이면 "검색 결과 없음 + 인기 검색어 보기" 안내
- ESC / 외부 클릭 / blur → 드롭다운 닫기

### 4-4. 전용 결과 페이지 (`/web/search?q=`)

```
[header — "통합 검색" 타이틀]
[검색 입력바 (sticky 상단)]
[탭: 전체 (N) | 성경 (M) | 사전 (L) | 메뉴 (K)]
[카테고리별 결과 리스트 (페이지네이션은 구절만 적용)]
[빈 상태 — 추천 검색어 + 인기 검색어 카드 재사용]
```

`tab` 파라미터로 직접 진입 가능: `/web/search?q=창조&tab=dictionary`

---

## 5. 데이터 소스 및 API

### 5-1. 기존 API 재사용 + `track` 파라미터 추가

#### 성경 구절 검색
```
GET /api/v1/bibles/translations/{translationId}/search?keyword={kw}&page=0&size=5&track={true|false}
```
- 드롭다운: `translationId=1` (KRV) 고정, `size=3`, **`track=false`**
- 결과 페이지(구절 탭): `size=20`, **`track=false`** — 통합 검색 입력의 도메인 의도가 명확하지 않으므로 백그라운드 카테고리 조회로 간주
- 페이지네이션 "더보기": **`track=false`** 동일
- 응답: `BibleSearchSliceResponse` 재사용

#### 성경 사전 검색
```
GET /api/v1/study/dictionaries?keyword={kw}&page=0&size=5&track={true|false}
```
- 드롭다운: `size=5`, **`track=false`**
- 결과 페이지(사전 탭): `size=20`, **`track=false`** — 위와 동일 이유

> **`track=true` 가 적용되는 호출 (기본값)**: 도메인 전용 페이지 `/web/bible/search?keyword=...`, `/web/study/dictionary?keyword=...` 의 직접 진입. 이들은 기존 호출자라 `track` 파라미터를 보내지 않으므로 default `true` 가 적용되어 **기존 동작이 그대로 유지**된다. 통합 검색 (`/web/search` 및 홈 드롭다운) 만이 명시적으로 `track=false` 를 전달.

### 5-2. 백엔드 변경 — `track` 파라미터 추가

**왜 필요한가**: 현재 두 API 모두 `page=0` 호출 시 `*SearchPerformedEvent` 를 발행하고 (`BibleReader.kt:174`, `DictionaryService.kt:36`), 리스너가 인기 검색어 카운트를 증가시킨다 (`BibleSearchKeywordListener.kt:21`).

오염 시나리오는 두 가지:
1. **자동완성 디바운스 부분 입력**: 사용자가 "창세기" 입력 도중 "ㅊ", "차", "창", "창세", "창세기" 5건이 모두 카운트
2. **도메인 비매칭 검색어**: 사용자가 "퀴즈" 또는 "마이페이지" 같은 메뉴 의도로 검색해도 `/web/search` 의 "all" 탭이 성경/사전 API 까지 동시 호출 → 도메인별 랭킹에 무관한 키워드가 누적. **특히 성경은 결과 0건이어도 page==0 이면 이벤트 발행** (사전은 `totalElements > 0` 가드 있음, 성경은 없음 — `BibleReader.kt:174-180`)

**변경 내용**:
1. 컨트롤러 시그니처에 `@RequestParam(defaultValue = "true") track: Boolean` 추가 (양 API 동일)
2. 서비스 메서드 시그니처에 `track: Boolean` 전달 (양 API 동일)
3. 이벤트 발행 조건에 `&& track` 만 **추가** (기존 조건은 그대로 보존, 이 부분만 API 별로 다름):
   - `BibleReader.kt:174` — 기존 `page == 0` → **`page == 0 && track`**
   - `DictionaryService.kt:36` — 기존 `normalizedKeyword != null && pageable.pageNumber == 0 && page.totalElements > 0` → **`normalizedKeyword != null && pageable.pageNumber == 0 && page.totalElements > 0 && track`**

> **주의**: 사전 API 의 `totalElements > 0` 가드를 실수로 제거하면 0건 결과 키워드까지 집계되어 회귀가 생긴다. 기존 조건은 그대로 두고 `&& track` 만 append.

**Backward-compatibility**: `track` 미지정 시 기본값 `true` → 기존 호출자(`/web/bible/search`, `/web/study/dictionary` 페이지) 동작 변화 없음.

**관련 파일 (수정, 총 7개)**:
- `BibleApi.kt:75-85` — searchBible 시그니처에 `track` 추가
- `BibleApiDocument.kt` — Swagger 문서 갱신
- `BibleService.kt`, `BibleReader.kt:174` — 가드 조건: `page == 0` → **`page == 0 && track`**
- `DictionaryApi.kt:18` — getDictionaries 시그니처에 `track` 추가
- `DictionaryApiDocument.kt` — Swagger 갱신
- `DictionaryService.kt:36` — 가드 조건: 기존 `normalizedKeyword != null && pageable.pageNumber == 0 && page.totalElements > 0` 를 보존한 채 **`&& track`** 만 append (`totalElements > 0` 가드 제거 금지)

본 단계의 백엔드 변경은 **위 7개 파일의 시그니처/조건 보강뿐, 새 엔드포인트는 없다.**

### 5-3. 정적 JS 인덱스 (신규)

#### `bible-book-index.js`
```javascript
export const BIBLE_BOOKS = [
  { bookKey: "GEN", name: "창세기",  abbr: "창", nameEn: "Genesis",   chapters: 50, testament: "OLD" },
  { bookKey: "EXO", name: "출애굽기", abbr: "출", nameEn: "Exodus",    chapters: 40, testament: "OLD" },
  // ... 66권
];
```
- **기준 번역본**: KRV (`translationId=1`) 의 `name` / `abbreviation` 값으로 고정. 다른 번역본의 책 이름 변형(예: 가톨릭 번역의 "탈출기")은 본 단계에서 미지원.
- **`nameEn` 필드**: KJV 책 시드(`bible_kjv_book.sql`) 의 영문 풀네임을 KRV 책과 1:1 매핑하여 추가. 영문 입력(`genesis`) 매칭용.
- **동기화 전략**: `bible_book` 테이블 구조 변경 빈도가 극히 낮으므로 (66권은 신학적 고정값) **수동 추출** 채택. 새 번역본 추가 시 `name`/`abbr` 가 KRV 와 달라지면 본 인덱스에는 영향 없음(KRV 기준 고정). 추후 자동화가 필요하면 Gradle task 로 분리.
- 크기 추정: ~7KB (gzip 후 ~3KB, `nameEn` 추가 반영)

#### `menu-index.js`
```javascript
export const MENU_INDEX = [
  {
    id: "study-creation",
    title: "7일 창조 체험",
    titleEn: "Creation",
    category: "학습",
    icon: "✨",
    keywords: ["창조", "7일", "creation", "창세기"],
    url: "/web/study/creation",
    description: "창세기 1장의 창조 이야기를 스크롤로 체험합니다.",
    requiresAuth: false
  },
  {
    id: "game-bible-quiz",
    title: "성경 퀴즈",
    titleEn: "Bible Quiz",
    category: "게임",
    icon: "🎮",
    keywords: ["퀴즈", "quiz", "문제"],
    url: "/web/game/bible-quiz",
    description: "장별로 성경 퀴즈를 풀고 점수를 기록합니다.",
    requiresAuth: true   // SecurityConfig: /web/game/** authenticated
  },
  // ... Section 3-2 의 32개 항목
];
```

`requiresAuth` 가 정의되지 않은 항목은 기본 `false`. **SecurityConfig 및 컨트롤러 인증 정책(`redirectIfUnauthenticated`)** 과 정합성 유지를 위해 Section 3-2 표가 SSOT.

### 5-4. 호출 흐름 (Drop-down)

```
입력 변경
  └─ debounce 200ms
       └─ Promise.allSettled([
              bibleVerseSearch(kw),    // fetch
              dictionarySearch(kw),    // fetch
              bookIndexSearch(kw),     // 로컬
              menuIndexSearch(kw),     // 로컬
              parseReference(kw)       // 로컬
          ])
       └─ 카테고리별 결과 병합·렌더링
       └─ 실패한 fetch 는 해당 카테고리만 숨김 (전체 실패 X)
```

이전 호출이 끝나기 전 새 입력이 들어오면 `AbortController.abort()` 로 중단.

---

## 6. 매칭 및 랭킹 알고리즘

### 6-1. 정규화 (양쪽 공통)

- 트림 후 소문자화
- 한글 유사 처리: NFC 정규화
- 양 끝 공백/특수문자 제거 (단, Bible Reference 파싱은 원본 입력 유지)

### 6-2. 메뉴 / 책 인덱스 매칭

각 항목에 대해 점수 계산:

| 조건 | 점수 |
|---|---|
| `title` 정확 일치 | 100 |
| `title` 접두 일치 | 70 |
| `title` 부분 포함 | 50 |
| `keywords[]` 정확 일치 | 60 |
| `keywords[]` 부분 포함 | 30 |
| `titleEn` / `abbr` 일치 | 40 |

점수 합계 내림차순, 동점은 정의 순서. 0점은 제외.

### 6-3. API 결과는 서버 정렬을 신뢰

구절·사전 검색은 서버가 정한 정렬 그대로 사용 (재정렬 X). 클라이언트는 카테고리 헤더 + 상위 N건 절단만 담당.

---

## 7. JavaScript 아키텍처

### 7-1. 모듈 구성 (신규 파일)

```
src/main/resources/static/js/
├── search/
│   ├── unified-search.js         ← 홈 검색바 컨트롤러 (index.html 진입)
│   ├── unified-search-page.js    ← /web/search 결과 페이지 컨트롤러
│   ├── bible-book-index.js       ← 정적 책 인덱스
│   ├── menu-index.js             ← 정적 메뉴 인덱스
│   ├── bible-reference-parser.js ← "창3:16" 등 파싱
│   └── search-sources.js         ← fetch + 로컬 조회 어댑터 (공통)
```

### 7-2. 핵심 클래스 — `UnifiedSearch`

```javascript
export class UnifiedSearch {
  constructor(rootEl) {
    this.input    = rootEl.querySelector("#usInput");
    this.dropdown = rootEl.querySelector("#usDropdown");
    this.clearBtn = rootEl.querySelector("#usClear");
    this.state = { keyword: "", composing: false, abortController: null };
    this.activeIndex = -1;  // 키보드 네비게이션
    this.bind();
  }

  bind() {
    this.input.addEventListener("input", () => this.onInput());
    this.input.addEventListener("compositionstart", () => this.state.composing = true);
    this.input.addEventListener("compositionend",   () => { this.state.composing = false; this.onInput(); });
    this.input.addEventListener("keydown", e => this.onKeydown(e));
    this.input.addEventListener("focus",   () => this.openDropdown());
    document.addEventListener("click",     e => this.onOutsideClick(e));
    this.clearBtn.addEventListener("click", () => this.clear());
  }

  onInput() {
    if (this.state.composing) return;
    const kw = this.input.value.trim();
    this.state.keyword = kw;
    this.clearBtn.classList.toggle("d-none", kw.length === 0);
    if (kw.length === 0) { this.closeDropdown(); return; }
    this.debounceRun();
  }

  debounceRun() {
    clearTimeout(this._t);
    this._t = setTimeout(() => this.run(), 200);
  }

  async run() {
    if (this.state.abortController) this.state.abortController.abort();
    this.state.abortController = new AbortController();
    const kw = this.state.keyword;
    const signal = this.state.abortController.signal;

    const results = await Promise.allSettled([
      searchBibleVerses(kw, { signal, size: 3, track: false }),   // §5-2 비집계
      searchDictionary(kw,   { signal, size: 5, track: false }),  // §5-2 비집계
      searchBibleBooks(kw,   { size: 3 }),     // 로컬
      searchMenus(kw,        { size: 5 }),     // 로컬
      parseBibleReference(kw)                  // 로컬, 0 or 1건
    ]);

    // Stale guard — 응답 대기 중 사용자가 더 빠르게 타이핑해 키워드가 바뀐 경우
    // 이 결과를 렌더하면 직전 키워드의 로컬 결과가 새 키워드의 화면을 덮을 수 있다.
    if (this.state.keyword !== kw) return;

    this.render(this.normalize(results));
  }

  // 결과 클릭 → 해당 페이지 이동
  // Enter → /web/search?q={kw} 이동
  // ArrowUp/Down → activeIndex 조정, Enter 시 그 항목으로 이동
}
```

### 7-3. 기존 유틸 재사용

- 토큰 갱신 불필요 → `common-util.js` 의 `fetchWithAuthRetry` 사용 안 함
- URL 빌드는 `URL` 생성자 + `searchParams.set()` 활용 (정적 path 는 그대로, 쿼리/해시만 자동 인코딩 — §10 보안 항목 참조)
- 디바운스: 자체 구현(외부 의존성 추가 금지, 본 프로젝트 컨벤션과 일치)

---

## 8. UX 세부 동작

### 8-1. 키보드 단축키

| 키 | 동작 |
|---|---|
| `/` (페이지 진입 시) | 검색 입력 포커스 (input/textarea 포커스 중이면 무시) |
| `ArrowDown` | 드롭다운 다음 항목 |
| `ArrowUp` | 드롭다운 이전 항목 |
| `Enter` | 선택 항목 있으면 그 URL 이동, 없으면 `/web/search?q=` 이동 |
| `Escape` | 드롭다운 닫기, 입력 유지 |
| `Tab` | 드롭다운 닫고 다음 포커스 이동 |

### 8-2. IME(한글) 안전

- `compositionstart` → 검색 일시 중단 플래그 ON
- `compositionend` → 플래그 OFF + 즉시 `onInput()` 1회 실행

### 8-3. 빈 상태 (드롭다운)

```
검색 결과가 없어요.
→ 인기 검색어로 찾아보기 (성경 / 사전 카드 재사용)
```

### 8-4. 로딩 표시

- 200ms 이상 응답 지연 시 드롭다운 우상단에 작은 스피너
- 모든 카테고리 결과가 settle 된 후 일괄 렌더 (§7-2 `Promise.allSettled` 흐름). 점진 렌더링은 v1 비채택 — debounce 200ms + 평균 응답 100ms 환경에서 체감 이득 미미 vs 구현 복잡도 증가

### 8-5. 모바일

- 드롭다운은 full-width, 키보드 가림 방지 위해 `position: fixed; bottom: keyboard-area` 대응
- 입력 `font-size: 16px` 고정 (iOS 자동 확대 방지)

---

## 9. 전용 결과 페이지 (`/web/search`)

### 9-1. 컨트롤러

```kotlin
@Controller
class RootWebController(...) {
    // 기존 메서드 ...

    @GetMapping("/web/search")
    fun showUnifiedSearch(
        @RequestParam(required = false) q: String?,
        @RequestParam(required = false, defaultValue = "all") tab: String,
        model: Model
    ): String {
        model.addAttribute("query", q ?: "")
        model.addAttribute("activeTab", tab)
        return "search"
    }
}
```

> 서버는 키워드를 모델에 넘기기만 한다. 실제 검색은 클라이언트 JS 가 기존 API 호출로 수행.

### 9-2. 템플릿 골격

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org" lang="ko">

<!-- 동적 title + noindex (§13 SEO 정책) -->
<head th:replace="~{fragments/head :: head(
        ${#strings.isEmpty(query) ? '통합 검색 - ElSeeker' : query + ' 검색 결과 - ElSeeker'},
        true,
        '/css/unified-search.css?v=1.0')}"
      th:with="robotsContent='noindex,follow'">
</head>

<body class="has-fixed-nav unified-search-page">

<header th:replace="~{fragments/header :: header}"
        th:with="pageTitle='통합 검색', pageTitleVisible=true"></header>

<main class="container content-wrapper">
  <div class="us-page-search-wrap">
    <input id="usPageInput" type="search"
           class="us-search-input"
           th:value="${query}"
           placeholder="검색어 입력">
  </div>

  <nav class="us-tabs" role="tablist">
    <button role="tab" data-tab="all"        aria-selected="true">전체</button>
    <button role="tab" data-tab="bible"     aria-selected="false">성경</button>
    <button role="tab" data-tab="dictionary" aria-selected="false">사전</button>
    <button role="tab" data-tab="menu"      aria-selected="false">메뉴</button>
  </nav>

  <section class="us-results">
    <!-- 탭별 결과 렌더링 -->
  </section>
</main>

<script type="module" src="/js/search/unified-search-page.js?v=1.0"></script>
<div th:replace="~{fragments/section-nav :: section-nav}"></div>
</body>
</html>
```

> **`<head>` 의 두 가지 필수**:
> 1. **동적 `<title>`** — `query` 가 있으면 `[검색어] 검색 결과 - ElSeeker`, 빈 검색이면 `통합 검색 - ElSeeker`
> 2. **`robotsContent='noindex,follow'`** — `fragments/head.html:68` 의 `<meta name="robots">` 이 `th:if="${!#strings.isEmpty(robotsContent)}"` 조건부 렌더라 `th:with` 로 전달해야 출력됨

### 9-3. 페이지네이션

- 구절 탭만 적용 (서버 페이징 응답 활용)
- "더보기" 버튼 클릭 시 다음 page 호출 + append (무한 스크롤 X — 단순화)
- 사전/메뉴 탭은 전체 결과를 한 번에 표시 (소규모)

---

## 10. 보안

| 항목 | 처리 |
|---|---|
| XSS | 모든 결과 DOM 생성 시 `textContent` 사용. `innerHTML` 금지. **URL 인코딩 정책**: 정적 인덱스의 내부 path(`/web/...`)는 `/web/` prefix allowlist 검증 후 그대로 사용 (전체 path 를 `encodeURIComponent` 하면 `/` 가 `%2F` 로 인코딩되어 링크 깨짐). 동적으로 합성되는 쿼리 파라미터(`?q=...&tab=...&verseNumber=...` 등)는 `URL` 생성자 + `searchParams.set()` 으로 자동 인코딩. 본 프로젝트는 URL fragment(`#`)를 사용하지 않음 |
| 입력 검증 | 키워드 최대 100자 클라이언트 제한. 100자 초과 시 슬라이스. **서버 측 검증은 비대칭**: 성경 검색 API 는 `BibleReader.kt:158` 의 `MAX_SEARCH_KEYWORD_LENGTH` 가드 보유. 사전 API(`DictionaryApi.kt`, `DictionaryService.kt`)는 길이 검증 없음 → 본 단계에서는 클라이언트 100자 제한이 사전 API 의 1차 방어선. 향후 서버 측 길이 가드 추가 검토(향후 작업) |
| URL 파라미터 | `q` 값은 URL 디코드 후 `<script>` 등 위험 태그 제거 없이 그대로 사용(텍스트로만 렌더링 — XSS 방지는 텍스트 노드 사용으로 처리). |
| Rate limit | 클라이언트 debounce(200ms) + `AbortController` 로 진행 중 호출 중단. 서버 측 추가 제한 불필요(기존 검색 API 정책 그대로). |
| Referer | 외부 링크 없음 (모두 내부 라우팅) → noopener 불필요 |

---

## 11. 접근성 (Accessibility)

WAI-ARIA APG **Combobox + Listbox** 패턴 적용.

| 요소 | 역할 / 속성 |
|---|---|
| 검색바 wrapper | `role="combobox" aria-haspopup="listbox" aria-expanded="..." aria-owns="usDropdown"` |
| `<input>` | `aria-autocomplete="list" aria-controls="usDropdown" aria-activedescendant="us-item-{idx}"` |
| 드롭다운 | `role="listbox" aria-label="검색 결과 미리보기"` |
| 카테고리 그룹 | `role="group" aria-labelledby="us-group-bible"` |
| 결과 항목 | `role="option" id="us-item-{idx}" aria-selected="false"` |
| 키보드 네비 | `aria-activedescendant` 로 가상 포커스 (실제 포커스는 input 유지) |
| 라이브 영역 | `<span class="visually-hidden" aria-live="polite">총 N건 검색됨</span>` |
| `prefers-reduced-motion` | 드롭다운 fade-in transition 비활성화 |
| 색상 대비 | WCAG AA 충족 (theme.css 토큰 사용) |

---

## 12. 성능 (Performance)

| 항목 | 전략 |
|---|---|
| 정적 인덱스 로드 | `import()` 동적 로드 — 입력 최초 1자 입력 시 (홈 첫 페인팅 영향 0) |
| 호출 중복 방지 | 동일 키워드 직전 결과 메모이즈(LRU 10건). 다시 입력 시 즉시 표시 후 백그라운드 새로고침 |
| 네트워크 호출 | `AbortController` 로 진행 중 호출 즉시 중단 |
| 응답 캐시 | **현재 검색 API 자체에는 `@Cacheable` 없음** (`BibleService` / `DictionaryService` 확인). `@Cacheable` 은 인기 검색어 랭킹(`BibleSearchKeywordService.kt:31`, `DictionarySearchKeywordService.kt:38`) 에만 적용 중. 본 단계는 추가 캐싱 없이 출시하고, 트래픽 측정 후 검색 API HTTP 캐시 헤더(`Cache-Control: public, max-age=...`) 도입 검토 |
| Bundle 크기 | bible-book-index.js gzip ~3KB(§5-3), menu-index.js gzip ~1.5KB — 합쳐 ~5KB |
| 드롭다운 DOM | 최대 ~20 노드(카테고리 4 + 항목 16) |

---

## 13. SEO

- 결과 페이지 `<title>` 동적: `[검색어] 검색 결과 - ElSeeker`
- `<meta name="robots" content="noindex,follow">` — 검색 결과 페이지는 인덱싱 차단 (Google 권장)
- 홈 검색바는 schema.org `WebSite.potentialAction.SearchAction` 으로 이미 정의되어 있음 (`head.html` 의 JSON-LD).
  본 단계에서는 **JSON-LD `SearchAction.target` 을 변경하지 않는다.** (기존 `/web/bible/search?keyword=` 유지)

> **결정 근거**: `/web/search` 페이지는 위에서 정의한 대로 `noindex` 처리된다. Google sitelinks searchbox 가이드라인은 SearchAction target 으로 **indexable URL** 을 요구하므로, noindex 페이지를 target 으로 지정하면 Google 이 해당 정의를 무시하거나 sitelinks searchbox 노출에서 제외된다. 현재 `/web/bible/search` 는 indexable 이고 잘 동작 중이므로 기존 정의 유지가 안전하다.
> 향후 `/web/search` 를 빈 검색어일 때 indexable 랜딩 페이지로 발전시키면 그때 변경을 재검토 (Section 17 참조).

---

## 14. 다크 모드

- 검색바: `bg-elevated-bright`, 입력 텍스트 `text-primary`, placeholder `text-muted`
- 드롭다운: `bg-elevated-bright` + 1px `color-border`, 항목 hover `bg-elevated-strong-hover`
- 활성 항목(`aria-activedescendant`) 배경: `bg-elevated-strong-active` + accent border-left 2px
- 카테고리 헤더: `text-secondary` + 작은 폰트

모든 색상은 `theme.css` 의 시맨틱 토큰만 사용 — 다크/라이트 자동 분기.

---

## 15. 파일 변경 목록 (Implementation Checklist)

### 신규 파일

- [ ] `templates/search.html` — 전용 결과 페이지
- [ ] `static/css/unified-search.css?v=1.0` — 검색바 + 드롭다운 + 결과 페이지 공통 스타일 (`us-` 접두사). **주의**: 기존 `static/css/search.css` 와 별개 파일 (해당 파일은 `/web/bible/search` 등 7개 페이지에서 이미 사용 중)
- [ ] `static/js/search/unified-search.js?v=1.0` — 홈 검색바
- [ ] `static/js/search/unified-search-page.js?v=1.0` — 결과 페이지
- [ ] `static/js/search/bible-book-index.js?v=1.0`
- [ ] `static/js/search/menu-index.js?v=1.0`
- [ ] `static/js/search/bible-reference-parser.js?v=1.0`
- [ ] `static/js/search/search-sources.js?v=1.0`

### 수정 파일

- [ ] `templates/index.html` — `home-unified-search` 섹션 추가, `unified-search.css` extraCss 등록, `unified-search.js` 로드, `home.css` 캐시 버스팅 +0.1
- [ ] `kotlin/.../RootWebController.kt` — `@GetMapping("/web/search")` 추가
- [ ] `kotlin/.../bible/.../BibleApi.kt`, `BibleApiDocument.kt` — `track: Boolean = true` 파라미터 추가 (§5-2)
- [ ] `kotlin/.../bible/.../BibleService.kt`, `BibleReader.kt` — 가드 조건: `page == 0` → **`page == 0 && track`**
- [ ] `kotlin/.../study/.../DictionaryApi.kt`, `DictionaryApiDocument.kt` — `track: Boolean = true` 파라미터 추가
- [ ] `kotlin/.../study/.../DictionaryService.kt` — 가드 조건: 기존 3조건(`normalizedKeyword != null && pageable.pageNumber == 0 && page.totalElements > 0`) 보존 + **`&& track`** append. `totalElements > 0` 가드 제거 금지
- [ ] `src/main/resources/static/sitemap.xml` — `/web/search` 는 noindex 대상이므로 추가하지 **않음** (실제 sitemap 파일 위치는 `static/`)

> **변경하지 않는 파일**: `templates/fragments/head.html` 의 JSON-LD `SearchAction.target` 은 그대로 유지 (Section 13 결정 근거 참조).

### 테스트

**테스트 인프라 결정**: 현 repo 에는 JS 테스트 러너 인프라(`package.json`, `vitest.config`, `playwright.config`, `jest.config`)가 **존재하지 않는다**. 본 단계에서는 신규 인프라를 도입하지 않고 다음 두 가지를 채택:
1. **백엔드 변경(`track` 파라미터)**: 기존 JUnit 5 + Kotest 인프라로 통합 테스트 작성
2. **클라이언트 Bible Reference Parser**: 브라우저 기반 **수동 스모크 테스트 체크리스트** — 홈(`/`) 검색바에 입력 → 드롭다운에 노출된 parser 결과 항목 클릭 → 도달 URL 을 주소창에서 육안 확인하는 방식으로 통일 (parser 의 URL 생성 로직 검증이 목적이므로 클릭 동선이 직접적). 향후 JS 테스트 인프라 도입 시 자동화 (§17 future work 참조)

#### 자동화 테스트 (백엔드)

- [ ] `RootWebControllerTest` — `/web/search` 200, 모델 속성(`query`, `activeTab`) 검증
- [ ] `BibleApi` / `DictionaryApi` 통합 테스트 — `track=false` 호출 시 `*SearchPerformedEvent` **미발행** 검증 (이벤트 캡처 spy). `track=true` 또는 미지정 시 발행 유지 검증 (기존 동작 회귀 방지)

#### 수동 스모크 체크리스트 (Bible Reference Parser)

KRV 고정(`translationId=1`)이므로 모든 기대 URL 에 `translationId=1` 포함되어야 함 (세션/스토어 상태에 의존하지 않음). 홈 검색바에 입력 후 드롭다운 첫 항목 클릭 시 도달하는 URL 을 육안 확인:
  - `창3:16` → `/web/bible/verse?translationId=1&bookOrder=1&chapterNumber=3&verseNumber=16`
  - `창세기 3장 16절` → 동일
  - `고린도전서 13:4` → `/web/bible/verse?translationId=1&bookOrder=46&chapterNumber=13&verseNumber=4`
  - `genesis` / `Genesis` / `GENESIS` → `/web/bible/chapter?translationId=1&bookOrder=1` (대소문자 무시 매칭 검증)
  - `요 3:16` → `/web/bible/verse?translationId=1&bookOrder=43&chapterNumber=3&verseNumber=16`
  - **`예레미야 애가 1:1`** → `/web/bible/verse?translationId=1&bookOrder=25&chapterNumber=1&verseNumber=1` (공백 포함 책 이름)
  - **`1 Samuel 3:10`** (KJV) → `/web/bible/verse?translationId=1&bookOrder=9&chapterNumber=3&verseNumber=10` (공백+숫자 prefix)
  - **`Song of Solomon 2:1`** (KJV) → `/web/bible/verse?translationId=1&bookOrder=22&chapterNumber=2&verseNumber=1`
  - `창1:300` → `verseNumber` 제거 후 `/web/bible/verse?translationId=1&bookOrder=1&chapterNumber=1` (sanity 실패)
  - 잘못된 입력 (`창9999장`) → 결과 0건
  - prefix-match longest-first 동작: "예레미야" 단독 입력 vs "예레미야 애가" 입력의 분기 검증

---

## 16. 설계 결정 기록 (Design Decision Log)

| 결정 | 채택 | 기각 | 이유 |
|---|---|---|---|
| 백엔드 통합 API | 기존 API 재사용 + 정적 인덱스 + `track` 파라미터 추가 | 신규 `/api/v1/search` 엔드포인트 | 4개 소스 중 2개(메뉴/책)는 정적이므로 서버 호출 불필요. 구절/사전은 이미 잘 만든 검색 API 존재 → 신규 엔드포인트 대신 기존 API 에 비집계 옵션(`track=false`)만 추가하여 자동완성 호출이 인기검색어 랭킹을 오염시키지 않도록 함 |
| `track` 적용 범위 | 통합 검색의 모든 호출(드롭다운 + 결과 페이지)에 `track=false` | 결과 페이지는 `track=true` | 사용자가 "퀴즈"·"마이페이지" 같은 메뉴 의도로 검색해도 결과 페이지 "all" 탭이 성경/사전 API 를 동시 호출. 도메인 의도가 명확하지 않은 입력이 도메인별 랭킹을 오염시키는 것을 차단. 도메인 전용 페이지(`/web/bible/search` 등) 직접 진입은 기본 `track=true` 유지 |
| 절 번호 유효성 | best-effort (sanity range 1–200) | 정확한 verseCountByChapter 인덱싱 | 정확한 절수 데이터를 클라이언트에 싣는 비용(~1.5KB) 대비 잘못된 verseNumber 의 UX 피해가 작음(하이라이트만 실패). 향후 필요 시 보강 |
| 구절 deep link 메커니즘 | `verseNumber` 쿼리 파라미터 | URL fragment `#v{n}` | `verse-list.js:150,474` 가 `verseNumber` 쿼리를 읽어 처리. 렌더링 id 도 `verse-text-{v}` 라서 fragment `#v{n}` 은 매칭되지 않음. 기존 성경 검색(`search.js:480`)과 일관성 유지 |
| 책만 매칭 시 라벨 | "장 목록 보기" + `/web/bible/chapter?...` | "1장 보기" (오해 소지) | `BibleWebController.kt:41` `/chapter` 라우트는 `bible/chapter-list` 템플릿(장 선택 페이지)을 렌더. 1장으로 진입한다는 의미가 아니므로 라벨 정확화 |
| Bible Reference 파싱 전략 | 책 인덱스 prefix-match (longest-first) | 정규식 단독 매칭 | 정규식은 KRV "예레미야 애가"(공백 포함), KJV "1 Samuel"·"Song of Solomon"(공백+숫자 prefix) 같은 책 이름을 안정적으로 못 잡음. lookup-table 기반 prefix-match 가 데이터-구동 방식으로 더 견고 |
| 검색바 위치 | 히어로 아래 / 메뉴 위 별도 섹션 | 히어로 오버레이 / top-nav 통합 | 히어로 CTA("성경 읽기 시작")와 시각적 경쟁 회피. top-nav 통합은 영향 범위가 너무 큼(별도 후속 작업) |
| 결과 표시 | 드롭다운 자동완성 + 전용 결과 페이지 | 모달 단일 / 인라인 트리 | 자동완성으로 빠른 진입, 결과 페이지로 깊은 탐색 모두 지원. Google/Notion 패턴과 동일하여 학습 부담 최소 |
| 메뉴 데이터 | 정적 JS 인덱스 (32건) | DB 테이블 + 어드민 UI | 메뉴 추가는 코드 변경 동반(라우트·템플릿) → JS 한 파일과 함께 PR 로 관리하는 편이 SSOT |
| 상태 변경 액션(로그아웃) 노출 | 메뉴 인덱스에서 제외 | "액션" 분리 카테고리로 노출 | `/web/auth/logout` 은 GET 한 번에 쿠키 삭제(상태 변경). 검색 결과에서 우연 클릭 시 의도치 않은 로그아웃 발생 가능. "액션" 카테고리로 분리 + 확인 절차도 검토했으나 v1 단순화 위해 제외 채택. 로그아웃은 top-nav 의 계정 메뉴로 일관 접근 |
| Bible Reference 파싱 위치 | 클라이언트 (prefix-match + 잔여 정규식) | 서버 파싱 API | 책 인덱스가 이미 클라이언트에 있음. 왕복 없이 즉시 결과 표시 가능 |
| 호출 동시성 | `Promise.allSettled` + `AbortController` | 순차 호출 / `Promise.all` | 부분 실패 허용(R5) + 입력 변경 시 진행 중 호출 즉시 중단 |
| 결과 페이지 렌더 방식 | CSR (서버는 query만 전달) | SSR 결과 | 동일 검색 API 를 두 곳(드롭다운/결과)에서 사용 → CSR 통일이 코드 중복 최소 |
| 결과 페이지 인덱싱 | `noindex,follow` | indexable | 검색 결과 페이지는 사용자별 동적 콘텐츠. Google Search Quality 가이드라인 권장 |
| 커뮤니티 게시글 본문 | **본 단계 제외** | 포함 | 게시글 검색 API 미구현 + 본문 검색은 서버 인덱싱 전략 필요 → 별도 설계로 분리 (Section 17 참조) |
| JSON-LD SearchAction.target | 기존 `/web/bible/search` 유지 | `/web/search` 로 변경 | 새 페이지는 `noindex` 라 Google sitelinks searchbox 가이드라인에 부적합. 변경 시 현재 잘 동작 중인 SearchAction 노출이 손실됨 → 기존 유지가 안전 |
| 책 인덱스 동기화 | 수동 추출, KRV 고정 | 빌드시 자동 추출 | 66권은 신학적 고정값으로 변경 빈도 0. 자동화 ROI 낮음 |
| 게임 메뉴 노출(비로그인) | 노출 + "로그인 필요" 뱃지 | 비로그인 시 숨김 | 사용자가 "퀴즈" 검색했을 때 결과 0건은 더 큰 혼란. 뱃지로 사전 안내 |
| 결과 항목 클릭 동작 | 항목별 deep link 직접 이동 | 결과 페이지 경유 | 사용자 의도가 명확한 항목(특정 구절/사전)은 한 번에 도달 |
| 최근 검색어 저장 | **본 단계 제외** | localStorage 저장 | UX 가치는 있으나 1단계 범위 초과. Section 17 향후 확장 |

---

## 17. 향후 확장 (Future Work)

| 기능 | 우선순위 | 메모 |
|---|---|---|
| 커뮤니티 게시글 본문 검색 | 높음 | 별도 검색 API 신규 + 본문 인덱싱 전략(LIKE → 향후 외부 검색엔진) |
| 최근 검색어 (개인) | 중간 | localStorage 기반, 인증 무관. 드롭다운 빈 상태에 표시 |
| 검색어 자동완성(인기 기반) | 중간 | 이미 존재하는 `*-search-keywords/ranking` API 를 첫 글자 prefix 필터링으로 활용 |
| 전역 `/` 단축키 (모든 페이지) | 중간 | Google/GitHub 패턴. 본 단계(§8-1)는 홈에서만 작동. 향후 top-nav 검색 통합 시 모든 페이지에서 `/` 진입 |
| 음성 검색 | 낮음 | Web Speech API. 모바일 우선 |
| 시맨틱 검색(임베딩) | 낮음 | "예수가 십자가에 못 박힌 이유" 같은 자연어 → 관련 구절 / 학습 페이지. 외부 LLM/임베딩 DB 필요 |
| 검색 분석 대시보드 | 낮음 | 통합 검색 키워드 집계 → 어드민에서 인기 키워드 확인 |
| 사전 API 서버 측 길이 검증 | 중간 | `DictionaryApi`/`DictionaryService` 에 성경 검색과 동일한 `MAX_SEARCH_KEYWORD_LENGTH` 가드 추가. 현재는 클라이언트 100자 제한이 1차 방어선 |
| 정확한 절 번호 검증 (`verseCountByChapter`) | 낮음 | best-effort 정책의 한계가 실제 UX 문제로 드러날 경우 정적 인덱스에 verse count 추가 |
| JS 테스트 인프라 도입 (Vitest 등) | 중간 | 현재 repo 에 JS 테스트 러너 없음. Bible Reference Parser 등 클라이언트 로직이 늘어나면 수동 스모크 한계 도달 → Vitest + jsdom 도입 검토. `package.json` 신설 비용은 있으나 본 단계 종료 후 별도 인프라 PR 로 분리 |
| 로그아웃 검색 노출 (액션 카테고리 분리) | 낮음 | 본 단계는 메뉴 인덱스에서 제외(§16). 사용자 요청이 누적되면 "액션" 카테고리 + 확인 dialog 로 부활 검토 |

---

## 18. 참고 자료

- 인기 검색어 노출 설계: `docs/common/popular-search-keywords.md`
- 성경 구절 검색 키워드 집계: `docs/bible/search-keyword-ranking-design.md`
- 사전 검색 키워드 집계: `docs/study/dictionary-search-keyword-ranking-design.md`
- 다크 테마 토큰: `docs/common/dark-theme.md`
- 섹션 네비게이션: `docs/common/section-navigation.md`
- WAI-ARIA Combobox APG: <https://www.w3.org/WAI/ARIA/apg/patterns/combobox/>
- Google SearchAction schema.org: <https://schema.org/SearchAction>
