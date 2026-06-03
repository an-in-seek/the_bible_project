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
 */

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
