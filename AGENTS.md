# Repository Guidelines

## Project Structure & Module Organization
- `src/main/kotlin/com/elseeker`: Spring Boot app code organized by domain modules.
  - `common`: shared config, error model, common web components.
  - `auth`: authentication/authorization, OAuth2, JWT.
  - `bible`: Bible domain (domain, application, adapter/in, adapter/out).
  - `study`: Study domain (dictionary/history/bible-overview-video/bible-genealogy) with the same adapter structure.
  - `game`: Bible quiz domain (domain, application, adapter/in, adapter/out).
  - `member`: member profile and account management.
- `src/main/resources`: configuration and assets.
  - `application.yml`: main runtime config (JPA, OAuth2, JWT); datasource lives in the profile files.
  - `application-local.yml`, `application-prod.yml`: env-specific overrides.
  - `data/`: SQL seed scripts for translations/books/chapters/verses, quizzes, and dictionary.
    - `krv/`, `nkrv/`, `kjv/`: translation-specific book/verse seeds.
  - `templates/`: Thymeleaf HTML pages.
  - `static/`: CSS, JS, images.
- `docs/`: per-domain documentation (analytics, bible, community, game, member, study, support, qna, policy, android, googleplay, …).
- `src/test/kotlin`: test support + tests for `auth`, `bible`, `common`, `game`, `member`, `qna`, `study`.
- `src/test/resources`: test config (`application-test.yml`).

