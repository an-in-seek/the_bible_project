# 구절 글씨 크기 동적 설정 기능 설계 (Verse Font Size) — v2

`verse-list.html` 화면에서 사용자가 **구절 본문(.verse-text)의 글씨 크기를 직접 조절·저장**할 수 있도록 한다.

> 노인층·시각약자·저시력 사용자가 성경 본문을 편안하게 읽도록 하는 **접근성(a11y) 우선 기능**이며, 모든 사용자에게 가독성 커스터마이즈를 제공한다.

**v2 변경 요약** (v1 자체 검토 결과 반영)
- 토글 숨김 셀렉터 버그 수정 (사이블링 → JS 직접 토글)
- 기존 sticky 컨벤션(`z-index: 1020`, `.has-fixed-nav` / `.top-nav-hidden`) 준수
- 모바일 360px 폭 오버플로 해결 — 좌우 `Aa±` 버튼 제거(점 직접 클릭으로 일원화), "초기화/닫기"는 더 작게
- 터치 타겟 겹침 해결 — 점 자체를 24px, 점 사이 간격 56px 이상으로 강제
- ARIA `radiogroup` 표준: roving tabindex + 화살표키 포커스 이동
- 외부 클릭 핸들러 FAB와 통합
- 폰트 단계 균등 증분(약 1.16x 로그 스케일)
- "초기화" 라벨 + 기본 상태에서 비활성
- 진짜 FOUC 방지 — `fragments/head.html` 인라인 부트스트랩 스크립트로 본문 paint 전 적용

**v2.1 변경 요약** (외부 리뷰 4건 반영)
- **WCAG 2.5.5 (AAA) 일관성 확보** — 모든 인터랙티브 요소 44×44 px 히트 영역 보장. 점은 24px 시각 + 44px 클릭 박스(`::before` 패턴), 토글/닫기 36px → 44px, 초기화 버튼 height 44px
- **fragments/head.html 시그니처 변경 폐기** — 기존 `pageDescription`/`pageKeywords` 패턴 그대로 차용. caller `th:with="useVerseFontBoot=true"` + fragment `th:if="${useVerseFontBoot}"` 만 사용
- **slide-down 200ms 사양 제거** — 작은 패널은 즉시 토글이 더 직관적. 트랜지션은 본문 폰트와 점 시각 변화에만 적용
- **포커스 복귀 옵션화** — `toggleFontPanel(false, { returnFocus })` 분리. Esc/× 로 닫힘은 `returnFocus: true`, 외부 클릭은 `returnFocus: false` (사용자 클릭 지점 존중). 초기화 클릭은 패널을 닫지 않음 (단계만 변경, 패널 유지)

**v2.2 변경 요약** (외부 리뷰 2차 4건 반영)
- **import 지시문 명시** — 기존 `import {BookStore, ChapterStore, LastReadStore, TranslationStore, VerseStore}` 줄을 대체하지 않고 `BibleReaderStore` 를 **추가** (diff 형태로 명시)
- **외부 클릭 포커스 안전 정책** — `.verse-text` 등 non-focusable 요소(div) 클릭으로 패널이 닫힐 때, 패널 내부에 남아 있는 포커스(`document.activeElement`)를 `blur()` 처리하여 hidden 요소에 active 가 머무는 a11y 위반 방지. `returnFocus: true` 분기는 토글로 명시 복귀
- **잔존 옛 수치 정리** — "토글 36×36", "점 24px 시각·터치 타겟 일체화", "gap: 32px" 등 v2 잔재를 모두 v2.1 기준(44px hit / 24px 시각·::before / max-width 320px space-between)으로 일치화
- **360px viewport 오버플로 해결** — 좁은 폭에서 container padding(24→12px), panel gap(16→8px) 축소 + reset 버튼을 라벨 → 아이콘(`↺`)으로 축약. stepper 220px 는 절대 양보하지 않음. 360px 기준 합계 328px 로 안전

**v2.4 변경 요약** (외부 리뷰 4차 3건 반영)
- **focus() 호출 순서 버그 수정** — 닫기 분기에서 `fontToggle.focus()` 호출 시점이 `data-expanded="true"` (토글이 `display:none`) 상태였음. silent fail 방지를 위해 상태 플립을 먼저 수행하고, 캐시한 `focusInsidePanel` 플래그/`activeBeforeCollapse` 참조로 분기 후 포커스 적용. 펼침 분기도 동일하게 상태 플립 후 점에 focus
- **localStorage 오염 방어** — `BibleReaderStore.getFontStep/saveFontStep` 양쪽에 try/catch 추가. `LocalStore.get` 내부의 `JSON.parse` 가 throw 해도 기본값(3)으로 폴백. 추가로 `syncFontStepFromBoot` 도 bootStep 유효 시 store 호출을 단락 평가로 스킵하여 이중 안전망 확보
- **QA #9 표현 정정** — `.verse-text` 가 `<div>`(non-focusable) 임을 명시. 외부 클릭 시 "포커스는 클릭한 요소로 이동" 이 아니라 "패널 내부 포커스가 `blur()` 처리되고 토글로 강제 복귀하지 않음" 으로 실제 동작과 일치화

