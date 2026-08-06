# CLAUDE.md

Claude Code(claude.ai/code)가 이 저장소에서 작업할 때 참고하는 안내서다.

el-seeker 는 성경 읽기·타이핑·퀴즈·낱말퍼즐·커뮤니티를 제공하는 Kotlin/Spring Boot 서버 렌더링
웹 애플리케이션이다. Thymeleaf 로 화면을 그리고 같은 애플리케이션이 REST API 도 함께 제공한다.

## 규칙 문서

주제별 규칙은 `.claude/rules/` 에 나눠 두었다. **작업 전에 해당 주제 문서를 먼저 읽는다.**

| 문서 | 언제 읽나 |
|---|---|
| [architecture.md](.claude/rules/architecture.md) | 모듈·레이어 구조, 패키지 배치, 인증/보안 필터 체인을 다룰 때 |
| [tech-stack.md](.claude/rules/tech-stack.md) | 빌드·실행, 의존성 추가/변경, Spring Boot 4 관련 문제, DB 설정 |
| [naming.md](.claude/rules/naming.md) | 클래스·메서드 이름을 정할 때 |
| [error-handling.md](.claude/rules/error-handling.md) | 예외를 던지거나 에러 응답을 만들 때 |
| [testing.md](.claude/rules/testing.md) | 테스트를 작성·수정할 때 |
| [caching.md](.claude/rules/caching.md) | 캐시를 추가하거나 만료 정책을 바꿀 때 |
| [time-and-locale.md](.claude/rules/time-and-locale.md) | 날짜·시각·타임존을 다룰 때 |
| [frontend.md](.claude/rules/frontend.md) | Thymeleaf 템플릿, CSS, JavaScript 를 건드릴 때 |

## 자주 쓰는 명령

```bash
./gradlew bootRun     # 로컬 실행 (DB 환경변수 필요, tech-stack.md 참고)
./gradlew build       # 빌드 + 전체 테스트
./gradlew test        # 테스트만 (Docker 필요 — Testcontainers)
./gradlew bootJar     # 실행 가능한 JAR
```

프론트엔드(HTML/CSS/JS/Thymeleaf)만 고쳤다면 `./gradlew build` 나 `test` 를 돌리지 않는다.
Kotlin 코드가 함께 바뀐 경우에만 돌린다.

린터·포매터는 설정돼 있지 않다.

## Git 커밋 컨벤션

AngularJS 컨벤션의 접두사를 쓴다: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`, `build:`

```
feat: 성경 낱말 퍼즐 기능 추가
fix: 퍼즐 보드 셀 렌더링 오류 수정
```
