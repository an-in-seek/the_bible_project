# 구절 글씨 크기 동적 설정 기능 설계 (Verse Font Size)

`verse-list.html` 화면에서 사용자가 **구절 본문(.verse-text)의 글씨 크기를 직접 조절·저장**할 수 있도록 한다.

> 노인층·시각약자·저시력 사용자가 성경 본문을 편안하게 읽도록 하는 **접근성(a11y) 우선 기능**이며, 모든 사용자에게 가독성 커스터마이즈를 제공한다.

---

## 1. UX 목표

| 목표 | 설명 |
|---|---|
| 즉시 가독성 확보 | 한 번의 조작으로 본문이 즉시 커지거나 작아져야 한다. 모달·서브페이지 이동 금지. |
| 상시 노출 X / 필요 시 노출 O | 평소엔 작은 `Aa` 토글만, 필요 시 dropdown 패널 펼침. |
| 장 이동·새로고침에도 보존 | `LocalStore`에 영구 저장. |
| 읽기 흐름 비방해 | 구절 선택/FAB/메모와 충돌하지 않음. |
| WCAG 2.1 SC 1.4.4 / 2.5.5 | 키보드·스크린리더·터치 모두 지원, 44×44 px 히트 영역. |
| 브라우저 줌과 차별화 | 본문(`.verse-text`)만 확대 — 헤더·네비·버튼은 그대로. |
| 시스템 폰트 사이즈 존중 | `rem` 단위로 사용자 브라우저 기본값과 비례. |
| 자기설명형 UI | Aa 텍스트가 단계별로 비례 크기 → 라벨 없이 시각적으로 크기 인지. |

---

## 2. UX 사양

### 2-1. 글씨 크기 단계 (균등 ~1.16x 로그 스케일)

| 단계 | 라벨 | rem | px (16px 기준) | Aa 표시 크기 |
|---|---|---|---|---|
| 1 | 가장 작게 | `0.875rem` | 14px | 0.75rem |
| 2 | 작게 | `1.0rem` | 16px | 0.875rem |
| 3 | **기본** | `1.125rem` | **18px** | 1.0rem |
| 4 | 크게 | `1.3125rem` | 21px | 1.25rem |
| 5 | 가장 크게 | `1.5rem` | 24px | 1.5rem |

본문 크기와 stepper 의 Aa 표시 크기는 별도 맵. Aa 시각 크기는 stepper 가독성 우선(너무 크면 토글 박스 초과). 인접 단계 증분 +12.5% ~ +16.7%.

### 2-2. 위치 / 구조

**토글 위치**: 상단 네비게이션 우측 (`header.html` 의 `.top-nav-right` 안, `topNavSearchLink` 와 `topNavNotificationButton` 사이).

**노출 조건**: `useVerseFontBoot` 모델 어트리뷰트가 `true` 일 때만 (`@ControllerAdvice` 에서 `request.requestURI.startsWith("/web/bible/verse")` 로 자동 판정).

**펼침 방식**: 토글 클릭 시 패널이 dropdown 으로 표시.
- 데스크탑/태블릿 (`>= 420px`): `position: absolute; right: 0; top: calc(100% + 0.25rem)` — 토글 하단 우측 정렬
- 모바일 (`< 420px`): `position: fixed; left: 50%; transform: translateX(-50%)` — viewport 중앙 고정 (좌우 thumb reach 균형)

**펼친 상태 레이아웃**:

```
Aa  Aa  Aa  Aa  Aa     [초기화]  [×]
sm   s   M   l   xl
```

5개의 `Aa` 버튼 (44×44 hit + 비례 크기 텍스트) + 초기화(라벨/아이콘) + 닫기.

### 2-3. 인터랙션