**v2.3 변경 요약** (외부 리뷰 3차 4건 반영)
- **clamp 로직 버그 수정** — `parseInt(step,10) || DEFAULT` 패턴은 0/NaN 을 모두 DEFAULT 로 폴백시켜 "1단계에서 ArrowLeft → 3단계로 튐" 버그를 유발. `Number.isNaN(parsed) ? DEFAULT : Math.max(1, Math.min(5, parsed))` 형태로 교체. 경계값(0, -1, 6)이 정상적으로 1/5로 clamp됨
- **Esc 중복 처리 제거** — stepper keydown 의 Esc 분기는 `preventDefault`/`stopPropagation` 없이 `toggleFontPanel(false)` 호출 → 전역 `handleFabEscapeKey` 까지 버블링되어 FAB도 동시에 닫히는 부수효과. stepper 의 Esc 처리를 **제거**하고 전역 핸들러 1곳에서만 처리하도록 단일화
- **트랜지션 예시 `::before` 일치화** — section 3-3 의 `.verse-font-dot { transition: ... }` 를 `.verse-font-dot::before` 로 수정. 실제 구현(6-2 CSS)이 시각 점을 `::before` 로 그리므로 트랜지션 대상도 동일해야 함. `prefers-reduced-motion` 분기도 동일하게 보정
- **v2.1 요약 "초기화 후 닫힘" 표현 수정** — 구현/QA 어디에도 "초기화 후 닫기" 동작 없음. "Esc/×" 만 닫힘 대상, 초기화는 단계만 변경하고 패널 유지하는 점 명시

---

## 1. UX 목표 (Why)

| 목표 | 설명 |
|---|---|
| **즉시 가독성 확보** | 한 번의 조작으로 본문이 즉시 커지거나 작아져야 한다. 모달·서브페이지 이동 금지. |
| **상시 노출 X / 필요 시 노출 O** | 평소엔 작은 토글만, 필요 시 컨트롤 펼침. |
| **장 이동·새로고침에도 보존** | `LocalStore`에 영구 저장하여 모든 장에서 재현. |
| **읽기 흐름 비방해** | 구절 선택/FAB/메모 영역과 충돌하지 않아야 함. |
| **WCAG 2.1 SC 1.4.4 (Resize text) / 2.5.5 (Target Size)** | 키보드 / 스크린리더 / 터치 모두 지원. |
| **브라우저 줌과 차별화** | 본문만 확대 — 헤더·네비·버튼은 그대로 유지. |
| **시스템 폰트 사이즈 존중** | `rem` 단위 사용으로 사용자 브라우저 기본 폰트 사이즈와 곱해짐 → 접근성 측면 의도된 동작. |

---

## 2. UX 사양 (What)

### 2-1. 글씨 크기 단계 (균등 1.16x 로그 스케일)

| 단계 | 라벨 | rem | px (16px 기준) | 비율 |
|---|---|---|---|---|
| 1 | XS (가장 작게) | `0.875rem` | 14px | 0.78× M |
| 2 | S (작게) | `1.0rem` | 16px | 0.89× M |
| 3 | **M (기본)** | `1.125rem` | **18px** | 1.0× (기준) |
| 4 | L (크게) | `1.3125rem` | 21px | 1.17× M |
| 5 | XL (가장 크게) | `1.5rem` | 24px | 1.33× M |

> 인접 단계 증분이 **+12.5% ~ +16.7%** 범위로 균등 — "한 단계" 의 의미가 사용자에게 일관되게 인지된다.

### 2-2. UI 컴포넌트

**위치**: `<header>` 와 `<main>` 사이에 sticky 마운트. 기존 `search-controls`, `my-memo-tabs` 와 동일 컨벤션.

**노출 방식**: 접힌 토글 ↔ 펼침 패널 토글.
- 평소: 우측 정렬된 **44×44** `Aa` 토글 버튼만
- 펼침: 같은 컨테이너에 stepper 패널 전개. 토글은 JS로 `d-none` 처리.

**펼침 상태 레이아웃** (단순화):

```
┌──────────────────────────────────────────────┐
│   ● ─ ● ─ ●─ ● ─ ●     [초기화]   [×]        │
│   1   2   3  4   5                            │
└──────────────────────────────────────────────┘
```

- 좌우 `Aa±` 버튼 제거 — 점 직접 클릭 + 키보드 ←/→ 로 충분
- 점은 **시각 24px + 클릭 박스 44×44 px** (`::before` 패턴) — 시각 단정함과 WCAG 2.5.5 AAA 동시 충족
- "초기화" 는 현재 ≠ 기본일 때만 활성, 360px 미만 좁은 폭에선 아이콘(↺)으로 축약

### 2-3. 인터랙션

| 트리거 | 동작 | 피드백 |
|---|---|---|
| `Aa` 토글 클릭 | 컨트롤 즉시 펼침 | 점 시각 변화만 트랜지션 (`prefers-reduced-motion` 존중) |
| 점 직접 클릭/탭 | 해당 크기 즉시 적용 | font-size 150ms 트랜지션 |
| 키보드 ←/→ (stepper 포커스 시) | 한 단계씩 이동 + **새 점에 포커스 이동** | `aria-live` 안내 |
| 키보드 Home/End | 1단계 / 5단계 점프 + 포커스 이동 | — |
| Space/Enter (점 포커스 시) | 해당 단계 적용 | — |
| "초기화" 클릭 | 3단계로 복귀 | 기본 상태에서는 disabled |
| "×" 클릭 / Esc | 컨트롤 접힘 + 토글로 포커스 복귀 | — |
| 외부 영역 클릭 | 컨트롤 접힘. 클릭 타깃이 focusable 이면 브라우저 기본 동작으로 포커스 이동, non-focusable(예: `.verse-text` div) 이면 패널 내부에 남아 있던 포커스를 `blur()` 하여 hidden 요소에 active 가 남지 않도록 처리 | — |
| 장 이동 / 새로고침 | 동일 크기 즉시 적용 (FOUC 없음) | — |

