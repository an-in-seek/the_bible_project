# 성경 대역 비교 설계 문서

읽던 화면([verse-list.html](../../src/main/resources/templates/bible/verse-list.html))을 떠나지 않고,
각 절 옆에 다른 번역본의 같은 절을 나란히 놓는다.

## 구현 상태

**구현 완료 / 브라우저 확인 전.** `BibleWebControllerTest` 3건 통과, Kotlin 컴파일 통과.
§9 의 손 확인 목록은 아직 돌려 보지 않았다.

| 항목 | 위치 |
|---|---|
| 대상 화면 | `templates/bible/verse-list.html` · `static/js/bible/verse-list.js` · `static/css/bible/verse-list.css` |
| 쓰는 API | `GET /api/v1/bibles/translations/{id}/books/{bookOrder}/chapters/{n}/verses` (`BibleApi.getChapterVerses`) — **그대로 쓴다** |
| 번역본 목록 | 서버 모델로 내려준다(§7). `GET /api/v1/bibles/translations` 는 손대지 않았다 |
| 서버 변경 | `BibleWebController.showVerses` 에 `compareTranslations` 모델 속성 + `getVisibleTranslations()` 추출 |
| 상단바 컨트롤 | `templates/fragments/header.html` — `useVerseFontBoot` 조건으로 verse-list 에서만 |
| 정렬 | `verse-list.js#mergeChapterVerses` (절 번호 합집합) |
| 테스트 | `BibleWebControllerTest` — 숨김 번역본이 대역 목록으로 새지 않는지 (Docker 불필요) |
| 새 테이블 · 새 `ErrorType` | 없음 |

이 문서의 수치는 2026-08-31 운영 DB 에서 직접 재 본 값이다.

## 1. 무엇을 만드는가

성경 구절 화면에서 **번역본 하나를 더 골라 두면, 각 절 아래(넓은 화면에서는 옆)에 그 번역본의
같은 절이 함께 나온다.** 화면을 옮기지 않고, 읽던 자리를 잃지 않는다.

- 비교 대상은 **한 번에 하나**다. 좁은 화면에서 한 줄이 반으로 줄어드는 것이 이미 비용이고,
  둘 이상은 가로 스크롤 없이는 읽을 수 없다. 늘리는 이야기는 §11.
- **대역은 읽기 전용이다.** 선택·메모·형광펜·읽음·통계는 전부 주 번역본 기준으로만 동작한다
  (§6).
- 켜고 끄는 상태는 URL 과 localStorage 에 남아 새로고침·공유·다음 방문에도 이어진다(§5).

### 1.1 이 문서가 다루지 않는 것

- 원어(히브리어/헬라어) 대조, 스트롱 코드
- 절 단위 낱말 대응(interlinear)
- 검색 결과 화면(`verse-search.html`)의 대역 — 여기서 자리를 잡은 뒤에 볼 일이다

## 2. 정렬 — 절 번호로 맞추고, 그것으로 다 되지 않는다는 것을 화면에 적는다

대역 기능의 전부는 "무엇과 무엇을 같은 줄에 놓는가"다. 나머지는 배치 문제다.

### 2.1 붙일 수 있는 근거는 절 번호뿐이다

`bible_verse` 에는 번역본을 가로지르는 식별자가 없다. 있는 것은 `(translation_id, book_order,
chapter_number, verse_number)` 뿐이고, 메모·형광펜도 이미 이 네 값을 키로 쓴다
(`bible_verse_memo.uk_bible_verse_memo_member_verse`). 그러니 **절 번호로 맞춘다.**

`book_order` 가 번역본마다 같은 책을 가리키는지 확인했다. 노출 중인 11개 번역본에서
`book_key` 하나가 서로 다른 `book_order` 를 갖는 경우는 **0건**이다. 다만 유니크 제약은
`(translation_id, book_order)` 와 `(translation_id, book_key)` 로 **번역본 안에서만** 걸려 있어,
번역본을 가로지르는 이 일치를 강제하는 것은 아무것도 없다. 지금 맞는다는 사실일 뿐이다.

번역본을 새로 넣을 때 `book_order` 를 다르게 매기면 대역이 **다른 책**을 나란히 보여 준다.
오류 없이, 화면도 멀쩡하게. 번역본 추가 절차에 이 확인을 넣어 둔다.

```sql
-- 새 번역본을 넣은 뒤 반드시 0 이어야 한다
SELECT COUNT(*) FROM (
  SELECT book_key FROM bible_book
  GROUP BY book_key HAVING COUNT(DISTINCT book_order) > 1
) x;
```

### 2.2 절 번호는 세 가지 방식으로 어긋난다

노출 중인 11개 번역본(KRV·NKRV·KJV·WEB·ASV·RVR1909·SBLM·JPNMEB·KOUGO·CUVT·CUVS)은 모두
66권 1,189장을 갖췄지만 총 절 수는 갈린다.

