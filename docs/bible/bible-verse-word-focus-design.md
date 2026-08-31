# 사전 표제어 구절 포커스 설계 문서

성경 사전 상세([dictionary-detail.html](../../src/main/resources/templates/study/dictionary-detail.html))의
`관련 성경 구절` 을 누르면 구절 화면([verse-list.html](../../src/main/resources/templates/bible/verse-list.html))으로
옮겨 가 **그 절에 스포트라이트를 주고, 그 절 안의 표제어 글자를 칠한다.**

## 구현 상태

**구현 완료 · 검증 완료.** 서버 코드·새 API·새 테이블·새 `ErrorType` 은 없다.
스포트라이트는 이미 있던 것을 그대로 쓴다.

| 바꾼 파일 | 무엇을 |
|---|---|
| `templates/study/dictionary-detail.html` | `data-dictionary-term` 추가 (§3.4) · `?v=2.8` |
| `static/js/study/dictionary-detail.js` | 링크에 `word` · 번역본 미선택 시 returnPath (§3.3) |
| `static/js/bible/verse-list.js` | `parseFocusWord` · `applyFocusWord` · `paintFocusWord` · `paintTextNode` · `findFocusStarts`, `state.focusWord`/`focusVerseNumber`, `buildVerseUrl`·`loadChapter` 반영 |
| `static/css/bible/verse-list.css` | `.verse-word-focus` |
| `templates/bible/verse-list.html` | `?v=7.3` · `?v=5.8` |

검증을 마쳤다.

- **로직** — 운영 DB 의 실제 절 20건(직접 고른 10 + 극단값 10). 전부 통과(§10.1).
- **색** — 실제 `verse-list.css` 로 라이트·다크 × 다섯 상태를 재고, 거기서 나온 결함을 고쳤다
  (§7.1 · §7.2). **넷이던 신호가 다섯이 됐다.**
- **화면** — 앱을 띄워 운영 DB 본문으로 전 항목을 돌렸다(§10.2). 대역 토글에서도 강조가
  살아남는 것을 확인했다.

> **설계와 달라진 곳이 하나 있다.** 칠하기를 `highlightVerse()` 가 아니라 `renderChapter()`
> 에서 부른다. 대역 토글이 같은 장을 다시 그리면서 강조를 지우기 때문이며, 그 경위는 §6.2 에
> 적었다.

이 문서의 수치는 **2026-08-31 운영 DB 에서 직접 재 본 값**이며 추정치가 아니다. 질의 대상은
`dictionary` 322건, `dictionary_reference` 1,029건, KRV 본문 31,102절이다.

- 관련: [word-frequency-design.md](word-frequency-design.md) (어휘·매처) ·
  [bible-compare-design.md](bible-compare-design.md) (같은 화면을 건드리는 다른 설계)

## 1. 무엇을 만드는가

사전에서 `기름 부음` 을 읽다가 관련 구절 `출 30:30` 을 누르면, 구절 화면이 열리고 그 절이
스포트라이트로 떠오르며 **본문 안의 `기름` 글자가 칠해져 있다.** 어디를 보라는 것인지 눈이
먼저 안다.

### 1.1 이 문서가 다루지 않는 것

- 구절 화면에서 단어를 눌러 사전으로 가는 **반대 방향** — 이미 있다(`word-stats.js:250` 의
  통계 팝오버). 이 문서는 사전 → 구절 한 방향만 본다.
- 원어(히브리어/헬라어) 대응, 스트롱 코드.
- 검색 화면(`search.js`)의 키워드 강조 — 별개 코드이며 여기서 고치지 않는다(§6.4).
- 사전 다국어화. `dictionary` 에 `language_code` 를 더하는 계획은
  [word-frequency-design.md](word-frequency-design.md) §8 이 다룬다. 이 기능은 그 변경이
  들어와도 고칠 곳이 없다(§5.3).

## 2. 스포트라이트는 다시 만들지 않는다

`highlightVerse()`(`verse-list.js:649`)가 이미 전부 한다.

| 하는 일 | 코드 |
|---|---|
| 화면을 덮는 오버레이 | `.verse-spotlight-overlay` 생성 후 `is-active` |
| 대상 절·`td`·`tr` 을 흰 카드로 | `.verse-spotlight-target` / `-td` / `-row` |
| 그 자리로 부드럽게 스크롤 | `scrollIntoView({block: "center"})` |
| 클릭 또는 4초 후 해제 | `dismiss()` |

**진입 경로와 무관하게 `verseNumber` 만 있으면 뜬다.** 사전 링크는 이미 그것을 붙이고
있으므로(`dictionary-detail.js:78`), 사전에서 들어오는 스포트라이트는 **오늘 이미 동작한다.**
같은 사실이 [biblical-intertestamental-period-study-page-design.md](../study/biblical-intertestamental-period-study-page-design.md)
§6-7 에도 적혀 있다.

그러므로 이 문서의 실질은 **단어 색 표시 하나**다. 스포트라이트 쪽은 §7 의 색 충돌만 확인한다.

## 3. URL 계약

```
/web/bible/verse?translationId=1&bookOrder=2&chapterNumber=30&verseNumber=30&word=%EA%B8%B0%EB%A6%84%20%EB%B6%80%EC%9D%8C&from=dictionary
```

`word` 하나를 더한다. `dictionaryId` 를 넘기지 않는 이유는 §4 가 문자열 연산으로 끝나기
때문이다. id 를 넘기면 구절 화면이 표제어를 알아내려고 `study` 모듈 API 를 한 번 더 불러야
하고, 얻는 것이 없다.

| 규칙 | 값 |
|---|---|
| 인코딩 | `encodeURIComponent`. 표제어 16건에 공백이 있다(§4.1) |
| 길이 상한 | 50자. `bible_word.term` 의 컬럼 길이와 맞춘다. 넘으면 무시 |
| — | 실제 표제어 최대 길이는 **9자**(`새 하늘과 새 땅`), 관련 구절이 달린 것 중에는 6자다. 상한에 걸리는 표제어는 **0건**이므로 이 값은 손으로 만든 URL 만 막는다 |
| 빈 값·공백뿐 | 무시. 스포트라이트만 뜬다 |
| **`verseNumber` 없이 `word` 만** | **스포트라이트가 잡는 절을 따라간다** — 아래 참고 |
| 파라미터 순서 | `verseNumber` 다음, `from` 앞 |

`word` 는 **`verseNumber` 에 종속된 파라미터**다. 장 전체를 칠하지 않기로 했으므로(§11)
가리킬 절이 없으면 칠할 대상도 없다. 링크를 만드는 쪽은 둘을 항상 함께 붙인다.