### 2-4. 적용 범위

**적용 대상**: `.verse-text` (구절 본문) **만**.

**적용 제외**: 구절 번호, 메모 textarea, FAB, 버튼, 헤더/네비, 패널 자체.

### 2-5. 충돌 회피

| 상황 | 처리 |
|---|---|
| FAB 표시 중 | 컨트롤 바는 상단 sticky, FAB는 하단 fixed — 영역 분리됨 |
| 메모 영역 열린 상태 | textarea는 영향 없음, 구절 본문만 리사이즈 |
| 스포트라이트(z-index 998) 활성 | 컨트롤 바 `z-index: 1020` 이지만 stepper 사용 중에 검색 진입 시나리오는 거의 없음. spotlight 활성 중에는 외부 클릭으로 닫혀서 자연스럽게 사라짐. |
| 검색 진입 후 verseNumber 스크롤 | `applyFontStep` 적용 후 `highlightVerse` 호출되도록 init() 순서 보장 |
| top-nav-hidden(모바일 스크롤) | `.has-fixed-nav.top-nav-hidden .verse-font-control { top: 0 }` 처리 |

---

## 3. 시각 / 모션

### 3-1. 컨트롤 바

- 배경: `var(--color-bg-elevated)`
- 보더: 하단 1px `var(--color-border)`
- 접힌 상태 높이: 44px (토글만)
- 펼친 상태 높이: 56px

### 3-2. stepper 점

```
1단계:  ●─○─○─○─○
2단계:  ○─●─○─○─○
3단계:  ○─○─●─○─○   ← 기본
4단계:  ○─○─○─●─○
5단계:  ○─○─○─○─●
```

- 점 시각 크기: 24px (`::before` 로 그림)
- 점 클릭 박스: 44×44 px (투명 button 본체, `min-width/min-height: 44px`)
- 점 분포: stepper `max-width: 320px` + `justify-content: space-between` — 5점이 균등 분포, 점 중심 간 ≥ 44px 보장 (히트존 겹침 없음)
- 활성 점: `var(--bs-primary, #0d6efd)`, `::before` 에 `transform: scale(1.1)` (모션 감소 시 X)
- 비활성: 2px border `var(--color-border-control)`
- 다크 모드: 활성 점 `#4ea3ff` 로 대비 보강

### 3-3. 트랜지션

```css
.verse-text { transition: font-size 150ms ease-out; }
/* 시각 점은 ::before 로 그리므로 트랜지션도 ::before 대상 (실제 구현 6-2 참조) */
.verse-font-dot::before { transition: background 120ms, border-color 120ms, transform 120ms; }

@media (prefers-reduced-motion: reduce) {
    .verse-text,
    .verse-font-dot::before { transition: none; }
}
```

---

## 4. 접근성 (A11y)

| 항목 | 구현 |
|---|---|
| WCAG 1.4.4 Resize Text | 본 기능이 페이지 내 폰트 확대 제공 |
| WCAG 2.5.5 Target Size (Enhanced) | 모든 인터랙티브 요소의 **클릭/탭 영역**이 44×44 px 이상. 점은 24px로 보이지만 44×44 투명 박스 내부에 `::before` 로 그려져 히트 영역이 확보됨. 토글/닫기/초기화 버튼은 width/height 44px |
| 키보드 조작 | Tab 1회로 stepper 진입, ←/→/Home/End 로 단계, Esc 닫기 |
| **roving tabindex** | 선택된 점만 `tabindex=0`, 나머지는 `tabindex=-1` — 표준 radiogroup 패턴 |
| **포커스 이동** | 화살표 키로 단계 변경 시 새 점에 `focus()` |
| 스크린리더 | `role="radiogroup" aria-label`, 각 점 `role="radio" aria-checked` |
| 단계 변경 알림 | `aria-live="polite"` 로 "글씨 크기: 크게 (4단계)" |
| 고대비 | `@media (prefers-contrast: more)` → 점 border 강화 |
| 모션 감소 | `@media (prefers-reduced-motion)` → 트랜지션 0ms |
| 시스템 폰트 사이즈 존중 | `rem` 단위 사용 — 사용자 브라우저 기본값과 곱해져 더 커짐 (의도) |

---

## 5. 영속화 + FOUC 방지

### 5-1. Storage

**`storage-util.js`** 에 `BibleReaderStore` 신설:

```javascript
const STORAGE_KEYS = {
    // 기존...
    BIBLE_READER_FONT_STEP: "bibleReaderFontStep"
};

export const BibleReaderStore = {
    getFontStep() {
        // LocalStore.get 은 내부에서 JSON.parse 를 호출하므로, localStorage 가
        // 외부 도구로 깨진 값(JSON 으로 파싱 불가) 으로 오염된 경우 throw 한다.
        // 호출 측 init 이 중단되지 않도록 여기서 흡수하고 기본값(3) 으로 폴백.
        try {
            const value = parseInt(LocalStore.get(STORAGE_KEYS.BIBLE_READER_FONT_STEP), 10);
            return (Number.isInteger(value) && value >= 1 && value <= 5) ? value : 3;
        } catch (e) {
            return 3;
        }
    },
    saveFontStep(step) {
        const parsed = parseInt(step, 10);
        if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 5) {
            try { LocalStore.set(STORAGE_KEYS.BIBLE_READER_FONT_STEP, parsed); }
            catch (e) { /* storage 차단/할당 실패 환경 무시 */ }
        }
    }
};
```

### 5-2. 진짜 FOUC 방지 — `<head>` 인라인 부트스트랩 스크립트

본문 paint **전**에 `--verse-font-size` 가 결정되어야 한다. `DOMContentLoaded` 의 init() 은 너무 늦다. → **`fragments/head.html` 에 인라인 스크립트 추가**.

**`fragments/head.html`** (verse-list 페이지에만 영향을 주기 위해 `useVerseFontBoot` 플래그 사용):

```html
<!-- 본문 paint 전 verse 폰트 크기 적용 (FOUC 방지) -->
<script th:if="${useVerseFontBoot}">
    (function () {
        try {
            var raw = localStorage.getItem("bibleReaderFontStep");
            var step = parseInt(raw, 10);
            if (!(step >= 1 && step <= 5)) step = 3;
            var map = { 1: "0.875rem", 2: "1.0rem", 3: "1.125rem", 4: "1.3125rem", 5: "1.5rem" };
            document.documentElement.style.setProperty("--verse-font-size", map[step]);
            document.documentElement.setAttribute("data-verse-font-step", String(step));
        } catch (e) { /* 무시 */ }
    })();
</script>
```

`verse-list.html` 의 `head` 호출 시 — **fragment 시그니처는 변경하지 않는다**. 기존 `pageDescription` / `pageKeywords` 가 caller의 `th:with` 로 전달되어 fragment 내부에서 그대로 참조되는 패턴(`fragments/head.html:11-12`)을 동일하게 차용:

```html
<head th:replace="~{fragments/head :: head('성경 구절 읽기...', true, '/css/bible/verse-list.css?v=5.5')}"
      th:with="pageDescription='...',
               pageKeywords='...',
               useVerseFontBoot=true"></head>
```

fragment 내부에서는 `th:if="${useVerseFontBoot}"` 만으로 옵셔널 처리되므로, 기존 3-arg 호출자(`head(title, useCommonCss, extraCss)`) 들은 영향을 받지 않는다. 새 fragment 파라미터 추가도 불필요하다.

### 5-3. CSS는 변수 단일 진입점

```css
:root { --verse-font-size: 1.125rem; }
.verse-text { font-size: var(--verse-font-size); }
```

inline 스크립트는 `:root` 의 변수를 **덮어쓴다** (인라인 style의 우선순위로). LocalStorage 없으면 폴백으로 `:root` 기본값(1.125rem = 3단계) 적용.

---

## 6. 프론트엔드 구현 (How)

### 6-0. 제약 사항

- 백엔드 변경 **없음**
- Bootstrap JS 미사용
- ES6 모듈, 번들러 없음
- 캐시 버스팅 `?v=` bump 필수

### 6-1. HTML — `verse-list.html`

`<header>` 와 `<main>` 사이:

```html
<div id="verseFontControl" class="verse-font-control" data-expanded="false">
    <!-- 접힌 상태: 토글 -->
    <button type="button"
            id="verseFontToggle"
            class="verse-font-toggle"
            aria-expanded="false"
            aria-controls="verseFontPanel"
            aria-label="글씨 크기 조절 열기">
        <span aria-hidden="true">Aa</span>
    </button>

    <!-- 펼친 상태: stepper 패널 -->
    <div id="verseFontPanel"
         class="verse-font-panel d-none"
         aria-hidden="true"
         role="group"
         aria-label="구절 글씨 크기 조절">
        <div class="verse-font-stepper" role="radiogroup" aria-label="글씨 크기 단계 선택">
            <button type="button" class="verse-font-dot" data-step="1" role="radio"
                    aria-checked="false" tabindex="-1" aria-label="1단계 (가장 작게)"></button>
            <button type="button" class="verse-font-dot" data-step="2" role="radio"
                    aria-checked="false" tabindex="-1" aria-label="2단계 (작게)"></button>
            <button type="button" class="verse-font-dot" data-step="3" role="radio"
                    aria-checked="true"  tabindex="0"  aria-label="3단계 (기본)"></button>
            <button type="button" class="verse-font-dot" data-step="4" role="radio"
                    aria-checked="false" tabindex="-1" aria-label="4단계 (크게)"></button>
            <button type="button" class="verse-font-dot" data-step="5" role="radio"
                    aria-checked="false" tabindex="-1" aria-label="5단계 (가장 크게)"></button>
        </div>

        <button type="button" class="verse-font-reset" id="verseFontReset"
                disabled aria-label="기본 크기로 초기화">
            <span class="verse-font-reset-label">초기화</span>
            <span class="verse-font-reset-icon" aria-hidden="true">↺</span>
        </button>
        <button type="button" class="verse-font-close" id="verseFontClose"
                aria-label="글씨 크기 조절 닫기">×</button>

        <span class="visually-hidden" aria-live="polite" id="verseFontLiveRegion"></span>
    </div>
</div>
```