| 번역본 | 총 절 수 | 번역본 | 총 절 수 |
|---|---|---|---|
| KRV | 31,102 | RVR1909 | 31,084 |
| NKRV | 31,089 | SBLM | 31,102 |
| KJV | 31,102 | JPNMEB | 31,103 |
| WEB | 31,102 | KOUGO | 31,104 |
| ASV | 31,086 | CUVT · CUVS | 각 31,102 |

**1,189장 중 46장은 번역본에 따라 절 수가 다르다.** 어긋남은 세 종류다.

**① 중간이 비어 있는 절 (25건).** 절 번호는 이어지는데 그 번호의 행이 없다. 사본 계열 차이로
현대 역본이 빼는 절들이다. 전부 NKRV(10건)와 ASV(15건)에서 나온다.

| 번역본 | 위치 | 없는 절 번호 |
|---|---|---|
| ASV | 마가복음 9장 | 44, 46 |
| ASV | 로마서 16장 | 24 |
| NKRV | 시편 92편 | 2, 3 |

**② 한쪽에만 있는 절.** ①의 뒤집힌 얼굴이다. 주 번역본이 ASV 이고 대역이 KJV 이면 마가복음
9:44·9:46 은 **대역에만** 있다. 버리면 성경 본문이 화면에서 조용히 사라진다.

**③ 판본이 절을 다르게 나눈 경우 — 번호가 통째로 밀린다.** 이것이 정렬로 해결되지 않는
부분이다.

욥기에서 RVR1909 는 38장이 38절(다른 번역본 41절), 40장이 19절(다른 번역본 24절)이다. 실제
본문을 대 보면:

| | RVR1909 | KJV 에서 같은 내용 | 밀린 폭 |
|---|---|---|---|
| 욥 39:1 | ¿Cazarás tú la presa para el león…? | 38:39 | 3절 |
| 욥 39:30 | ¿Se remonta el águila por tu mandamiento…? | 39:27 | 3절 |
| 욥 40:1 | Entonces respondió Jehová á Job… | 40:6 | 5절 |
| 욥 40:19 | ¿Tomarálo alguno por sus ojos…? | 40:24 | 5절 |

**욥기 39장은 양쪽 다 30절이다.** 절 수를 비교해서는 이 어긋남을 찾아낼 수 없다. 절 번호로
붙이는 한, 여기서는 **정확히 3줄씩 어긋난 대역이 정상 화면처럼** 나온다.

### 2.3 그래서 병합은 합집합으로 한다

한쪽을 기준으로 삼고 다른 쪽을 붙이면 ②가 사라진다. **양쪽 절 번호의 합집합을 오름차순으로
놓고 줄마다 두 칸을 채운다.**

```js
function mergeChapterVerses(primaryVerses, compareVerses) {
    const primaryMap = new Map(primaryVerses.map(v => [v.verseNumber, v.text]));
    const compareMap = new Map(compareVerses.map(v => [v.verseNumber, v.text]));
    return [...new Set([...primaryMap.keys(), ...compareMap.keys()])]
        .sort((a, b) => a - b)
        .map(verseNumber => ({
            verseNumber,
            text: primaryMap.get(verseNumber) ?? null,        // null → 주 번역본에 없는 절
            compareText: compareMap.get(verseNumber) ?? null  // null → 대역에 없는 절
        }));
}
```

- `text === null` 인 줄은 **`.verse-text` 요소를 아예 만들지 않는다.** 선택·메모·형광펜이 붙을
  자리가 없어지므로, 읽기 전용이라는 성질이 CSS 나 조건문이 아니라 마크업으로 강제된다(§4.2).
- `compareText === null` 이면 대역 칸에 `—` 를 놓는다. 빈칸으로 두면 로딩 실패와 구분되지 않는다.
- **정렬은 대역을 켜지 않아도 항상 한다.** 지금 `renderChapter` 는 응답 순서를 그대로 쓰는데,
  `BibleChapterRepository.findByBookAndChapter` 의 `LEFT JOIN FETCH c.verses` 에 `ORDER BY` 가
  없어 절 순서는 DB 가 돌려주는 순서다. 대역을 켜지 않았을 때는 `compareVerses = []` 를 넣어
  같은 경로를 타면 렌더 경로가 하나로 유지된다.

### 2.4 어긋남을 어떻게 알리는가

**대역을 켜면 목록 아래에 안내 한 줄을 늘 둔다.**

> 번역본마다 절을 나누는 기준이 달라, 같은 번호가 같은 내용이 아닐 수 있습니다.