| 트리거 | 동작 | 피드백 |
|---|---|---|
| `Aa` 토글 클릭 | 패널 펼침, 활성 단계의 Aa 에 포커스 | 즉시 토글 |
| `Aa` 버튼 클릭/탭 | 해당 크기 즉시 적용 | 본문 font-size 150ms 트랜지션 |
| 키보드 ←/↑ (stepper 포커스 시) | 한 단계 작게 + 새 Aa 에 포커스 이동 | `aria-live` 안내 |
| 키보드 →/↓ | 한 단계 크게 + 포커스 이동 | 동일 |
| 키보드 Home/End | 1단계 / 5단계 점프 + 포커스 이동 | 동일 |
| Space/Enter (Aa 포커스 시) | 해당 단계 적용 | 동일 |
| 초기화 클릭 | 3단계로 복귀. 패널은 닫지 않음. | 기본 상태에서 disabled |
| × 클릭 / Esc | 패널 접힘 + 토글로 포커스 복귀 | — |
| 외부 영역 클릭 | 패널 접힘. `.verse-text` 등 non-focusable 클릭이면 패널 내부 포커스를 `blur()` 처리(hidden 요소에 active 잔존 방지) | — |
| 장 이동 / 새로고침 | 동일 크기 즉시 적용 (FOUC 없음) | — |

### 2-4. 적용 범위

**적용 대상**: `.verse-text` (구절 본문) **만**.

**적용 제외**: 구절 번호, 메모 textarea, FAB, 버튼, 헤더/네비, 패널 자체.

### 2-5. 충돌 회피

| 상황 | 처리 |
|---|---|
| FAB 표시 중 | 컨트롤은 상단 nav, FAB 는 하단 fixed — 영역 분리. 외부 클릭 핸들러는 `handleGlobalOutsideClick` 으로 통합 |
| 메모 영역 열린 상태 | textarea 는 영향 없음, 본문만 리사이즈 |
| 스포트라이트(z-index 998) | 패널 z-index 1030 이지만 stepper 사용 중 검색 진입 시나리오는 드묾. 외부 클릭으로 자연 닫힘 |
| top-nav-hidden(모바일 스크롤) | 모바일 분기에서 `top: 0.25rem` 으로 보정 |
| ESC 우선순위 | 장 메모 패널 → **폰트 패널** → FAB |

---

## 3. 시각 / 모션

### 3-1. 토글 버튼

- 다른 nav 버튼과 동일한 `top-nav-btn btn btn-outline-secondary` 스타일
- 44×44 원형 + `Aa` 라벨 (font-weight 600)

### 3-2. 펼친 패널

- 부유 dropdown: `background: var(--color-bg-elevated)`, `border 1px var(--color-border)`, `border-radius 0.5rem`, `box-shadow 0 0.5rem 1rem var(--color-shadow)`
- 최소 높이 56px, 가로 padding 0.75rem

### 3-3. stepper 의 Aa 버튼

- **시각 크기**: 14px → 24px 비례 (자기설명형 UI — Aa 자체가 크기 메타포)
- **히트 영역**: 모든 단계 44×44 (시각 크기와 무관, WCAG 2.5.5 보장)
- **활성 단계**: 채워진 원 배경(`var(--bs-primary)`) + 흰 텍스트(`font-weight: 700`) — 강한 시각 위계
- **호버**(데스크탑): 미선택 단계는 미세 배경 강조 (`@media (hover: hover) and (pointer: fine)`)
- **다크 모드 활성 단계**: 배경 `#4ea3ff`, 텍스트 `#0f1216` (대비 보강)

### 3-4. 트랜지션

```css
.verse-text { transition: font-size 150ms ease-out; }
.verse-font-dot { transition: background 120ms, color 120ms; }
.verse-font-dot-label { transition: font-weight 120ms; }

@media (prefers-reduced-motion: reduce) {
    .verse-text,
    .verse-font-dot,
    .verse-font-dot-label,
    .verse-font-control { transition: none; }
}
```

---

## 4. 접근성 (A11y)