**정확히는 "URL 의 `verseNumber`" 가 아니라 "스포트라이트가 잡은 절" 을 따라간다.**
`renderChapter()` 의 대상 절은 `state.verseNumber ?? VerseStore.consumeVerseNumber()` 라,
URL 에 `verseNumber` 가 없어도 세션에 남은 절 번호가 있으면 그 절이 잡힌다. 칠하기는 그 값을
그대로 쓴다 — 스포트라이트가 뜨는 절과 칠해지는 절이 어긋나는 편이 더 나쁘기 때문이다.
둘 다 없으면 아무 일도 일어나지 않는다.

### 3.1 새로고침에도 남는다 — `verseNumber` 와 똑같이 다룬다

`buildVerseUrl()`(`verse-list.js:465`)이 URL 을 다시 만들고 `updateVerseUrl()` 이
`history.replaceState` 로 덮는다. `verseNumber` 는 여기에 들어 있고 `from` 은 들어 있지
않아서, **첫 렌더 직후 `from` 은 URL 에서 사라진다.** `word` 를 그냥 두면 같은 운명이 되어
새로고침하면 강조가 없어진다.

`word` 는 `verseNumber` 와 같은 취급을 한다.

```js
// buildVerseUrl() — word 는 verseNumber 블록 안에 둔다. 하나만 남으면 계약이 깨진다.
if (state.verseNumber) {
    targetUrl.searchParams.set("verseNumber", state.verseNumber);
    if (state.focusWord) {
        targetUrl.searchParams.set("word", state.focusWord);
    }
}
```

```js
// loadChapter() — 장을 옮기면 전부 버린다
if (direction !== "CURRENT") {
    state.verseNumber = null;
    state.focusWord = null;
    state.focusVerseNumber = null;
}
```

- 이전/다음 장으로 넘어가면 강조도 스포트라이트도 사라진다. 다른 장의 절을 가리키던 값이다.
- `state.focusWord` 는 `renderChapter()` 에서 비우지 않는다. `verseNumber` 가 거기서 비워지는
  것은 `VerseStore` 세션 값을 두 번 소비하지 않으려는 처리이고(`verse-list.js:602`),
  `focusWord` 에는 대응하는 세션 저장소가 없다.

### 3.2 `from=dictionary` 는 이미 쓰이고 있다

`setupBackButton()`(`verse-list.js:337`)의 `backOn` 에 `"dictionary"` 가 들어 있어 백버튼이
`history.back()` 으로 사전 상세로 돌아간다. `state.fromDictionary`(`:258`)는 **파싱만 되고
아무 데서도 읽히지 않는 죽은 필드**다. 이 기능이 그것을 쓰지도 않는다 — 강조 여부는 `word`
가 있느냐로만 갈린다. 링크를 새로 만드는 화면이 생겨도 `from` 을 외우지 않아도 된다.

### 3.3 번역본이 없으면 링크가 구절을 잃는다 (기존 문제)

`dictionary-detail.js:79` 는 `TranslationStore.getCurrentTranslationId()` 가 비어 있으면
**번역본 목록으로 보낸다.** 절 정보가 통째로 사라져, 번역본을 고르고 나면 사용자는 사전으로
돌아가 다시 눌러야 한다. 이 기능이 만든 문제는 아니지만 같은 링크를 고치는 김에 값을 실어
보낸다.

**쿼리 파라미터를 새로 만들지 않는다.** 이 저장소에는 같은 일을 하는 장치가 이미 있다 —
`TranslationStore.saveTranslationReturnPath()`(`storage-util.js:81`)로 sessionStorage 에
경로를 넣어 두면 `translation-list.js:43` 이 `consumeTranslationReturnPath()` 로 꺼내
쓴다. 구절 화면의 번역본 버튼이 지금 그렇게 동작한다(`verse-list.js:246`).

```js
buildVerseUrl: (ref) => {
    const translationId = TranslationStore.getCurrentTranslationId();
    const verseUrl = `${ROUTES.VERSE}?...&word=${encodeURIComponent(App.term)}&from=dictionary`;
    if (!translationId) {
        TranslationStore.saveTranslationReturnPath(verseUrl);   // 고르고 나면 이 절로 온다
        return ROUTES.TRANSLATION_LIST;
    }
    return verseUrl;
}
```

`translationId` 가 없다는 것은 번역본을 한 번도 고르지 않았다는 뜻이라 흔한 경로는 아니다.
**고쳐도 이 기능의 동작은 달라지지 않으므로, 빼도 되는 항목이다.** 다만 넣는 비용이 두 줄이고
이미 있는 장치를 쓴다.

### 3.4 링크를 만드는 쪽에 표제어 문자열이 없다

**`dictionary-detail.js` 는 표제어를 갖고 있지 않다.** 링크를 만드는 데 쓰는 값은 두
갈래인데 둘 다 표제어가 아니다.

| 값 | 출처 |
|---|---|
| `dictionaryId` | `document.body.dataset.dictionaryId` |
| `bookOrder` · `chapterNumber` · `verseNumber` · `verseLabel` | `/api/v1/study/dictionaries/{id}/references` 응답 |

표제어는 서버 모델(`dictionary.term`)에서 `<h1 class="dictionary-term">` 으로만 렌더된다
(`dictionary-detail.html:18`). **`?v=` 만 올리면 되는 화면이 아니라 마크업을 고쳐야 하는
화면이다.**

```html
<!-- 지금 -->
<body th:attr="data-back-link=${backLink},data-dictionary-id=${dictionary.id}">
<!-- 바꾼 뒤 -->
<body th:attr="data-back-link=${backLink},data-dictionary-id=${dictionary.id},data-dictionary-term=${dictionary.term}">
```

```js
App.term = (document.body.dataset.dictionaryTerm ?? "").trim();
```

- **`<h1>` 의 `textContent` 를 읽지 않는다.** 화면에 보이는 글자를 데이터로 되읽는 방식은
  제목 마크업이 바뀌는 순간 조용히 빈 문자열이 된다(강조가 사라질 뿐 오류는 나지 않는다).
  `data-dictionary-id` 가 이미 body 에 있으므로 같은 자리에 둔다.
- 새 API 를 부르지 않는다. `GET /api/v1/study/dictionaries/{id}` 가 `term` 을 돌려주지만,
  서버가 이미 모델에 갖고 있는 값을 위해 왕복을 만들 이유가 없다
  ([frontend.md](../../.claude/rules/frontend.md) 의 서버 렌더 우선 원칙).
- `dictionary.term` 은 `DictionaryViewResponse.Detail` 에 이미 있다. 서버 코드 변경은 없다.

