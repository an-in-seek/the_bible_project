/**
 * 화면 상태 ↔ URL 쿼리 동기화 (딥링크)
 *
 * 상단 공유 버튼(share.js)은 canonical 의 origin/path 에 **현재 쿼리스트링**을 붙여 링크를 만든다.
 * 그래서 화면이 탭·검색어·필터·선택 같은 상태를 쿼리에 반영해 두면 공유 링크가 그대로 딥링크가 되고,
 * 반영하지 않은 상태는 받는 사람에게 기본 화면으로 보인다. 이 모듈은 그 반영을 담당한다.
 *
 * 같은 URL 은 Android App Links 로 앱에서도 해당 화면을 여는 링크이므로, 여기서 만든 쿼리가
 * 웹·앱 양쪽의 딥링크 파라미터가 된다.
 *
 * 설계 문서: docs/common/url-share.md
 */

/**
 * 검색어 입력처럼 키 입력마다 호출되는 경로가 있어 묶어서 반영한다.
 * 브라우저는 replaceState 호출 빈도를 제한하므로(초과 시 조용히 무시되거나 예외) 매 입력마다 쓰지 않는다.
 */
const WRITE_DEBOUNCE_MS = 200;

let writeTimer = null;
let pendingValues = null;

function isEmptyValue(value) {
    return value === null || value === undefined || value === false || value === "";
}

function flush() {
    clearTimeout(writeTimer);
    writeTimer = null;
    if (pendingValues === null) {
        return;
    }

    const params = new URLSearchParams(window.location.search);
    Object.entries(pendingValues).forEach(([key, value]) => {
        if (isEmptyValue(value)) {
            // 기본값은 URL 에서 지운다. 공유 링크에 기본 상태가 파라미터로 남지 않도록.
            params.delete(key);
            return;
        }
        params.set(key, String(value));
    });
    pendingValues = null;

    const query = params.toString();
    const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    // history.state 를 그대로 넘긴다. auth-check.js 가 심어 둔 popstate 가드가 지워지면 뒤로가기 동작이 바뀐다.
    history.replaceState(history.state, "", url);
}

/**
 * 넘긴 키만 URL 쿼리에 반영하고 나머지 파라미터는 건드리지 않는다.
 * 화면이 관리하지 않는 파라미터(`from`, `bookOrder` 등)를 지우지 않기 위해 통째로 다시 쓰지 않는다.
 *
 * 값이 비어 있으면(`null` / `undefined` / `""` / `false`) 해당 키를 URL 에서 제거한다.
 *
 * @param {Object<string, string|number|boolean|null|undefined>} values
 */
export function syncDeepLinkParams(values) {
    pendingValues = {...(pendingValues ?? {}), ...values};
    clearTimeout(writeTimer);
    writeTimer = setTimeout(flush, WRITE_DEBOUNCE_MS);
}

/**
 * 대기 중인 반영을 즉시 URL 에 쓴다.
 * 검색어를 입력하자마자 공유 버튼을 누르면 debounce 창(200ms) 안이라 직전 상태가 공유될 수 있어,
 * share.js 가 공유 URL 을 만들기 직전에 호출한다.
 */
export function flushDeepLinkParams() {
    flush();
}

/** 진입 시 상태 복원용 — 현재 URL 의 쿼리 파라미터. */
export function readDeepLinkParams() {
    return new URLSearchParams(window.location.search);
}