### 6-2. CSS — `verse-list.css`

```css
/* ─────────── 본문 변수 ─────────── */
:root { --verse-font-size: 1.125rem; }

.verse-text {
    font-size: var(--verse-font-size);
    transition: font-size 150ms ease-out;
}

/* ─────────── 컨트롤 바 (기존 sticky 컨벤션 준수) ─────────── */
.verse-font-control {
    position: sticky;
    top: 0;
    z-index: 1; /* 일반 페이지 폴백 */
    background: var(--color-bg-elevated);
    border-bottom: 1px solid var(--color-border);
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 0.25rem 0.75rem;
    min-height: 44px;
}

.has-fixed-nav .verse-font-control {
    top: calc(var(--top-nav-height, 52px));
    z-index: 1020;
    transition: top 300ms ease;
}

@media (max-width: 599.98px) {
    .has-fixed-nav.top-nav-hidden .verse-font-control { top: 0; }
}

/* 펼친 상태 — JS가 data-expanded 전환 */
.verse-font-control[data-expanded="true"] { justify-content: stretch; }
.verse-font-control[data-expanded="true"] .verse-font-toggle { display: none; }

/* ─────────── 토글 버튼 (44x44 hit) ─────────── */
.verse-font-toggle {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 1px solid var(--color-border-control);
    background: transparent;
    color: var(--color-text-primary);
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

/* ─────────── 펼친 패널 ─────────── */
.verse-font-panel {
    display: flex; /* d-none 이 풀리면 flex 활성 */
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    min-height: 56px;
}

/* ─────────── stepper ─────────── */
.verse-font-stepper {
    flex: 1 1 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    /* 5점 × 44px = 220px, gap 0 일 때도 width 220px 보장 */
    max-width: 320px;
    position: relative;
}

/* 연결선 — 점 ::before(24px) 의 시각 중앙선에 위치 */
.verse-font-stepper::before {
    content: "";
    position: absolute;
    left: 22px; right: 22px; top: 50%; /* 44px 박스의 좌우 22px 끝점 = 점 시각 중심 */
    height: 1px;
    background: var(--color-border);
    z-index: 0;
}

/* 점은 44×44 투명 클릭 박스, 시각 점은 ::before 로 24×24 */
.verse-font-dot {
    width: 44px;
    height: 44px;
    min-width: 44px;
    min-height: 44px;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.verse-font-dot::before {
    content: "";
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid var(--color-border-control);
    background: var(--color-bg-elevated);
    transition: background 120ms, border-color 120ms, transform 120ms;
}

.verse-font-dot[aria-checked="true"]::before {
    background: var(--bs-primary, #0d6efd);
    border-color: var(--bs-primary, #0d6efd);
    transform: scale(1.1);
}

.verse-font-dot:focus-visible {
    outline: 2px solid var(--bs-primary, #0d6efd);
    outline-offset: -4px; /* 44px 박스 내부에 표시 */
    border-radius: 50%;
}

/* ─────────── 우측 컨트롤 ─────────── */
.verse-font-reset {
    min-width: 44px;
    height: 44px;
    padding: 0 0.875rem;
    border: 1px solid var(--color-border-control);
    background: transparent;
    color: var(--color-text-primary);
    border-radius: 0.375rem;
    font-size: 0.875rem;
    cursor: pointer;
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}
.verse-font-reset:disabled { opacity: 0.4; cursor: not-allowed; }

/* 기본은 라벨 노출, 아이콘 숨김 */
.verse-font-reset .verse-font-reset-icon { display: none; }

.verse-font-close {
    width: 44px;
    height: 44px;
    min-width: 44px;
    border: none;
    background: transparent;
    color: var(--color-text-primary);
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

/* ─────────── 다크 모드 ─────────── */
html[data-theme="dark"] .verse-font-dot[aria-checked="true"]::before {
    background: #4ea3ff;
    border-color: #4ea3ff;
}

/* ─────────── 미디어 쿼리 ─────────── */
@media (prefers-reduced-motion: reduce) {
    .verse-text,
    .verse-font-dot::before,
    .verse-font-control { transition: none; }
}

@media (prefers-contrast: more) {
    .verse-font-dot::before { border-width: 3px; }
}

/* 모바일 좁은 폭 — stepper 44px×5=220px 는 절대 양보 X.
   대신 container padding / panel gap 축소 + reset 을 아이콘 버튼으로 축약하여 360px viewport 수용.
   계산(360px): 220(stepper) + 8(gap×2) + 44(reset) + 44(close) + 12(container padding) = 328px ≤ 348px(360-12) */
@media (max-width: 419.98px) {
    .verse-font-control { padding: 0.25rem 0.375rem; }
    .verse-font-panel { gap: 0.25rem; }
    .verse-font-stepper { max-width: none; }

    .verse-font-reset {
        width: 44px;
        padding: 0;
        font-size: 1.125rem;
    }
    .verse-font-reset .verse-font-reset-label { display: none; }
    .verse-font-reset .verse-font-reset-icon { display: inline; }
}

/* 인쇄 시 컨트롤 바 숨김, 본문은 기본 크기로 */
@media print {
    .verse-font-control { display: none; }
    .verse-text { font-size: 1rem !important; }
}
```

### 6-3. JS — `verse-list.js`

**import 수정** — 기존 named import 줄에 `BibleReaderStore` 를 **추가**한다 (전체 교체 X):