## 4. 무엇을 칠하는가 — 표제어 문자열 그대로

**표제어를 문자열로 찾아 그 자리를 칠한다.** 형태소 분석도, 어휘 조회도 하지 않는다.
아래는 그 판단의 근거이며, 전부 운영 데이터로 재 본 값이다.

### 4.1 데이터의 모양

| 항목 | 값 |
|---|---|
| `dictionary` | 322건, **전부 한국어** (비한글 표제어 0건) |
| 표제어 길이 | 1자 20건 · 2자 222건 · 3자 이상 80건 |
| 공백이 든 표제어 | 16건 (`기름 부음`, `거룩한 백성`, `거짓 선지자` …) |
| `dictionary_reference` | 1,029건 |
| 관련 구절을 가진 표제어 | **45건** (322건 중) |

관련 구절이 달린 표제어는 45개뿐이다. **이 기능이 오늘 실제로 닿는 범위가 그것이다.** 나머지
277건은 사전 상세에 `등록된 관련 구절이 없습니다` 만 뜬다.

### 4.2 표제어가 본문에 있는 비율 — 76.8%

1,029건의 참조를 실제 본문과 대 봤다.

| 번역본 | 참조 | 표제어 문자열이 본문에 있는 것 | 비율 |
|---|---|---|---|
| KRV (개역한글) | 1,029 | **790** | 76.8% |
| NKRV (개역개정) | 1,029 | 872 | 84.7% |
| KJV 등 비한국어 | 1,029 | **0** | 0% (§5) |

참조가 가리키는 절이 본문에 없는 경우는 KRV·NKRV·KJV 모두 **0건**이다. 절 번호는 맞다.
`dictionary_reference` 의 유니크 제약이 `(dictionary_id, book_order, chapter_number,
verse_number)` 라 중복도 없다.

**나머지 239건은 어떤 규칙으로도 칠할 수 없다.** 참조가 틀린 것이 아니라 관리자가 *개념*으로
연결했기 때문이다.

| 표제어 | 참조 | 맞음 | 안 맞는 이유 |
|---|---|---|---|
| `거듭남` | 8 | **0** | 본문은 활용형이다 — 요 3:3 `사람이 거듭나지 아니하면`, 벧전 1:23 `너희가 거듭난 것이` |
| `귀환` | 6 | **0** | 개역한글이 쓰지 않는 현대 한자어 |
| `견고함` | 27 | 2 | 명사화 어미. 본문은 `견고하게`·`견고하니` |
| `결핍` | 26 | 2 | 위와 같음 |
| `거룩한 백성` | 11 | 1 | 여러 어절짜리 표제어가 본문에 통째로 붙어 나오지 않는다 — 레 11:45 는 `내가 거룩하니 너희도 거룩할지어다` |
| `기적` / `격려` / `갈망` | 12 / 9 / 7 | 각 2 | 위와 같음 |

반대쪽 끝도 있다. `그리스도` 47/47, `권세` 30/30, `거룩` 24/24, `그림자` 19/19, `기업` 26/27
처럼 **본문 어휘와 표제어가 같은 말이면 거의 전부 맞는다.**

딛 3:5 는 `거듭남` 의 참조인데 본문은 `중생의 씻음` 이고, 겔 36:26 은 `새 영을 너희 속에
두고` 다. 어느 쪽도 `거듭남` 이라는 글자를 갖고 있지 않으며 **그래도 참조로서는 옳다.**
그러므로 이 기능의 첫 번째 규칙은 이것이다.

> **못 찾으면 조용히 넘어간다.** 강조가 없어도 스포트라이트는 뜨고, 사용자는 자기가 누른
> 구절을 본다. 안내 문구도 토스트도 띄우지 않는다. 네 번에 한 번 뜨는 `이 절에서 단어를
> 찾지 못했습니다` 는 기능이 아니라 잡음이다.

### 4.3 어절 시작에서만 칠한다

문자열 비교는 형태소 경계를 보지 못한다. 키워드 집계 설계
([word-stat-keyword-count-design.md](word-stat-keyword-count-design.md) §3.2)가 `말` 이
`말씀`·`말미암아` 를 먹고 `물` 이 `재물`·`선물` 을 먹는다고 적어 둔 그 문제다.

그래서 **매치 앞 글자가 한글이면 버린다.** 한국어는 접미가 붙는 언어라 어간이 어절 앞에
온다. `사랑하시니라` 의 `사랑` 은 살고, `재물` 의 `물` 은 죽는다.

실제로 얼마나 걸리는지 재 봤다. KRV 에서 790건의 절 안에 표제어는 **874번** 등장하고 그중
**871번이 어절 시작**이다. 어절 중간은 3번뿐이다.

| 위치 | 본문 | 판단 |
|---|---|---|
| 요이 1:7 · 요일 2:22 | `적그리스도` 안의 `그리스도` | **버려야 한다.** 뜻이 반대인 말에 표제어 색이 붙는다 |
| 신 4:13 | `십계명` 안의 `계명` | 칠해도 무방했다 |

**2건을 막고 1건을 잃는다.** 숫자는 작지만 잃는 쪽이 무해하고 막는 쪽이 `적그리스도` 다.
오류를 내지 않고 그럴듯한 오답을 보여 주는 종류의 실패이므로 규칙을 넣는다.

**어절 시작 규칙은 어절 앞머리가 같은 다른 낱말을 막지 못한다.** 가정이 아니라 관측된
사례가 있다 — 레위기 3:9 는 `기름` 이 네 번 잡히는데 그중 하나가 **`기름진`** 이다(살진,
`기름` 과 다른 말). 유다서 1:15 의 `경건` 네 번은 전부 `경건치 않은` 이라 어근이 같아 문제가
없다. **둘을 코드가 가를 방법은 없다** — 어휘가 필요하고, 그것이 §4.5 다.

이런 자리는 색이 한 칸 더 붙을 뿐 본문을 바꾸지 않으므로 그대로 둔다. 값을 틀리게 만드는
집계와 달리 여기서는 **눈에 거슬리는 것이 손해의 전부**다.

같은 이유로 `길르앗` 의 `길` 도 막지 못한다. 표제어 45건 중 1자짜리는 `길` 하나이고,
그 5개 참조 중 글자가 잡힌 4건은 전부 `길은`·`길로`·`길 가실` 이라 오늘은 걸리지 않았다
(나머지 1건은 본문에 `길` 이 없다). 사전 전체로 보면 1자 표제어가 20건이므로, **그쪽에
관련 구절이 붙기 시작하면 이 규칙만으로는 부족해진다.** 그때 필요한 것은 더 긴 접두 검사가
아니라 §4.5 의 어휘 매칭이다.