절 수가 다를 때만 띄우고 싶은 유혹이 있지만, §2.2 ③ 이 그것을 막는다. 욥기 39장은 절 수가
같은데도 3절씩 밀려 있다. **조건을 달면 가장 크게 어긋난 화면에서 안내가 사라진다.**

절 수가 실제로 다른 장에서는 여기에 숫자를 덧붙인다. `대역에 없는 절 5개` / `이 번역본에만
있는 절 2개`. 46장에서만 보이므로 평소에는 조용하다.

## 3. 데이터 — 서버를 고치지 않는다

### 3.1 이미 있는 엔드포인트를 한 번 더 호출한다

대역 본문은 `GET /api/v1/bibles/translations/{compareId}/books/{bookOrder}/chapters/{n}/verses`
를 그대로 부른다. 새 엔드포인트도, 기존 응답 스키마 변경도 없다.

두 번역본을 한 번에 내려주는 엔드포인트를 만들지 않은 이유:

- 지금 응답은 `Cache-Control: public, max-age=1d` 다(`BibleApi.bibleCacheControl`). 번역본별
  URL 이라 브라우저·중간 캐시가 그대로 재사용한다. 두 번역본을 묶으면 조합마다 별개 URL 이
  되어 캐시 적중률이 조합 수만큼 떨어진다.
- 대역을 껐다 켤 때 주 번역본 본문을 다시 받을 이유가 없다. 분리해 두면 켜는 순간 **대역 쪽만**
  받는다.
- 정렬 규칙(§2.3)을 서버에 두면 화면이 필요로 하는 "한쪽에만 있는 절" 표시를 위해 응답 형태를
  새로 설계해야 한다. 병합은 줄 수 스물이 안 되는 클라이언트 코드다.

호출은 본문과 같은 조건으로 한다 — `fetch(url, {credentials: "omit"})`. 쿠키를 실어 보내면
공유 캐시가 응답을 사용자별로 취급한다.

### 3.2 요청 순서와 stale 응답

| 상황 | 순서 |
|---|---|
| 첫 진입 (`CURRENT`) | `bookOrder` / `chapterNumber` 를 이미 알고 있으므로 **병렬** |
| 이전/다음 장 (`PREV`/`NEXT`) | `/navigate` 응답이 목적지 장을 정해 주므로 **순차** |

`/navigate` 는 책 경계를 넘는 판단을 서버가 한다(`BibleReader.getAdjacentChapterVerses`). 그
로직을 클라이언트에 복제하지 않는다. 응답에서 확정된 `book.bookOrder` /
`book.chapter.chapterNumber` 로 대역을 부른다.

**대역 요청은 `chapterState.loadToken` 을 지킨다.** 이미 장 상태(메모/형광펜/읽음) 로딩이 쓰는
장치다. 다음 장 버튼을 연달아 누르면 먼저 보낸 대역 응답이 나중에 도착할 수 있고, 토큰을 보지
않으면 **다른 장의 본문이 대역 칸에 붙는다.** 오류도 빈칸도 아닌, 그럴듯한 오답이다.

```js
const token = chapterState.loadToken;
const compare = await fetchCompareChapter();
if (token !== chapterState.loadToken) return;   // 이미 다른 장으로 넘어갔다
```

### 3.3 대역이 실패해도 본문은 살린다

대역은 부가 기능이다. 실패가 읽기를 막아서는 안 된다.

- 네트워크 실패·5xx → `대역을 불러오지 못했습니다`, 404 (`BOOK_NOT_FOUND` /
  `CHAPTER_NOT_FOUND`) → `이 번역본에는 이 장이 없습니다`. 지금 11개 번역본은 모두 66권
  1,189장을 갖췄으므로 404 는 나지 않아야 정상이지만, 부분 수록 번역본이 들어오면 바로 이
  경로다.
- **실패 메시지는 목록 아래 안내 한 줄과 `다시 시도` 버튼이 맡고, 대역 칸은 아예 그리지
  않는다.** 절마다 실패 문구를 넣으면 시편 119편에서 그 문구가 176번 나와 본문을 덮는다.
  `showAlert(..., "danger")` 로 화면 전체 오류를 띄우지도 않는다 — 본문은 멀쩡히 읽힌다.
- `다시 시도` 는 장을 다시 여는 것으로 충분하다. 본문 응답은 하루짜리 공개 캐시라 실제로
  네트워크를 타는 것은 대역뿐이다.
- 대역 실패가 `markRead` / 메모 저장 같은 주 번역본 동작을 막지 않는다.

### 3.4 얼마나 더 받는가

가장 긴 장인 시편 119편(176절)의 본문 바이트를 실측했다.

| 번역본 | 본문 바이트 |
|---|---|
| KRV | 16,311 |
| KJV | 12,832 |
| KOUGO | 20,937 (최대) |
| CUVT · CUVS | 각 11,256 (최소) |

