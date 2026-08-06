# Error Handling

Never hardcode messages for business/domain errors. Define them in `ErrorType` and raise them with
`throwError`.

```kotlin
// ✅ correct
val translation = translationRepository.findById(id)
    ?: throwError(ErrorType.TRANSLATION_NOT_FOUND)

// ❌ hardcoded exception/message
val translation = translationRepository.findById(id)
    ?: throw IllegalStateException("번역본을 찾을 수 없습니다")
```

## Components

All of these live in `common/domain/`.

| Element | Role |
|---|---|
| `ErrorType` (enum) | Bundles `HttpStatus` + message + `LogLevel` in one place |
| `ServiceError` | A `RuntimeException` carrying `errorType` and a vararg `data` |
| `throwError(errorType, vararg data): Nothing` | The throwing function. Returns `Nothing`, so it can sit on the right side of an elvis operator |
| `GlobalExceptionHandler` | `@RestControllerAdvice`. Catches `ServiceError` and converts it to `ErrorResponse` |
| `ErrorResponse` | `status` / `code` (= `ErrorType` name) / `message` |

`ErrorType` entries are grouped by HTTP status range (`// 400`, `// 404`, …). 66 entries today.

Error messages themselves are written in Korean — they are user-facing.

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

## LogLevel is not decoration

`GlobalExceptionHandler` branches on `errorType.logLevel` to pick the actual log level. Tagging a
user input mistake (bad parameter, duplicate nickname) as `ERROR` sets off production alerts. The
rule is: **client's fault → `WARN`, server's fault → `ERROR`.** That is why every existing 400/404
entry is `WARN`.

## When to use `data`

When `data` is present, `ServiceError.message` becomes `"{message} - {data joined by commas}"`.
That string **goes straight into the `message` field of the response body.** Do not put internal
identifiers or anything else users should not see into `data`.

```kotlin
throwError(ErrorType.TRANSLATION_NOT_FOUND, translationId)   // "번역본을 찾을 수 없습니다. - 3"
```

## Rules

- **Search the existing entries before adding a new `ErrorType`.** One of the 66 usually fits.
- Do not raise business errors with `require` / `check` plus a string literal. No meaningful code
  is left in the stack trace, and `GlobalExceptionHandler` will not catch it, so it becomes a 500.
- `ErrorType` lives in `common/domain` but is a **shared kernel**. Any layer of any module may
  reference it.
- Do not wrap framework exceptions (`MethodArgumentNotValidException` etc.) in `ServiceError` and
  rethrow. Add a handler to `GlobalExceptionHandler` instead.
