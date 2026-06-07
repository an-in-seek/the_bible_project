// /js/auth/auth-check.js

const AUTH_ME_ENDPOINT = "/api/v1/auth/me";
const AUTH_REFRESH_ENDPOINT = "/api/v1/auth/refresh";
const OAUTH_LOGIN_FLAG_KEY = "oauthLoginInitiated";
const OAUTH_BACK_URL_KEY = "oauthLoginBackUrl";

const isOkStatus = (response) => response && response.status === 200;

const isUnauthorized = (response) => response && response.status === 401;

export const markOAuthLoginInitiated = (backUrl) => {
    try {
        sessionStorage.setItem(OAUTH_LOGIN_FLAG_KEY, "1");
        if (backUrl) {
            sessionStorage.setItem(OAUTH_BACK_URL_KEY, backUrl);
        } else {
            sessionStorage.removeItem(OAUTH_BACK_URL_KEY);
        }
    } catch (error) {
        // Ignore storage errors (private mode, blocked storage).
    }
};

const applyOAuthBackGuard = () => {
    try {
        if (sessionStorage.getItem(OAUTH_LOGIN_FLAG_KEY) !== "1") {
            return;
        }
        sessionStorage.removeItem(OAUTH_LOGIN_FLAG_KEY);
    } catch (error) {
        return;
    }

    let backUrl = null;
    try {
        backUrl = sessionStorage.getItem(OAUTH_BACK_URL_KEY);
        sessionStorage.removeItem(OAUTH_BACK_URL_KEY);
    } catch (error) {
        backUrl = null;
    }

    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (!backUrl || backUrl === currentUrl) {
        backUrl = "/";
    }

    // Prevent back navigation from returning to the OAuth provider page.
    history.pushState({oauthGuard: true}, document.title, window.location.href);
    window.addEventListener("popstate", () => {
        window.location.replace(backUrl);
    });
};

export const applyOAuthBackGuardIfNeeded = () => {
    applyOAuthBackGuard();
};

export const refreshAccessToken = async () => {
    const response = await fetch(AUTH_REFRESH_ENDPOINT, {
        method: "POST",
        credentials: "include",
        headers: {
            Accept: "application/json",
        },
    });
    return response && response.status === 204;
};

export const buildLoginRedirectUrl = (returnUrl) => {
    const targetReturnUrl = returnUrl || `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const loginUrl = new URL("/web/auth/login", window.location.origin);
    if (targetReturnUrl) {
        loginUrl.searchParams.set("returnUrl", targetReturnUrl);
    }
    return loginUrl.toString();
};

export const showAuthError = (container, message) => {
    if (!container) {
        return;
    }
    container.textContent = message;
    container.classList.remove("d-none");
};

export const checkAuthStatus = async ({
                                          onAuthenticated,
                                          onUnauthenticated,
                                          onError,
                                      } = {}) => {
    try {
        const response = await fetch(AUTH_ME_ENDPOINT, {
            method: "GET",
            credentials: "include",
            headers: {
                Accept: "application/json",
            },
        });

        if (isOkStatus(response)) {
            const data = await response.json().catch(() => null);
            // 인증 성공 시 사용자 요약 정보를 전달합니다.
            if (typeof onAuthenticated === "function") {
                onAuthenticated(data);
            }
            applyOAuthBackGuard();
            return;
        }

        if (isUnauthorized(response)) {
            const refreshed = await refreshAccessToken();
            if (refreshed) {
                const retry = await fetch(AUTH_ME_ENDPOINT, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                    },
                });
                if (isOkStatus(retry)) {
                    const data = await retry.json().catch(() => null);
                    if (typeof onAuthenticated === "function") {
                        onAuthenticated(data);
                    }
                    applyOAuthBackGuard();
                    return;
                }
            }

            // 인증 실패는 로그인으로 유도합니다.
            if (typeof onUnauthenticated === "function") {
                onUnauthenticated();
            }
            return;
        }

        // 기타 4xx(403/404 등)는 무효한 세션으로 간주해 로그아웃 처리(예: orphaned session).
        // 5xx/네트워크 오류는 일시적 장애일 수 있으므로 onError로 둔다.
        if (response && response.status >= 400 && response.status < 500) {
            if (typeof onUnauthenticated === "function") {
                onUnauthenticated();
            }
            return;
        }

        if (typeof onError === "function") {
            onError(new Error("Unexpected auth response"));
        }
    } catch (error) {
        if (typeof onError === "function") {
            onError(error);
        }
    }
};