대역을 켜면 가장 무거운 조합에서도 21 KB 남짓이 더해진다. 응답은 하루짜리 공개 캐시라 같은
장을 다시 열면 네트워크를 타지 않는다. 서버 쿼리도 기존 장 조회와 동일하다.

## 4. 화면

### 4.1 진입점은 상단 네비다

하단의 `장 메모 / 통계 / 읽음` 은 `flex-equal` 로 3등분되어 있다. 여기에 넷째 버튼을 넣으면
좁은 화면에서 글자가 먼저 깨진다.

**상단 네비의 번역본 버튼 옆**에 둔다. `#topNavTranslationLink` 가 이미 현재 번역본
약어(`KRV`)를 달고 있으므로, 그 옆의 대역 버튼이 `＋` → `KJV` 로 바뀌면 **지금 무엇과 무엇을
보고 있는지가 늘 보인다.** 화면을 내려 확인할 필요가 없다.

패널은 글씨 크기 조절(`#verseFontPanel`)과 같은 방식을 쓴다 — 토글 아래 절대 위치 dropdown,
420px 미만에서는 `position: fixed` + 화면 중앙 정렬. 이미 있는 패턴이라 새 상호작용을 배울
것이 없다.

- 노출 조건은 `useVerseFontBoot` 과 같다(`GlobalModelAttribute` 가 `/web/bible/verse` 에서만
  참). 대역 컨트롤은 이 화면에만 필요하므로 같은 플래그를 쓴다.
- **라벨 길이가 상단바를 넘긴다.** 375px 에서 대역이 `RVR1909`(노출 중인 약어 가운데 가장 길다)
  이면 좌우 묶음 합이 386px 이 되어 계정 버튼이 11px 잘려 나갔다. 토글에 `max-width` 를 두고,
  420px 미만에서 글자를 줄이고 `.top-nav-left` 간격을 좁혀 막았다. `verse-list.css` 는 이 화면
  에서만 로드되므로 간격 조정이 다른 화면의 상단바에 번지지 않는다.
- 목록은 `translation-list.js` 처럼 언어별로 묶는다(한국어/영어/중국어/일본어/스페인어).
- **현재 주 번역본은 목록에서 뺀다.** 자기 자신과의 대역은 없다.
- 맨 위에 `대역 끄기`.

### 4.2 `.verse-text` 를 다시 쓰면 안 된다 — 이 기능에서 가장 조용히 깨지는 곳

`verse-list.js` 는 절 요소를 **문서 전역에서** 찾는다.

| 위치 | 하는 일 | 대역이 같은 클래스를 쓰면 |
|---|---|---|
| `verse-list.js:1236`, `:1265` | `querySelectorAll(".verse-text")` 로 형광펜 적용 | 대역 본문에 형광펜이 칠해진다 |
| `:506` `highlightVerse` | `querySelector('.verse-text[data-verse="N"]')` | 문서 순서상 **먼저 나온 것**이 잡힌다 |
| `:874`, `:921` 메모 저장/삭제 | 같은 선택자 | 메모 표시가 엉뚱한 칸에 붙는다 |
| `:1027` `toggleVerseSelection` | 같은 선택자 | 선택 하이라이트가 다른 칸에 간다 |
| `:1455` `buildSelectedText` | 같은 선택자로 복사/공유 문자열 조립 | **다른 번역본 본문이 복사된다** |
| `:595` `handleVerseClick` | `closest(".verse-text[data-verse]")` | 대역을 눌러도 절이 선택된다 |
| `:687` `applyMemoIndicators` | `querySelectorAll(".verse-text.verse-has-memo")` | 메모 표식이 두 배로 붙는다 |
| `renderVerseRow` | `id="verse-text-${v}"` | **id 중복** |

전부 오류를 내지 않는다. 화면은 그려지고, 잘못된 값이 조용히 나간다. 관리자 화면에서 표와
카드가 `data-id` 를 공유해 숨은 쪽 요소가 먼저 잡혔던 것과 같은 사고다
([frontend.md](../../.claude/rules/frontend.md)).

**그래서 대역 본문은 클래스도 속성도 id 도 겹치지 않게 만든다.**

```html
<tr>
  <td>1</td>
  <td>
    <div class="verse-body">
      <div class="verse-text text-body" id="verse-text-1" data-verse="1">태초에 …</div>
      <div class="verse-compare-text" data-compare-verse="1">
        <span class="verse-compare-tag" aria-hidden="true">KJV</span>In the beginning …
      </div>
    </div>
    <div class="memo-container d-none mt-3" id="memo-1"> … </div>
  </td>
</tr>
```