| 항목 | 구현 |
|---|---|
| WCAG 1.4.4 Resize Text | 페이지 내 5단계 폰트 확대 제공 |
| WCAG 2.5.5 Target Size (Enhanced) | 모든 인터랙티브 요소 44×44 px (Aa 시각 크기는 다양해도 클릭 박스는 동일 44px) |
| 키보드 조작 | Tab 1회로 stepper 진입, ←→/↑↓/Home/End 로 단계, Esc 닫기 |
| Roving tabindex | 선택된 Aa 만 `tabindex=0`, 나머지 `-1` (표준 radiogroup) |
| 포커스 이동 | 화살표 키 단계 변경 시 새 Aa 에 `focus()` |
| 스크린리더 | `role="radiogroup"`, 각 Aa `role="radio" aria-checked aria-label="1단계 (가장 작게)"` |
| 단계 변경 알림 | `aria-live="polite"` 로 "글씨 크기: 크게 (4단계)" |
| 고대비 | `prefers-contrast: more` → 활성 단계에 outline 2px 추가 |
| 모션 감소 | `prefers-reduced-motion: reduce` → transition 0ms |
| 시스템 폰트 존중 | `rem` 단위 사용 |

---

## 5. 영속화 + FOUC 방지

### 5-1. Storage (`storage-util.js`)

`BibleReaderStore` 가 `LocalStore.get/set` 을 래핑하면서 try/catch 로 localStorage 차단/오염 환경 안전 폴백 (기본값 3):

```javascript
const BIBLE_READER_FONT_STEP_KEY = "bibleReaderFontStep";
const BIBLE_READER_FONT_STEP_DEFAULT = 3;

export const BibleReaderStore = {
    getFontStep() {
        try {
            const value = parseInt(LocalStore.get(BIBLE_READER_FONT_STEP_KEY), 10);
            return (Number.isInteger(value) && value >= 1 && value <= 5)
                ? value
                : BIBLE_READER_FONT_STEP_DEFAULT;
        } catch (e) {
            return BIBLE_READER_FONT_STEP_DEFAULT;
        }
    },
    saveFontStep(step) {
        const parsed = parseInt(step, 10);
        if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 5) {
            try { LocalStore.set(BIBLE_READER_FONT_STEP_KEY, parsed); }
            catch (e) { /* 차단/할당 실패 환경 무시 */ }
        }
    }
};
```

### 5-2. FOUC 방지 — `fragments/head.html` 인라인 부트스트랩 스크립트

본문 paint **전** 에 `--verse-font-size` 가 결정되어야 한다. `DOMContentLoaded` 의 init() 은 너무 늦다.

```html
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

### 5-3. CSS 변수 단일 진입점

```css
:root { --verse-font-size: 1.125rem; }
.verse-text { font-size: var(--verse-font-size); }
```

인라인 스크립트가 `:root` 변수를 paint 전 덮어쓴다. LocalStorage 없으면 `:root` 기본값(3단계) 폴백.

---

## 6. 구현

### 6-0. 제약 사항

- Bootstrap JS 미사용 (프로젝트 정책)
- ES6 모듈, 번들러 없음
- 캐시 버스팅 `?v=` bump 필수

### 6-1. ControllerAdvice — `GlobalModelAttribute.kt`

`useVerseFontBoot` 을 path 기반 모델 어트리뷰트로 주입. 기존 `currentPath` 와 동일 패턴(템플릿 fragment 어디서나 안정적 접근).

```kotlin
@ControllerAdvice
class GlobalModelAttribute {

    @ModelAttribute("currentPath")
    fun currentPath(request: HttpServletRequest): String = request.requestURI