## Build, Test, and Development Commands
- `./gradlew bootRun`: run the service locally. Requires PostgreSQL connection env vars (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`) — see `.claude/rules/tech-stack.md`.
- `./gradlew build`: compile and run tests (if present), produce the boot JAR.
- `./gradlew test`: run unit tests with JUnit 5. Requires Docker (Testcontainers).
- `./gradlew bootJar`: build the runnable Spring Boot artifact.
- Gradle 9.7.0 (wrapper); toolchain targets Java 25; Kotlin 2.4.10 + Spring Boot 4.1.0.
- **Do NOT run `./gradlew build` or `./gradlew test` for frontend-only changes (HTML, CSS, JS, Thymeleaf templates).** Only run build/test when Kotlin/Java code changes are included.

## Coding Style & Naming Conventions
- Kotlin + Spring Boot 4; keep idiomatic Kotlin (data classes, null-safety) and Spring annotations.
- Use 4-space indentation and standard Kotlin naming: `UpperCamel` for classes, `lowerCamel` for functions/vars, `UPPER_SNAKE` for constants.
- SQL seed files follow `bible_krv_XX_<book>.sql` in `db/seed/krv`.
- No formatter or linter is configured; avoid reformatting unrelated files.
- Frontend JS: prefer ES module scripts (`type="module"`); avoid IIFEs and `'use strict'` in module files. Use explicit `import`/`export` instead of globals.
- Hover styles: apply only on desktop (mouse) using `@media (hover: hover) and (pointer: fine)`. Do not design hover-based UX for touch/mobile.
- **CSS/JS 파일을 수정한 경우, 해당 파일을 참조하는 HTML 템플릿의 쿼리 파라미터 버전(`?v=`)을 반드시 올린다.** 예: `lords-prayer.css?v=1.0` → `lords-prayer.css?v=1.1`. 브라우저 캐시 무효화를 위해 필수.
- Swagger/OpenAPI annotations should live in `*ApiDocument` interfaces (controllers implement them).
- Web UI back navigation should use the shared top nav back button (`#topNavBackButton`) instead of page-level back links. Use `data-back-link` on `<body>` when a custom target is needed.

## Testing Guidelines
- Tests should use `spring-boot-starter-test` with JUnit 5 (Kotest is also available).
- Testcontainers dependencies are available for integration tests (PostgreSQL).
- Place unit tests under `src/test/kotlin` mirroring production packages.
- Name tests `*Test.kt` and focus on service, repository, and controller behavior.

## Commit & Pull Request Guidelines
- Follow AngularJS commit convention prefixes: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`, etc.
- Keep commits scoped to one feature/fix; include a short, imperative summary.
- PRs should describe the change, link related issues, and include screenshots for UI/template changes.

## Thymeleaf Active Menu Handling
- Thymeleaf 3.1+ blocks direct access to `#request`, `#session`, and other Web API objects in templates.
- **Prohibited**: Direct `#httpServletRequest` access in templates, JS `location.pathname` for active class toggling (violates SSR principles, causes flickering, degrades SEO/accessibility).
- **Required**: Use `@ControllerAdvice` + `@ModelAttribute` to inject the current path from the server into the Model.
  - Server: Return `request.getRequestURI()` from a `@ModelAttribute("currentPath")` method.
  - View: Use `th:classappend="${#strings.startsWith(currentPath, '/path')} ? 'active'"`.
- Reference implementation: `GlobalModelAttribute.kt` (`common/adapter/input/web/`)

## Configuration & Data Notes
- PostgreSQL 17 (Supabase) is the database in both production and local. H2 is not used.
- `ddl-auto` is `none` outside the test profile; the app does not create the schema.
- The SQL files in `db/seed` are **not** loaded automatically (`spring.sql.init` is off). They remain as reference material for seeding.
- OAuth2 client and JWT settings live in `src/main/resources/application.yml`.
- Access/refresh JWT cookies are issued on OAuth2 login; access is auto-refreshed via `JwtRefreshFilter` using refresh cookie (or via `POST /api/v1/auth/refresh`).
- API responses return all timestamps in UTC ISO-8601 (example: `2024-01-01T10:00:00Z`); client converts to user timezone.
- If you add new Bible content, keep book order and naming consistent with existing SQL files.

## Skills
A skill is a set of local instructions to follow that is stored in a `SKILL.md` file. Below is the list of skills that can be used. Each entry includes a name, description, and file path so you can open the source for full instructions when using a specific skill.
### Available skills
- skill-creator: Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Codex's capabilities with specialized knowledge, workflows, or tool integrations. (file: /home/seek/.codex/skills/.system/skill-creator/SKILL.md)
- skill-installer: Install Codex skills into $CODEX_HOME/skills from a curated list or a GitHub repo path. Use when a user asks to list installable skills, install a curated skill, or install a skill from another repo (including private repos). (file: /home/seek/.codex/skills/.system/skill-installer/SKILL.md)
### How to use skills
- Discovery: The list above is the skills available in this session (name + description + file path). Skill bodies live on disk at the listed paths.
- Trigger rules: If the user names a skill (with `$SkillName` or plain text) OR the task clearly matches a skill's description shown above, you must use that skill for that turn. Multiple mentions mean use them all. Do not carry skills across turns unless re-mentioned.
- Missing/blocked: If a named skill isn't in the list or the path can't be read, say so briefly and continue with the best fallback.
- How to use a skill (progressive disclosure):
  1) After deciding to use a skill, open its `SKILL.md`. Read only enough to follow the workflow.
  2) If `SKILL.md` points to extra folders such as `references/`, load only the specific files needed for the request; don't bulk-load everything.
  3) If `scripts/` exist, prefer running or patching them instead of retyping large code blocks.
  4) If `assets/` or templates exist, reuse them instead of recreating from scratch.
- Coordination and sequencing:
  - If multiple skills apply, choose the minimal set that covers the request and state the order you'll use them.
  - Announce which skill(s) you're using and why (one short line). If you skip an obvious skill, say why.
- Context hygiene:
  - Keep context small: summarize long sections instead of pasting them; only load extra files when needed.
  - Avoid deep reference-chasing: prefer opening only files directly linked from `SKILL.md` unless you're blocked.
  - When variants exist (frameworks, providers, domains), pick only the relevant reference file(s) and note that choice.
- Safety and fallback: If a skill can't be applied cleanly (missing files, unclear instructions), state the issue, pick the next-best approach, and continue.