- `.verse-compare-text` / `data-compare-verse` — 기존 선택자 어디에도 걸리지 않는다.
- id 를 붙이지 않는다. 붙일 이유가 없고, 붙이면 중복 위험만 생긴다.
- 주 번역본에 없는 절(§2.3)은 `.verse-text` 자체를 만들지 않고 `tr.verse-row-compare-only` 로
  표시한다. 행 전체를 흐리게 두고, 본문 자리에는 `대역에만 있는 절` 이라는 안내를 놓는다.
  메모 입력 블록도 만들지 않는다 — 붙일 절이 없다.
- 본문은 `bible_verse` 에서 온 값이라 기존 본문과 신뢰 경계가 같다. 대역만 다르게 다룰 이유가
  없어 렌더 방식도 그대로 둔다. 번역본 이름·약어는 `textContent` 로 넣는다.

### 4.3 좁은 화면은 위아래, 넓은 화면은 좌우

**같은 마크업을 CSS 로 바꾼다.** 렌더를 두 벌 만들지 않는다.

```css
/* 기본(모바일) — 본문 아래 대역이 쌓인다 */
.verse-compare-text {
    font-size: var(--verse-font-size);
    line-height: 1.6;
    margin-top: 0.35rem;
    padding-left: 0.6rem;
    border-left: 2px solid var(--color-border);
    color: var(--color-text-secondary);
}

/* 넓은 화면 — 두 칸을 나란히 */
@media (min-width: 768px) {
    .verse-body {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0 1rem;
        align-items: start;
    }
    .verse-compare-text {
        margin-top: 0;
        border-left: 1px solid var(--color-border);
    }
}
```

- **메모 컨테이너는 `.verse-body` 밖에 둔다.** 안에 넣으면 2열 그리드에서 한 칸으로 밀려 폭이
  절반이 된다. 밖에 두면 `<td>` 전체 폭을 쓴다.
- 색은 흐리게, 크기는 같게. 대역이 본문과 같은 무게로 읽히면 어느 쪽을 읽고 있었는지 놓치고,
  글씨를 줄이면 대역이 읽히지 않아 기능의 의미가 없다. 구분은 색과 왼쪽 선으로 한다.
- 약어 태그(`KJV`)는 줄마다 붙는 작은 인라인 배지다. 처음에는 첫 줄에만 두려 했는데, 좁은
  화면에서 40절쯤 내려가면 그 한 줄이 화면 밖으로 나가 "이 흐린 글씨가 무엇인지" 를 답해 줄
  것이 없어진다. 반복해도 시선을 뺏기지 않도록 **이름이 아니라 약어**를 쓰고 크기를 줄인다.
- **태그는 `.verse-compare-text` 안에 두되 본문은 `.verse-compare-body` 로 한 겹 감싼다.**
  복사·공유가 `textContent` 로 대역 본문을 읽어 가는데, 태그가 같은 요소에 있으면 복사한
  문자열에 `KJV` 가 섞여 들어간다.

### 4.4 글씨 크기와 다크 테마는 따로 챙겨야 한다

클래스를 나눈 대가다. `.verse-text` 에 걸린 규칙은 대역에 자동으로 적용되지 않는다.

- **글씨 크기** — `.verse-text` 만 `font-size: var(--verse-font-size)` 를 쓴다
  (`verse-list.css:8`). 대역에도 같은 변수를 걸어야 `Aa` 조절이 양쪽에 함께 먹는다. 인쇄
  미디어쿼리(`verse-list.css:199`)에도 대역을 추가한다.
- **다크 테마** — `html[data-theme="dark"] .verse-text { color: #ffffff !important; }` 가 걸려
  있다. `!important` 라, 클래스를 공유했다면 대역을 흐리게 만들 방법이 없었을 것이다. 대역은
  다크에서 `rgba(255,255,255,0.72)` 쯤으로 따로 정의한다
  ([dark-theme.md](../common/dark-theme.md)).
- **모션 감소 / 고대비** — `prefers-reduced-motion` 블록의 transition 목록에 대역을 넣는다.

### 4.5 스포트라이트

검색·마이페이지에서 절 번호를 달고 들어오면 `highlightVerse()` 가 그 절에 스포트라이트를 준다.
클래스는 절 요소(`verse-spotlight-target`)·`td`·`tr`(`verse-spotlight-target-row`) 세 곳에
붙으므로 **행 단위 강조는 이미 있다.** 대역 칸도 같은 `td` 안에 있어 따로 손댈 것은 없다.

확인할 것은 색이다. 다크 테마에서 스포트라이트는
`html[data-theme="dark"] .verse-text.verse-spotlight-target` 로 본문 색을 덮는데, 대역은 그
선택자에 걸리지 않아 혼자 흐린 채로 남는다. `.verse-compare-text` 용 규칙을 같이 넣는다.

## 5. 상태 — URL 이 먼저, localStorage 가 그다음

```
?translationId=1&bookOrder=1&chapterNumber=1&compareTranslationId=10
```

