import {checkAuthStatus, markOAuthLoginInitiated, showAuthError} from "/js/auth/auth-check.js";

document.addEventListener("DOMContentLoaded", () => {
    const authErrorMessage = document.getElementById("authErrorMessage");
    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get("returnUrl");
    const safeReturnUrl =
        returnUrl && returnUrl.startsWith("/") && !returnUrl.startsWith("//") ? returnUrl : null;
    const fallbackUrl = "/web/game";

    const socialLoginLinks = document.querySelectorAll(".social-login-button[href^='/oauth2/authorization/']");
    if (safeReturnUrl) {
        socialLoginLinks.forEach((link) => {
            const url = new URL(link.getAttribute("href"), window.location.origin);
            url.searchParams.set("returnUrl", safeReturnUrl);
            link.setAttribute("href", `${url.pathname}${url.search}`);
        });
    }
    const resolveBackUrl = () => {
        const referrer = document.referrer;
        if (!referrer || !referrer.startsWith(window.location.origin)) {
            return "/";
        }
        const referrerUrl = new URL(referrer);
        const candidate = `${referrerUrl.pathname}${referrerUrl.search}${referrerUrl.hash}`;
        if (!candidate.startsWith("/") || candidate.startsWith("//")) {
            return "/";
        }
        if (candidate.startsWith("/oauth2/") || candidate.startsWith("/web/auth/login")) {
            return "/";
        }
        return candidate;
    };

    socialLoginLinks.forEach((link) => {
        link.addEventListener("click", () => {
            markOAuthLoginInitiated(resolveBackUrl());
        });
    });

    // 로그인 페이지 접근 시 이미 인증된 사용자는 바로 이동합니다.
    checkAuthStatus({
        onAuthenticated: () => {
            window.location.replace(safeReturnUrl || fallbackUrl);
        },
        onUnauthenticated: () => {
            // 로그인 UI는 비로그인 사용자에게만 노출됩니다.
        },
        onError: () => showAuthError(authErrorMessage, "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."),
    });
});
