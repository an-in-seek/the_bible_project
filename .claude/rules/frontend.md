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

**`#httpServletRequest` fails silently — never reach for it as a workaround.** Thymeleaf 3.1
removed it along with `#request`, but an unknown `#name` is an undefined SpEL variable, so it
evaluates to `null` instead of raising. The page still renders; only the value is gone. That is
how every page ended up declaring `https://elseeker.com` as its canonical (and how the share
button ended up copying the site root from every screen). Use `currentPath` — anything else the
page needs from the request goes through the model the same way.

## Hover is desktop-only

```css
@media (hover: hover) and (pointer: fine) {
  .card:hover { ... }
}
```

On touch devices hover sticks after a tap. Do not build UX that depends on hover (dropdowns,
features reachable only through a tooltip) — it becomes unreachable on mobile. 45 CSS files use
this media query today.

## Admin list screens need a table *and* a card list

`admin/admin.css` swaps the two at 768px:

```css
@media (max-width: 768px) {
  .admin-table-wrapper { display: none; }
  .admin-card-list { display: flex; }
}
```

**A screen that only has `.admin-table-wrapper` renders nothing at all on a phone.** Not a broken
layout — a blank page, because the only thing on it is `display: none`. Nothing errors and the
desktop view stays perfect, so it survives review. Three of the word-vocabulary screens shipped
that way and were blank on mobile until 2026-08-24.

So every list screen carries both, built from the same data:

```html
<div class="admin-table-wrapper"><table class="admin-table"> ... </table></div>
<div class="admin-card-list">
  <div class="admin-card" th:each="w : ${page.content}">
    <div class="admin-card-title" th:text="${w.term}"></div>
    <div class="admin-card-row">
      <span class="admin-card-label">상태</span>
      <span class="admin-card-value" th:text="${w.status.displayName}"></span>
    </div>
    <div class="admin-card-actions"> ... </div>
  </div>
</div>
```

Points that bite:

- **A JS-rendered list has to render both.** Build the row and the card from the same array in one
  `render()`. See `admin-bible-word-candidate-list.html`.
- **Controls in `<thead>` disappear on mobile.** A "select all" checkbox in a `<th>` is unreachable
  on a phone. Put it in the toolbar instead.
- **Duplicate `data-id` between the table and the card.** `document.querySelector('[data-id="x"]')`
  finds the hidden table's element first, so a handler reads a value the user cannot see. Scope the
  lookup with `btn.closest("tr, .admin-card")`.
- `.admin-card-label` is 80px wide. Keep labels short (`수동 보존`, not `보존한 수동 행`).

Related helper classes: `.admin-form-grid` (filter forms lay out in columns instead of one tall
stack), `.admin-toolbar-group` (button rows that wrap instead of overflowing), `.admin-selection-bar`
(selection actions that dock to the bottom of a phone screen while a selection exists).

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
