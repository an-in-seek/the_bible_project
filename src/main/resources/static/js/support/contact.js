// 공개(비로그인) 문의하기 폼. 인증이 필요 없으므로 일반 fetch 를 사용한다.

document.addEventListener("DOMContentLoaded", () => {
    const elements = {
        form: document.getElementById("contactForm"),
        category: document.getElementById("contactCategory"),
        email: document.getElementById("contactEmail"),
        name: document.getElementById("contactName"),
        title: document.getElementById("contactTitle"),
        titleCount: document.getElementById("contactTitleCount"),
        content: document.getElementById("contactContent"),
        contentCount: document.getElementById("contactContentCount"),
        website: document.getElementById("contactWebsite"), // 허니팟
        formError: document.getElementById("contactFormError"),
        submitBtn: document.getElementById("contactSubmitBtn"),
    };

    // 제출 소요시간 트랩용 — 폼 렌더 시각 기록
    const formRenderedAt = Date.now();

    const showFormError = (msg) => {
        if (!elements.formError) return;
        elements.formError.textContent = msg;
        elements.formError.classList.remove("d-none");
    };

    const hideFormError = () => {
        elements.formError?.classList.add("d-none");
    };

    // ── Live char counters ────────────────────────────────────────────────

    elements.title?.addEventListener("input", () => {
        if (elements.titleCount) elements.titleCount.textContent = elements.title.value.length;
    });

    elements.content?.addEventListener("input", () => {
        if (elements.contentCount) elements.contentCount.textContent = elements.content.value.length;
    });

    // ── 간단한 이메일 형식 검증 ────────────────────────────────────────────

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // ── Submit ────────────────────────────────────────────────────────────

    const handleSubmit = async (e) => {
        e.preventDefault();
        hideFormError();

        const category = elements.category?.value ?? "";
        const email = (elements.email?.value ?? "").trim();
        const name = (elements.name?.value ?? "").trim();
        const title = (elements.title?.value ?? "").trim();
        const content = (elements.content?.value ?? "").trim();
        const website = elements.website?.value ?? ""; // 허니팟

        if (!category) { showFormError("카테고리를 선택해 주세요."); return; }
        if (!email) { showFormError("회신받을 이메일을 입력해 주세요."); return; }
        if (!isValidEmail(email)) { showFormError("이메일 형식이 올바르지 않습니다."); return; }
        if (!title) { showFormError("제목을 입력해 주세요."); return; }
        if (!content) { showFormError("내용을 입력해 주세요."); return; }

        if (elements.submitBtn) elements.submitBtn.disabled = true;

        try {
            const response = await fetch("/api/v1/qna/contacts", {
                method: "POST",
                headers: {"Content-Type": "application/json", Accept: "application/json"},
                body: JSON.stringify({
                    category,
                    title,
                    content,
                    guestEmail: email,
                    guestName: name || null,
                    website,
                    formRenderedAt,
                }),
            });

            if (response.status === 429) {
                showFormError("문의 요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.");
                return;
            }
            if (!response.ok) {
                const err = await response.json().catch(() => null);
                showFormError(err?.message ?? "전송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
                return;
            }

            window.location.replace("/web/support/contact/complete");
        } catch {
            showFormError("요청 중 오류가 발생했습니다. 다시 시도해 주세요.");
        } finally {
            if (elements.submitBtn) elements.submitBtn.disabled = false;
        }
    };

    elements.form?.addEventListener("submit", handleSubmit);
});
