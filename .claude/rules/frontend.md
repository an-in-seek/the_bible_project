# Frontend

서버 렌더링(Thymeleaf)이 기본이다. 번들러는 없다.

## 구성

| 위치 | 내용 |
|---|---|
| `src/main/resources/templates/` | Thymeleaf 템플릿. 기능별 디렉터리(`bible/`, `game/`, `community/`, …) |
| `templates/fragments/` | 공용 조각 — `head.html`, `header.html`, `footer.html`, `app-install-banner.html` 등 |
| `static/js/` | ES6 모듈 (`type="module"`). 공용 유틸은 `common-util.js`, `storage-util.js` |
| `static/css/` | 기능별 CSS + Bootstrap 5.3 (WebJars) |

클래스 이름은 기능 단위 BEM 유사 규칙을 쓴다 (`genealogy-node`, `bible-overview-video-card`).

## 캐시 버스팅 — 빠뜨리기 쉬운 규칙

**CSS/JS 파일을 수정하면 이를 참조하는 템플릿의 `?v=` 쿼리 파라미터를 반드시 올린다.**

```html
<link rel="stylesheet" th:href="@{/css/lords-prayer.css(v=1.1)}">   <!-- 1.0 → 1.1 -->
```

현재 템플릿에 221곳의 `?v=` 가 있다. 올리지 않으면 브라우저가 이전 파일을 계속 쓰고, 로컬에서는
하드 리프레시로 가려져 배포 후에만 드러난다.

## 활성 메뉴 처리

Thymeleaf 3.1+ 는 템플릿에서 `#request` 직접 접근을 막는다. 현재 경로는 **서버에서 모델로
주입**해서 쓴다.

```kotlin
// common/adapter/input/web/GlobalModelAttribute.kt
@ModelAttribute("currentPath")
fun currentPath(request: HttpServletRequest): String = request.requestURI
```

```html
<a th:href="@{/bible}" th:classappend="${#strings.startsWith(currentPath, '/bible')} ? 'active'">
```

**JS 의 `location.pathname` 으로 active 클래스를 토글하지 않는다.** 서버 렌더링 원칙에 어긋나고,
첫 페인트에 메뉴가 깜빡인다.

## 호버는 데스크톱 전용

```css
@media (hover: hover) and (pointer: fine) {
  .card:hover { ... }
}
```

터치 기기에서는 호버가 "탭 후 고착" 상태로 남는다. 호버에 의존하는 UX(드롭다운, 툴팁으로만
접근 가능한 기능)를 만들지 않는다 — 모바일에서 접근 불가능해진다. 현재 45개 CSS 파일이 이
미디어 쿼리를 쓴다.

## 인증이 필요한 fetch

토큰 갱신은 `common-util.js` 의 `fetchWithAuthRetry()` 가 처리한다. 직접 `fetch` 를 쓰면
액세스 토큰 만료 시 재시도 없이 401 로 끝난다.

```js
import { fetchWithAuthRetry } from '/js/common-util.js';

const res = await fetchWithAuthRetry('/api/v1/community/posts');
```

## 서버 API 없이 도는 화면

`bible-overview-video`, `bible-genealogy` 는 데이터가 정적 JS 배열이다. 이 화면들에 서버 호출을
추가하려면 먼저 API 와 데이터 소스를 만들어야 한다. 기존 배열을 늘리는 방식으로 확장하지 않는다.
