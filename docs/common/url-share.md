# 화면 URL 공유 (상단 네비게이션 공유 버튼)

## 구현 상태: ✅ 완료 (학습·커뮤니티 섹션 적용, `creation`·글쓰기 제외)

현재 보고 있는 화면의 URL 을 공유할 수 있는 공통 버튼입니다. 상단 네비게이션 오른쪽,
계정 버튼 왼쪽에 위치합니다.

공유되는 링크는 **딥링크**입니다. 두 축이 있습니다.

| 축 | 뜻 | 담당 |
|---|---|---|
| 화면 상태 | 보고 있는 탭·검색어·필터·선택까지 URL 에 담아, 받는 사람이 **같은 화면**을 본다 | `deep-link-util.js` + 각 화면 |
| 앱 진입 | 같은 https 링크가 앱 설치자에게 **앱의 해당 화면**으로 열린다 (Android App Links) | `AppLinkApi` (`/.well-known/assetlinks.json`) |

## 왜 상단 네비게이션인가

| 후보 | 판단 |
|---|---|
| **상단 네비게이션 (채택)** | 학습 화면 레이아웃이 제각각(카드 그리드, 지도, 타임라인, 상세)인데 상단바만은 모든 화면에 동일하게 있다. 화면별 CSS·마크업 추가 없이 한 곳만 고치면 전부 적용된다. 이미 검색·알림·게시글 메뉴가 같은 자리를 쓰고 있어 사용자에게 "화면 단위 동작"으로 읽힌다. |
| 본문 상단/하단 고정 버튼 | 화면마다 배치를 다시 잡아야 하고, `bible-history-map`(지도 UI)처럼 본문을 UI 가 꽉 채우는 화면에는 놓을 자리가 없다. |
| FAB (성경 본문처럼) | 학습 화면 다수가 `has-dual-bottom-nav` 라 하단 탭바·스크롤 상단 버튼과 겹친다. FAB 는 성경 본문의 "구절 선택 후 동작"처럼 선택 대상이 있을 때 어울린다. 화면 전체 공유에는 과하다. |

상단바 auto-hide 를 걱정할 필요는 없다. `common-nav.js` 의 auto-hide 는 DOM 에
`.section-nav` 가 있을 때만 동작하는데, 학습 화면 19개 중 `.section-nav` 를 넣는 건
`study.html` 하나뿐이고 그 화면은 `has-dual-bottom-nav` 를 달지 않는다. 즉 **학습 섹션에서
상단바는 항상 떠 있다.** (`has-dual-bottom-nav` 클래스만 붙은 학습 화면이 9개 있지만
`.section-nav` 가 없어 auto-hide 가 걸리지 않는다.)

## 구성

| 파일 | 역할 |
|---|---|
| `common/adapter/input/web/GlobalModelAttribute.kt` | `showShareButton` 모델 속성 — 노출 대상 경로 판단 |
| `templates/fragments/header.html` | `#topNavShareButton` 마크업 (`showShareButton` 일 때만 렌더) |
| `templates/fragments/head.html` | `showShareButton` 일 때만 `share.js` 로드 |
| `static/js/share.js` | Web Share / 클립보드 복사 동작, 토스트. 공유 URL·`shareLink()` 를 export |
| `static/js/deep-link-util.js` | 화면 상태 ↔ URL 쿼리 동기화 (`syncDeepLinkParams` / `readDeepLinkParams`) |
| `common/adapter/input/api/AppLinkApi.kt` | `/.well-known/assetlinks.json` — Android App Links 검증 파일 |
| `common/config/ElSeekerProperties.kt` | `el-seeker.app-link.android` — 패키지명·서명 지문 설정 |
| `static/css/top-nav.css` | `.top-nav-share-button`, `.top-nav-share-icon` |
| `static/css/common.css` | `.share-toast` 기본 스타일 |
| `static/css/section-nav.css` | `.share-toast` 하단 탭바 공존 보정 |

## 노출 대상은 경로 접두사로 결정한다

화면 19개의 템플릿을 각각 고치는 대신, 기존 `useVerseFontBoot` 와 같은 방식으로
`@ControllerAdvice` 에서 요청 경로를 보고 판단한다. 학습 화면이 추가돼도 자동으로 붙는다.

```kotlin
@ModelAttribute("showShareButton")
fun showShareButton(request: HttpServletRequest): Boolean {
    val requestUri = request.requestURI
    return SHARE_ENABLED_PATH_PREFIXES.any { requestUri.startsWith(it) } &&
        requestUri !in SHARE_EXCLUDED_PATHS
}

companion object {
    private val SHARE_ENABLED_PATH_PREFIXES = listOf("/web/study", "/web/community")

    private val SHARE_EXCLUDED_PATHS = setOf("/web/study/creation", "/web/community/write")
}
```

