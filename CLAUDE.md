# CLAUDE.md

Guide for Claude Code (claude.ai/code) when working in this repository.

el-seeker is a Kotlin/Spring Boot server-rendered web application providing Bible reading, typing
practice, quizzes, word puzzles, and a community. Thymeleaf renders the pages, and the same
application also exposes a REST API.

## Rule documents

Topic-specific rules live in `.claude/rules/`. **Read the relevant document before starting work.**

| Document | When to read |
|---|---|
| [architecture.md](.claude/rules/architecture.md) | Module/layer structure, package placement, auth & security filter chain |
| [tech-stack.md](.claude/rules/tech-stack.md) | Build & run, adding/changing dependencies, Spring Boot 4 issues, DB config |
| [naming.md](.claude/rules/naming.md) | Naming classes and methods |
| [error-handling.md](.claude/rules/error-handling.md) | Throwing exceptions, building error responses |
| [testing.md](.claude/rules/testing.md) | Writing or modifying tests |
| [caching.md](.claude/rules/caching.md) | Adding a cache or changing an expiration policy |
| [time-and-locale.md](.claude/rules/time-and-locale.md) | Dates, times, time zones |
| [frontend.md](.claude/rules/frontend.md) | Thymeleaf templates, CSS, JavaScript |

## Common commands

```bash
./gradlew bootRun     # run locally (requires DB env vars, see tech-stack.md)
./gradlew build       # build + full test suite
./gradlew test        # tests only (requires Docker — Testcontainers)
./gradlew bootJar     # executable JAR
```

If you only changed frontend files (HTML/CSS/JS/Thymeleaf), do not run `./gradlew build` or `test`.
Run them only when Kotlin code changed as well.

No linter or formatter is configured.

## Git commit convention

Use AngularJS-convention prefixes: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`,
`chore:`, `build:`

Commit messages are written in Korean.

```
feat: 성경 낱말 퍼즐 기능 추가
fix: 퍼즐 보드 셀 렌더링 오류 수정
```