- **URL 파라미터가 우선**이다. 공유받은 링크가 보낸 사람과 같은 화면을 열어야 한다
  ([url-share.md](../common/url-share.md)).
- URL 에 없으면 localStorage(`bibleCompareTranslationId`)를 본다. 번역본 선택처럼 오래 유지되는
  취향이다.
- `buildVerseUrl()` 이 대역 파라미터를 함께 써서 `history.replaceState` 로 유지한다. 지금도
  `verseNumber` 를 같은 방식으로 다룬다.
- **주 번역본을 대역과 같은 번역본으로 바꾸면 대역을 끈다.** 번역본 목록에서 KJV 를 고르면
  KJV↔KJV 가 되므로, `init()` 에서 `compareTranslationId === translationId` 면 해제한다.
- 알 수 없는 `compareTranslationId`(숨김 번역본 id, 없는 id)는 **조용히 무시하고 대역을 끈다**.
  오류를 띄우면 링크를 잘못 받은 사람이 성경을 못 읽는다.
- `LastReadStore` 에는 넣지 않는다. 마지막 읽은 위치는 어디까지 읽었는지에 대한 기록이고,
  대역은 보기 설정이다.

## 6. 기존 기능과 어떻게 지내는가

| 기능 | 대역을 켰을 때 |
|---|---|
| 절 선택 / FAB | 주 번역본만. 대역 칸 클릭은 무시 |
| 메모 (절/장) | 주 번역본만. `bible_verse_memo` 는 `translation_id` 를 키에 갖는다 |
| 형광펜 | 주 번역본만. 같은 이유 |
| 읽음 표시 | 주 번역본만. 대역을 곁들여 읽었다고 그 번역본을 읽은 것은 아니다 |
| 단어 통계 | 주 번역본만. 버튼 라벨도 그대로 |
| 이전/다음 장 | 두 번역본이 함께 이동 (§3.2) |
| 글씨 크기 | 양쪽 함께 (§4.4) |
| 복사 · 공유 | 양쪽 본문을 함께 (아래) |

메모·형광펜을 대역에도 열면 "지금 어느 번역본에 메모하고 있는가"를 화면이 매 순간 설명해야
한다. 장 상태 요청도 두 벌이 된다. 대역은 **읽기 위한 기능**이라는 선을 지킨다.

복사·공유는 예외다. 두 번역본을 비교하는 화면에서 한쪽만 복사되면 기능을 켠 이유가 사라진다.

```
KRV 창세기 1장
1 태초에 하나님이 천지를 창조하시니라
  [KJV] In the beginning God created the heaven and the earth.
```

`buildSelectedText()` 는 지금 `document.querySelector` 로 절을 찾는다(§4.2). **선택된 행 안에서
찾도록 범위를 좁히는 수정이 필요하다.** 대역을 켜지 않아도 해 두는 편이 안전하다.

## 7. 번역본 목록 — NKRV 를 그대로 노출하면 안 된다

`BibleWebController.showTranslations` 는 관리자가 아니면 `HIDDEN_TRANSLATION_TYPES`(= `NKRV`,
개역개정)를 목록에서 걷어 낸다. 그런데 **`GET /api/v1/bibles/translations` 는 걸러 주지 않는다.**
`BibleReader.getTranslations()` 의 허용 목록에 NKRV 가 들어 있고, `verse-list.js` 의
`ensureTranslationInfo()` 도 이 API 를 쓴다.

이 API 를 그대로 대역 선택 목록에 쓰면 **숨겨 둔 번역본이 모든 사용자에게 노출된다.**

**API 에 역할 분기를 넣는 것은 답이 아니다.** 이 응답에는
`Cache-Control: public, max-age=1d` 가 붙어 있다. 응답이 역할에 따라 달라지는데 공개 캐시를
허용하면, 관리자가 받은 응답이 캐시에 남아 일반 사용자에게 그대로 나갈 수 있다. 지금은 캐시가
안전한 이유가 "누가 부르든 같은 응답"이기 때문이다.

**대역 선택 목록은 서버가 모델에 담아 내려준다.**

```kotlin
@GetMapping("/verse")
fun showVerses(model: Model): String {
    model.addAttribute("compareTranslations", visibleTranslations())
    return "bible/verse-list"
}

// showTranslations 와 같은 규칙을 쓴다. 두 곳에 흩어지지 않게 private 로 묶는다.
private fun visibleTranslations(): List<BibleViewResponse.Translation> =
    bibleService.getTranslations()
        .filterNot { !isAdmin() && it.translationType in HIDDEN_TRANSLATION_TYPES }
        .map(BibleViewResponse.Translation::from)
```

- 서버 렌더가 기본이라는 원칙에 맞고([frontend.md](../../.claude/rules/frontend.md)), 화면 진입
  시 fetch 가 하나 줄어든다.