### 4.4 보정 규칙은 넣지 않는다 — 재 보고 버렸다

239건의 실패를 줄일 방법 둘을 실제로 계산해 봤다.

| 규칙 | 맞는 참조 | 증가 |
|---|---|---|
| 표제어 그대로 | 790 | — |
| \+ 여러 어절 표제어를 어절별로 따로 찾기 | 808 | **+18** |
| \+ 명사화 어미 `ㅁ` 을 떼어 어간으로 찾기 (`거듭남`→`거듭나`) | 810 | **+2** |

**239건 중 20건을 건지려고 자모 연산과 어절 분해를 클라이언트에 들인다.** 그 대가는 숫자로
드러나지 않는 쪽에 있다. `거룩한 백성` 을 어절로 갈라 찾으면 본문의 아무 `백성` 이나 칠해져,
표제어가 아닌 말이 표제어 색을 갖는다. §4.3 에서 `적그리스도` 를 막은 것과 정확히 반대
방향의 실수다.

**둘 다 넣지 않는다.** 표제어 문자열 하나만 본다.

### 4.5 서버 어휘·별칭으로 하면 더 낫지 않은가 — 아니다

이 저장소에는 이미 조사를 떼고 활용형을 접어 표제어에 맞추는 코드가 있다
(`BibleWordTokenizer` / `BibleWordMatcher`, 단위 테스트 31건). `bible_word.dictionary_id`
컬럼도 있어서 사전 표제어에서 번역본별 표기와 별칭까지 끌어올 수 있다. 당연히 그쪽이 정확할
것 같다.

재 봤더니 **한 건도 늘지 않았다.**

| 규칙 | 맞는 참조 |
|---|---|
| 표제어 그대로 | 790 |
| \+ `bible_word_alias` 의 별칭 전부 | **790** |

관련 구절을 가진 45개 표제어에 걸린 별칭이 **4행**뿐이기 때문이다. 어휘 자체는 KRV 26,996건
(사전 연결 315건) · NKRV 25,715건(244건)으로 충분히 크지만, **별칭은 관리자가 손으로 넣는
값이고 아직 넣지 않았다.** 그리고 어휘가 있는 번역본은 KRV·NKRV 둘뿐 — §5 에서 보듯 그 둘은
문자열 매칭이 이미 가장 잘 맞는 번역본이다.

그러므로 서버 경로는 **새 엔드포인트, 새 컴포넌트, 새 테스트, 화면 진입마다 왕복 한 번을
치르고 지금 얻는 것이 0** 이다. 별칭이 채워지면 그때 다시 볼 문제이고, `word` 를 넘기는
URL 계약(§3)은 그 전환에 영향을 받지 않는다 — 서버 매칭은 `word` 와 `translationId` 를 받아
오프셋을 돌려주면 되고 링크는 그대로다.

## 5. 번역본 — 칠할 수 있는 것은 사실상 KRV 하나다

### 5.1 참조는 번역본에 매여 있지 않다

`dictionary_reference` 는 `(book_order, chapter_number, verse_number)` 만 갖는다. 번역본
컬럼이 없다. 반면 표제어는 322건 전부 한국어다. 그리고 링크가 여는 번역본은
`TranslationStore` 에 남아 있는 **사용자가 마지막에 읽던 번역본**이다.

KJV 를 읽던 사용자가 사전에서 `구원` 의 관련 구절을 누르면 KJV 본문이 열리고, 거기에
`구원` 이라는 글자는 없다. **1,029건 전부 0건이다.**

### 5.2 그래서 어떻게 하는가 — 그대로 둔다

노출 중인 번역본은 11개이고(`BibleReader.getTranslations()`), 그중 `NKRV` 는
`BibleWebController.HIDDEN_TRANSLATION_TYPES` 로 비관리자에게 감춰져 있다. **일반 사용자가
고를 수 있는 한국어 번역본은 KRV 하나뿐이다.**

| 사용자가 읽던 번역본 | 결과 |
|---|---|
| KRV | 스포트라이트 + 단어 강조 (§4.2 의 76.8%) |
| NKRV (관리자) | 스포트라이트 + 단어 강조 (84.7%) |
| KJV · WEB · ASV · RVR1909 · SBLM · JPNMEB · KOUGO · CUVT · CUVS | **스포트라이트만** |

§4.2 가 정한 "못 찾으면 조용히 넘어간다" 가 여기서도 그대로 적용되므로, **비한국어 번역본을
위해 따로 쓸 코드가 없다.** 찾지 못한 것과 언어가 다른 것을 화면이 구분할 이유가 없다.

번역본을 강제로 KRV 로 바꾸는 선택지는 쓰지 않는다. 사용자가 고른 번역본을 사전 링크가
말없이 갈아치우면, 뒤로 돌아왔을 때 읽던 번역본이 바뀌어 있다. 단어에 색을 칠하자고 치를
값이 아니다.

### 5.3 사전 다국어화가 들어와도 고칠 곳이 없다

`dictionary.language_code` 추가는 확정된 계획이다
([word-frequency-design.md](word-frequency-design.md) §8). 영어 표제어가 들어오면 영어
번역본에서 그 표제어가 그대로 매칭된다 — **§4 의 규칙이 언어를 보지 않기 때문이다.**

단 하나, §4.3 의 어절 시작 판단은 한국어를 전제한다. 앞 글자가 한글이면 버리는 규칙은 라틴
문자에서는 아무것도 걸러 내지 못한다. 그때는 앞뒤 모두 `\p{L}` 가 아닐 것을 요구하는 조건이
필요하다. `BibleWordTokenizer` 가 언어별로 분기하는 것과 같은 자리다.

## 6. 어떻게 칠하는가

### 6.1 텍스트 노드를 자른다 — 문자열 치환이 아니다

`renderVerseRow()`(`verse-list.js:798`)는 본문을 템플릿 문자열에 넣어 `innerHTML` 로 그린다
(`:592`, 이 파일에서 `innerHTML` 을 쓰는 유일한 자리). 여기에 손대지 않는다.

**이미 그려진 절 요소의 텍스트 노드를 찾아 자른다.**