    @ModelAttribute("useVerseFontBoot")
    fun useVerseFontBoot(request: HttpServletRequest): Boolean =
        request.requestURI.startsWith("/web/bible/verse")
}
```

> `th:with` 로 fragment 에 변수 전파하는 방식은 환경에 따라 평가가 불안정. ControllerAdvice 가 더 안정적.

### 6-2. 헤더 fragment — `fragments/header.html`

`.top-nav-right` 의 `topNavSearchLink` 와 `topNavNotificationButton` 사이에 삽입:

```html
<div id="verseFontControl"
     class="verse-font-control top-nav-font"
     data-expanded="false"
     th:if="${useVerseFontBoot}">
    <button id="verseFontToggle"
            type="button"
            class="verse-font-toggle top-nav-btn btn btn-outline-secondary"
            aria-expanded="false"
            aria-controls="verseFontPanel"
            aria-label="글씨 크기 조절 열기"
            title="글씨 크기 조절">
        <span aria-hidden="true">Aa</span>
    </button>
    <div id="verseFontPanel"
         class="verse-font-panel d-none"
         aria-hidden="true"
         role="group"
         aria-label="구절 글씨 크기 조절">
        <div class="verse-font-stepper" role="radiogroup" aria-label="글씨 크기 단계 선택">
            <button type="button" class="verse-font-dot" data-step="1" role="radio"
                    aria-checked="false" tabindex="-1" aria-label="1단계 (가장 작게)">
                <span class="verse-font-dot-label" aria-hidden="true">Aa</span>
            </button>
            <!-- ...단계 2~5 동일 구조... -->
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

### 6-3. CSS — `verse-list.css`

핵심 구조:

```css
:root { --verse-font-size: 1.125rem; }

.verse-text {
    font-size: var(--verse-font-size);
    transition: font-size 150ms ease-out;
}

/* 컨트롤 — top-nav-right 내부 인라인 컨테이너 */
.verse-font-control {
    position: relative;
    display: inline-flex;
    align-items: center;
}

/* 패널 — 데스크탑 dropdown */
.verse-font-panel {
    position: absolute;
    top: calc(100% + 0.25rem);
    right: 0;
    z-index: 1030;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 56px;
    padding: 0.5rem 0.75rem;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    box-shadow: 0 0.5rem 1rem var(--color-shadow);
    white-space: nowrap;
}

/* Aa 버튼 — 44×44 hit + 비례 크기 텍스트 */
.verse-font-dot {
    width: 44px; height: 44px;
    min-width: 44px; min-height: 44px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--color-text-secondary, #6c757d);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background 120ms, color 120ms;
}

.verse-font-dot[data-step="1"] .verse-font-dot-label { font-size: 0.75rem; }
.verse-font-dot[data-step="2"] .verse-font-dot-label { font-size: 0.875rem; }
.verse-font-dot[data-step="3"] .verse-font-dot-label { font-size: 1rem; }
.verse-font-dot[data-step="4"] .verse-font-dot-label { font-size: 1.25rem; }
.verse-font-dot[data-step="5"] .verse-font-dot-label { font-size: 1.5rem; }

/* 활성 단계 — 채워진 원 + 흰 텍스트 */
.verse-font-dot[aria-checked="true"] {
    background: var(--bs-primary, #0d6efd);
    color: #fff;
}
.verse-font-dot[aria-checked="true"] .verse-font-dot-label { font-weight: 700; }

/* 다크 모드 활성 단계 대비 보강 */
html[data-theme="dark"] .verse-font-dot[aria-checked="true"] {
    background: #4ea3ff;
    color: #0f1216;
}

/* 모바일 — 패널 viewport 중앙 고정 정렬 */
@media (max-width: 419.98px) {
    .verse-font-panel {
        position: fixed;
        top: calc(var(--top-nav-height, 52px) + 0.25rem);
        left: 50%;
        right: auto;
        transform: translateX(-50%);
        gap: 0.25rem;
        padding: 0.5rem 0.5rem;
    }
    .has-fixed-nav.top-nav-hidden .verse-font-panel { top: 0.25rem; }
    .verse-font-stepper { gap: 0; }

    /* reset 라벨 → 아이콘 축약 */
    .verse-font-reset { width: 44px; padding: 0; font-size: 1.125rem; }
    .verse-font-reset .verse-font-reset-label { display: none; }
    .verse-font-reset .verse-font-reset-icon { display: inline; }
}

/* 인쇄 — 컨트롤 숨김, 본문 기본 크기 */
@media print {
    .verse-font-control { display: none; }
    .verse-text { font-size: 1rem !important; }
}

/* 다크 모드 스포트라이트 가독성 — 흰 카드 위에서 어두운 글씨 강제
   (다크 모드 .verse-text 가 흰색 강제 적용되므로 override 필요) */
html[data-theme="dark"] .verse-text.verse-spotlight-target,
html[data-theme="dark"] .verse-text.text-body.verse-spotlight-target {
    color: #1f2933 !important;
}
```

