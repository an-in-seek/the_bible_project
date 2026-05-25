import {refreshAccessToken} from "/js/auth/auth-check.js";

/**
 * 숫자에 천 단위 콤마를 적용하여 반환합니다.
 * @param {number|string} number - 포맷팅할 숫자
 * @returns {string} 콤마가 적용된 문자열 (입력이 유효하지 않으면 '0' 반환)
 */
export const formatNumberWithComma = (number) => {
    if (number === null || number === undefined || isNaN(number)) {
        return "0";
    }
    return Number(number).toLocaleString();
};

export const fetchWithAuthRetry = async (url, options = {}) => {
    const response = await fetch(url, options);
    if (response.status !== 401) {
        return response;
    }
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
        return response;
    }
    return fetch(url, options);
};

/**
 * 본문 스크롤 잠금/해제 — 다이얼로그 활성 시 사용.
 * CSS body.scroll-locked 룰과 페어로 동작.
 */
export const lockBodyScroll = () => document.body.classList.add("scroll-locked");
export const unlockBodyScroll = () => document.body.classList.remove("scroll-locked");

/**
 * Native <dialog> 인스턴스에 자동 스크롤 잠금/해제 바인딩.
 * showModal을 래핑하여 호출 시점에 lock 자동 처리, close 이벤트로 unlock.
 * 모든 close 경로(닫기 버튼, ESC, backdrop 클릭)를 한 번에 커버.
 */
export const setupDialogScrollLock = (dialog) => {
    if (!dialog || typeof dialog.showModal !== "function") return;
    if (dialog.dataset.scrollLockBound === "true") return;
    const original = dialog.showModal.bind(dialog);
    dialog.showModal = (...args) => {
        lockBodyScroll();
        return original(...args);
    };
    dialog.addEventListener("close", unlockBodyScroll);
    dialog.dataset.scrollLockBound = "true";
};