다른 섹션으로 넓힐 때는 접두사 목록에 추가하면 된다. 관리자 화면(`/web/admin`)은 접두사가
달라 영향을 받지 않는다. 판정은 `GlobalModelAttributeTest` 가 고정한다.

### 예외 경로

| 경로 | 이유 |
|---|---|
| `/web/study/creation` | 풀스크린 스크롤로 창조 과정을 체험하는 연출 화면이라 상단 버튼이 몰입을 깬다 |
| `/web/community/write` | 아직 저장되지 않은 작성 폼이라 공유할 대상이 없다 |

접두사만으로는 걸러지지 않으므로 `SHARE_EXCLUDED_PATHS` 로 정확히 일치하는 경로를 제외한다.
같은 성격의 화면이 생기면 이 목록에 추가한다.

## 공유되는 값

**URL** — `link[rel=canonical]` 의 origin/path 에 현재 쿼리스트링을 합쳐 만든다.

- canonical 은 `head.html` 이 `https://elseeker.com + currentPath` 로 만들기 때문에,
  로컬·스테이징에서 눌러도 **운영 도메인 링크**가 공유된다. 공유는 남에게 보내는 동작이므로
  의도한 동작이다.
- 경로는 `GlobalModelAttribute` 가 넣어 주는 `currentPath` 를 쓴다. **템플릿에서
  `#httpServletRequest` 로 직접 읽으면 안 된다** — Thymeleaf 3.1 이 그 표현식 객체를 없앴는데
  예외가 아니라 조용히 `null` 이 되고, canonical 이 `siteUrl` 로 폴백해 **어느 화면에서 눌러도
  루트가 공유된다.** 렌더링은 멀쩡해서 눈에 띄지 않으므로 `CanonicalUrlTest` 로 고정해 두었다.
- 쿼리스트링을 살리는 이유는 canonical 에 쿼리가 빠져 있기 때문이다. 화면 상태가 쿼리에 담기므로
  이걸 버리면 받는 사람이 다른 화면을 보게 된다.

**제목** — 우선순위는 `data-share-title` → `og:title` → `document.title` 이며, 끝의
`| ElSeeker` 는 제거한다.

정적 화면은 `og:title` 로 충분하지만, 내용이 데이터에 따라 달라지는 화면은 컨트롤러에서
`shareTitle` 모델 속성으로 덮어쓴다.

```kotlin
model.addAttribute("shareTitle", "${dictionary.term} - 성경 사전")
```

| 화면 | shareTitle |
|---|---|
| 사전 상세 | `{용어} - 성경 사전` |
| 연대기 시대별 | `{시대명} - 성경 연대기` |
| 역사 사건 상세 | `{사건명} - 성경 역사` |

커뮤니티 게시글 상세는 본문을 클라이언트에서 그려 `og:title` 이 사이트 기본값이라, 게시글을
받아온 뒤 `community-detail.js` 가 `#topNavShareButton` 의 `data-share-title` 을 제목으로 덮어쓴다.

## 화면 상태 딥링크

공유 URL 은 canonical + **현재 쿼리스트링**이다. 즉 **화면이 상태를 쿼리에 실어 둔 만큼만
딥링크가 된다.** 쿼리에 없는 상태(탭, 검색어, 필터, 열려 있는 상세)는 받는 사람에게 기본
화면으로 보인다.

그래서 상태를 가진 공유 대상 화면은 `deep-link-util.js` 로 상태를 URL 에 남기고, 진입 시
같은 쿼리를 읽어 복원한다.

```js
import {readDeepLinkParams, syncDeepLinkParams} from "/js/deep-link-util.js?v=1.0";

syncDeepLinkParams({keyword});            // 값이 비면(null/""/false) 키를 URL 에서 지운다
const tab = readDeepLinkParams().get("tab");
```

`syncDeepLinkParams` 는 **넘긴 키만** 쓰고 나머지 파라미터(`from`, `bookOrder` 등)는 건드리지
않는다. `history.replaceState` 호출 빈도 제한을 피하려 200ms 묶어서 반영하고, 공유 직전
`share.js` 가 `flushDeepLinkParams()` 로 밀어낸다. 검색어를 치자마자 공유를 눌러도 직전 상태가
나가지 않게 하기 위해서다.

### 화면별 파라미터

