# 구약 성경의 왕들 연대표 화면 기획 및 설계 문서

> 작성일: 2026-07-10
> 담당 도메인: study
> 상태: 설계 완료 (구현 전)

---

## 1. 개요 (Overview)

### 1-1. 페이지 목적

구약 성경의 왕들을 통일왕국, 북이스라엘, 남유다 흐름으로 나누어 연대표 형태로 제공하는 학습 페이지이다.
사용자는 사울부터 시드기야까지의 왕권 흐름을 한눈에 보고, 남북 왕국이 동시에 존재하던 시기의 왕들을 비교하며, 각 왕의 핵심 사건과 관련 성경 본문으로 이동할 수 있어야 한다.

기존 `성경 역사` 페이지가 시대별 사건 중심이라면, 본 페이지는 **왕과 왕조 중심의 병렬 연대기**에 초점을 둔다.

### 1-2. URL 및 라우팅

| 항목 | 값 |
|---|---|
| URL | `/web/study/old-testament-kings` |
| Thymeleaf 템플릿 | `templates/study/old-testament-kings.html` |
| CSS | `static/css/study/old-testament-kings.css` |
| JS | `static/js/study/old-testament-kings.js` |
| 컨트롤러 | `StudyWebController.kt` 내 `@GetMapping("/old-testament-kings")` |
| 인증 | 불필요 (공개 페이지) |

### 1-3. 대상 사용자

- 구약 왕정 시대의 흐름을 처음 정리하려는 일반 성도
- 사무엘상하, 열왕기상하, 역대상하를 읽으며 왕들의 순서를 확인하려는 사용자
- 북이스라엘과 남유다의 동시대 왕을 비교하려는 소그룹 리더, 교사, 설교 준비자

### 1-4. 핵심 가치

- 왕 이름 암기보다 **흐름 이해**를 우선한다.
- 남북 왕국 분열 이후의 복잡한 연대를 병렬 타임라인으로 단순화한다.
- 각 왕의 평가는 단정적 낙인보다 성경 본문 기반 요약으로 제공한다.
- 연대는 학계/전통별 차이가 있으므로 "대략 BCE" 기준임을 명시한다.

---

## 2. study.html 메뉴 추가

### 2-1. 카드 위치

학습 허브(`study.html`) 카드 그리드에서 **성경 역사 카드 다음**에 배치한다.
기존 성경 역사 페이지와 주제가 가깝기 때문에 사용자가 자연스럽게 발견할 수 있다.

### 2-2. 카드 문구

```html
<div class="col-12 col-md-6 col-lg-4">
    <a class="text-decoration-none study-card-link card-lift" href="/web/study/old-testament-kings">
        <div class="card card-panel card-soft">
            <div class="card-body">
                <h3 class="h6 fw-semibold mb-1">
                    <span class="me-2" aria-hidden="true">👑</span>구약 왕들 연대표
                </h3>
                <p class="text-muted small mb-0">통일왕국부터 남북 왕국까지 왕들의 흐름을 한눈에 봅니다.</p>
            </div>
        </div>
    </a>
</div>
```

### 2-3. 아이콘

초기 구현은 `👑` 유니코드 이모지를 사용한다. 이후 학습 메뉴 아이콘 정책을 통일할 경우 `/images/icon/crown.svg`를 추가해 대체할 수 있다.

---

## 3. 파일 구조

```text
src/main/kotlin/com/elseeker/study/adapter/input/web/client/
└── StudyWebController.kt

src/main/resources/
├── templates/study/
│   ├── study.html
│   └── old-testament-kings.html
├── static/css/study/
│   ├── study.css
│   └── old-testament-kings.css
└── static/js/study/
    └── old-testament-kings.js
```

### 버전 관리

| 파일 | 초기 버전 |
|---|---|
| `old-testament-kings.css` | `?v=1.0` |
| `old-testament-kings.js` | `?v=1.0` |
| `study.css` 수정 시 | 기존 버전 +0.1 |
| `study.html`에서 CSS/JS 참조 변경 시 | 참조 쿼리 파라미터 동시 갱신 |