```js
// verseEl 은 .verse-text 하나다. 메모 컨테이너는 그 형제 요소이므로(renderVerseRow)
// 순회 범위 밖이고, 입력창 텍스트를 걸러 낼 조건문이 필요 없다.
function paintFocusWord(verseEl, word) {
    const walker = document.createTreeWalker(verseEl, NodeFilter.SHOW_TEXT);
    const targets = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        targets.push(node);   // 먼저 모은다 — 순회 중에 노드를 쪼개면 walker 가 흔들린다
    }
    targets.forEach(node => paintTextNode(node, word));
}

// 겹치는 매치는 세지 않는다 — 찾은 자리에서 표제어 길이만큼 건너뛴다
function findStarts(text, word) {
    const starts = [];
    for (let i = text.indexOf(word); i !== -1; i = text.indexOf(word, i + word.length)) {
        if (i > 0 && /[가-힣]/.test(text[i - 1])) continue;   // 어절 시작만 (§4.3)
        starts.push(i);
    }
    return starts;
}

// 노드를 조각내지 않고 조각을 모아 통째로 바꾼다. splitText 를 반복하면 자를 때마다
// 뒤쪽 오프셋이 밀려, 매치가 둘 이상인 절에서 엉뚱한 자리를 감싸게 된다.
function paintTextNode(node, word) {
    const text = node.nodeValue;
    const starts = findStarts(text, word);
    if (starts.length === 0) return;

    const fragment = document.createDocumentFragment();
    let cursor = 0;
    starts.forEach(start => {
        if (start > cursor) fragment.append(text.slice(cursor, start));
        const mark = document.createElement("mark");
        mark.className = "verse-word-focus";
        mark.textContent = text.slice(start, start + word.length);   // 본문에서 잘라 낸 조각
        fragment.append(mark);
        cursor = start + word.length;
    });
    if (cursor < text.length) fragment.append(text.slice(cursor));
    node.parentNode.replaceChild(fragment, node);
}
```

`.verse-text` 는 오늘 텍스트 노드 하나만 갖는다(KRV 본문에 `<` 가 0건이므로 `innerHTML` 이
자식을 만들지 않는다). `createTreeWalker` 는 그 전제가 깨질 때를 위한 것이고, 노드가 하나뿐인
지금도 같은 코드로 동작한다.

이 방식을 고른 이유는 세 가지다.

- **정규식을 만들지 않는다.** `word` 는 URL 에서 온 값이다. `new RegExp("(" + word + ")")` 는
  `(` 하나로 `SyntaxError` 를 내고, `(a+)+b` 같은 값으로 탭을 멈춰 세울 수 있다. `indexOf`
  에는 그런 표면이 없다.
- **삽입되는 것은 본문의 부분 문자열뿐이다.** `<mark>` 가 감싸는 것은 텍스트 노드에서 잘라
  낸 조각이고, `word` 자체는 어디에도 들어가지 않는다. 텍스트 노드를 다루므로 이스케이프
  문제도 생기지 않는다.
- **문자열 치환의 함정을 피한다.** KRV 본문 31,102절에 `<` 도 `&` 도 **0건**이라 오늘은
  치환도 안전하지만, 본문에 표식이 하나라도 생기는 순간 인덱스 기반 치환은 태그 안쪽을
  자른다. 텍스트 노드는 그 경우에도 옳다.

### 6.2 어디서 부르는가 — 스포트라이트가 아니라 렌더 경로에 붙인다

**`renderChapter()` 끝에서 `applyFocusWord()` 를 부른다.** `highlightVerse()` 안이 아니다.

처음 설계는 `highlightVerse()` 안, 이미 `targetVerse` 를 찾아 둔 자리에서 칠하는 것이었다.
절 요소를 두 번 찾지 않아도 되고 스포트라이트와 강조가 같은 시점에 나타나서다. **대역 기능이
들어오면서 그 자리가 틀린 자리가 됐다.**

`applyCompareTranslation()` 은 대역을 켜고 끌 때 `loadChapter("CURRENT")` 를 부른다. 같은
장을 다시 그리는 것이라 `renderChapter()` 가 `innerHTML` 을 다시 쓰지만, `state.verseNumber`
는 첫 렌더에서 이미 비워졌으므로 `highlightVerse()` 를 타지 않고 `restoreVerseNumber` 경로로
간다. **칠해 둔 `<mark>` 는 표와 함께 사라지고 다시 칠해지지 않는다.**

그래서 상태를 둘로 나눈다.

| 필드 | 수명 |
|---|---|
| `state.verseNumber` | 첫 렌더에서 소비되고 비워진다 (스포트라이트는 한 번만 뜬다) |
| `state.focusWord` · `state.focusVerseNumber` | **장이 바뀔 때까지 산다** — 같은 장을 몇 번 다시 그리든 다시 칠한다 |

```js
// renderChapter() 끝
if (verseNumber && state.focusWord) {
    state.focusVerseNumber = verseNumber;
}
applyFocusWord();
```

`applyFocusWord()` 는 **`renderChapter()` 가 표를 다시 그린 직후에만** 부른다. 같은 DOM 에
두 번 부르면 이미 칠한 `<mark>` 안의 글자를 다시 칠해 마크가 중첩된다. `renderChapter()` 가
이 파일의 유일한 `innerHTML` 쓰기이므로 그 불변식이 지켜진다 — 나머지 경로는 클래스만 바꾼다
(`applyHighlightsMerged`, `applyMemoIndicators`). 글씨 크기 변경도 `:root` 변수만 바꾼다
(`verse-list.css:6`).

주 번역본에 없는 절(대역에만 있는 절)은 `.verse-text` 자체가 만들어지지 않으므로
(`renderVerseRow` 의 `compareOnly`), `applyFocusWord()` 가 대상을 찾지 못하고 조용히 끝난다.

### 6.3 절 요소 안에 자식이 생긴다 — 무엇이 깨지는지 세어 봤다

`.verse-text` 는 지금까지 텍스트 노드 하나만 갖고 있었다. `<mark>` 를 넣는 것은 **그 전제를
바꾸는 일**이므로, 그 요소를 읽는 코드를 전부 확인했다.

| 위치 | 읽는 방식 | `<mark>` 가 생기면 |
|---|---|---|
| `buildSelectedText():1746` | `verseEl.textContent` | **영향 없음.** `textContent` 는 자손 텍스트를 이어 붙이므로 복사·공유 문자열이 그대로다 |
| `applyMemoIndicators():956` | `classList` 토글 | 영향 없음 |
| `applyHighlights()` / `-Merged()` | `classList` 토글 | 영향 없음 |
| `toggleVerseSelection():1304` | `classList` 토글 | 영향 없음 |
| `handleVerseClick():852` | `event.target.closest(".verse-text[data-verse]")` | **`closest` 라 영향 없음.** `<mark>` 를 눌러도 조상인 `.verse-text` 가 잡혀 절 선택이 동작한다 |
| `showMemo()` / `hideMemo():1081` | `#memo-{n}` 을 따로 찾는다 | 영향 없음 |

