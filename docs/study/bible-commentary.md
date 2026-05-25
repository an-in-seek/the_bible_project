# 성경 주석 (Bible Commentary) — 기획 및 설계 문서

> 작성일: 2026-05-25
> 담당 도메인: study
> 상태: 설계 완료 (구현 전)

---

## 1. 개요 (Overview)

### 1-1. 페이지 목적

신뢰성 있는 외부 **성경 주석/연구 사이트**를 큐레이션하여 한 화면에서 비교·탐색할 수 있도록 제공하는 **클라이언트 전용** 학습 페이지이다.
프로젝트가 자체 주석을 보유하지 않는 단계에서, 사용자가 흩어진 외부 자료를 찾는 데 드는 비용을 줄이고 학습 도구를 일관된 UX로 안내한다.

`bible-overview-video`, `public-reading-of-scripture`와 동일한 패턴으로 서버 API 없이 정적 JS 배열에 사이트 메타데이터를 관리하고 카드 그리드로 렌더링한다.

### 1-2. URL 및 라우팅

| 항목 | 값 |
|---|---|
| URL | `/web/study/bible-commentary` |
| Thymeleaf 템플릿 | `templates/study/bible-commentary.html` |
| 컨트롤러 | `StudyWebController.kt` 내 `@GetMapping("/bible-commentary")` |
| 인증 | 불필요 (공개 페이지) |

### 1-3. 대상 사용자

- 성경 본문의 의미를 깊이 연구하려는 신학생·평신도
- 설교/소그룹 준비를 위해 권위 있는 주석을 빠르게 비교하고 싶은 리더
- 영어/원어 주석 도구를 처음 탐색하려는 학습자
- 종교개혁기 고전 주석(칼빈 등)을 무료로 열람하려는 일반 성도

---

## 2. study.html 메뉴 변경

### 2-1. 변경 내용

현재 '성경 주석' 카드는 **"준비중"** 상태(`coming-soon` 클래스, 클릭 비활성). 본 페이지 구현과 함께 **활성 카드로 전환**한다.

### 2-2. 카드 위치

기존 학습 허브(`study.html`) 카드 그리드에서 '성주간 타임라인' 다음, '준비중' 그룹의 첫 번째였던 자리. 활성 전환 후에는 활성 카드 그룹의 마지막에 자연스럽게 배치된다.

### 2-3. 변경 전 (현재)

```html
<div class="col-12 col-md-6 col-lg-4">
    <div class="study-card-link card-lift coming-soon">
        <div class="card card-panel card-soft">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h3 class="h6 fw-semibold mb-0">
                        <span class="me-2" aria-hidden="true">📝</span>성경 주석
                    </h3>
                    <span class="badge text-bg-warning text-uppercase small">준비중</span>
                </div>
                <p class="text-muted small mb-0">준비중</p>
            </div>
        </div>
    </div>
</div>
```

### 2-4. 변경 후

```html
<div class="col-12 col-md-6 col-lg-4">
    <a class="text-decoration-none study-card-link card-lift" href="/web/study/bible-commentary">
        <div class="card card-panel card-soft">
            <div class="card-body">
                <h3 class="h6 fw-semibold mb-1">
                    <span class="me-2" aria-hidden="true">📝</span>성경 주석
                </h3>
                <p class="text-muted small mb-0">권위 있는 성경 주석·연구 사이트를 한 곳에서 비교합니다.</p>
            </div>
        </div>
    </a>
</div>
```

### 2-5. 아이콘 선택 근거

`📝` (메모) — 주석을 다는 행위 상징. study.html의 다른 활성 카드들과 동일한 유니코드 이모지 컨벤션을 유지한다.

---

## 3. 파일 구조

`bible-overview-video`와 동일한 구성을 따른다.

```
src/main/kotlin/com/elseeker/study/adapter/input/web/client/
└── StudyWebController.kt              ← @GetMapping("/bible-commentary") 추가

src/main/resources/
├── templates/study/
│   ├── study.html                     ← '성경 주석' 카드 활성화
│   └── bible-commentary.html          ← 신규 Thymeleaf 템플릿
├── static/css/study/
│   └── bible-commentary.css           ← 전용 CSS (bc- 접두사)
└── static/js/study/
    └── bible-commentary.js            ← 정적 데이터 + 렌더링 클래스
```