```diff
- import {BookStore, ChapterStore, LastReadStore, TranslationStore, VerseStore} from "/js/storage-util.js?v=2.3";
+ import {BibleReaderStore, BookStore, ChapterStore, LastReadStore, TranslationStore, VerseStore} from "/js/storage-util.js?v=2.4";
```

**상수 정의:**

```javascript
const VERSE_FONT_SIZES = {
    1: "0.875rem",
    2: "1.0rem",
    3: "1.125rem",
    4: "1.3125rem",
    5: "1.5rem"
};
const FONT_STEP_LABELS = { 1: "가장 작게", 2: "작게", 3: "기본", 4: "크게", 5: "가장 크게" };
const DEFAULT_FONT_STEP = 3;

const fontState = {
    step: DEFAULT_FONT_STEP,
    expanded: false
};
```

#### elements 등록

```javascript
fontControl: get("verseFontControl"),
fontToggle: get("verseFontToggle"),
fontPanel: get("verseFontPanel"),
fontStepper: document.querySelector("#verseFontPanel .verse-font-stepper"),
fontReset: get("verseFontReset"),
fontClose: get("verseFontClose"),
fontLiveRegion: get("verseFontLiveRegion")
```

#### init() 통합

```javascript
async function init() {
    elements = getElements();
    resolveInitialState();
    // FOUC 방지를 위해 inline script가 이미 :root 변수를 세팅했음.
    // 여기서는 fontState만 동기화하고 stepper UI를 맞춤.
    syncFontStepFromBoot();
    bindFontControlEvents();
    // ... 기존
}

function syncFontStepFromBoot() {
    const bootStep = parseInt(document.documentElement.getAttribute("data-verse-font-step"), 10);
    // bootStep 이 유효하면 store 를 읽지 않는다 (단락 평가).
    // LocalStore.get() 내부의 JSON.parse 가 깨진 값에 throw 할 경우 init 이 중단되는 것을 방지.
    let resolved;
    if (bootStep >= 1 && bootStep <= 5) {
        resolved = bootStep;
    } else {
        try {
            resolved = BibleReaderStore.getFontStep();
        } catch (e) {
            resolved = DEFAULT_FONT_STEP;
        }
    }
    fontState.step = resolved;
    applyFontStep(fontState.step, { persist: false, announce: false, focus: false });
}
```

#### applyFontStep

```javascript
function applyFontStep(step, { persist = true, announce = true, focus = true } = {}) {
    // `parseInt(step, 10) || DEFAULT` 는 0/NaN 모두 DEFAULT 로 폴백시켜서
    // 1단계에서 ArrowLeft (step → 0) 시 기본값으로 튀는 버그가 있다.
    // NaN 만 DEFAULT 로 폴백하고 그 외에는 정수로 clamp 한다.
    const parsed = parseInt(step, 10);
    const clamped = Number.isNaN(parsed)
        ? DEFAULT_FONT_STEP
        : Math.max(1, Math.min(5, parsed));
    fontState.step = clamped;

    document.documentElement.style.setProperty("--verse-font-size", VERSE_FONT_SIZES[clamped]);
    document.documentElement.setAttribute("data-verse-font-step", String(clamped));

    // stepper UI 동기화 + roving tabindex
    const dots = document.querySelectorAll(".verse-font-dot");
    dots.forEach(dot => {
        const dotStep = parseInt(dot.dataset.step, 10);
        const checked = dotStep === clamped;
        dot.setAttribute("aria-checked", String(checked));
        dot.setAttribute("tabindex", checked ? "0" : "-1");
        if (checked && focus && fontState.expanded) {
            dot.focus();
        }
    });

    // 초기화 버튼 disabled
    if (elements?.fontReset) {
        elements.fontReset.disabled = (clamped === DEFAULT_FONT_STEP);
    }

    if (persist) BibleReaderStore.saveFontStep(clamped);
    if (announce && elements?.fontLiveRegion) {
        elements.fontLiveRegion.textContent =
            `글씨 크기: ${FONT_STEP_LABELS[clamped]} (${clamped}단계)`;
    }
}
```

#### bindFontControlEvents

