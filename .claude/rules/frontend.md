# Frontend

Server-side rendering (Thymeleaf) is the default. There is no bundler.

## Layout

| Location | Contents |
|---|---|
| `src/main/resources/templates/` | Thymeleaf templates, one directory per feature (`bible/`, `game/`, `community/`, …) |
| `templates/fragments/` | Shared fragments — `head.html`, `header.html`, `footer.html`, `app-install-banner.html`, … |
| `static/js/` | ES6 modules (`type="module"`). Shared utilities: `common-util.js`, `storage-util.js` |
| `static/css/` | Per-feature CSS + Bootstrap 5.3 (WebJars) |

Class names follow a feature-scoped BEM-like convention (`genealogy-node`,
`bible-overview-video-card`).

## Cache busting — the easy rule to forget

**When you modify a CSS/JS file, you must bump the `?v=` query parameter in every template that
references it.**

```html
<link rel="stylesheet" th:href="@{/css/lords-prayer.css(v=1.1)}">   <!-- 1.0 → 1.1 -->
```

There are 221 `?v=` occurrences across the templates today. Without a bump the browser keeps using
the old file, and a hard refresh masks it locally so the problem only shows up after deployment.

## Active menu handling

Thymeleaf 3.1+ blocks direct `#request` access from templates. The current path is **injected into
the model from the server**.

```kotlin
// common/adapter/input/web/GlobalModelAttribute.kt
@ModelAttribute("currentPath")
fun currentPath(request: HttpServletRequest): String = request.requestURI
```

```html
<a th:href="@{/bible}" th:classappend="${#strings.startsWith(currentPath, '/bible')} ? 'active'">
```

**Do not toggle the active class from JS via `location.pathname`.** It violates the
server-rendering principle and makes the menu flicker on first paint.

## Hover is desktop-only

```css
@media (hover: hover) and (pointer: fine) {
  .card:hover { ... }
}
```

On touch devices hover sticks after a tap. Do not build UX that depends on hover (dropdowns,
features reachable only through a tooltip) — it becomes unreachable on mobile. 45 CSS files use
this media query today.

## Authenticated fetches

Token refresh is handled by `fetchWithAuthRetry()` in `common-util.js`. Calling `fetch` directly
means a 401 with no retry once the access token expires.

```js
import { fetchWithAuthRetry } from '/js/common-util.js';

const res = await fetchWithAuthRetry('/api/v1/community/posts');
```

## Screens that run without a server API

`bible-overview-video` and `bible-genealogy` are driven by static JS arrays. Adding a server call
to these screens requires building the API and the data source first. Do not extend them by
growing the existing arrays.