---

## 4. 화면 구성

### 4-1. 전체 레이아웃

```text
[공통 Header: "구약 왕들 연대표" + 뒤로가기]
[Intro: 페이지 설명, 연대 기준 안내]
[Summary Strip: 통일왕국 / 왕국 분열 / 북이스라엘 / 남유다 요약]
[Filter Bar: 왕국, 평가, 성경책, 검색어]
[Timeline Legend: 왕국·평가·표기 설명]
[모바일 왕국 탭: 전체 | 통일 | 북이스라엘 | 남유다]
[Vertical Timeline: 중앙 스파인 · 통일(중앙) → 북(좌)/남(우) 연대순 병합, 위→아래]
[King Detail Panel: 선택한 왕 상세]
[Related Study Links: 성경 역사, 성경 읽기, 성경 사전]
[하단 네비: section-nav fragment]
```

### 4-2. Intro

상단에는 짧은 설명과 연대 주의 문구를 제공한다.

```html
<section class="otk-intro" aria-labelledby="otkIntroTitle">
    <p class="otk-kicker">Old Testament Kings Timeline</p>
    <h2 id="otkIntroTitle">구약 성경의 왕들 연대표</h2>
    <p>
        사울, 다윗, 솔로몬의 통일왕국부터 북이스라엘과 남유다의 왕들을
        왕국별 흐름과 동시대 관계로 살펴봅니다.
    </p>
    <p class="otk-note">
        연도는 대략적인 BCE 기준이며, 세부 연대는 자료와 해석에 따라 달라질 수 있습니다.
    </p>
</section>
```

> Intro 제목은 `<h2>`로 둔다. 페이지의 `<h1>`은 공통 header fragment(`pageTitleVisible=true`)가 렌더하는 페이지 타이틀(`#pageTitleLabel`)이므로, Intro까지 `<h1>`을 쓰면 `<h1>`이 2개가 되어 SEO/접근성에 좋지 않다.

### 4-3. Summary Strip

페이지 초입에서 사용자가 큰 흐름을 먼저 잡도록 4개 요약 칩을 제공한다.

| 구간 | 표시 문구 | 설명 |
|---|---|---|
| 통일왕국 | 사울 → 다윗 → 솔로몬 | 이스라엘 왕정의 시작과 성전 건축 |
| 왕국 분열 | 르호보암 / 여로보암 | 솔로몬 이후 남유다와 북이스라엘로 분열 |
| 북이스라엘 | 여로보암 1세 → 호세아 | 앗수르에 의해 멸망 |
| 남유다 | 르호보암 → 시드기야 | 바벨론 포로로 이어짐 |

### 4-4. Filter Bar

필터는 스크롤 전에 고정하지 않는다. 화면 상단에서 조건을 선택하면 해당 조건에 맞는 왕 카드만 강조한다.

| 필터 | UI | 동작 |
|---|---|---|
| 왕국 | segmented control | 전체 / 통일왕국 / 북이스라엘 / 남유다 |
| 평가 | checkbox group | 선한 왕 / 악한 왕 / 혼합 평가 / 왕위 찬탈 / 해석 주의 |
| 성경책 | select | 사무엘상, 사무엘하, 열왕기상, 열왕기하, 역대상, 역대하 |
| 검색 | input | 왕 이름, 별칭, 핵심 사건 부분 일치 |

검색 결과가 없을 때는 "조건에 맞는 왕이 없습니다. 필터를 줄여보세요." 메시지를 표시한다.

### 4-5. Desktop Timeline (세로 연대기)

**위 → 아래로 흐르는 세로 연대기 타임라인**을 사용한다. 중앙 세로 스파인(시간축)을 두고, 통일왕국은 상단 중앙, 분열 이후에는 북이스라엘을 좌측·남유다를 우측에 두어 즉위 연도(`reignStartBce`) 순으로 병합 배치한다. 동시대 왕이 세로로 가까운 높이에 놓여 자연스럽게 비교된다.