### 버전 관리

| 파일 | 초기 버전 |
|---|---|
| `bible-commentary.css` | `?v=1.0` |
| `bible-commentary.js` | `?v=1.0` |
| `study.html` (study.css 수정 시) | 기존 버전 +0.1 |

---

## 4. 화면 구성

### 4-1. 전체 레이아웃

```
[header — "성경 주석" 타이틀 + 뒤로가기]
[Hero/Intro 영역 — 페이지 소개 (1~2줄)]
[검색 바 — 사이트명·키워드·태그 즉시 필터링]
[로딩 스피너]
[카드 그리드 — 사이트 카드 목록 (한글 → 영어 순)]
[빈 상태 — 검색 결과 없음]
[Footer — section-nav]
```

### 4-2. 카드 구조

```html
<a class="bc-card"
   href="{externalUrl}"
   target="_blank"
   rel="noopener noreferrer"
   aria-label="{siteName} (새 창에서 열림)">
    <div class="bc-card-thumb">
        <img src="{logoOrFavicon}" alt="" loading="lazy" decoding="async" width="64" height="64">
    </div>
    <div class="bc-card-body">
        <div class="bc-card-head">
            <h3 class="bc-card-title">{siteName}</h3>
            <span class="bc-card-lang" aria-hidden="true">{언어 뱃지}</span>
        </div>
        <p class="bc-card-desc">{한 줄 설명}</p>
        <ul class="bc-card-tags" aria-label="태그">
            <li class="bc-card-tag">{태그1}</li>
            <li class="bc-card-tag">{태그2}</li>
        </ul>
    </div>
    <span class="bc-card-external" aria-hidden="true">↗</span>
</a>
```

- 카드 전체가 외부 링크. `target="_blank"`로 새 탭 열기
- `aria-label="{siteName} (새 창에서 열림)"` — 스크린 리더 사용자에게 외부 링크임을 명시 (WAI-ARIA APG 권장)
- `<img alt="">` 빈 alt — 카드 제목(`bc-card-title`)이 이미 사이트명을 나타내므로 favicon은 장식 이미지로 처리하여 스크린 리더 중복 읽기 방지
- 우상단 `↗` 아이콘은 `aria-hidden="true"` — 시각 사용자 전용 보조 단서
- `rel="noopener noreferrer"`로 보안 처리 (Section 10-1 참조)
- 태그를 `<ul>/<li>`로 시맨틱 표현, `aria-label="태그"`로 그룹화

---

## 5. 데이터 구조 (Data Structure)

### 5-1. JavaScript 데이터 배열

`bible-commentary.js`에 정적 배열로 정의한다 (DB 미사용, 클라이언트 전용).

