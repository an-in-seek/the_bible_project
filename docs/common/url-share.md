# 화면 URL 공유 (상단 네비게이션 공유 버튼)

## 구현 상태: ✅ 완료 (학습 섹션 전체 적용)

현재 보고 있는 화면의 URL 을 공유할 수 있는 공통 버튼입니다. 상단 네비게이션 오른쪽,
계정 버튼 왼쪽에 위치합니다.

## 왜 상단 네비게이션인가

| 후보 | 판단 |
|---|---|
| **상단 네비게이션 (채택)** | 학습 화면 19개가 레이아웃이 제각각(카드 그리드, 풀스크린 스크롤, 지도, 타임라인)인데 상단바만은 모든 화면에 동일하게 있다. 화면별 CSS·마크업 추가 없이 한 곳만 고치면 전부 적용된다. 이미 검색·알림·게시글 메뉴가 같은 자리를 쓰고 있어 사용자에게 "화면 단위 동작"으로 읽힌다. |
| 본문 상단/하단 고정 버튼 | 화면마다 배치를 다시 잡아야 하고, `creation`(풀스크린 스크롤)·`bible-history-map`(지도 UI)에서는 놓을 자리가 없다. |
| FAB (성경 본문처럼) | 학습 화면 다수가 `has-dual-bottom-nav` 라 하단 탭바·스크롤 상단 버튼과 겹친다. FAB 는 성경 본문의 "구절 선택 후 동작"처럼 선택 대상이 있을 때 어울린다. 화면 전체 공유에는 과하다. |

`has-dual-bottom-nav` 화면에서 상단바는 스크롤을 내리면 숨는다. 위로 조금만 올리면 다시
나타나므로 접근성 문제는 없다고 판단했다.

## 구성

| 파일 | 역할 |
|---|---|
| `common/adapter/input/web/GlobalModelAttribute.kt` | `showShareButton` 모델 속성 — 노출 대상 경로 판단 |
| `templates/fragments/header.html` | `#topNavShareButton` 마크업 (`showShareButton` 일 때만 렌더) |
| `templates/fragments/head.html` | `showShareButton` 일 때만 `share.js` 로드 |
| `static/js/share.js` | Web Share / 클립보드 복사 동작, 토스트 |
| `static/css/top-nav.css` | `.top-nav-share-button`, `.top-nav-share-icon` |
| `static/css/common.css` | `.share-toast` |

## 노출 대상은 경로 접두사로 결정한다

화면 19개의 템플릿을 각각 고치는 대신, 기존 `useVerseFontBoot` 와 같은 방식으로
`@ControllerAdvice` 에서 요청 경로를 보고 판단한다. 학습 화면이 추가돼도 자동으로 붙는다.

```kotlin
@ModelAttribute("showShareButton")
fun showShareButton(request: HttpServletRequest): Boolean =
    SHARE_ENABLED_PATH_PREFIXES.any { request.requestURI.startsWith(it) }

companion object {
    private val SHARE_ENABLED_PATH_PREFIXES = listOf("/web/study")
}
```

다른 섹션으로 넓힐 때는 이 목록에 접두사를 추가하면 된다. 관리자 화면(`/web/admin`)은
접두사가 달라 영향을 받지 않는다.

## 공유되는 값

**URL** — `link[rel=canonical]` 의 origin/path 에 현재 쿼리스트링을 합쳐 만든다.

- canonical 은 `head.html` 이 `https://elseeker.com + requestURI` 로 만들기 때문에,
  로컬·스테이징에서 눌러도 **운영 도메인 링크**가 공유된다. 공유는 남에게 보내는 동작이므로
  의도한 동작이다.
- 쿼리스트링을 살리는 이유는 canonical 에 쿼리가 빠져 있기 때문이다. 사전 검색어(`keyword`),
  선택한 시대(`selectedEra`) 처럼 화면 상태가 쿼리에 담기는 화면이 있어, 이걸 버리면 받는
  사람이 다른 화면을 보게 된다.

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

## 동작

1. `navigator.share` 가 있으면 OS 공유 시트를 띄운다 (모바일 대부분, 일부 데스크톱).
2. 없으면 클립보드에 URL 을 복사하고 토스트로 알린다.
   `navigator.clipboard` 가 막힌 환경(비보안 컨텍스트 등)에서는 `execCommand("copy")` 로 한 번 더
   시도한다.

**사용자가 공유 시트를 그냥 닫은 경우(`AbortError`)에는 복사로 넘어가지 않는다.** 취소했는데
"링크가 복사되었습니다" 가 뜨면 사용자가 의도하지 않은 동작이 일어난 것처럼 보이기 때문이다.
(커뮤니티 게시글 공유 `community-detail.js` 는 아직 이 구분 없이 항상 복사로 대체한다.)

## 확인 시 주의

- Web Share API 와 클립보드 API 는 **보안 컨텍스트(HTTPS 또는 localhost)** 에서만 동작한다.
  사설 IP 로 접속해 테스트하면 `execCommand` 경로로 떨어진다.
- 데스크톱 크롬은 `navigator.share` 를 지원하므로, 복사 토스트를 보려면 지원하지 않는
  브라우저(파이어폭스 데스크톱 등)로 확인해야 한다.