복사·공유가 이 표의 핵심이다. [bible-compare-design.md](bible-compare-design.md) §4.2 는
`buildSelectedText()` 가 `document.querySelector` 로 절을 찾는 것을 대역 기능에서 가장 조용히
깨지는 자리로 꼽는다. **이 기능은 절 요소를 새로 만들지 않고 안쪽만 쪼개므로 그 경로를
건드리지 않는다.** `event.target` 을 그대로 쓰는 코드가 있었다면 `<mark>` 클릭이 절 선택을
놓쳤겠지만, `handleVerseClick` 은 `closest` 를 쓴다.

### 6.4 `search.js` 의 방식을 가져오지 않는 이유

검색 결과는 `item.text.replace(new RegExp("(" + keyword + ")", "gi"), ...)` 로 칠한다
(`bible/search.js:391`). 같은 함정을 그대로 갖고 있지만 **거기서 고치지 않는다.** 이 기능의
범위가 아니고, 지금 고치면 검증 범위가 검색 화면까지 넓어진다. 별도 항목으로 남긴다.

### 6.5 해제 시점 — 스포트라이트가 꺼져도 색은 남는다

스포트라이트는 4초 뒤 또는 클릭으로 꺼진다. **단어 색은 그때 지우지 않는다.** 오버레이가
사라진 뒤 본문을 읽는 동안이야말로 그 단어가 어디 있는지 보여야 할 때다.

색은 장을 옮길 때 사라진다(§3.1). 같은 장 안에서 지우는 수단은 두지 않는다 — 지우는 버튼을
만들면 그 버튼을 놓을 자리를 정하는 문제가 따라오고, 하단 3버튼은 이미 `flex-equal` 로 꽉
차 있다.

## 7. 색 — 절이 이미 걸치고 있는 것들과 겹친다

절은 아래 상태를 **동시에** 가질 수 있다. 강조는 그 위에 얹힌다.

| 상태 | 절에 걸리는 것 | 근거 |
|---|---|---|
| 평소 | 테마 배경 | — |
| 형광펜 | 배경색 6종 중 하나 | `verse-list.css:315` 이하 |
| 스포트라이트 | 흰 카드 + `color: #1f2933` | `verse-list.css:418`, `:431` |
| **선택** | `color: #0d6efd` + `font-weight: bold` + `text-decoration: underline` | `verse-list.css:309` |

**선택 상태를 빠뜨리면 안 된다.** `.verse-text.active` 는 **굵기와 밑줄을 이미 쓰고 있다.**
아래에서 고르는 강조 신호 셋 중 둘이 선택된 절에서는 그대로 겹친다는 뜻이다. 절을 눌러
복사·공유하려는 순간이 바로 그 상태다.

**색상만으로 구분하려 들면 안 된다.** 형광펜 6색이 색상환을 거의 다 덮고 있어서, 어떤 색을
고르든 그 색으로 칠해 둔 절에서는 강조가 보이지 않는다. 검색 결과가 쓰는 `#fff59d`
(`search.css:236`)를 그대로 가져오면 노랑 형광펜 절에서 정확히 사라진다.

**테두리를 포함해 다섯을 함께 쓴다.** 넷으로는 부족하다는 것이 실측으로 드러났다.

### 7.1 넷은 부족했다 — 다크 + 형광펜 + 선택

처음에는 배경색·글자색·굵기·밑줄 넷이면 충분하고 최악의 경우에도 **글자색이 남는다**고
적었다. **실제 `verse-list.css` 로 재 보니 틀렸다.**

| 다크 테마 조합 | 글자색 대비 | 배경 대비 | 굵기 | 남는 신호 |
|---|---|---|---|---|
| 형광펜만 | 1.00 | 1.15 | 400 vs 700 | 굵기 |
| 선택만 | 14.76 | 16.28 | 같음 | 글자색·배경 |
| **형광펜 + 선택** | **1.00** | **1.15** | **같음** | **없음** |

`html[data-theme="dark"] .verse-text.verse-highlight-*` 가 절 글자색을 `#1f2933` 으로
강제하는데(`verse-list.css:355` 이하), **그것이 마크의 글자색과 정확히 같은 값이다.** 굵기는
`.active` 가 이미 `bold` 라 같고, 밑줄도 공존한다. 다섯 중 넷이 한꺼번에 무너진다.

> 이 결함은 **직접 옮겨 적은 CSS 로는 잡히지 않았다.** 처음 측정용 페이지는 다크 규칙을
> `.dark .verse-text { color:#ffffff !important }` 한 줄로 줄여 놓았고, 그래서 "글자색이
> 남는다" 는 잘못된 결론이 나왔다. **실제 파일을 `<link>` 로 불러오고 나서야 드러났다.**

### 7.2 테두리 — 절이 가질 수 없는 신호

**`.verse-text` 에 `border` 를 주는 규칙은 저장소 전체에 하나도 없다.** 형광펜은 배경,
`.active` 는 글자색·굵기·밑줄, 스포트라이트는 글자색·`z-index` 만 건드린다. 그래서 테두리는
절이 어떤 상태를 걸치든 상쇄되지 않는 **유일한 신호**다.

배경색으로는 이것을 보장할 수 없다. 형광펜 6색(`#fff59d` `#c8f7c5` `#ffd6e7` `#bbdefb`
`#e1bee7` `#ffe0b2`)이 색상환을 덮고 있어, 어떤 색을 골라도 그중 하나와 부딪힌다.

테두리를 넣은 뒤 다시 쟀다. **모든 상태에 남는 신호가 있다.**

| 겹치는 상태 | 라이트 | 다크 |
|---|---|---|
| 평소 | 글자색·배경·굵기·테두리 (4) | 글자색·배경·굵기·테두리 (4) |
| 노랑 형광펜 | 글자색·굵기·테두리 (3) | 굵기·테두리 (2) |
| 선택(`active`) | 글자색·배경·테두리 (3) | 글자색·배경·테두리 (3) |
| 스포트라이트 | 굵기·테두리 (2) | 굵기·테두리 (2) |
| **노랑 형광펜 + 선택** | 글자색·테두리 (2) | **테두리 (1)** |

테두리와 절 배경의 대비는 상태에 따라 **4.18 ~ 5.02** 로, 비텍스트 요소 기준(WCAG 1.4.11 의
3:1)을 넘는다. 마크 글자 자체의 대비는 어디서나 **11.44** 다.

`<mark>` 의 `color` 는 어느 상태에서도 `rgb(31,41,51)` 로 계산된다. 다크 테마의
`color: #ffffff !important` 도 이 값을 밀어내지 못한다 — `!important` 는 상속으로 넘어오지
않고, 자기 선언이 있는 자식이 이긴다. **다만 §7.1 이 보여 주듯 그 사실이 "글자색이 늘
구분된다" 를 뜻하지는 않는다.** 절 쪽이 같은 값으로 강제되는 상태가 있다.