```javascript
const BIBLE_COMMENTARY_SITES = [
    {
        id: "freebiblecommentary-ko",
        siteName: "FreeBibleCommentary 한국어",
        lang: "ko",
        url: "https://www.freebiblecommentary.org/korean_bible_study.htm",
        favicon: "/images/icon/commentary/freebiblecommentary.png",
        description: "Bob Utley 박사의 학술적 성경 주석을 한국어로 무료 제공",
        tags: ["학술 주석", "한국어 번역", "무료"]
    },
    {
        id: "gotquestions-ko",
        siteName: "GotQuestions 한국어",
        lang: "ko",
        url: "https://www.gotquestions.org/Korean/",
        favicon: "/images/icon/commentary/gotquestions.png",
        description: "절별 학술 주석보다는 신학 Q&A 형식. 성경 관련 8,000+ 질문을 주제·구절별로 검색하여 한국어 해설을 읽을 수 있다",
        tags: ["Q&A 형식", "주제별 해설", "신학 질문"]
    },
    {
        id: "biblehub-commentaries",
        siteName: "Bible Hub Commentaries",
        lang: "en",
        url: "https://biblehub.com/commentaries",
        favicon: "/images/icon/commentary/biblehub.png",
        description: "다양한 영어 주석(매튜 헨리·반즈 등)을 절별로 통합 제공",
        tags: ["주석 모음", "절별 비교"]
    },
    {
        id: "blueletterbible-comms",
        siteName: "Blue Letter Bible Commentaries",
        lang: "en",
        url: "https://www.blueletterbible.org/niv/gen/1/1/t_comms_1001",
        favicon: "/images/icon/commentary/blueletterbible.png",
        description: "스트롱 코드·원어 분석과 함께 주석을 절별로 제공 (창세기 1:1 진입)",
        tags: ["스트롱", "원어", "주석"]
    },
    {
        id: "biblegateway",
        siteName: "Bible Gateway",
        lang: "en",
        url: "https://www.biblegateway.com/",
        favicon: "/images/icon/commentary/biblegateway.png",
        description: "200+ 번역본 비교, 오디오 성경, 묵상 도구를 통합 제공",
        tags: ["다중 번역", "오디오", "묵상"]
    },
    {
        id: "studylight",
        siteName: "StudyLight",
        lang: "en",
        url: "https://www.studylight.org/",
        favicon: "/images/icon/commentary/studylight.png",
        description: "고전 주석(매튜 헨리·John Gill 등)과 사전을 무료로 제공",
        tags: ["고전 주석", "사전"]
    },
    {
        id: "sacred-texts-bib-cmt",
        siteName: "Internet Sacred Text Archive — Bible Commentaries",
        lang: "en",
        url: "https://sacred-texts.com/bib/cmt/index.htm",
        favicon: "/images/icon/commentary/sacred-texts.png",
        description: "여러 고전 성경 주석을 한 곳에서 무료로 열람할 수 있는 디지털 아카이브",
        tags: ["고전 주석", "디지털 아카이브", "무료"]
    },
    {
        id: "ccel-calvin-commentaries",
        siteName: "CCEL — Calvin's Commentaries",
        lang: "en",
        url: "https://ccel.org/c/calvin/comment2/home.html",
        favicon: "/images/icon/commentary/ccel.png",
        description: "장 칼빈의 성경 주석 전집을 무료로 열람할 수 있는 CCEL 디지털 아카이브",
        tags: ["칼빈", "고전 주석", "종교개혁"]
    },
    {
        id: "netbible",
        siteName: "NET Bible (Bible.org)",
        lang: "en",
        url: "https://netbible.org/",
        favicon: "/images/icon/commentary/netbible.png",
        description: "각주 6만 개 이상이 본문에 직접 연결된 학술적 영어 번역·주석",
        tags: ["학술 각주", "번역 노트"]
    },
];
```

> **주: 외부 사이트 진입 URL 정책**
> Bible Hub Commentaries(`/commentaries`)와 Blue Letter Bible(`t_comms_1001`)은 사이트 상단 네비게이션을 통해 다른 책/장으로 자유롭게 이동 가능한 페이지로, "주석 코너로 바로 진입"하는 사용자 친화 진입점이다.
> 향후 `?bookOrder=N` 파라미터를 받아 외부 사이트의 해당 책 주석으로 deep link 하는 확장이 가능하다 (Section 15 참조).

### 5-2. 언어 뱃지

| `lang` 값 | 라벨 | 색상 |
|---|---|---|
| `ko` | 한글 | `var(--color-accent)` 계열 파랑 |
| `en` | EN | 회색 |

### 5-3. 데이터 운영 방침

- 신규 사이트 추가/제거는 본 배열만 수정하면 즉시 반영 (배포 필요)
- favicon 이미지는 `/static/images/icon/commentary/` 하위에 PNG로 저장 (**64×64 통일**, Retina 대응)
- 외부 사이트 운영 변동에 대비해 `id`만 안정적으로 유지하고 `url`은 변경 가능
- 데이터 정렬은 배열 순서를 그대로 따른다 (의도된 큐레이션 순서)

---

## 6. JavaScript 클래스 구조