```text
              │  (중앙 스파인 = 시간축, 위=이른 연대)
        ┌───────────┐
        │   사울     │   통일왕국(중앙 정렬)
        │   다윗     │
        │   솔로몬   │
        ●─── 왕국 분열 · BCE 931 ───●
   ┌─────────┐  │
   │여로보암1 │──●             ← 북이스라엘(좌)
   │          │  ●──┌─────────┐
   │          │     │르호보암 │   ← 남유다(우)
   │나답      │──●  └─────────┘
   │  ...     │     │  ...    │
   │호세아    │──●             ← 즉위 연도순 병합
        ●─ 북이스라엘 멸망 · BCE 722 ─●
                  ●──│히스기야 │   (이후 남유다만 이어짐)
                     │  ...    │
                     │시드기야 │
        ●─ 남유다 멸망 · BCE 586 ─●
```

#### 시각 규칙

| 요소 | 표현 |
|---|---|
| 시간축 | 중앙 세로 스파인 라인, 각 왕은 즉위 연도 노드(점 + `BCE {연도}`)로 스파인에 연결 |
| 통일왕국 | 스파인 중앙 정렬 카드 |
| 분열왕국 | 북이스라엘=좌측, 남유다=우측. 좌우를 `reignStartBce` 내림차순으로 병합 |
| 시대 마커 | "왕국 분열(931)", "북이스라엘 멸망(722)", "남유다 멸망(586)"을 스파인 위 pill 마커로 삽입 |
| 동시대 정렬 | 즉위 연도 병합으로 동시대 왕이 세로로 인접. 카드 선택 시 상대 왕국 왕 카드에 강조(`is-contemporary`) |
| 평가 | 선한/악한/혼합/찬탈/해석주의 pill 배지 |
| 왕조 교체 | 카드 메타의 "왕조 교체" 라벨 |
| 멸망/포로 | 카드 메타의 사건 배지 + 시대 마커 |
| 단일 왕국 선택 | 스파인을 좌측으로 옮긴 단일 열(`.is-single`)로 접힘 |

### 4-6. Mobile Timeline

모바일(`< 768px`)에서는 스파인을 좌측으로 옮겨 **단일 세로 열**로 접는다. 통일왕국 이후 북/남 왕들이 **즉위 연도순으로 자연스럽게 섞여** 위→아래로 흐르며, 각 카드에 왕국 배지(통일/북/남)가 붙어 구분된다. (데스크톱과 동일한 병합 정렬을 그대로 세로화하므로 별도 인터리브 로직이 필요 없다.)

```text
[왕국 탭: 전체 | 통일 | 북이스라엘 | 남유다]
│ ● BCE 1050  사울 [통일]
│ ● BCE 1010  다윗 [통일]
│ ● BCE 970   솔로몬 [통일]
│ ── 왕국 분열 · BCE 931 ──
│ ● BCE 931   여로보암 1세 [북]
│ ● BCE 931   르호보암 [남]
│ ● BCE 913   아비얌 [남]
│ ...
```

- 기본 탭은 `전체`. 데스크톱 왕국 segmented 컨트롤은 모바일에서 상단 탭으로 대체된다.
- 북이스라엘/남유다 탭에서는 해당 왕국 카드만 남는다.

### 4-7. King Card

```html
<article class="otk-king-card" data-king-id="{id}" data-kingdom="{kingdom}">
    <div class="otk-king-card-head">
        <span class="otk-kingdom-badge">{왕국}</span>
        <span class="otk-reign-range">{대략 BCE 1010-970}</span>
    </div>
    <div class="otk-king-card-titlerow">
        <h3 class="otk-king-name">{다윗}</h3>
        <span class="otk-eval-badge">{선한 왕}</span>
    </div>
    <p class="otk-king-summary">{핵심 요약}</p>
    <div class="otk-king-meta">
        <span>{왕조}</span>
        <!-- 왕조 교체 / 멸망·포로 라벨(해당 시) -->
    </div>
    <button type="button" class="otk-detail-button" aria-expanded="false" aria-controls="otkDetail">
        자세히 보기
    </button>
</article>
```