### 6-4. JS — `verse-list.js`

#### import (기존 named import 에 추가)

```javascript
import {BibleReaderStore, BookStore, ChapterStore, LastReadStore, TranslationStore, VerseStore} from "/js/storage-util.js?v=2.4";
```

#### 상수 / 상태

```javascript
const VERSE_FONT_SIZES = {1: "0.875rem", 2: "1.0rem", 3: "1.125rem", 4: "1.3125rem", 5: "1.5rem"};
const FONT_STEP_LABELS = {1: "가장 작게", 2: "작게", 3: "기본", 4: "크게", 5: "가장 크게"};
const DEFAULT_FONT_STEP = 3;
const fontState = { step: DEFAULT_FONT_STEP, expanded: false };
```

#### init() 통합

```javascript
async function init() {
    elements = getElements();
    // ... 기존
    syncFontStepFromBoot();
    bindFontControlEvents();
    await loadChapter("CURRENT");
}

function syncFontStepFromBoot() {
    const bootStep = parseInt(document.documentElement.getAttribute("data-verse-font-step"), 10);
    let resolved;
    if (bootStep >= 1 && bootStep <= 5) {
        resolved = bootStep;  // 부트 스크립트가 이미 적용한 값 신뢰 — store 호출 스킵
    } else {
        try { resolved = BibleReaderStore.getFontStep(); }
        catch (e) { resolved = DEFAULT_FONT_STEP; }
    }
    fontState.step = resolved;
    applyFontStep(fontState.step, {persist: false, announce: false, focus: false});
}
```

#### applyFontStep — clamp 안전 처리

```javascript
function applyFontStep(step, {persist = true, announce = true, focus = true} = {}) {
    // parseInt("0") || DEFAULT 패턴은 1단계 ArrowLeft 시 0이 DEFAULT 로 폴백되어 3으로 튀는 버그.
    // NaN 만 DEFAULT, 그 외 1~5 로 clamp.
    const parsed = parseInt(step, 10);
    const clamped = Number.isNaN(parsed)
        ? DEFAULT_FONT_STEP
        : Math.max(1, Math.min(5, parsed));
    fontState.step = clamped;

    document.documentElement.style.setProperty("--verse-font-size", VERSE_FONT_SIZES[clamped]);
    document.documentElement.setAttribute("data-verse-font-step", String(clamped));

    document.querySelectorAll(".verse-font-dot").forEach(dot => {
        const dotStep = parseInt(dot.dataset.step, 10);
        const checked = dotStep === clamped;
        dot.setAttribute("aria-checked", String(checked));
        dot.setAttribute("tabindex", checked ? "0" : "-1");  // roving tabindex
        if (checked && focus && fontState.expanded) dot.focus();
    });

    if (elements?.fontReset) elements.fontReset.disabled = (clamped === DEFAULT_FONT_STEP);
    if (persist) BibleReaderStore.saveFontStep(clamped);
    if (announce && elements?.fontLiveRegion) {
        elements.fontLiveRegion.textContent =
            `글씨 크기: ${FONT_STEP_LABELS[clamped]} (${clamped}단계)`;
    }
}
```

#### toggleFontPanel — 상태 플립 후 포커스 처리

