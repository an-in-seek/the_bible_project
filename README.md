# 📖 TheBible API

## 📌 프로젝트 개요

TheBible API는 성경 데이터(번역본, 책, 장, 절)를 관리하고 제공하는 RESTful API입니다.
Spring Boot 기반으로 설계되었으며, DDD 원칙을 적용하여 모듈화된 구조를 갖추고 있습니다.

## 📌 기술 스택

- **Backend**: Spring Boot 3.x, Kotlin, JPA (Hibernate)
- **Database**: H2
- **Build**: Gradle
- **Caching**: Redis (선택사항)
- **API 문서화**: SpringDoc OpenAPI (Swagger)

---

## 📌 도메인 모델

### **📍 도메인 관계도**

```
BibleTranslation (1) ───> (N) BibleBook
BibleBook (1) ───> (N) BibleChapter
BibleChapter (1) ───> (N) BibleVerse
```

- **BibleTranslation** → **BibleBook** (번역본 - 책, 1:N 관계)
- **BibleBook** → **BibleChapter** (책 - 장, 1:N 관계)
- **BibleChapter** → **BibleVerse** (장 - 절, 1:N 관계)

## 📌 API 엔드포인트

### ✅ 번역본 리스트 조회

```
GET /bibles/translations
```

### ✅ 특정 번역본에 해당하는 책 리스트 조회

```
GET /bibles/translations/{translationId}/books
```

### ✅ 특정 책에 해당하는 장 리스트 조회

```
GET /bibles/translations/{translationId}/books/{bookId}/chapters
```

### ✅ 특정 장에 해당하는 절 리스트 조회

```
GET /bibles/translations/{translationId}/books/{bookId}/chapters/{chapterId}/verses
```

### ✅ 성경 구절 검색 (키워드 포함)

```
GET /bibles/search?keyword=
```

- **설명**: 입력한 키워드가 포함된 성경 구절을 검색합니다.

📌 **Request Example**

```http
GET /bibles/search?keyword=Jesus
```

📌 **Response Example**

```json
[
  {
    "verseId": 1,
    "bookName": "Matthew",
    "chapterNumber": 1,
    "verseNumber": 21,
    "text": "And she shall bring forth a son, and thou shalt call his name Jesus..."
  },
  {
    "verseId": 2,
    "bookName": "John",
    "chapterNumber": 3,
    "verseNumber": 16,
    "text": "For God so loved the world, that he gave his only begotten Son..."
  }
]
```

---

## 📌 데이터베이스 (H2 개발 환경)

### **H2 설정 (`application.yml`)**

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
    username: sa
    password:
  jpa:
    database-platform: org.hibernate.dialect.H2Dialect
    hibernate:
      ddl-auto: update
    show-sql: true
```

### **DDL 테이블 스키마 (자동 생성)**

### **bible_translation (번역본 테이블)**

| 컬럼명  | 타입           | 설명                  |
|------|--------------|---------------------|
| id   | BIGINT (PK)  | 번역본 ID (자동 증가)      |
| type | VARCHAR(50)  | 번역본 타입 (KRV, NIV 등) |
| name | VARCHAR(255) | 번역본 이름              |

### **bible_book (성경 책 테이블)**

| 컬럼명            | 타입           | 설명                            |
|----------------|--------------|-------------------------------|
| id             | BIGINT (PK)  | 책 ID (자동 증가)                  |
| translation_id | BIGINT (FK)  | 번역본 ID (bible_translation 연결) |
| name           | VARCHAR(255) | 책 이름 (예: 창세기, 마태복음)           |
| abbreviation   | VARCHAR(50)  | 책 약어 (예: 창, 마)                |
| testament_type | VARCHAR(10)  | 구약/신약 구분 (OLD, NEW)           |
| book_order     | INT          | 성경 내 정렬 순서                    |

### **bible_chapter (성경 장 테이블)**

| 컬럼명            | 타입          | 설명                   |
|----------------|-------------|----------------------|
| id             | BIGINT (PK) | 장 ID (자동 증가)         |
| book_id        | BIGINT (FK) | 책 ID (bible_book 연결) |
| chapter_number | INT         | 장 번호 (예: 1, 2, 3장)   |

### **bible_verse (성경 절 테이블)**

| 컬럼명          | 타입          | 설명                      |
|--------------|-------------|-------------------------|
| id           | BIGINT (PK) | 절 ID (자동 증가)            |
| chapter_id   | BIGINT (FK) | 장 ID (bible_chapter 연결) |
| verse_number | INT         | 절 번호 (예: 1, 2, 3절)      |
| text         | TEXT        | 성경 구절 내용                |

---

## 📌 실행 방법

```bash
# 프로젝트 빌드 및 실행
./gradlew bootRun
```