- 카드 이름은 `<h3>`이다. 각 카드는 세로 타임라인 행(`.otk-row`)에 담겨 스파인 좌/우/중앙에 배치된다.
- 카드는 자체 링크가 아니라 상세 패널을 여는 버튼을 가진다. 관련 성경 본문 이동은 상세 패널 안에서 제공한다.

### 4-8. King Detail Panel

데스크톱에서는 우측 사이드 패널, 모바일에서는 하단 시트 또는 카드 아래 확장 영역으로 표시한다.

| 섹션 | 내용 |
|---|---|
| 기본 정보 | 이름, 왕국, 재위 연도, 부친/왕조, 이전 왕, 다음 왕 |
| 핵심 사건 | 2-4개 bullet |
| 성경 평가 | 성경 본문이 요약하는 평가 문장 |
| 관련 본문 | 사무엘/열왕기/역대기 링크 |
| 동시대 왕 | 같은 시기 북/남 왕국 왕 카드로 이동 |
| 학습 메모 | "성전", "우상숭배", "개혁", "포로" 등 태그 |

---

## 5. 데이터 구조

### 5-1. JavaScript 데이터 배열

초기 구현은 DB 없이 `old-testament-kings.js` 안의 정적 배열로 제공한다.
이 페이지는 운영자가 자주 수정하는 데이터가 아니며, 기존 학습 정적 페이지 패턴과 맞는다.

```javascript
const OLD_TESTAMENT_KINGS = [
    {
        id: "david",
        name: "다윗",
        englishName: "David",
        kingdom: "united",
        kingdomLabel: "통일왕국",
        dynasty: "다윗 왕조",
        reignStartBce: 1010,
        reignEndBce: 970,
        reignLabel: "대략 BCE 1010-970",
        predecessorId: "saul",
        successorId: "solomon",
        evaluation: "faithful",
        evaluationLabel: "선한 왕",
        summary: "예루살렘을 수도로 삼고 이스라엘 왕국의 기틀을 세웠습니다.",
        keyEvents: [
            "골리앗을 이긴 후 사울 왕가와 긴 갈등을 겪음",
            "예루살렘을 정복해 수도로 삼음",
            "밧세바 사건 이후 가정과 왕국에 큰 갈등이 일어남"
        ],
        references: [
            { label: "사무엘상 16장", bookOrder: 9, chapterNumber: 16 },
            { label: "사무엘하 5장", bookOrder: 10, chapterNumber: 5 },
            { label: "열왕기상 2장", bookOrder: 11, chapterNumber: 2 }
        ],
        contemporaryIds: [],
        tags: ["통일왕국", "예루살렘", "언약", "시편"]
    }
];
```

- `evaluation` 값은 5-3의 주 평가(`faithful` / `evil` / `mixed` / `usurper`) 중 하나를 쓴다. `disputed`("해석 주의")는 주 평가와 배타적이지 않은 **보조 성격**이므로, 별도의 `disputed: true` 불리언 플래그로 표시한다(예: 아달랴 = `evaluation: "usurper"` + `disputed: true`). "해석 주의" 필터는 `evaluation === "disputed"`가 아니라 이 플래그를 기준으로 매칭하므로, 한 왕이 "왕위 찬탈"과 "해석 주의" 필터 양쪽에서 잡힐 수 있다.
- `contemporaryIds`는 **동시대 반대 왕국 왕의 id 목록을 데이터에서 명시적으로 지정**한다. 재위 연도 겹침으로 런타임 계산하지 않는다 — 남유다/북이스라엘 왕들은 섭정(co-regency)으로 재위 구간이 겹쳐(예: 여로보암 2세 793-753 vs 요아스 798-782, 웃시야 792-740 vs 아마샤 796-767, 히스기야 715-686 vs 아하스 735-715) 연도 기반 계산이 부정확해지기 때문이다. 통일왕국 왕은 빈 배열로 둔다.

### 5-2. 왕국 구분