```javascript
function toggleFontPanel(expand, {returnFocus = true} = {}) {
    const willCollapse = !expand && fontState.expanded;

    // 1) 닫기 직전: 패널 내부 포커스 캐시 (포커스 이동은 DOM 가시성 확정 후)
    let focusInsidePanel = false;
    let activeBeforeCollapse = null;
    if (willCollapse) {
        activeBeforeCollapse = document.activeElement;
        focusInsidePanel = !!(activeBeforeCollapse && elements.fontPanel?.contains(activeBeforeCollapse));
    }

    // 2) 상태/속성 플립
    fontState.expanded = Boolean(expand);
    elements.fontPanel?.classList.toggle(UI_CLASSES.HIDDEN, !fontState.expanded);
    elements.fontPanel?.setAttribute("aria-hidden", String(!fontState.expanded));
    elements.fontToggle?.setAttribute("aria-expanded", String(fontState.expanded));
    elements.fontControl?.setAttribute("data-expanded", String(fontState.expanded));

    // 3) 포커스 처리 — DOM 가시성 확정 후
    if (fontState.expanded) {
        const checked = elements.fontStepper?.querySelector('[aria-checked="true"]');
        checked?.focus();
    } else if (returnFocus) {
        // 명시적 닫기(Esc/×) — focusInsidePanel 여부 무관하게 항상 토글로 복귀
        // (사용자가 Tab 으로 패널 밖에 나간 뒤 Esc 누른 시나리오도 보장)
        elements.fontToggle?.focus();
    } else if (focusInsidePanel) {
        // 외부 클릭 + 패널 내부에 포커스 남음 — blur 하여 hidden 요소에 active 잔존 방지
        // (.verse-text 는 div 라 non-focusable 이므로 이 분기가 실제 발동)
        activeBeforeCollapse?.blur();
    }
}
```

#### 외부 클릭 통합 핸들러

`handleOutsideFabClick` 을 `handleGlobalOutsideClick` 으로 교체 (FAB + 폰트 패널 한 곳에서 처리):

```javascript
function handleGlobalOutsideClick(event) {
    const fab = elements?.fab;
    if (fab && !fab.classList.contains("d-none") && !event.target.closest("#verseFab")) {
        closeFabMenu();
    }
    if (fontState.expanded && !event.target.closest("#verseFontControl")) {
        toggleFontPanel(false, {returnFocus: false});
    }
}
```

#### ESC 체인

`handleFabEscapeKey` 에 폰트 패널을 장 메모와 FAB 사이에 삽입:

```javascript
function handleFabEscapeKey(event) {
    if (event.key !== "Escape") return;
    if (!elements.chapterMemoOverlay?.classList.contains("d-none")) {
        closeChapterMemoPanel(); return;
    }
    if (fontState.expanded) {
        toggleFontPanel(false, {returnFocus: true}); return;
    }
    const fab = elements?.fab;
    if (!fab || fab.classList.contains("d-none")) return;
    closeFabMenu();
}
```

#### stepper 키보드 핸들러

Escape 는 처리하지 않음 (전역 `handleFabEscapeKey` 로 위임; 중복 처리하면 FAB 까지 같이 닫힘):

```javascript
elements.fontStepper?.addEventListener("keydown", (e) => {
    let nextStep = null;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") nextStep = fontState.step - 1;
    else if (e.key === "ArrowRight" || e.key === "ArrowDown") nextStep = fontState.step + 1;
    else if (e.key === "Home") nextStep = 1;
    else if (e.key === "End") nextStep = 5;
    if (nextStep !== null) { applyFontStep(nextStep); e.preventDefault(); }
});
```

### 6-5. 캐시 버스팅

| 파일 | 현재 버전 |
|---|---|
| `verse-list.html` 의 `verse-list.css?v=` | `6.0` |
| `verse-list.html` 의 `verse-list.js?v=` | `3.7` |
| `verse-list.js` 내 `storage-util.js?v=` | `2.4` |

---

## 7. QA 시나리오