```css
/* 사전에서 들어온 표제어 강조 (설계 문서: docs/bible/bible-verse-word-focus-design.md) */
.verse-word-focus {
    background-color: #ffe08a;
    color: #1f2933;                          /* 최후의 신호. 선택·다크에서 이것만 남는다 */
    font-weight: 700;
    border-radius: 3px;
    padding: 0 2px;
    text-decoration: underline;              /* 배경색이 겹쳐도 남는 신호 */
    text-decoration-color: #e8890c;
    text-decoration-thickness: 2px;
    text-underline-offset: 2px;
}
```

밑줄은 `box-shadow: inset` 이 아니라 `text-decoration` 으로 그린다. `<mark>` 는 인라인
요소라 긴 절에서 줄바꿈에 걸릴 수 있고, 그때 `box-shadow` 는 조각마다 상자를 따로 그려
`border-radius`·`padding` 과 어긋난다. `text-decoration` 은 줄이 나뉘어도 글자를 따라간다.

- **`color` 를 반드시 함께 정한다.** 다크 테마에는
  `html[data-theme="dark"] .verse-text { color: #ffffff !important; }` 가 걸려 있다
  (`verse-list.css:304`). 자식 요소가 색을 정하지 않으면 밝은 배경 위에 흰 글씨가 남는다. 스포트라이트가 켜져 있는 동안에는 `.verse-spotlight-target` 이 `#1f2933` 을 주지만
  (`:418`), §6.5 대로 색은 스포트라이트보다 오래 살아남는다. **스포트라이트가 꺼진 다크
  테마 화면이 이 규칙이 필요한 이유다.**
- `.highlight-keyword` 를 재사용하지 않는다. 그 클래스는 `search.css` 에 있는데, 그 파일은
  `head` 프래그먼트의 `extraCss` 로 화면마다 따로 싣는 것이고 `verse-list.html` 의 목록에는
  없다(`verse-list.css` · `word-stats.css` 둘뿐). 구절 화면에서는 그 클래스가 아무 스타일도
  갖지 않는다.
- 애니메이션을 넣지 않으므로 `prefers-reduced-motion` 블록(`verse-list.css:151`)에 추가할
  것이 없다.

`<mark>` 태그를 쓴다. 의미가 정확히 그것이고, 브라우저 기본 배경색은 위 규칙이 덮는다.

## 8. 접근성

- **`<mark>` 하나로 끝낸다.** 매치마다 시각적으로 숨긴 설명을 넣지 않는다. 한 절에 여러 번
  나오면 스크린리더가 같은 말을 반복해 본문이 읽히지 않는다.
- 라이브 리전에 알리지 않는다. 스포트라이트도 알리지 않고 있고, 화면이 바뀐 것을 사용자가
  이미 안다(사전에서 링크를 눌러 왔다).
- 색만으로 정보를 전하지 않는다 — 굵기와 밑줄을 함께 쓴 이유가 §7 이다. 강조가 아예 없어도
  구절을 읽는 데는 지장이 없다(§4.2).

## 9. 캐시 버스팅

[frontend.md](../../.claude/rules/frontend.md) 규칙대로 고친 정적 파일마다 `?v=` 를 올린다.

| 파일 | 이전 | 올린 값 | 참조 템플릿 |
|---|---|---|---|
| `js/study/dictionary-detail.js` | `2.7` | `2.8` | `study/dictionary-detail.html` |
| `js/bible/verse-list.js` | `5.7` | `5.8` | `bible/verse-list.html` |
| `css/bible/verse-list.css` | `7.1` | `7.3` | `bible/verse-list.html` |

세 파일 모두 참조 템플릿이 하나뿐임을 확인했다. `verse-list.js` 를 부르는 다른 템플릿은
없다.

**`5.7` / `7.1` 은 대역 기능이 이미 가져갔고, `7.2` 도 그 뒤 소비됐다.** 이 문서를 처음 쓸 때 예약해 둔 값이 그것이라,
같은 화면을 건드리는 설계가 둘 나란히 있을 때는 올리기 직전에 현재 값을 다시 봐야 한다
([bible-compare-design.md](bible-compare-design.md)).

## 10. 검증

Kotlin 코드가 없으므로 `./gradlew build` · `test` 는 돌리지 않는다
([CLAUDE.md](../../CLAUDE.md)).

### 10.1 로직 — 운영 본문으로 돌려 봤다 (완료)

`findFocusStarts` · `paintTextNode` · `paintFocusWord` 를 최소 DOM 위에서 그대로 실행했다.
본문은 전부 운영 DB(KRV)의 실제 절이다. **10건 전부 통과.**

| 절 | `word` | 기대 | 왜 이 절인가 |
|---|---|---|---|
| 시 1:6 | `길` | `길` 2개 | 한 절에 두 번. 오프셋이 밀리면 두 번째가 엉뚱한 자리를 감싼다 |
| 요이 1:7 · 요일 2:22 | `그리스도` | 1개 | `적그리스도` 안쪽은 칠하지 않는다 (§4.3) |
| 신 4:13 | `계명` | 0개 | `십계명` 안쪽 — 어절 시작이 아니라 버린다 |
| 요 3:3 | `거듭남` | 0개 | 본문은 활용형. 조용히 넘어간다 (§4.2) |
| 창 1:1 | `태초` | 1개 | 절 맨 앞(`i === 0`) — 앞 글자 검사가 인덱스 밖을 보지 않는다 |
| 출 30:30 | `기름 부음` | 0개 | 공백이 든 표제어가 본문에 통째로 없을 때 |
| 시 1:6 | `(a+)+b` | 0개 | URL 로 들어온 정규식 폭탄. 0.002ms, 예외 없음 |
| 요이 1:7 | `적그리스도` | 1개 | 표제어 자체가 긴 말이면 그것을 칠한다 |

**모든 사례에서 `textContent` 가 원문과 같았다.** §6.3 의 표에서 가장 중요한 줄 —
복사·공유가 그대로라는 것 — 을 읽기가 아니라 실행으로 확인한 것이다.

이어서 1,029건 중 **가장 깨지기 쉬운 극단값 10건**을 SQL 로 뽑아 같은 함수에 넣었다.
기대값은 Postgres 정규식 `(^|[^가-힣])term` 이 **독립적으로** 센 값이며, **10건 전부
JS 결과와 일치했다.**

