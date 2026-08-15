# 7일 창조 스크롤 체험 (Creation Scroll Experience) — 설계 및 구현 문서

> 작성일: 2026-03-08
> 최종 수정: 2026-03-09
> 담당 도메인: study
> 상태: 구현 완료

---

## 1. 개요 (Overview)

### 1-1. 페이지 목적

창세기 1장의 7일 창조 이야기를 풀스크린 스크롤 스토리텔링으로 체험하는 몰입형 학습 페이지이다.
단순 성경 텍스트 나열이 아니라, **각 날의 창조물이 시각적으로 "등장"하는 경험**을 설계한다.
사용자는 스크롤을 내리며 혼돈(공허)에서 안식까지, 창조의 여정을 직접 통과하는 느낌을 받아야 한다.

### 1-2. URL 및 라우팅

| 항목 | 값 |
|---|---|
| URL | `/web/study/creation` |
| Thymeleaf 템플릿 | `templates/study/creation.html` |
| 컨트롤러 | `StudyWebController.kt` 내 `@GetMapping("/creation")` |
| 인증 불필요 | 공개 페이지 (비로그인 접근 가능) |

### 1-3. 대상 사용자

- 성경에 처음 입문하는 새신자 — 창세기 1장 본문을 시각적 맥락과 함께 이해
- 자녀에게 창조 이야기를 설명하려는 부모
- 묵상과 큐티를 원하는 일반 성도
- ElSeeker 메인 페이지의 우주 섹션에서 "더 알고 싶다"는 호기심을 가진 방문자

---

## 2. 파일 구조 (File Structure)

```
src/main/kotlin/com/elseeker/study/adapter/input/web/client/
└── StudyWebController.kt           ← @GetMapping("/creation") 라우트

src/main/resources/
├── templates/study/
│   └── creation.html               ← Thymeleaf 템플릿 (9개 섹션)
├── static/css/study/
│   └── creation.css                 ← 전용 CSS (날별 테마, 장식, 애니메이션)
└── static/js/study/
    └── creation.js                  ← IntersectionObserver 기반 스크롤 로직
```

### 버전 관리

| 파일 | 현재 버전 |
|---|---|
| `creation.css` | `?v=3.4` |
| `creation.js` | `?v=2.2` |

---

## 3. 페이지 구조 (Page Structure)

### 3-1. 섹션 구성

9개 `<section>` 요소가 `<main class="creation-main">` 내에 순서대로 배치된다.
각 섹션은 `min-height: 100dvh` (100vh 폴백)로 풀스크린을 차지한다.

```
[프롤로그]  data-day="0"  — 창세기 1:1-2 (태초, 혼돈과 공허)
[1일차]    data-day="1"  — 빛의 창조
[2일차]    data-day="2"  — 궁창 (물의 분리)
[3일차]    data-day="3"  — 땅과 식물
[4일차]    data-day="4"  — 해, 달, 별
[5일차]    data-day="5"  — 물고기와 새
[6일차]    data-day="6"  — 동물과 사람
[7일차]    data-day="7"  — 안식
[에필로그]  data-day="8"  — 창세기 1:31 (마무리 + 네비게이션 링크)
```

### 3-2. 섹션 내부 구조

각 섹션은 두 레이어로 구성:

```html
<section class="cr-section cr-day{N}" data-day="{N}">
    <div class="cr-deco cr-deco-{theme}"></div>   <!-- 장식 레이어 (CSS pseudo-element) -->
    <div class="cr-inner">                         <!-- 콘텐츠 레이어 -->
        <div class="cr-day-num cr-fade">{N}</div>  <!-- 대형 워터마크 번호 -->
        <span class="cr-label cr-fade">N째 날</span>
        <h2 class="cr-title cr-fade">핵심 선언 구절</h2>
        <p class="cr-body cr-fade">본문 구절</p>
        <p class="cr-verdict cr-fade">저녁이 되고 아침이 되니...</p>
    </div>
</section>
```

### 3-3. 네비게이션 숨김/노출

스크롤 체험의 몰입감을 위해 상단 네비게이션(`.top-nav-row`)을 숨긴다:

- **초기 상태**: `.creation-page .top-nav-row`가 `translateY(-100%) + opacity: 0`으로 숨김
- **에필로그 도달 시**: IntersectionObserver가 에필로그 섹션을 감지하면 `body`에 `.nav-visible` 클래스 추가
- **0.5s 트랜지션**으로 부드럽게 슬라이드 다운
- 에필로그를 벗어나면 다시 숨김

```css
.creation-page .top-nav-row {
    transform: translateY(-100%);
    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1),
                opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0;
}
.creation-page.nav-visible .top-nav-row {
    transform: translateY(0);
    opacity: 1;
}
```

---

## 4. 시각 디자인 (Visual Design)

### 4-1. 미적 방향

**"태고의 서사시(Primordial Epic)"** — 우주적 웅장함과 정적인 경건함의 공존.

- 완전한 어둠(#000)에서 출발, 날이 진행될수록 배경이 점진적으로 변화
- 마지막 안식은 따뜻한 황금빛으로 도달
- 폰트: **Noto Serif KR** (Google Fonts) — 헤딩에 적용하여 고전적·경건한 인상 부여
- 본문 텍스트는 기본 sans-serif 유지 (가독성 우선)

### 4-2. 날별 색상 팔레트 및 장식 효과

| 날 | 배경 | 장식 효과 (`.cr-deco`) | 분위기 |
|---|---|---|---|
| 프롤로그 | `#000` 순흑 | 맥동하는 어둠 원형 그라디언트 | 혼돈, 공허 |
| 1일차 | `#0c1230` → `#000` | 중앙 빛줄기 (blur 8px), 호흡 애니메이션 | 어둠 속 첫 빛 |
| 2일차 | `#051228` → `#020c1e` 수직 분리 | 수평 궁창 분리선 (shimmer 4s) | 물빛 푸름 |
| 3일차 | `#040e04` → `#183a18` | 하단 대지 그라디언트 + 성장 원형 펄스 | 생명의 움틈 |
| 4일차 | `#0c0035` → `#010010` | 10개 CSS 별 점 배경 + 태양 글로우 | 심우주, 은하수 |
| 5일차 | `#031a2e` → `#042030` | 가로 물결 애니메이션 (8s linear infinite) | 깊은 바다 |
| 6일차 | `#2d1300` → `#0d0500` | 대지 그라디언트 + 생명 글로우 펄스 | 창조의 정점 |
| 7일차 | `#1e1600` → `#080600` | 대형 황금 원형 글로우 (6s 펄스) | 완성, 거룩한 쉼 |

모든 장식 효과는 CSS `::before` / `::after` pseudo-element로 구현. Three.js 미사용.

### 4-3. 대형 워터마크 번호

각 날 섹션에 대형 숫자(`.cr-day-num`)가 워터마크로 표시된다:
- 크기: `clamp(6rem, 18vw, 12rem)` (모바일: `clamp(4rem, 20vw, 7rem)`)
- 색상: `rgba(255, 255, 255, 0.04)` — 극히 연한 흰색
- 폰트: Noto Serif KR, weight 200

### 4-4. 타이포그래피

| 요소 | 폰트 | 크기 | 색상 |
|---|---|---|---|
| `.cr-label` (날 라벨) | Noto Serif KR 400 | 0.8rem, letter-spacing 0.25em | `rgba(255,255,255,0.4)` |
| `.cr-title` (핵심 선언) | Noto Serif KR 700 | `clamp(1.5rem, 5vw, 2.6rem)` | `rgba(255,255,255,0.95)` + text-shadow |
| `.cr-body` (본문) | 기본 sans-serif 400 | `clamp(0.9rem, 2vw, 1.05rem)` | `rgba(255,255,255,0.55)` |
| `.cr-verdict` (마무리) | Noto Serif KR 400 | `clamp(0.85rem, 2vw, 1rem)` | `rgba(255,255,255,0.35)` |

---

## 5. 스크롤 인터랙션 (Scroll Interaction)

### 5-1. 스크롤 방식: 네이티브 스크롤

**scroll-snap mandatory 적용.** 풀페이지 스냅 방식으로 한 섹션씩 정확히 넘어간다.
- `html:has(.creation-page)`에 `scroll-snap-type: y mandatory` 적용
- 각 `.cr-section`에 `scroll-snap-align: start` — 섹션 상단 기준 스냅
- 스크롤할 때마다 정확히 한 섹션씩 이동하여 어중간한 위치에 멈추지 않음
- 커스텀 스크롤 래퍼 미사용 — 브라우저 네이티브 스크롤 + CSS 스냅

> 스냅 방식 히스토리: mandatory(v1, 너무 강제적) → 제거(v2, 경계 어색) → proximity(v3, 자석 부자연스러움) → **mandatory(현재, 풀페이지 스냅)**

### 5-2. 텍스트 페이드인 (밤안개 효과)

IntersectionObserver(threshold 0.15)로 `.cr-fade` 요소 감지 → `.visible` 클래스 추가.

```css
.cr-fade {
    opacity: 0;
    transform: translateY(30px);
    filter: blur(5px);
    transition: opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1),
                transform 1.2s cubic-bezier(0.16, 1, 0.3, 1),
                filter 1.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.cr-fade.visible {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
}
```

**순차 딜레이** (CSS nth-child):

| 순서 | 딜레이 | 대상 요소 |
|---|---|---|
| 1번째 | 0s | 워터마크 번호 / 프롤로그 라벨 |
| 2번째 | 0.15s | 날 라벨 |
| 3번째 | 0.3s | 핵심 선언 제목 |
| 4번째 | 0.5s | 본문 구절 |
| 5번째 | 0.7s | 마무리 구절 |
| 6번째 | 0.9s | (에필로그 링크 등) |

> 속도 튜닝 히스토리: 0.9s(너무 빠름) → 1.8s(너무 느림) → 1.2s(중간값) → **0s~0.9s(현재, 1초 이내 모두 등장)**
> 딜레이 압축 이유: 빠른 스크롤 시 화면이 비어 보이는 문제 방지

### 5-3. 스크롤 유도 힌트 (Scroll Down Indicator)

프롤로그 하단에 스크롤 유도 UI를 배치:
- "scroll" 텍스트 + 세로 막대(40px) + 하단 V자 화살촉
- 0.5초 후 1.5초에 걸쳐 페이드인 (`cr-hint-fade` 애니메이션)
- 위아래 바운스 애니메이션 (2s 반복)
- 사용자가 첫 스크롤 시 JS로 페이드아웃 처리

### 5-4. 진행 바 (Progress Bar)

화면 하단 고정 바(`position: fixed`)로 진행률 표시.
- v1의 우측 세로 dot 인디케이터에서 변경 — 미니멀한 하단 바가 몰입에 유리
- 높이 3px (모바일 4px), 골드 그라디언트 필
- `env(safe-area-inset-bottom)` 적용으로 iPhone 홈 인디케이터와 겹침 방지
- 라벨: `"N / 7"` 형식 (프롤로그/에필로그에서는 비표시)
- IntersectionObserver(threshold 0.5)로 현재 섹션 감지

### 5-5. 키보드 네비게이션

- `ArrowDown`: 다음 섹션으로 `scrollIntoView({ behavior: 'smooth' })`
- `ArrowUp`: 이전 섹션으로 이동
- 현재 섹션 인덱스는 sectionObserver에서 추적

---

## 6. 반응형 디자인 (Responsive Design)

3단계 반응형 설계:

### 모바일 (≤576px)

- `.cr-inner` 패딩: `5rem 1.25rem`
- 워터마크 번호: `clamp(4rem, 20vw, 7rem)`
- 제목: `clamp(1.3rem, 6vw, 1.7rem)`
- 본문: `0.88rem`, 줄간격 2.0
- 에필로그 버튼: 세로 배치, 전체 너비
- 섹션 높이: `100dvh` (100vh 폴백)

### 태블릿 (577px–1024px)

- `.cr-inner` 최대 너비: 580px, 패딩: `4.5rem 2rem`
- 워터마크 번호: `clamp(5rem, 14vw, 9rem)`
- 제목: `clamp(1.4rem, 4vw, 2.2rem)`

### 데스크탑 (≥1025px)

- `.cr-inner` 최대 너비: 680px, 패딩: `6rem 2rem`

---

## 7. 접근성 (Accessibility)

- `prefers-reduced-motion: reduce` 지원: 트랜지션 0.15s ease, transform/filter 제거, 장식 애니메이션 전체 비활성화
- 각 `<section>`에 `data-day` 속성으로 날 번호 명시
- 에필로그 CTA 링크에 명확한 텍스트 라벨
- 스크롤 힌트 화살표: `aria-hidden="true"`
- 진행 바: `aria-hidden="true"` (장식 요소)
- Google Fonts: `font-display: swap`으로 FOIT 방지

---

## 8. 페이지 진입점 (Entry Points)

### 8-1. 메인 페이지 우주 섹션 CTA

**파일:** `templates/index.html` (`index.js?v=2.5`, `home.css?v=3.2`)

`.universe-content` 하단에 CTA 링크:

```html
<a href="/web/study/creation" class="universe-cta universe-fade">
    7일 창조 이야기 체험하기 <span aria-hidden="true">&rarr;</span>
</a>
```

- 필 버튼 스타일: 반투명 보더, backdrop-filter blur, hover 시 배경 활성화
- `.universe-fade:nth-child(3)` transition-delay 0.9s로 순차 등장

### 8-2. 학습 허브 카드

**파일:** `templates/study/study.html`

학습 카드 그리드 첫 번째 항목으로 배치.

### 8-3. sitemap.xml

```xml
<url>
    <loc>https://elseeker.com/web/study/creation</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
</url>
```

### 8-4. SEO 메타 태그

```
title:       "7일 창조 스크롤 체험 - 창세기 1장 | ElSeeker"
description: "창세기 1장의 7일 창조 이야기를 풀스크린 스크롤로 체험하는 학습 페이지입니다.
              빛의 창조부터 안식일까지, 하나님의 창조 과정을 시각적으로 만납니다."
keywords:    "창세기 1장,7일 창조,창조 이야기,빛이 있으라,하나님의 창조,창세기 공부,성경 창조론"
```

---

## 9. 성경 본문 (Genesis 1 Text - KRV)

### 프롤로그 (창세기 1:1-2)

> 태초에 하나님이 천지를 창조하시니라
> 땅이 혼돈하고 공허하며 흑암이 깊음 위에 있고 하나님의 영은 수면 위에 운행하시니라

### 첫째 날 — 빛 (창세기 1:3-5)

**핵심 선언:** "빛이 있으라"

> 하나님이 이르시되 빛이 있으라 하시니 빛이 있었고
> 그 빛이 하나님이 보시기에 좋았더라

마무리: "저녁이 되고 아침이 되니 이는 첫째 날이니라"

### 둘째 날 — 궁창 (창세기 1:6-8)

**핵심 선언:** "물 가운데 궁창이 있어 물과 물로 나뉘라"

> 하나님이 궁창을 만드사 궁창 아래의 물과 궁창 위의 물로 나뉘게 하시니 그대로 되니라

마무리: "저녁이 되고 아침이 되니 이는 둘째 날이니라"

### 셋째 날 — 땅과 식물 (창세기 1:9-13)

**핵심 선언:** "천하의 물이 한 곳으로 모이고 뭍이 드러나라"

> 하나님이 뭍을 땅이라 부르시고 모인 물을 바다라 부르시니 하나님이 보시기에 좋았더라

마무리: "저녁이 되고 아침이 되니 이는 셋째 날이니라"

### 넷째 날 — 해, 달, 별 (창세기 1:14-19)

**핵심 선언:** "하늘의 궁창에 광명체들이 있으라"

> 하나님이 두 큰 광명체를 만드사 큰 광명체로 낮을 주관하게 하시고
> 작은 광명체로 밤을 주관하게 하시며 또 별들을 만드시고

마무리: "저녁이 되고 아침이 되니 이는 넷째 날이니라"

### 다섯째 날 — 물고기와 새 (창세기 1:20-23)

**핵심 선언:** "물들은 생물을 번성하게 하라, 새는 하늘의 궁창에서 날으라"

> 하나님이 큰 바다 짐승들과 물에서 번성하여 움직이는 모든 생물을 그 종류대로 창조하시니
> 하나님이 보시기에 좋았더라

마무리: "저녁이 되고 아침이 되니 이는 다섯째 날이니라"

### 여섯째 날 — 동물과 사람 (창세기 1:24-31)

**핵심 선언:** "우리의 형상을 따라 우리가 사람을 만들고"

> 하나님이 자기 형상 곧 하나님의 형상대로 사람을 창조하시되 남자와 여자를 창조하시고
> 하나님이 그들에게 복을 주시며 이르시되 생육하고 번성하여 땅에 충만하라

마무리: "하나님이 지으신 그 모든 것을 보시니 보시기에 심히 좋았더라"

### 일곱째 날 — 안식 (창세기 2:1-3)

**핵심 선언:** "하나님이 그 일곱째 날을 복되게 하사 거룩하게 하셨으니"

> 천지와 만물이 다 이루어지니라
> 하나님이 그가 하시던 일을 일곱째 날에 마치시니
> 그가 하시던 모든 일을 그치고 일곱째 날에 안식하시니라

---

## 10. 설계 결정 기록 (Design Decision Log)

| 결정 | 채택 | 기각 | 이유 |
|---|---|---|---|
| 스크롤 방식 | scroll-snap mandatory | 네이티브 스크롤, proximity | mandatory가 풀페이지 체험에 가장 적합. proximity는 자석 동작이 부자연스러움 |
| 진행 표시 | 하단 3px 프로그레스 바 | 우측 세로 dot 인디케이터 | 미니멀, 몰입 방해 최소화 |
| 스크롤 컨테이너 | `<main>` 일반 블록 | 커스텀 래퍼 (overflow-y: scroll) | 래퍼가 브라우저 네이티브 스크롤과 충돌 |
| 장식 효과 | CSS pseudo-element | Three.js 3D 씬 | 성능 예산 내 유지, 모바일 호환성 |
| 텍스트 등장 | CSS transition + IntersectionObserver | JS setTimeout 딜레이 | CSS nth-child 딜레이가 더 깔끔하고 유지보수 용이 |
| 페이드인 속도 | 1.2s (중간값) | 0.9s (빠름), 1.8s (느림) | 사용자 피드백 기반 반복 조정 |
| 딜레이 간격 | 0s~0.9s (1초 이내) | 0.1s~1.7s (넓은 간격) | 빠른 스크롤 시 빈 화면 방지 |
| 상단 네비게이션 | 스크롤 중 숨김, 에필로그에서 노출 | 항상 표시 | 풀스크린 몰입 체험에 nav가 방해 |
| 스크롤 힌트 | 막대+V자 화살표 | 마우스 휠 아이콘, 쉐브론 단독 | 막대 화살표가 가장 직관적 |
| 프로그레스 바 위치 | 하단 + safe-area-inset | 하단 bottom:0 고정 | iPhone 홈 인디케이터 겹침 방지 |

---

## 11. 향후 확장 가능성 (Future Enhancements)

### Phase 2 — Three.js 강화 (선택)

- 4일차(별) 섹션에 `universe-bg.js` 패턴 적용한 별 파티클 씬
- 하드웨어 감지 후 Three.js 미적용 폴백 처리

### Phase 3 — 사운드 및 햅틱 (선택)

- Web Audio API로 섹션별 ambient 사운드 (물소리, 바람소리 등)
- 음소거 기본값, 토글 버튼 제공 (WCAG 1.4.2 준수)
- `navigator.vibrate()` API로 섹션 전환 시 햅틱 (Android)

---

## 12. 참고 자료

- Three.js 우주 배경 구현: `static/js/home/universe-bg.js`
- IntersectionObserver 패턴: `static/js/home/universe-bg.js` 내 sectionRevealObserver
- 섹션 페이드인 CSS 패턴: `static/css/home.css` `.universe-fade`
- Thymeleaf head 프래그먼트: `templates/fragments/head.html`
- 학습 허브 카드 패턴: `templates/study/study.html`
- 개역한글(KRV) 성경 본문 출처: `db/seed/krv/`
