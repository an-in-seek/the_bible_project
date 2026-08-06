# Error Handling

비즈니스·도메인 오류는 메시지를 하드코딩하지 않는다. `ErrorType` 에 정의하고 `throwError` 로 던진다.

```kotlin
// ✅ 올바름
val translation = translationRepository.findById(id)
    ?: throwError(ErrorType.TRANSLATION_NOT_FOUND)

// ❌ 하드코딩된 예외/메시지
val translation = translationRepository.findById(id)
    ?: throw IllegalStateException("번역본을 찾을 수 없습니다")
```

## 구성 요소

전부 `common/domain/` 에 있다.

| 요소 | 역할 |
|---|---|
| `ErrorType` (enum) | `HttpStatus` + 메시지 + `LogLevel` 을 한 곳에 묶는다 |
| `ServiceError` | `RuntimeException`. `errorType` 과 가변 `data` 를 갖는다 |
| `throwError(errorType, vararg data): Nothing` | 던지는 함수. 반환 타입이 `Nothing` 이라 엘비스 우변에 바로 쓸 수 있다 |
| `GlobalExceptionHandler` | `@RestControllerAdvice`. `ServiceError` 를 잡아 `ErrorResponse` 로 변환 |
| `ErrorResponse` | `status` / `code`(=`ErrorType` 이름) / `message` |

`ErrorType` 은 HTTP 상태 구간별로 묶어서 정의한다 (`// 400`, `// 404`, …). 현재 66개.

```kotlin
enum class ErrorType(
    val status: HttpStatus,
    val message: String,
    val logLevel: LogLevel
) {
    // 404
    TRANSLATION_NOT_FOUND(HttpStatus.NOT_FOUND, "번역본을 찾을 수 없습니다.", LogLevel.WARN),
}
```

## LogLevel 은 장식이 아니다

`GlobalExceptionHandler` 가 `errorType.logLevel` 로 분기해 실제 로그 레벨을 정한다. 사용자 입력
실수(잘못된 파라미터, 중복 닉네임)에 `ERROR` 를 달면 운영 알림이 울린다. **클라이언트 잘못이면
`WARN`, 서버 잘못이면 `ERROR`** 가 기준이다. 기존 400/404 항목이 전부 `WARN` 인 이유다.

## data 를 쓰는 경우

`ServiceError.message` 는 `data` 가 있으면 `"{메시지} - {data 를 콤마로 연결}"` 형태가 된다.
이 문자열은 **응답 body 의 `message` 로 그대로 나간다.** 내부 식별자나 사용자에게 보여선 안 되는
값을 `data` 에 넣지 않는다.

```kotlin
throwError(ErrorType.TRANSLATION_NOT_FOUND, translationId)   // "번역본을 찾을 수 없습니다. - 3"
```

## 규칙

- **새 `ErrorType` 을 만들기 전에 기존 항목을 먼저 찾는다.** 66개 중 맞는 게 대개 있다.
- `require`/`check` + 문자열 리터럴로 비즈니스 오류를 던지지 않는다. 스택트레이스에 의미 있는
  코드가 남지 않고 `GlobalExceptionHandler` 도 잡지 못해 500 이 된다.
- `ErrorType` 은 `common/domain` 에 있지만 **공유 커널**이다. 어느 모듈의 어느 레이어에서 참조해도
  된다.
- 프레임워크 예외(`MethodArgumentNotValidException` 등)를 `ServiceError` 로 감싸 다시 던지지
  않는다. 필요하면 `GlobalExceptionHandler` 에 핸들러를 추가한다.