```javascript
class BibleCommentary {
    constructor() {
        this.initElements();
        this.state = { keyword: "" };
        this.init();
    }

    initElements() {
        this.loadingEl  = document.getElementById("bcLoading");
        this.contentEl  = document.getElementById("bcContent");
        this.gridEl     = document.getElementById("bcGrid");
        this.emptyEl    = document.getElementById("bcEmpty");
        this.searchEl   = document.getElementById("bcSearchInput");
        this.clearBtn   = document.getElementById("bcSearchClear");
        this.backButton = document.getElementById("topNavBackButton");
    }

    init() {
        this.initNav();
        this.bindSearch();
        this.render();
        this.injectStructuredData();
    }

    initNav()    { /* "성경 주석" 타이틀 + 뒤로가기 (→ /web/study) */ }
    bindSearch() { /* input + compositionend → debounce(150ms) → state.keyword → render */ }

    filterSites() {
        const kw = this.state.keyword.trim().toLowerCase();
        if (!kw) return BIBLE_COMMENTARY_SITES;
        return BIBLE_COMMENTARY_SITES.filter(site =>
            site.siteName.toLowerCase().includes(kw)
            || site.description.toLowerCase().includes(kw)
            || site.tags.some(t => t.toLowerCase().includes(kw))
        );
    }

    render() {
        const sites = this.filterSites();
        this.gridEl.innerHTML = "";
        if (sites.length === 0) {
            this.emptyEl.classList.remove("d-none");
            return;
        }
        this.emptyEl.classList.add("d-none");
        sites.forEach(site => this.gridEl.appendChild(this.createCard(site)));
    }

    createCard(site) { /* a.bc-card DOM 생성 (XSS 방지: textContent 사용) */ }
}

document.addEventListener("DOMContentLoaded", () => {
    new BibleCommentary();
});
```

### 6-1. 보안 — XSS 방지

외부 사이트명·설명·태그 모두 정적 데이터이지만, 향후 DB/Admin UI 확장 가능성을 고려해 **DOM 생성 시 반드시 `textContent` 사용**한다. `innerHTML` 직접 삽입 금지.

---

## 7. Thymeleaf 템플릿

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org" lang="ko">
<head th:replace="~{fragments/head :: head('성경 주석 사이트 모음 - 권위 있는 주석 큐레이션 | ElSeeker', true,
      '/css/card.css?v=5.0,/css/study/bible-commentary.css?v=1.0')}"
      th:with="pageDescription='Bible Hub, Blue Letter Bible, Calvin Commentaries, FreeBibleCommentary 등 권위 있는 성경 주석·연구 사이트를 한 곳에서 비교·탐색할 수 있는 큐레이션 페이지입니다.',
               pageKeywords='성경 주석,Bible Hub,Blue Letter Bible,Bible Gateway,FreeBibleCommentary,칼빈 주석,CCEL,성경 연구 사이트'">
</head>
<body class="has-fixed-nav bible-commentary-page">

<header th:replace="~{fragments/header :: header}"></header>

<main class="container content-wrapper">
    <!-- Intro -->
    <section class="bc-intro">
        <p class="bc-intro-lead">
            국내외에서 신뢰받는 성경 주석·연구·묵상 사이트를 큐레이션했습니다.
            카테고리와 검색으로 빠르게 비교하세요.
        </p>
    </section>

    <!-- 검색 -->
    <div class="bc-search">
        <input type="search" id="bcSearchInput" class="bc-search-input"
               placeholder="사이트명·키워드 검색 (예: 원어, 큐티)"
               autocomplete="off" inputmode="search">
        <button type="button" id="bcSearchClear" class="bc-search-clear d-none" aria-label="검색어 지우기">×</button>
    </div>

    <!-- 로딩 -->
    <div id="bcLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">로딩 중...</span>
        </div>
    </div>

    <!-- 콘텐츠 -->
    <div id="bcContent" class="d-none">
        <div id="bcGrid" class="bc-grid"></div>
        <div id="bcEmpty" class="bc-empty d-none">
            검색 결과가 없습니다.
        </div>
    </div>
</main>