| # | 시나리오 | 기대 결과 |
|---|---|---|
| 1 | 첫 방문 (storage 없음) | 3단계로 본문, 초기화 disabled, 토글만 노출 |
| 2 | `Aa` 토글 클릭 | 패널 펼침, 활성 Aa(3) 에 포커스 |
| 3 | 5단계 Aa 클릭 | 본문 즉시 1.5rem, 5단계 Aa 가 채워진 원+흰글씨로 강조, 초기화 활성화 |
| 4 | 키보드 → 5회 | 1→2→3→4→5 순차 적용, 5단계에서 더 증가 안 함 |
| 5 | 키보드 End | 즉시 5단계 + 5번째 Aa 에 포커스 |
| 6 | 키보드 Home | 1단계 + 1번째 Aa 에 포커스 |
| 7 | **1단계에서 ←/Home** | 1단계 유지 (parseInt(0)\|\|DEFAULT 버그 없음) |
| 8 | 초기화 클릭 | 3단계 복귀, 초기화 disabled. 패널은 닫히지 않음 |
| 9 | × 클릭 | 패널 접힘, 토글로 포커스 복귀 |
| 10 | 외부 영역(구절 본문 div) 클릭 | 패널 접힘. `.verse-text` 는 non-focusable 이므로 패널 내부 포커스가 `blur()` 처리되어 hidden active 잔존 X. 토글로 강제 복귀 X |
| 11 | Esc (패널 열림, 포커스 패널 내부) | 패널 접힘, 토글로 포커스 복귀 |
| 12 | Esc (패널 열림 + Tab 으로 포커스 외부 이동 후) | 패널 접힘, 토글로 포커스 복귀 (focusInsidePanel false 여도 returnFocus:true) |
| 13 | Esc (패널 닫힘 + FAB 열림) | FAB 만 닫힘 (우선순위 체인) |
| 14 | 다음 장 이동 | 동일 크기 적용 |
| 15 | 페이지 새로고침 | FOUC 없음 (paint 전 인라인 스크립트가 :root 변수 세팅) |
| 16 | 다른 기기 접속 | 그 기기의 기본값(3단계) 적용 (디바이스별 분리 의도) |
| 17 | 구절 선택 후 폰트 변경 | `.active` 밑줄/FAB 유지, 본문만 리사이즈 |
| 18 | 메모 열린 상태에서 폰트 변경 | textarea 무영향, 본문만 리사이즈 |
| 19 | 다크 모드 활성 단계 시인성 | 활성 단계가 `#4ea3ff` 배경 + 어두운 텍스트로 명확 |
| 20 | 다크 모드 + verseNumber 진입(스포트라이트) | 흰 카드 위에서 본문 텍스트가 어두운 색으로 가독 |
| 21 | 360px 모바일 | 패널이 viewport 중앙(`translateX(-50%)`) 에 fixed 정렬, reset 아이콘(↺) 으로 축약 |
| 22 | 모바일 스크롤 다운 → top-nav-hidden | 패널 `top: 0.25rem` 으로 보정 |
| 23 | 키보드 Tab 진입 | 1회 Tab 으로 활성 Aa 에 도달, 나머지 Aa 는 skip (roving tabindex) |
| 24 | 스크린리더 (NVDA/VoiceOver) | "글씨 크기: 크게 (4단계)" aria-live 안내 |
| 25 | `prefers-reduced-motion: reduce` | 트랜지션 0ms |
| 26 | `prefers-contrast: more` | 활성 단계에 outline 추가 |
| 27 | 인쇄 미리보기 | 컨트롤 숨김, 본문 1rem 고정 |
| 28 | 다른 페이지 진입 (`/web/bible/book` 등) | 토글 미노출 (`useVerseFontBoot` 가 false) |
| 29 | localStorage 차단 환경 | 기본값(3) 폴백, 에러 없음 |
| 30 | localStorage 깨진 값(`"abc"`) | try/catch 흡수, 기본값 폴백 |

---

## 8. 미래 확장 (Out of Scope)

| 확장 | 비고 |
|---|---|
| 줄 간격(line-height) 조절 | 같은 패널에 두 번째 행 |
| 서체(폰트 패밀리) 선택 | 한국어 가독성 (명조/고딕) |
| 글자 굵기(weight) 조절 | regular/medium |
| 서버 동기화 | 멀티 디바이스 통일 — Member prefs 테이블 |
| 자동 야간 가독 모드 연동 | 다크 진입 시 +1 단계 자동 |
| 타 페이지 확장 | `study/*`, `game/*` — 컨트롤만 마운트하면 즉시 가능 |
| 되돌리기(undo) 스택 | "방금 전 크기로" |
