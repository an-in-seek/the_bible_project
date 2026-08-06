# Architecture

Hexagonal (ports & adapters), applied per domain module. All code lives under
`src/main/kotlin/com/elseeker/{module}/` — split by module first, then by layer inside each module.

## Modules

| Module | Responsibility |
|---|---|
| `bible` | Bible text/chapters & verses, translations, reading progress, notes & highlights, typing sessions, search |
| `study` | Dictionary, dictionary search, study progress |
| `game` | Quizzes (multiple choice / OX), word puzzles, rankings |
| `community` | Posts, comments, reactions, reports |
| `member` | Members, OAuth account links, consent history, withdrawal history |
| `auth` | Login and token issuance flows |
| `qna` | Inquiries, guest contact messages |
| `analytics` | Site visit and app-install-banner event collection |
| `common` | Shared config, security, exceptions, policies, global components |

When a new domain appears, create a new module instead of squeezing it into an existing one.

## Layers

```
{module}/
  adapter/input/api/      — REST controllers (@RestController)
  adapter/input/api/client|admin/   — split client-facing / admin-facing APIs
                          put request/, response/, mapper/ underneath
  adapter/input/web/      — Thymeleaf view controllers (@Controller)
  adapter/output/jpa/     — Spring Data JPA repositories, custom JPQL, converters
  application/service/    — thin service facades
  application/component/  — the actual domain-logic helpers (e.g. BibleReader)
  application/mapper/     — entity <-> DTO conversion
  application/listener/   — domain event listeners
  domain/model/           — JPA @Entity
  domain/vo/              — enums, value objects
  domain/result/          — DTOs returned by services
  domain/event/           — domain events
  domain/policy/          — domain policies
```

Dependencies flow one way: `adapter → application → domain`. `domain` knows nothing about the
layers above it.

## Core patterns

**Thin services, logic in components.** Services in `application/service` own only the transaction
boundary and flow control; the actual computation and lookups are delegated to `@Component` classes
in `application/component`. Example: `BibleService` → `BibleReader`.

**Prevent N+1 in JPQL.** Every entity association is `LAZY` by default. Repository methods that
fetch lists must spell out `JOIN FETCH` in JPQL. Do not rely on lazy loading inside a loop.

**Entity inheritance.** Every entity extends `BaseEntity` (`@MappedSuperclass`, `@Id` `IDENTITY`).
If created/updated timestamps are needed, extend `BaseTimeEntity`
(`@CreatedDate` / `@LastModifiedDate`).

**Swagger docs go in a separate interface.** springdoc annotations such as `@Operation` / `@Schema`
belong on a `*ApiDocument` interface that the controller implements. Do not mix documentation
annotations into the controller body (24 such interfaces exist today).

**Type-safe queries use Kotlin JDSL.** Queries with many dynamic conditions are written with
Kotlin JDSL (`jpql { }`). See [tech-stack.md](tech-stack.md) for dependency caveats.

## Authentication & security

- JWT (JJWT) + OAuth2 social login (Google, Naver, Kakao)
- Sessions are stateless. Access/refresh tokens are exchanged via **HttpOnly cookies**.
- Filter order: `JwtRefreshFilter` → `JwtAuthenticationFilter` → `ConsentGateFilter` → Spring Security
- Authentication failure handling diverges:
  - **API** → 401 JSON response
  - **Web pages** → redirect to `/web/auth/login?returnUrl=...`
- On the client, `fetchWithAuthRetry()` in `common-util.js` handles token refresh.

The related code lives under `common/security/` (`SecurityConfig.kt`, `jwt/`, `oauth/`).