```javascript
function bindFontControlEvents() {
    if (!elements.fontControl) return;

    elements.fontToggle?.addEventListener("click", () => toggleFontPanel(true));
    elements.fontClose?.addEventListener("click", () => toggleFontPanel(false));
    elements.fontReset?.addEventListener("click", () => applyFontStep(DEFAULT_FONT_STEP));

    elements.fontStepper?.addEventListener("click", (e) => {
        const dot = e.target.closest("[data-step]");
        if (dot) applyFontStep(dot.dataset.step, { focus: false });
    });

    elements.fontStepper?.addEventListener("keydown", (e) => {
        let nextStep = null;
        if (e.key === "ArrowLeft" || e.key === "ArrowUp")    nextStep = fontState.step - 1;
        else if (e.key === "ArrowRight" || e.key === "ArrowDown") nextStep = fontState.step + 1;
        else if (e.key === "Home")                                nextStep = 1;
        else if (e.key === "End")                                 nextStep = 5;
        // Escape 는 stepper 에서 처리하지 않고 전역 handleFabEscapeKey 로 위임한다.
        // (중복 처리하면 이벤트가 document 까지 버블링되어 FAB까지 같이 닫히는 문제 발생)
        if (nextStep !== null) {
            applyFontStep(nextStep); // focus: true 기본 — 새 점으로 이동
            e.preventDefault();
        }
    });
}

function toggleFontPanel(expand, { returnFocus = true } = {}) {
    const willCollapse = !expand && fontState.expanded;

    // 1) 닫기 직전: 패널 내부에 포커스가 남아 있다면 미리 캐시.
    //    포커스 이동/제거는 DOM 상태 플립 이후에 수행해야 한다.
    //    (현재 시점엔 .verse-font-control[data-expanded="true"] .verse-font-toggle { display:none }
    //     상태라 토글에 .focus() 해도 silent fail 한다.)
    let focusInsidePanel = false;
    let activeBeforeCollapse = null;
    if (willCollapse) {
        activeBeforeCollapse = document.activeElement;
        focusInsidePanel = !!(activeBeforeCollapse && elements.fontPanel?.contains(activeBeforeCollapse));
    }

    // 2) 상태/속성 플립 — 이 시점 이후로 토글이 display:block 으로 복귀
    fontState.expanded = Boolean(expand);
    elements.fontPanel?.classList.toggle("d-none", !fontState.expanded);
    elements.fontPanel?.setAttribute("aria-hidden", String(!fontState.expanded));
    elements.fontToggle?.setAttribute("aria-expanded", String(fontState.expanded));
    elements.fontControl?.setAttribute("data-expanded", String(fontState.expanded));

    // 3) 포커스 처리 — DOM 가시성이 확정된 후에 호출해야 적용된다
    if (fontState.expanded) {
        // 펼치자마자 현재 선택된 점에 포커스
        const checked = elements.fontStepper?.querySelector('[aria-checked="true"]');
        checked?.focus();
    } else if (focusInsidePanel) {
        if (returnFocus) {
            // 명시적 닫기(Esc/×) — 이제 토글이 보이는 상태이므로 focus 적용됨
            elements.fontToggle?.focus();
        } else {
            // 외부 클릭으로 닫힘 — 패널 내부에 남아 있는 active 를 blur 하여
            // hidden 요소에 포커스가 머무는 a11y 위반 방지.
            // (대상 페이지의 .verse-text 는 div 라 native focusable 이 아니므로
            //  외부 클릭 후에도 활성 요소가 여전히 패널 내부에 머무는 분기가 실제 발동된다.)
            activeBeforeCollapse?.blur();
        }
    }
}
```

#### 외부 클릭 핸들러 통합

기존 `handleOutsideFabClick` 와 폰트 패널 외부 클릭을 **하나의 글로벌 핸들러**로 통합:

```javascript
function handleGlobalOutsideClick(event) {
    // FAB
    const fab = elements?.fab;
    if (fab && !fab.classList.contains("d-none") && !event.target.closest("#verseFab")) {
        closeFabMenu();
    }
    // 폰트 패널 — 외부 클릭이므로 포커스를 토글로 강제 복귀시키지 않는다.
    // toggleFontPanel 내부에서 패널에 포커스가 남아 있고 returnFocus=false 인 경우
    // blur() 처리하여 hidden 요소에 포커스가 머무는 a11y 위반을 방지한다.
    if (fontState.expanded && !event.target.closest("#verseFontControl")) {
        toggleFontPanel(false, { returnFocus: false });
    }
}
// bindEvents() 안에서:
document.addEventListener("click", handleGlobalOutsideClick);
// 기존 handleOutsideFabClick 등록은 제거
```

#### ESC 우선순위 체인

```javascript
function handleFabEscapeKey(event) {
    if (event.key !== "Escape") return;
    // 1. 장 메모 패널
    if (!elements.chapterMemoOverlay?.classList.contains("d-none")) {
        closeChapterMemoPanel();
        return;
    }
    // 2. 폰트 패널 — Esc 는 명시적 닫기이므로 토글로 포커스 복귀
    if (fontState.expanded) {
        toggleFontPanel(false, { returnFocus: true });
        return;
    }
    // 3. FAB
    const fab = elements?.fab;
    if (!fab || fab.classList.contains("d-none")) return;
    closeFabMenu();
}
```

### 6-4. 캐시 버스팅

| 파일 | 변경 |
|---|---|
| `verse-list.html` 안 `verse-list.css?v=` | 5.4 → 5.5 |
| `verse-list.html` 안 `verse-list.js?v=` | 3.6 → 3.7 |
| `verse-list.js` 안 `storage-util.js?v=` | 2.3 → 2.4 |
| `fragments/head.html` | 인라인 스크립트 추가, fragment 자체는 별도 버전 없음 → 영향 없음 |

> `storage-util.js` 를 import 하는 다른 페이지는 자체 버전 그대로 두면 캐시상 별도 인스턴스로 유지되지만, 다른 페이지에서 `BibleReaderStore` 를 사용하지 않으므로 기능 영향 없음. 일관성을 원하면 함께 bump 가능.

---

## 7. 미래 확장 (Out of Scope, Phase 2)

| 확장 | 비고 |
|---|---|
| 줄 간격(line-height) 조절 | 같은 컨트롤 바에 두 번째 행 |
| 서체(폰트 패밀리) — 명조/고딕 | 한국어 가독성 |
| 글자 굵기(weight) | regular/medium |
| 서버 동기화 | 멀티 디바이스 동일 환경 — Member prefs 테이블 |
| 자동 야간 가독 모드 연동 | 다크 진입 시 자동 +1 단계 |
| 타 페이지 확장 | `study/*`, `game/*` 등 |
| 되돌리기(undo) 스택 | "방금 전 크기로" |