<script type="module" src="/js/study/bible-commentary.js?v=1.0"></script>
<div th:replace="~{fragments/section-nav :: section-nav}"></div>
</body>
</html>
```

---

## 8. 시각 디자인 (Visual Design)

### 8-1. 카드 그리드

| 뷰포트 | 컬럼 수 |
|---|---|
| 모바일 (<576px) | 1 |
| 태블릿 (576~991px) | 2 |
| 데스크톱 (≥992px) | 3 |

`grid-template-columns: repeat(auto-fill, minmax(clamp(260px, 30vw, 320px), 1fr))` + grid blowout 방지 `min-width: 0` 적용 (`bible-casting-lots`에서 검증한 패턴).

### 8-2. 색상 토큰

- 카드 배경: `var(--color-bg-elevated-bright)` (라이트 #fff, 다크 #212832)
- 페이지 배경: `body.bible-commentary-page` 스코프로 라이트 `#f7f8fa`, 다크 `var(--color-bg-base)`
- 카드 hover (라이트): `var(--color-bg-elevated-strong-hover)` — 페이지 회색보다 짙음
- 카드 hover (다크): `var(--color-bg-elevated)` — 카드보다 짙음
- 외부 링크 뱃지(↗) 색: `var(--color-text-secondary)`

페이지/카드/hover 3단 분리 패턴은 `community`, `index`, `study`, `game`, `dictionary-list`에서 검증된 패턴을 그대로 따른다.

### 8-3. 카드 hover 효과

```css
.bc-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
    box-shadow: 0 4px 6px -1px var(--color-shadow), 0 2px 4px -1px var(--color-shadow);
}

@media (hover: hover) and (pointer: fine) {
    .bc-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px var(--color-shadow), 0 4px 6px -2px var(--color-shadow);
        background-color: var(--color-bg-elevated-strong-hover);
    }
    html[data-theme="dark"] .bc-card:hover {
        background-color: var(--color-bg-elevated);
    }
}

.bc-card:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
}
```

> **토큰 정합성**: `--color-shadow`는 theme.css에 라이트 `rgba(0,0,0,0.08)`, 다크 `rgba(0,0,0,0.5)`로 정의된 글로벌 토큰. 다크 모드에서도 자동 분기.

---

## 9. 반응형 디자인

### 모바일 (<=576px)

- 카드 1열, 패딩 `0.875rem`
- 카드 썸네일: 40×40px
- 카드 제목: `1rem` (clamp 사용)

### 데스크탑

- 카드 3열, 패딩 `1.25rem`
- 카드 hover 효과 (`@media (hover: hover) and (pointer: fine)`)
- 카드 썸네일: 56×56px

`prefers-reduced-motion: reduce` 적용 — hover transform/transition 비활성화 (WCAG 2.3.3).

---

## 10. 보안 및 외부 링크 처리

### 10-1. `rel="noopener noreferrer"` 필수

모든 외부 링크에 적용:
- `noopener` — 새 탭이 `window.opener`를 통해 부모 페이지를 조작하는 보안 취약점(tabnabbing) 차단
- `noreferrer` — Referer 헤더 미전송으로 사용자 추적 차단

### 10-2. target="_blank"

새 탭에서 외부 사이트가 열리도록 처리. 사용자가 학습 페이지로 쉽게 돌아올 수 있다.

### 10-3. favicon 정적 호스팅

외부 사이트 favicon을 hot-linking하지 않고 `/static/images/icon/commentary/` 하위에 사전 저장. 이유:
- 외부 사이트 다운 시 카드 깨짐 방지
- 비용/추적 차단 (사용자 IP가 외부에 노출되지 않음)
- 로딩 속도 안정

> 주: favicon 사용은 일반적으로 fair use 범위지만, 가능한 경우 사이트 정책 확인 후 자체 그래픽 또는 텍스트 로고로 대체한다.

### 10-4. 콘텐츠 책임 면책

페이지 하단(`bc-disclaimer`)에 짧은 안내:

> "본 페이지에 소개된 외부 사이트의 콘텐츠와 신학적 견해는 각 사이트 운영 주체에 귀속됩니다. ElSeeker는 링크만 제공합니다."

---

## 11. 접근성 (Accessibility)

- 카드 링크: 의미 있는 텍스트(`siteName`)로 스크린 리더 도달 가능
- 외부 링크 표시: 시각적 `↗` 아이콘 + `aria-label`에 "(새 창에서 열림)" 명시
- 색상 대비: 카드 텍스트 `var(--color-text-primary)` on `var(--color-bg-elevated-bright)` — WCAG AA 충족
- `prefers-reduced-motion: reduce`: hover 트랜지션 비활성화
- 키보드 포커스: `:focus-visible`에 명확한 outline (`2px solid var(--color-accent)`)

