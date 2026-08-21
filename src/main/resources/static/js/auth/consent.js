/**
 * 회원가입 동의 인터스티셜 컨트롤러.
 *
 * - 전체 동의 토글 + 필수 항목 체크 동기화
 * - 모두 체크 시 "동의하고 시작하기" 활성화
 * - 제출: POST /api/v1/auth/consent → 성공 시 redirectTo 로 이동
 * - 취소: POST /api/v1/auth/consent/cancel → 로그인 화면으로
 *
 * 인증은 가입 동의 대기(SIGNUP) 토큰 쿠키(HttpOnly)로 자동 전송된다.
 * SIGNUP 토큰은 Refresh 가 없으므로 만료 시 재로그인을 안내한다.
 *
 * 약관 "보기"는 새 탭(navigation) 대신 인페이지 모달로 표시한다.
 * → 동의 체크 상태가 보존되고, SIGNUP 사용자가 다른 경로로 이탈해 ConsentGateFilter 403을 만나는 일도 없다.
 */

import {setupDialogScrollLock} from "/js/common-util.js?v=2.4";

const errorBox = document.getElementById("consentError");
const submitBtn = document.getElementById("consentSubmit");
const cancelBtn = document.getElementById("consentCancel");
const agreeAll = document.getElementById("agreeAll");
const required = Array.from(document.querySelectorAll(".consent-required"));

function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.remove("d-none");
}

function clearError() {
    errorBox.classList.add("d-none");
}

function syncState() {
    const allChecked = required.every((c) => c.checked);
    agreeAll.checked = allChecked;
    submitBtn.disabled = !allChecked;
}

agreeAll.addEventListener("change", () => {
    required.forEach((c) => {
        c.checked = agreeAll.checked;
    });
    submitBtn.disabled = !agreeAll.checked;
});

required.forEach((c) => c.addEventListener("change", syncState));

submitBtn.addEventListener("click", async () => {
    if (submitBtn.disabled) return;
    clearError();
    submitBtn.disabled = true;
    try {
        const res = await fetch("/api/v1/auth/consent", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            credentials: "include",
            body: JSON.stringify({
                agreeTerms: document.getElementById("agreeTerms").checked,
                agreePrivacy: document.getElementById("agreePrivacy").checked,
                ageOver14: document.getElementById("ageOver14").checked,
            }),
        });

        if (res.ok) {
            const data = await res.json().catch(() => ({}));
            window.location.replace(data.redirectTo || "/");
            return;
        }

        if (res.status === 401) {
            showError("세션이 만료되었어요. 다시 로그인해 주세요.");
            setTimeout(() => window.location.replace("/web/auth/login"), 1500);
            return;
        }

        showError("동의 처리 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.");
        submitBtn.disabled = false;
    } catch (e) {
        showError("네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요.");
        submitBtn.disabled = false;
    }
});

cancelBtn.addEventListener("click", async () => {
    clearError();
    cancelBtn.disabled = true;
    try {
        await fetch("/api/v1/auth/consent/cancel", {
            method: "POST",
            credentials: "include",
        });
    } catch (e) {
        /* 취소는 실패해도 로그인으로 이동 */
    }
    window.location.replace("/web/auth/login");
});

/* ── 약관 본문 모달 ───────────────────────────────────────────── */
const legalDialog = document.getElementById("legalDialog");
const legalTitle = document.getElementById("legalDialogTitle");
const legalBody = document.getElementById("legalDialogBody");

const LEGAL_DOCS = {
    terms: {url: "/web/legal/terms", title: "서비스 이용약관"},
    privacy: {url: "/web/legal/privacy", title: "개인정보 수집 및 이용"},
};
const legalCache = {};

if (legalDialog) {
    setupDialogScrollLock(legalDialog);

    const openLegal = async (doc) => {
        const meta = LEGAL_DOCS[doc];
        if (!meta) return;
        legalTitle.textContent = meta.title;
        if (!legalDialog.open) legalDialog.showModal();
        legalBody.scrollTop = 0;

        if (legalCache[doc]) {
            legalBody.innerHTML = legalCache[doc];
            legalBody.scrollTop = 0;
            return;
        }

        legalBody.innerHTML = '<p class="legal-dialog-status">불러오는 중…</p>';
        try {
            const res = await fetch(meta.url, {credentials: "include", headers: {Accept: "text/html"}});
            if (!res.ok) throw new Error(String(res.status));
            const html = await res.text();
            // 같은 출처의 약관 페이지에서 <main> 본문만 추출(헤더/푸터/스크립트 제외). DOMParser는 스크립트를 실행하지 않는다.
            const main = new DOMParser().parseFromString(html, "text/html").querySelector("main");
            const content = main ? main.innerHTML : "";
            if (!content) throw new Error("empty");
            legalCache[doc] = content;
            legalBody.innerHTML = content;
            legalBody.scrollTop = 0;
        } catch (e) {
            legalBody.innerHTML =
                `<p class="legal-dialog-status legal-dialog-error">약관을 불러오지 못했어요. ` +
                `<a href="${meta.url}" target="_blank" rel="noopener noreferrer">새 탭에서 보기</a></p>`;
        }
    };

    document.querySelectorAll(".consent-view").forEach((btn) => {
        btn.addEventListener("click", () => openLegal(btn.dataset.doc));
    });

    legalDialog.querySelector("[data-legal-close]")?.addEventListener("click", () => legalDialog.close());
    // 백드롭(다이얼로그 바깥) 클릭 시 닫기 (ESC는 <dialog> 기본 동작)
    legalDialog.addEventListener("click", (e) => {
        if (e.target === legalDialog) legalDialog.close();
    });
    // 약관 본문 내부의 다른 약관 링크(/web/legal/*)는 이탈 대신 모달 내에서 전환
    legalBody.addEventListener("click", (e) => {
        const link = e.target.closest('a[href^="/web/legal/"]');
        if (!link) return;
        e.preventDefault();
        openLegal(link.getAttribute("href").includes("privacy") ? "privacy" : "terms");
    });
}