| 값 | 라벨 | 설명 |
|---|---|---|
| `united` | 통일왕국 | 사울, 다윗, 솔로몬 |
| `israel` | 북이스라엘 | 여로보암 1세부터 호세아까지 |
| `judah` | 남유다 | 르호보암부터 시드기야까지 |

### 5-3. 평가 구분

| 값 | 라벨 | 설명 |
|---|---|---|
| `faithful` | 선한 왕 | 성경 본문에서 여호와 보시기에 정직히 행했다고 평가되는 왕 |
| `evil` | 악한 왕 | 우상숭배와 불순종이 중심 평가인 왕 |
| `mixed` | 혼합 평가 | 선한 면과 실패가 함께 두드러지는 왕 |
| `usurper` | 왕위 찬탈 | 쿠데타, 암살, 왕조 교체와 직접 연결된 왕 |
| `disputed` | 해석 주의 | 연대/평가/지위에 보충 설명이 필요한 인물 |

### 5-4. 초기 포함 대상

#### 통일왕국

| 순서 | 왕 | 대략 재위 | 핵심 |
|---|---|---|---|
| 1 | 사울 | BCE 1050-1010 | 이스라엘의 첫 왕 |
| 2 | 다윗 | BCE 1010-970 | 예루살렘 수도, 다윗 언약 |
| 3 | 솔로몬 | BCE 970-931 | 성전 건축, 말년의 우상숭배 |

#### 북이스라엘

| 순서 | 왕 | 대략 재위 | 핵심 |
|---|---|---|---|
| 1 | 여로보암 1세 | BCE 931-910 | 금송아지 제단, 북왕국 시작 |
| 2 | 나답 | BCE 910-909 | 여로보암 왕조의 짧은 지속 |
| 3 | 바아사 | BCE 909-886 | 왕조 교체 |
| 4 | 엘라 | BCE 886-885 | 시므리에게 암살 |
| 5 | 시므리 | BCE 885 | 7일 통치 |
| 6 | 오므리 | BCE 885-874 | 사마리아 건설 |
| 7 | 아합 | BCE 874-853 | 엘리야 시대, 바알 숭배 |
| 8 | 아하시야 | BCE 853-852 | 아합 왕가 지속 |
| 9 | 여호람 | BCE 852-841 | 예후에게 왕조가 끝남 |
| 10 | 예후 | BCE 841-814 | 아합 왕가 심판, 새 왕조 |
| 11 | 여호아하스 | BCE 814-798 | 아람 압박 |
| 12 | 요아스 | BCE 798-782 | 엘리사 말년과 연결 |
| 13 | 여로보암 2세 | BCE 793-753 | 북왕국의 정치적 번영 |
| 14 | 스가랴 | BCE 753-752 | 예후 왕조 종료 |
| 15 | 살룸 | BCE 752 | 한 달 통치 |
| 16 | 므나헴 | BCE 752-742 | 앗수르 조공 |
| 17 | 브가히야 | BCE 742-740 | 베가에게 암살 |
| 18 | 베가 | BCE 740-732 | 아람-이스라엘 동맹 |
| 19 | 호세아 | BCE 732-722 | 사마리아 함락, 북왕국 멸망 |

#### 남유다