| 극단 | 사례 | 결과 |
|---|---|---|
| 한 절에 4회 | 레 3:9 `기름` · 유 1:15 `경건` | 4/4 |
| 3회 연속 | 사 6:3 `거룩하다 거룩하다 거룩하다` | 3/3, 감싼 글자 전부 `거룩` |
| 절 맨 앞(`i === 0`) | 눅 1:50 · 엡 1:23 · 엡 2:4 | 1/1 |
| 공백 든 표제어가 **실제로 맞는** 경우 | 삼하 1:14 · 1:16 · 1:21 `기름 부음` | 1/1 |

`term` 앞에 구두점이 오는 참조는 1,029건에 **0건**이라 그 경로는 실사례가 없다.
감싼 글자가 표제어와 정확히 같은지까지 확인했으므로, 오프셋이 밀리는 종류의 버그는 없다.

### 10.2 화면 — 앱에서 돌렸다

| # | 확인 | 기대 |
|---|---|---|
| 1 | KRV 로 읽다가 사전 `그리스도` → 관련 구절 클릭 | 스포트라이트 + `그리스도` 칠해짐 |
| 2 | 사전 `거듭남` → 요 3:3 | 스포트라이트만. **오류·토스트 없음** |
| 3 | 사전 `그리스도` → 요이 1:7 | `적그리스도` 의 `그리스도` 는 칠해지지 않는다 (§4.3) |
| 4 | 사전 `기름 부음` → 관련 구절 | 공백이 든 표제어가 URL 인코딩을 거쳐 그대로 맞는다 |
| 5 | KJV 로 읽다가 사전 → 관련 구절 | 스포트라이트만. 강조 없음 (§5.2) |
| 6 | 강조된 화면에서 새로고침 | 스포트라이트·강조 모두 다시 뜬다 (§3.1) |
| 7 | 다음 장 버튼 | 강조·스포트라이트 사라지고 URL 에서 `word` 도 사라진다 |
| 8 | 백버튼 | 사전 상세로 돌아간다 (§3.2) |
| 9 | 다크 테마 + 스포트라이트 4초 후 | 밝은 배경 위 글자가 어둡게 남는다 (§7) |
| 10 | 노랑 형광펜을 칠해 둔 절로 진입 | 밑줄·굵기·글자색으로 단어가 구분된다 (§7) |
| 10-1 | 강조된 절을 **선택**(`active`) | 절 전체가 파랗게 굵어져도 표제어만 어두운 글자로 남는다 (§7) |
| 10-2 | **노랑 형광펜 + 선택**을 동시에 걸기 | 네 신호 중 글자색 하나로 버티는 최악 조합. 여기서 안 보이면 색 조합을 다시 잡는다 (§7) |
| 11 | `?word=(a%2B)%2Bb` 를 손으로 넣고 진입 | 오류 없이 강조 없음. 콘솔 깨끗 (§6.1) |
| 12 | `?word=` (빈 값), 50자 초과, `verseNumber` 없이 `word` 만 | 무시. 스포트라이트만 (§3) |
| 13 | 강조된 절을 선택해 **복사·공유** | 복사된 문자열에 표식이 섞이지 않는다 (§6.3) |
| 14 | 칠해진 `<mark>` 글자를 직접 클릭 | 절 선택이 정상 동작한다 (§6.3) |
| 15 | 강조된 절에서 메모 열기·저장 | 메모가 정상 동작하고 강조가 지워지지 않는다 (§6.3) |
| 16 | 강조된 절에서 **대역을 켰다 껐다** | 표를 다시 그려도 강조가 그대로 남는다 (§6.2) |
| 17 | 대역을 켠 채 **대역에만 있는 절**을 가리키는 링크 | `.verse-text` 가 없어 조용히 넘어간다 (§6.2) |

3·11·12번은 §10.1 이 로직 수준에서 이미 통과했다. 여기서는 **화면에서도 같은 결과가 나오는지**
를 본다. 나머지 중 무게가 다른 것은 둘이다.

**전 항목을 앱에서 돌렸다(2026-08-31).** `bootRun` + 운영 DB, 다크 테마, 비로그인 상태.

| 확인한 것 | 결과 |
|---|---|
| 사전 `그리스도` 상세 | `data-dictionary-term` 이 실리고 관련 구절 **47개 링크 전부** `word=` 를 달았다 |
| 요이 1:7 진입 | 마크 1개, `그리스도` 만. **`적그리스도` 안쪽은 칠해지지 않았다** |
| 같은 장의 다른 절(3절 `그리스도께로부터`) | 칠해지지 않는다 — 대상은 링크가 가리킨 절 하나뿐(§11) |
| **대역 KJV 켜기 (16번)** | 표를 다시 그려도 마크 1개 유지. 대역 칸 13개에는 마크 없음 |
| **대역 끄기 (16번)** | 마크 1개 유지, **중첩 없음** — §6.2 의 불변식이 지켜졌다 |
| **대역 전용 절 (17번)** | ASV 막 9:44 는 `verse-row-compare-only` 로 렌더되고 `.verse-text` 가 없다. 마크 0개, 예외 없음 |
| **색 5상태 (9 · 10-1 · 10-2)** | 실제 DOM·CSS 로 재측정. 최악 조합도 테두리 4.5 로 남는다 |

콘솔의 401 은 비로그인 상태에서 메모·형광펜·읽음 API 가 내는 기존 응답이며 이 기능과 무관하다.

§7.1 의 결함을 잡아낸 것은 **실제 `verse-list.css` 를 불러온 측정**이었다. 손으로 옮겨 적은
CSS 로는 통과했다 — 검증용 사본은 원본과 같지 않다.

## 11. 하지 않는 것 / 나중

| 항목 | 판단 |
|---|---|
| 절 안의 매치로 이동하는 이전/다음 버튼 | 한 절 안이다. 스크롤할 거리가 없다 |
| 장 전체에서 표제어 칠하기 | 스포트라이트가 가리키는 절이 흐려진다. 사전이 고른 절은 그 절 하나다 |
| 참조가 가리키는 절에 표제어가 없는 239건을 관리자 화면에서 리포트 | 값은 있다(§4.2). 다만 그 목록은 **고쳐야 할 오류가 아니다** — 개념 참조가 절반 이상이다. 만든다면 "표제어가 본문에 없는 참조" 라는 이름이지 "잘못된 참조" 가 아니다 |
| 서버 오프셋 API | §4.5. `bible_word_alias` 가 채워지면 다시 본다. URL 계약은 그대로 쓸 수 있다 |
| `search.js` 의 정규식 치환 수정 | §6.4. 별도 항목 |
| 단어 통계 팝오버 → 구절 링크에도 `word` 붙이기 | 같은 파라미터를 그대로 쓸 수 있다. 이 문서의 범위 밖이지만 계약은 그것을 막지 않는다 |