---

## 12. SEO

### 12-1. 메타 태그

```
title:       "성경 주석 사이트 모음 - 권위 있는 주석 큐레이션 | ElSeeker"
description: "Bible Hub, Blue Letter Bible, Calvin Commentaries, FreeBibleCommentary 등 권위 있는 성경 주석·연구 사이트를 한 곳에서 비교·탐색할 수 있는 큐레이션 페이지입니다."
keywords:    "성경 주석,Bible Hub,Blue Letter Bible,Bible Gateway,FreeBibleCommentary,칼빈 주석,CCEL,성경 연구 사이트"
```

### 12-2. sitemap.xml 추가

```xml
<url>
    <loc>https://elseeker.com/web/study/bible-commentary</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
</url>
```

(외부 링크 큐레이션 성격이라 `priority`는 자체 학습 콘텐츠(0.7)보다 한 단계 낮춤)

### 12-3. schema.org JSON-LD `ItemList` 구조화 데이터

검색엔진이 본 페이지를 "사이트 목록 페이지"로 명확히 인식하도록 JSON-LD를 페이지에 임베드. 데이터 배열에서 동적으로 생성하여 **단일 진실의 출처(SSOT)** 유지.

**JS 생성 패턴** (`bible-commentary.js`에 메서드 추가):

```javascript
injectStructuredData() {
    const ld = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "성경 주석 사이트 큐레이션",
        "description": "권위 있는 성경 주석·연구 사이트를 한 곳에서 비교·탐색할 수 있는 큐레이션 페이지",
        "numberOfItems": BIBLE_COMMENTARY_SITES.length,
        "itemListOrder": "https://schema.org/ItemListOrderAscending",
        "itemListElement": BIBLE_COMMENTARY_SITES.map((site, idx) => ({
            "@type": "ListItem",
            "position": idx + 1,
            "item": {
                "@type": "WebSite",
                "name": site.siteName,
                "url": site.url,
                "description": site.description,
                "inLanguage": site.lang === "ko" ? "ko-KR" : "en-US"
            }
        }))
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(ld);
    document.head.appendChild(script);
}
```

`init()` 호출 시점에서 한 번만 삽입. Google이 JS 렌더링 후에도 JSON-LD를 인식하므로 SEO에 안정적이다.

