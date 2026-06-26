// /js/app-install-banner.js
// Android 모바일 웹 방문자 대상 앱 설치 유도 배너.
// 설계 문서: docs/googleplay/app-install-banner-prd.md

import { LocalStore, SessionStore, STORAGE_KEYS } from "/js/storage-util.js?v=2.7";

const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7일
const EVENT_ENDPOINT = "/api/v1/analytics/app-install-banner/events";

const EVENT = Object.freeze({
    IMPRESSION: "IMPRESSION",
    CLICK: "CLICK",
    DISMISS: "DISMISS",
});

const ua = navigator.userAgent || "";

// === 환경 감지 ===
function isAndroid() {
    return /Android/.test(ua);
}

function isMobile() {
    return /Mobile/.test(ua);
}

// 하이브리드 앱 내부 WebView 판별 (donation-prd.md 브릿지 규약과 동일 메커니즘)
function isWebView() {
    if (typeof window.AppBridge !== "undefined") return true; // 1차: 브릿지 객체
    return /;\s*wv\)/.test(ua); // 2차(보조): Android WebView 토큰
}

function isBot() {
    return /bot|crawler|spider|slurp|facebookexternalhit/i.test(ua);
}

// === 노출 제한 상태 ===
function shownInSession() {
    return SessionStore.get(STORAGE_KEYS.APP_INSTALL_BANNER_SHOWN_IN_SESSION) === true;
}

function dismissedWithinTtl() {
    const at = LocalStore.get(STORAGE_KEYS.APP_INSTALL_BANNER_DISMISSED_AT);
    if (typeof at !== "number") return false;
    return Date.now() - at < DISMISS_TTL_MS;
}

function shouldShow() {
    if (!isAndroid() || !isMobile()) return false; // Android 모바일만
    if (isWebView()) return false;                 // 앱 내부 WebView 제외
    if (isBot()) return false;                      // 봇 제외
    if (shownInSession()) return false;             // 동일 세션 재노출 금지
    if (dismissedWithinTtl()) return false;         // 7일 재노출 금지
    return true;
}

// === 익명 이벤트 비콘 ===
function trackEvent(eventType) {
    const payload = JSON.stringify({ event: eventType });
    try {
        if (navigator.sendBeacon) {
            const blob = new Blob([payload], { type: "application/json" });
            if (navigator.sendBeacon(EVENT_ENDPOINT, blob)) return;
        }
    } catch (e) { /* sendBeacon 실패 시 fetch 폴백 */ }
    try {
        fetch(EVENT_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
        }).catch(() => { /* 적재 실패는 무시 (UX 영향 없음) */ });
    } catch (e) { /* 무시 */ }
}

// === 배너 동작 ===
function dismiss(banner) {
    // 먼저 숨겨 UX를 절대 막지 않는다(§16). 저장 실패는 무시.
    banner.classList.remove("is-visible");
    banner.hidden = true;
    try {
        LocalStore.set(STORAGE_KEYS.APP_INSTALL_BANNER_DISMISSED_AT, Date.now());
        SessionStore.set(STORAGE_KEYS.APP_INSTALL_BANNER_SHOWN_IN_SESSION, true);
    } catch (e) { /* storage 차단 환경 — 무시 */ }
    trackEvent(EVENT.DISMISS);
}

function showBanner(banner) {
    banner.hidden = false;
    // 다음 프레임에 .is-visible 부여 → translateY(100%)→0 슬라이드업
    requestAnimationFrame(() => banner.classList.add("is-visible"));
    try {
        SessionStore.set(STORAGE_KEYS.APP_INSTALL_BANNER_SHOWN_IN_SESSION, true);
    } catch (e) { /* storage 차단 환경 — 무시 */ }
    trackEvent(EVENT.IMPRESSION);

    const installBtn = banner.querySelector("#appInstallBannerInstall");
    const continueBtn = banner.querySelector("#appInstallBannerContinue");
    const closeBtn = banner.querySelector("#appInstallBannerClose");

    // 설치하기 — 기본 링크 이동은 유지하고 클릭만 기록 (sendBeacon은 페이지 이탈 중에도 전송됨)
    installBtn?.addEventListener("click", () => trackEvent(EVENT.CLICK));
    continueBtn?.addEventListener("click", () => dismiss(banner));
    closeBtn?.addEventListener("click", () => dismiss(banner));
}

function init() {
    try {
        const banner = document.getElementById("appInstallBanner");
        if (!banner) return; // 배너 마크업이 없는 페이지
        if (!shouldShow()) return;
        showBanner(banner);
    } catch (e) {
        // storage 읽기 등 어떤 실패도 페이지 동작을 막지 않는다(§16). 배너 미노출로 fail-closed.
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
