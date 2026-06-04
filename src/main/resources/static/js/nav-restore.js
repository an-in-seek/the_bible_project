/**
 * 뒤로가기/새로고침 복귀용 공통 네비게이션 유틸. (번들러 없는 ES 모듈)
 *
 * 리스트 페이지의 "더보기 깊이 + 스크롤 위치 복원" 과 `from` 기반 백버튼에서
 * 반복되던 보일러플레이트를 공통화한다.
 *  - createRestoreStore: key 로 격리된 sessionStorage 복원 저장소
 *  - restoreScroll: 결과 렌더 후 스크롤 위치 1회 복원
 *  - bindFromBackButton: ?from 값에 따라 history.back() vs fallback 분기
 */

/**
 * key 로 격리된 sessionStorage 복원 저장소를 만든다.
 * sessionStorage 비활성/용량 초과 시 예외를 전파하지 않고 복원 기능만 비활성화한다.
 *
 * @param {string} key sessionStorage 키
 * @returns {{ load: () => any, save: (state: any) => void }}
 */
export function createRestoreStore(key) {
    return {
        load() {
            try {
                const raw = sessionStorage.getItem(key);
                return raw ? JSON.parse(raw) : null;
            } catch (_) {
                return null;
            }
        },
        save(state) {
            try {
                sessionStorage.setItem(key, JSON.stringify(state));
            } catch (_) {
                /* sessionStorage 비활성/용량 초과 시 복원 기능만 비활성화 */
            }
        },
    };
}

/**
 * 결과 렌더 후 스크롤 위치를 1회 복원한다. y 가 유효한 숫자가 아니면 아무것도 하지 않는다.
 * (브라우저 기본 scrollRestoration 은 건드리지 않는다 — bfcache 자동 복원 경로 보존)
 *
 * @param {number|null|undefined} y 복원할 scrollY
 */
export function restoreScroll(y) {
    if (y == null || !Number.isFinite(y)) {
        return;
    }
    requestAnimationFrame(() => window.scrollTo(0, y));
}

/**
 * URL 의 ?from 값이 backOn 에 포함되면 history.back(), 그 외에는 fallback 으로 이동하는
 * 백버튼 클릭 핸들러를 바인딩한다. 버튼의 표시(visibility) 처리는 호출부 책임.
 *
 * @param {HTMLElement|null} button 백버튼 엘리먼트(없으면 무시)
 * @param {{ backOn?: string[], fallback?: (() => void)|string }} options
 *        backOn: history.back() 을 적용할 from 값 목록(기본 ["search"])
 *        fallback: 그 외의 경우 — 함수(직접 처리) 또는 이동할 URL 문자열
 */
export function bindFromBackButton(button, { backOn = ["search"], fallback } = {}) {
    if (!button) {
        return;
    }
    // ?from 은 바인딩(페이지 로드) 시점에 캡처한다.
    // 일부 페이지(verse-list, chapter-list)는 로드 후 history.replaceState/pushState 로
    // URL 을 갱신하면서 from 을 제거하므로, 클릭 시점에 읽으면 값이 유실된다.
    const from = new URLSearchParams(window.location.search).get("from");
    button.addEventListener("click", () => {
        if (backOn.includes(from)) {
            history.back();
            return;
        }
        if (typeof fallback === "function") {
            fallback();
        } else if (typeof fallback === "string") {
            window.location.href = fallback;
        }
    });
}