| 화면 | 파라미터 |
|---|---|
| 사전 목록 | `keyword` (기존) |
| 성경 역사 지도 | `year` / `layers` / `route` / `sel` (기존) |
| 구약 왕들의 계보 | `kingdom` / `eval` / `keyword` / `king` |
| 성경 족보 | `tab` (`matthew` 기본값이면 생략) |
| 성경 주석 | `keyword` |
| 성경 개요 영상 | `keyword` (+ 기존 `bookOrder`) |
| 공동체성경읽기 | `keyword` (+ 기존 `bookOrder`) |
| 커뮤니티 목록 | `category` (`all` 기본값이면 생략) |
| 커뮤니티 상세 | 경로 자체가 게시글 식별자라 파라미터 없음 |

**기본값은 URL 에 남기지 않는다.** 기본 상태의 공유 링크가 파라미터로 지저분해지지 않도록
`syncDeepLinkParams` 에 `null` 을 넘겨 키를 지운다.

상태가 없는 정적 학습 화면(십계명·사도신경·주기도문·성주간·12제자·12지파 등)은 경로만으로
충분해 별도 파라미터가 없다.

## 앱 딥링크 (Android App Links)

공유 링크는 `https://elseeker.com/...` 그대로 두고, **Android App Links** 로 앱에서 열리게 한다.
커스텀 스킴(`elseeker://`)을 쓰지 않는 이유는 앱이 없는 사람에게 열리지 않는 링크가 되기
때문이다. https 링크는 앱이 있으면 앱으로, 없으면 웹으로 열려 공유 대상이 누구든 깨지지 않는다.

성립 조건은 **양쪽 다** 있어야 한다.

| 쪽 | 필요한 것 | 상태 |
|---|---|---|
| 서버 | `/.well-known/assetlinks.json` 응답 | ✅ `AppLinkApi` |
| 앱 | `AndroidManifest` 의 `android:autoVerify="true"` intent-filter | ⏳ 앱 저장소 작업 |

```yaml
el-seeker:
  app-link:
    android:
      package-name: ${ANDROID_APP_PACKAGE_NAME:com.elseeker.android}
      sha256-cert-fingerprints: ${ANDROID_APP_SHA256_CERT_FINGERPRINTS:}
```

**지문이나 패키지명이 비면 엔드포인트는 404 를 반환한다.** 지문 없는 파일을 200 으로 내보내면
Android 가 '검증 실패'로 캐시해, 나중에 지문을 채워도 재검증 전까지 링크가 앱으로 열리지 않는다.
없느니만 못하므로 fail-closed 로 둔다.

Play App Signing 을 쓰면 **업로드 키와 앱 서명 키의 지문이 다르다.** Play Console 의
`설정 > 앱 서명` 에서 두 지문을 모두 확인해 쉼표로 이어 넣는다. 하나만 넣으면 특정 트랙에서만
검증이 통과한다.

정적 파일 대신 엔드포인트로 둔 이유는 지문이 환경변수라서다. 지문을 레포에 커밋하지 않고,
키 교체 시 배포 없이 환경변수만 바꿀 수 있다.

확인:

```bash
curl -s https://elseeker.com/.well-known/assetlinks.json
```

## 동작

1. `navigator.share` 가 있으면 OS 공유 시트를 띄운다 (모바일 대부분, 일부 데스크톱).
2. 없으면 클립보드에 URL 을 복사하고 토스트로 알린다.
   `navigator.clipboard` 가 막힌 환경(비보안 컨텍스트 등)에서는 `execCommand("copy")` 로 한 번 더
   시도한다.

**사용자가 공유 시트를 그냥 닫은 경우(`AbortError`)에는 복사로 넘어가지 않는다.** 취소했는데
"링크가 복사되었습니다" 가 뜨면 사용자가 의도하지 않은 동작이 일어난 것처럼 보이기 때문이다.

커뮤니티 게시글 상세의 더보기 메뉴 공유 항목도 `share.js` 의 `shareLink()` 로 위임해 상단 버튼과
같은 동작을 쓴다. 상세 화면에는 공유 진입점이 상단 버튼과 더보기 메뉴 둘 다 있다.

## 확인 시 주의

- Web Share API 와 클립보드 API 는 **보안 컨텍스트(HTTPS 또는 localhost)** 에서만 동작한다.
  사설 IP 로 접속해 테스트하면 `execCommand` 경로로 떨어진다.
- 데스크톱 크롬은 `navigator.share` 를 지원하므로, 복사 토스트를 보려면 지원하지 않는
  브라우저(파이어폭스 데스크톱 등)로 확인해야 한다.