| 순서 | 왕 | 대략 재위 | 핵심 |
|---|---|---|---|
| 1 | 르호보암 | BCE 931-913 | 왕국 분열 |
| 2 | 아비얌 | BCE 913-911 | 다윗 왕조 지속 |
| 3 | 아사 | BCE 911-870 | 개혁, 말년의 실패 |
| 4 | 여호사밧 | BCE 870-848 | 신앙 개혁, 아합 왕가와 동맹 |
| 5 | 여호람 | BCE 848-841 | 아합 가문 영향 |
| 6 | 아하시야 | BCE 841 | 예후 혁명 때 죽음 |
| 7 | 아달랴 | BCE 841-835 | 왕위 찬탈, 여왕 통치 |
| 8 | 요아스 | BCE 835-796 | 성전 수리, 말년 변질 |
| 9 | 아마샤 | BCE 796-767 | 에돔 승리 후 교만 |
| 10 | 웃시야 | BCE 792-740 | 강성한 통치, 교만으로 나병 |
| 11 | 요담 | BCE 750-732 | 비교적 안정된 통치 |
| 12 | 아하스 | BCE 735-715 | 앗수르 의존, 우상숭배 |
| 13 | 히스기야 | BCE 715-686 | 종교 개혁, 앗수르 위기 |
| 14 | 므낫세 | BCE 697-642 | 악한 통치, 회개 전승 |
| 15 | 아몬 | BCE 642-640 | 짧은 악한 통치 |
| 16 | 요시야 | BCE 640-609 | 율법책 발견, 종교 개혁 |
| 17 | 여호아하스 | BCE 609 | 애굽에 의해 폐위 |
| 18 | 여호야김 | BCE 609-598 | 바벨론 압박 |
| 19 | 여호야긴 | BCE 598-597 | 바벨론 포로로 끌려감 |
| 20 | 시드기야 | BCE 597-586 | 예루살렘 함락, 남유다 멸망 |

> 아달랴는 엄밀히 말해 남유다의 여왕/왕위 찬탈자로 분류한다. 사용자가 왕정 흐름을 놓치지 않도록 연대표에는 포함하되, 상세 패널에 지위 설명을 명시한다.

---

## 6. 인터랙션

### 6-1. 카드 선택

- 왕 카드를 클릭하면 상세 패널을 연다.
- 선택된 카드는 `is-selected` 클래스를 가진다.
- 같은 시기 반대 왕국 왕이 있으면 해당 카드에 `is-contemporary` 클래스를 부여한다.
- 이미 선택한 카드를 다시 클릭하면 상세 패널을 닫는다.

### 6-2. 동시대 왕 이동

상세 패널의 "동시대 왕" 버튼을 누르면 해당 왕 카드로 부드럽게 스크롤한다.
이동 후 1.5초 동안 카드에 강조 효과를 적용한다.

### 6-3. 성경 본문 이동

관련 본문 링크는 기존 성경 읽기(구절 뷰) URL 패턴을 사용한다.

```text
/web/bible/verse?translationId=1&bookOrder={bookOrder}&chapterNumber={chapterNumber}&from=old-testament-kings
```

> ⚠️ 반드시 `/web/bible/verse`를 사용한다. `/web/bible/chapter`는 **장 선택 목록** 화면이며 `translationId`, `bookOrder`만 사용하고 `chapterNumber`를 무시하므로 특정 장 본문으로 이동하지 않는다. 실제 본문(구절) 읽기 화면은 `/web/bible/verse`이다. (근거: `BibleWebController.kt`의 `@GetMapping("/verse")`, `search-sources.js`·`bible-reference-parser.js`의 딥링크 패턴)

`from=old-testament-kings`를 붙여 향후 뒤로가기/유입 분석에 활용할 수 있게 한다.

### 6-4. 필터 상태

- 초기 구현은 URL 쿼리 동기화를 하지 않는다.
- 후속 개선으로 `?kingdom=judah&keyword=히스기야` 형태를 지원할 수 있다.
- 필터 변경 시 스크롤 위치는 유지한다.

---

## 7. 접근성

- 타임라인은 시각적으로 선을 사용하더라도 DOM은 읽기 순서가 자연스러운 `section`, `ol`, `li`, `article` 구조로 작성한다.
- 왕국 필터는 `button` 기반 segmented control로 구현하고 `aria-pressed`를 갱신한다.
- 상세 패널 열림 버튼은 `aria-expanded`와 `aria-controls`를 사용한다.
- 색상만으로 평가를 전달하지 않고 배지 텍스트를 함께 제공한다.
- 모바일 하단 시트를 사용할 경우 포커스 트랩이 필요한 모달로 만들지 않는다. 본문 흐름 안의 확장 패널로 처리하는 것이 단순하고 접근성이 좋다.
- 모션은 `prefers-reduced-motion: reduce`에서 제거한다.