- 숨김 규칙이 `BibleWebController` 한 곳에 남는다. 번역본을 더 숨길 때 고칠 자리가 하나다.
- 페이지 자체는 로그인 상태에 따라 달라지므로 공개 캐시 문제도 없다.

**URL 로 직접 들어오는 경로는 이 필터로 막히지 않는다.** `?compareTranslationId=2` 를 손으로
넣으면 대역 본문 API 는 응답한다 — 지금도 `?translationId=2` 로 개역개정을 읽을 수 있는 것과
같은 상태다. 목록에서 감추는 것과 접근을 막는 것은 다른 문제이며, 이 기능이 그 경계를 새로
넓히지는 않는다. 정말 막아야 한다면 `BibleReader.getTranslations()` 의 허용 목록에서 NKRV 를
빼는 것이 맞는 자리다.

## 8. 손대는 파일

| 파일 | 무엇을 |
|---|---|
| `bible/adapter/input/web/client/BibleWebController.kt` | `showVerses` 에 `compareTranslations` 모델 속성, 숨김 규칙을 `getVisibleTranslations()` 로 추출 (§7) |
| `templates/fragments/header.html` | 상단 네비 대역 토글 + 번역본 선택 패널 (`useVerseFontBoot` 조건) |
| `templates/bible/verse-list.html` | 안내 문구 자리(`#verseCompareNotice`), CSS `?v=7.0→7.1` · JS `?v=5.6→5.7` |
| `static/js/bible/verse-list.js` | 병합(§2.3)·요청(§3)·렌더(§4.2)·상태(§5), `buildSelectedText` 범위 좁히기 |
| `static/css/bible/verse-list.css` | `.verse-body` / `.verse-compare-text` / 상단바 패널, 2열 그리드, 다크·인쇄·모션 규칙 |
| `test/.../BibleWebControllerTest.kt` · `VerseCompareHeaderTest.kt` | §9 |

**`?v=` 를 올린다.** `verse-list.css` 는 `verse-list.html` 의 `head` 인자에, `verse-list.js` 는
같은 파일 하단 `<script>` 에 있다. 빼먹으면 로컬에서는 하드 리프레시로 가려지고 배포 후에
드러난다([frontend.md](../../.claude/rules/frontend.md)).

`storage-util.js` 는 건드리지 않았다. 15개 파일이 `?v=2.7` 로 import 하고 있어 export 를 늘리면
여기서만 버전을 올릴 수 없다 — 올리면 URL 이 달라져 모듈 인스턴스가 둘로 갈라지고, 안 올리면
캐시된 옛 사본에 새 export 가 없어 import 가 깨진다. 대역 번역본 선택은 `verse-list.js` 안의
`CompareStore` 가 `localStorage` 를 직접 읽고 쓴다.

## 9. 검증

이 기능의 무게는 프론트에 있고 이 저장소에는 JS 테스트 환경이 없다. 자동으로 고정할 수 있는
것과 손으로 봐야 하는 것을 갈라 둔다.

**자동으로 고정했다** — 둘 다 Spring 컨텍스트를 띄우지 않아 Docker/DB 가 필요 없다
([testing.md](../../.claude/rules/testing.md)).

| 테스트 | 무엇을 |
|---|---|
| `BibleWebControllerTest` (3건) | 비관리자의 `compareTranslations` 에 NKRV 가 없고 관리자에게는 있다. 번역본 목록 화면과 같은 규칙을 쓴다 |
| `VerseCompareHeaderTest` (3건) | `header` 프래그먼트가 서버가 준 목록만 대역 후보로 렌더하고, 구절 화면이 아니면 컨트롤 자체를 내지 않는다 |

`header` 는 모든 화면이 쓰므로 이 프래그먼트가 깨지면 사이트 전체가 500 이 난다. 그래서
모델(컨트롤러)과 렌더링(템플릿)을 따로 고정했다 — 중복이 아니라 서로 다른 실패를 잡는다.

통합 테스트는 만들지 않는다. 서버 변경이 모델 속성 하나다.

**브라우저로 확인했다 (2026-08-31).** `.env2` 가 없어 `bootRun` 을 띄우지 못해, 운영 DB 에서 뽑은
본문을 픽스처로 물리고 **실제 `verse-list.js` / `verse-list.css` / Thymeleaf 렌더 결과**를 그대로
로드해 확인했다. 확인한 것과 확인하지 못한 것을 갈라 둔다.