---

## 8. 구현 순서

1. **상수/스토어** — `VERSE_FONT_SIZES`, `BibleReaderStore` 추가
2. **`fragments/head.html` 인라인 부트스트랩 스크립트** — FOUC 차단
3. **CSS** — `:root --verse-font-size`, `.verse-text { font-size: var(...) }`, 컨트롤 바 / stepper / 미디어쿼리
4. **HTML 마운트** — header 와 main 사이 컨트롤 바
5. **JS 로직** — `applyFontStep`, `toggleFontPanel`, roving tabindex/포커스, 외부 클릭 통합, ESC 우선순위
6. **검증** — FOUC, a11y(키보드 only / 스크린리더), 충돌(FAB/메모/스포트라이트), 다크 모드, 모바일 360px
7. **캐시 버스팅** — `?v=` bump

---

## 9. 검증 시나리오 (수동 QA)

| # | 시나리오 | 기대 결과 |
|---|---|---|
| 1 | 첫 방문 | 3단계(M)로 본문, 초기화 버튼 disabled, 토글만 노출 |
| 2 | `Aa` 토글 클릭 | 패널 펼침, 토글 사라짐, 활성 점(3)에 포커스 |
| 3 | 5단계 점 클릭 | 본문 즉시 1.5rem, ●5 이동, 초기화 활성화 |
| 4 | 키보드 → 5회 | 1→2→3→4→5 순차 적용, 5단계에서 더 이상 안 늘어남 |
| 5 | 키보드 End | 즉시 5단계 + 포커스 5번째 점 |
| 6 | 키보드 Home | 1단계 + 포커스 1번째 점 |
| 7 | 초기화 클릭 | 3단계 복귀 + 초기화 버튼 disabled |
| 8 | × 클릭 | 패널 접힘, 토글로 포커스 복귀 |
| 9 | 외부 영역(예: 구절 본문 `.verse-text` div) 클릭 | 패널 접힘. `.verse-text` 가 non-focusable 이므로 클릭으로 포커스가 거기로 이동하지 않고 패널 내부에 남으나, **`blur()` 처리로 active 가 제거**되고 토글로 **강제 복귀하지 않음** (FAB/메모/타 영역 동작에 간섭 X) |
| 10 | Esc (패널 열림) | 패널 접힘, 토글로 포커스 복귀 |
| 11 | Esc (패널 닫힘 + FAB 열림) | FAB만 닫힘 (우선순위) |
| 12 | 다음 장 이동 | 같은 크기 적용, 깜빡임 없음 |
| 13 | 페이지 새로고침 | FOUC 없음 (paint 전 인라인 스크립트 적용) |
| 14 | 다른 PC | 그 기기의 3단계 (디바이스별 분리 의도) |
| 15 | 구절 선택 후 폰트 변경 | `.active` 밑줄·FAB 유지, 본문만 리사이즈 |
| 16 | 메모 열린 상태에서 폰트 변경 | textarea 무영향, 본문만 리사이즈 |
| 17 | 다크 모드 stepper 가시성 | 활성 점 `#4ea3ff` 로 명확 |
| 18 | 360px 모바일 | 5점 + 초기화 + × 한 줄 안에 수용 |
| 19 | 모바일 스크롤 다운 → top-nav-hidden | 컨트롤 바 `top: 0` 으로 재배치 |
| 20 | 스크린리더 활성 (NVDA/VoiceOver) | "글씨 크기: 크게 (4단계)" 안내 |
| 21 | Tab 키로 진입 | 1회 Tab으로 활성 점에 도달, 나머지 점은 skip |
| 22 | `prefers-reduced-motion: reduce` | 트랜지션 0ms |
| 23 | `prefers-contrast: more` | 점 border 3px |
| 24 | 인쇄 미리보기 | 컨트롤 바 숨김, 본문 1rem 고정 |
| 25 | 시스템 브라우저 폰트 사이즈 20px로 키운 사용자 | 본문이 비례적으로 더 큼 (의도) |

---

## 10. 기존 패턴 대조

| 항목 | 기존 | 본 기능 |
|---|---|---|
| Sticky 컨트롤 바 | `search-controls`, `my-memo-tabs` (`z-index: 1020`, `top: var(--top-nav-height)`) | 동일 컨벤션 |
| 영속화 | TranslationStore / ChapterStore (LocalStore) | `BibleReaderStore` (LocalStore) |
| 외부 클릭 닫기 | `handleOutsideFabClick` (FAB) | **통합** `handleGlobalOutsideClick` (FAB + 폰트) |
| ESC 우선순위 | 장 메모 → FAB | 장 메모 → **폰트 패널** → FAB |
| 다크 모드 | CSS 변수 토큰 | 동일 |
| top-nav-hidden 대응 | `search.css` 에 사례 있음 | 동일 패턴 차용 |
| Bootstrap JS | 미사용 | 미사용 |
| 백엔드 | 필요 (메모/형광펜) | **불필요** |
| FOUC 방지 | 다크 모드는 `theme.js` 가 head 안에서 즉시 적용 | 동일 — 인라인 부트스트랩 스크립트 |