---

## 8. 반응형 기준

| 화면 | 구성 |
|---|---|
| `>= 768px` | 중앙 스파인 세로 타임라인(통일=중앙, 북=좌·남=우 병합). 단일 왕국 선택 시 좌측 단일 열(`.is-single`)로 접힘. 상세 패널은 타임라인 아래 |
| `< 768px` | 스파인을 좌측으로 옮긴 단일 세로 열. 북/남이 즉위 연도순으로 섞여 흐름. 상단 왕국 탭으로 왕국 선택. 상세는 타임라인 아래 확장 |

- 스파인 폭은 `--otk-spine`(`clamp()`)으로, 카드 너비는 grid `1fr`로 유연하게 잡아 긴 왕 이름/라벨이 넘치지 않게 한다.
- 상세 패널은 데스크톱에서도 우측 고정 사이드바가 아니라 타임라인 아래 in-flow 확장 카드로 처리한다(접근성 §7의 "본문 흐름 확장 패널" 원칙). 열릴 때 뷰포트로 스크롤된다.

---

## 9. 디자인 톤

### 9-1. 색상

왕국 구분은 한 가지 색상 계열로 몰지 않는다.

| 항목 | 권장 색상 방향 |
|---|---|
| 통일왕국 | muted gold |
| 북이스라엘 | teal/green |
| 남유다 | indigo/navy가 아닌 restrained blue |
| 멸망/포로 | neutral charcoal |
| 경고/악한 평가 | muted red |
| 선한 평가 | muted green |

### 9-2. 컴포넌트

- Hero를 과하게 만들지 않고 학습 도구처럼 조용하고 정보 밀도 있게 구성한다.
- 카드는 8px 이하 radius를 사용해 기존 카드 UI와 맞춘다.
- 카드 안에 또 다른 카드 형태를 중첩하지 않는다.
- 배지는 작고 읽기 쉬운 pill 형태로 사용하되, 주요 액션 버튼처럼 보이지 않게 한다.

---

## 10. SEO 및 메타

### 10-1. 페이지 메타

| 항목 | 값 |
|---|---|
| title | `구약 왕들 연대표 - 통일왕국, 북이스라엘, 남유다 왕정 정리 | ElSeeker` |
| description | `사울, 다윗, 솔로몬의 통일왕국부터 북이스라엘과 남유다의 왕들을 연대표로 정리한 성경 학습 페이지입니다.` |
| keywords | `구약 왕들, 성경 왕 연대표, 이스라엘 왕, 유다 왕, 통일왕국, 북이스라엘, 남유다, 성경 연대기` |

### 10-2. sitemap.xml

`src/main/resources/static/sitemap.xml`의 학습 허브 영역에 추가한다. (`build/resources/...` 사본은 빌드 산출물이므로 직접 수정하지 않는다.) 기존 학습 페이지 관례(`changefreq monthly`, `priority 0.7`)와 일치한다.

```xml
<url>
    <loc>https://elseeker.com/web/study/old-testament-kings</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
</url>
```

---

## 11. 구현 메모

### 11-1. 컨트롤러

`StudyWebController.kt`에 라우트 1개를 추가한다.

```kotlin
@GetMapping("/old-testament-kings")
fun showOldTestamentKings(): String {
    return "study/old-testament-kings"
}
```

### 11-2. 템플릿 골격

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org" lang="ko">
<head th:replace="~{fragments/head :: head(
        '구약 왕들 연대표 - 통일왕국, 북이스라엘, 남유다 왕정 정리 | ElSeeker',
        true,
        '/css/study/old-testament-kings.css?v=1.0')}"
      th:with="pageDescription='사울, 다윗, 솔로몬의 통일왕국부터 북이스라엘과 남유다의 왕들을 연대표로 정리한 성경 학습 페이지입니다.',
               pageKeywords='구약 왕들,성경 왕 연대표,이스라엘 왕,유다 왕,통일왕국,북이스라엘,남유다,성경 연대기'">