| 확인 | 결과 |
|---|---|
| 욥 40장 KRV + RVR1909 | 24행 · 빈 대역 칸 5 · `대역에 없는 절 5개` |
| 막 9장 ASV(주) + KJV | 13행 · 44·46 이 `대역에만 있는 절` · `대역에만 있는 절 2개` |
| 대역 칸 격리 | `.verse-compare-text.verse-text` 0건, `id` 중복 0건, 대역 전용 행에 메모 블록 없음 |
| 복사 | `43 …` 아래 `  [KJV] …` — 약어 태그는 복사 문자열에 섞이지 않음 |
| 선택 패널 | 주 번역본(ASV)은 목록에서 숨김, 현재 대역에 `aria-checked`, Esc·바깥 클릭으로 닫힘, 폰트 패널과 동시에 열리지 않음 |
| 끄기/켜기 | URL 파라미터 · 라벨 · `localStorage` · 행 수 모두 왕복 |
| 404 / 500 | 안내 한 줄 + `다시 시도`, 대역 칸 0개, 본문 11절 그대로, 전체 오류 알림 없음. `다시 시도` 로 복구 |
| 레이아웃 | 767px 스택 / 768px 2열 정확히 전환, 375px 스택 정상 |
| 라이트·다크 | 양쪽에서 대역이 본문보다 흐리게, 읽히는 대비 유지 |

**확인하지 못한 것**

- **`Aa` 글씨 크기가 대역에도 먹는지.** 미리보기 창이 본문 글씨를 18px 로 고정해 버려
  `--verse-font-size` 를 40px 로 바꿔도 **주 번역본 본문조차** 변하지 않았다. 이 환경의 제약이지
  이번 변경과 무관하다(대역 규칙은 `.verse-text` 와 같은 형태로 썼다). 실제 브라우저에서 다시 봐야 한다.
- 로그인 상태의 메모·형광펜·읽음. 픽스처가 `/state` 를 401 로만 답한다.
- 이전/다음 장에서 책 경계를 넘는 경우. 픽스처에 두 장밖에 없다.

**남은 손 확인 (실서버에서)**

1. 창세기 1장 — KRV + KJV. 절 번호가 어긋나지 않는가.
2. **마가복음 9장 — 주 ASV / 대역 KJV.** 44·46 절이 `이 번역본에만 있는 절` 로 나오는가.
   반대로 주 KJV / 대역 ASV 면 그 두 줄의 대역 칸이 `—` 인가.
3. **욥기 40장 — KRV + RVR1909.** `대역에 없는 절 5개` 각주가 뜨는가.
4. **욥기 39장 — KRV + RVR1909.** 절 수가 같아 각주에 숫자는 없지만 상시 안내가 떠 있는가
   (§2.4). 실제로 3절씩 밀려 보이는 것이 정상이다.
5. 다음 장 버튼을 빠르게 여러 번 — 대역이 본문과 같은 장인가 (§3.2).
6. 절을 선택하고 복사 — 두 번역본이 함께, 주 번역본 본문이 위에 오는가.
7. 대역을 켠 채로 메모·형광펜·읽음 — 전부 주 번역본에만 붙는가.
8. 375px 폭 / 다크 테마 / `Aa` 최대·최소 — 양쪽 글씨가 함께 변하는가.
9. 대역 링크를 새 탭에 붙여넣기 — 같은 화면이 열리는가.
10. `?compareTranslationId=999` — 오류 없이 대역만 꺼지는가.

## 10. 완료 조건

1. 구절 화면 상단에서 번역본을 하나 더 고르면, 그 자리에서 각 절 옆에 같은 절이 붙는다.
2. 절 번호가 어긋나는 46개 장에서 **본문이 사라지지 않고**, 어긋났다는 사실이 화면에 적힌다.
3. 이전/다음 장을 아무리 빠르게 눌러도 두 칸이 같은 장을 보여 준다.
4. 메모·형광펜·읽음·통계는 대역을 켜기 전과 똑같이 동작한다.
5. 숨김 번역본이 대역 목록에 나오지 않는다.
6. 대역 요청이 실패해도 성경은 읽을 수 있다.

## 11. 나중에

- **번역본 둘 이상.** 넓은 화면에 한해 열 수 있다. 좁은 화면에서 세로로 쌓으면 한 절을 읽는 데
  스크롤이 세 번 필요해진다. 늘리기 전에 §2.4 의 각주가 조합마다 어떻게 보일지 먼저 정해야 한다.
- **검색 결과 대역.** `verse-search.html` 은 장이 아니라 절 목록이라 §2.3 을 절 단위로 다시
  적용해야 한다.
- **절 구분 대응표.** §2.2 ③ 을 실제로 맞추려면 번역본 간 절 매핑 데이터가 있어야 한다.
  `bible_verse_alignment(from_translation, book_key, chapter, verse, to_translation, …)` 같은
  테이블이 필요한 별도 과제이며, 이 문서의 범위가 아니다. 그때까지 이 기능은 **절 번호로
  붙이고, 붙지 않는다는 사실을 숨기지 않는다.**