**검증**: 페이지 배포 후 [Rich Results Test](https://search.google.com/test/rich-results)로 확인.

### 12-4. study.html 메타 태그 업데이트

페이지 제목과 키워드에 '성경 주석' 추가:

```
title:    "성경 학습 - 사전, 족보, 역사, 개요 영상, 십계명, 성주간, 성경 주석 | ElSeeker"
keywords: "성경 학습,...,성경 주석"
```

---

## 13. 구현 체크리스트

- [ ] `StudyWebController.kt` — `@GetMapping("/bible-commentary")` 추가
- [ ] `study.html` — '성경 주석' 카드 활성화 (`coming-soon` → `<a href>`)
- [ ] `study.html` — 메타 태그에 '성경 주석' 키워드 추가
- [ ] `study.css` 캐시 버스팅 +0.1
- [ ] `bible-commentary.html` — Thymeleaf 템플릿 생성
- [ ] `bible-commentary.css` — 전용 CSS (`bc-` 접두사, 라이트/다크 분리 패턴)
- [ ] `bible-commentary.js` — 데이터 + 렌더링 클래스
- [ ] `/images/icon/commentary/*.png` — 사이트 favicon 정적 저장
- [ ] `sitemap.xml` — 성경 주석 URL 추가
- [ ] 카드 외부 링크 모두 `target="_blank" rel="noopener noreferrer"` 확인
- [ ] 카드 마크업 `aria-label="{siteName} (새 창에서 열림)"` 적용 확인
- [ ] 검색 즉시 필터링 (debounce 150ms, IME composition 처리) 동작 확인
- [ ] JSON-LD `ItemList` 페이지 소스에 삽입 확인 (Rich Results Test)
- [ ] 모바일/데스크톱 반응형·다크 모드 확인

---

## 14. 설계 결정 기록 (Design Decision Log)

| 결정 | 채택 | 기각 | 이유 |
|---|---|---|---|
| 데이터 저장 방식 | JS 정적 배열 (클라이언트 전용) | DB + API | `bible-overview-video`/`public-reading-of-scripture`와 동일 패턴. 사이트 추가/제거 빈도가 낮고 운영자 1인 관리 가능 |
| 외부 링크 처리 | 새 탭 + `rel="noopener noreferrer"` | 동일 탭 이동 | 학습 페이지로 즉시 복귀 가능, tabnabbing 차단 |
| favicon 호스팅 | 정적 저장 | hot-linking | 외부 사이트 다운 시 카드 깨짐 방지, 사용자 IP 추적 차단 |
| 필터링 방식 | 텍스트 검색만 (사이트명·설명·태그) | 카테고리 탭 / 탭+검색 | 9개 사이트가 모두 "성경 주석" 단일 도메인이라 카테고리 분류는 인지 부담만 추가. 한국어 우선 배열 + 카드의 lang 뱃지/태그로 시각 구분, 검색바로 자유 필터링 가능 |
| 정렬 순서 | 배열 순서 = 큐레이션 순서 | 알파벳/사용자 평점 | 운영자가 의도한 추천 순서가 학습 효과 측면에서 가장 신뢰 가능 |
| 카드 hover 색 | 라이트 elevated-strong-hover, 다크 elevated | 라이트/다크 동일 토큰 | 페이지 회색화 패턴에서 hover 색이 페이지에 묻히지 않도록 분리 (`dictionary`/`game` 페이지 결정과 동일) |
| 페이지 카드 패턴 | `body.bible-commentary-page` 스코프 회색 배경 | body 전역 회색 | 다른 학습 페이지에 영향 없도록 스코프 격리 |
| 카드 hover box-shadow | 글로벌 `var(--color-shadow)` 사용 명시값 | community.css의 `--comm-shadow-hover` 변수 참조 | 본 페이지 전용 CSS에서 community 페이지 변수에 의존하지 않도록 토큰 정합성 확보. 다크 모드 그림자도 `--color-shadow` 자동 분기 |
| 외부 링크 a11y | `aria-label="{siteName} (새 창에서 열림)"` + favicon `alt=""` | 텍스트만으로 표현 | WAI-ARIA APG 권장. 스크린 리더 사용자에게 새 창 열림을 명시하고, 장식 favicon이 중복 읽히지 않도록 |
| JSON-LD 생성 방식 | JS에서 `BIBLE_COMMENTARY_SITES` 배열로 동적 생성 후 `document.head` 삽입 | Thymeleaf 정적 하드코딩 | 단일 진실의 출처(SSOT) 유지. 사이트 추가/제거 시 한 곳만 수정. Google이 JS 렌더링 후 JSON-LD 인식 가능 |

---

## 15. 향후 확장 (Future Work)

| 기능 | 우선순위 | 메모 |
|---|---|---|
| 즐겨찾기 표시 | 낮음 | localStorage 기반, 인증 불필요. 자주 가는 사이트 상단 고정 |
| 사이트별 책별 진입 | 중간 | `bible-overview-video`처럼 `?bookOrder=N` 파라미터로 외부 사이트의 책별 페이지 deep link |
| 사용자 추천 사이트 제보 | 낮음 | community 게시판 활용 (별도 페이지 만들지 않음) |
| 사이트 상태 모니터링 | 낮음 | 정기적으로 외부 URL 200 응답 확인 → 운영자 알림 |

---

## 16. 참고 자료

- 공동체성경읽기 구현 패턴: `docs/study/public-reading-of-scripture.md`
- 십계명 구현 패턴: `docs/study/ten-commandments.md`
- 학습 허브 카드 패턴: `templates/study/study.html`
- 컨트롤러 패턴: `src/main/kotlin/com/elseeker/study/adapter/input/web/client/StudyWebController.kt`
- 페이지/카드 3단 분리 디자인 패턴: `docs/common/dark-theme.md` + 본 프로젝트 community/index/game 구현