</head>
<body class="has-fixed-nav study-page" data-show-back="true">
<header th:replace="~{fragments/header :: header}"
        th:with="pageTitle='구약 왕들 연대표', pageTitleVisible=true"></header>

<main class="container content-wrapper old-testament-kings-main">
    <section class="otk-intro" aria-labelledby="otkIntroTitle"></section>
    <section class="otk-summary" aria-label="왕정 시대 요약"></section>
    <section class="otk-filter" aria-label="왕 연대표 필터"></section>
    <section class="otk-timeline" aria-label="구약 왕들 연대표"></section>
    <section class="otk-detail" aria-live="polite"></section>
</main>

<script type="module" src="/js/study/old-testament-kings.js?v=1.0"></script>
<div th:replace="~{fragments/section-nav :: section-nav}"></div>
</body>
</html>
```

> 뒤로가기 버튼은 body에 `data-show-back="true"`를 지정해 전역 `common-nav.js`가 처리하도록 한다. `common-nav.js`는 `body[data-show-back="true"]`이고 `history.length > 1`일 때만 `#topNavBackButton`을 노출하고 `history.back()`을 연결한다. (community/game 페이지에서 쓰는 `data-back-link` 속성은 각 페이지 전용 JS가 직접 읽는 별개 방식이며 `common-nav.js`는 이를 읽지 않으므로, `data-back-link`만 붙여서는 back 버튼이 노출되지 않는다. 페이지 JS에서 `#topNavBackButton`을 직접 wiring하는 twelve-tribes 방식도 대안이나, 정적 페이지에는 전역 처리가 더 단순하다.)

### 11-3. JS 클래스 구조

```javascript
class OldTestamentKingsTimeline {
    constructor() {
        this.kings = OLD_TESTAMENT_KINGS;
        this.state = {
            kingdom: "all",
            evaluations: new Set(),
            book: "all",
            keyword: "",
            selectedKingId: null
        };
    }

    init() {
        this.cacheElements();
        this.renderFilters();
        this.renderTimeline();
        this.bindEvents();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new OldTestamentKingsTimeline().init();
});
```

---

## 12. QA 체크리스트

- [ ] `/web/study/old-testament-kings` 라우트가 정상 렌더링된다.
- [ ] 학습 허브에서 카드 클릭 시 해당 페이지로 이동한다.
- [ ] 데스크톱에서 통일왕국/북이스라엘/남유다 구분이 한눈에 보인다.
- [ ] 모바일에서 왕국 탭과 카드 목록이 깨지지 않는다.
- [ ] 왕 카드 선택 시 상세 패널이 열리고 `aria-expanded`가 갱신된다.
- [ ] 검색어로 왕 이름과 핵심 사건을 찾을 수 있다.
- [ ] 필터 조합 결과가 없을 때 빈 상태 메시지가 보인다.
- [ ] 관련 본문 링크가 `/web/bible/verse`(구절 뷰)로 이동하며 지정한 장 본문이 실제로 열린다. (`/web/bible/chapter` 아님)
- [ ] 헤더 뒤로가기 버튼이 노출되고(직전 히스토리가 있을 때) 정상 동작한다.
- [ ] 페이지에 `<h1>`이 하나만 존재한다(헤더 페이지 타이틀).
- [ ] `evaluation` 값이 5-3 정의 집합(`faithful`/`evil`/`mixed`/`usurper`/`disputed`)에서만 사용된다.
- [ ] CSS/JS 변경 시 템플릿의 `?v=` 버전을 올렸다.
- [ ] `sitemap.xml`에 신규 URL을 추가했다.
- [ ] `./gradlew build`는 Kotlin 변경이 포함될 때만 실행한다.

---

## 13. 후속 개선 후보

- 왕 카드에서 성경 사전 항목으로 이동하는 링크 추가
- 성경 역사 페이지의 특정 사건과 상호 링크
- "좋은 왕/악한 왕" 평가 기준 도움말 모달
- 포로기 이후 총독/대제사장 흐름까지 확장
- 왕조별 색상 미니맵
- URL 쿼리 기반 필터 공유

