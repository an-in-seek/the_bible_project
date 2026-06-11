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

    // 필드별 인라인 에러 엘리먼트 매핑
    const fieldErrors = {
        email: document.getElementById("contactEmailError"),
        category: document.getElementById("contactCategoryError"),
        title: document.getElementById("contactTitleError"),
        content: document.getElementById("contactContentError"),
    };

    // 제출 소요시간 트랩용 — 폼 렌더 시각 기록
    const formRenderedAt = Date.now();

    // ── 폼 전역 에러 (네트워크/429 등) ─────────────────────────────────────

    const showFormError = (msg) => {
        if (!elements.formError) return;
        elements.formError.textContent = msg;
        elements.formError.classList.remove("d-none");
    };

    const hideFormError = () => {
        elements.formError?.classList.add("d-none");
    };

    // ── 필드 인라인 에러 ───────────────────────────────────────────────────

    const setFieldError = (key, msg) => {
        const input = elements[key];
        const errEl = fieldErrors[key];
        if (errEl) {
            errEl.textContent = msg;
            errEl.classList.remove("d-none");
        }
        if (input) input.setAttribute("aria-invalid", "true");
    };

    const clearFieldError = (key) => {
        const input = elements[key];
        const errEl = fieldErrors[key];
        errEl?.classList.add("d-none");
        input?.removeAttribute("aria-invalid");
    };

    const clearAllErrors = () => {
        hideFormError();
        Object.keys(fieldErrors).forEach(clearFieldError);
    };

    // 입력 시 해당 필드 에러 해제
    Object.keys(fieldErrors).forEach((key) => {
        elements[key]?.addEventListener("input", () => clearFieldError(key));
        elements[key]?.addEventListener("change", () => clearFieldError(key));
    });

    // ── Live char counters (90% 초과 시 경고색) ────────────────────────────

    const bindCounter = (input, counter, max) => {
        input?.addEventListener("input", () => {
            if (!counter) return;
            const len = input.value.length;
            counter.textContent = len;
            counter.parentElement?.classList.toggle("is-warning", len >= max * 0.9);
        });
    };
    bindCounter(elements.title, elements.titleCount, 200);
    bindCounter(elements.content, elements.contentCount, 4000);

    // ── 검증 ───────────────────────────────────────────────────────────────

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // 첫 오류 필드로 포커스 이동하며 인라인 에러를 모두 표시. 유효하면 값 객체 반환.
    const validate = () => {
        const values = {
            name: (elements.name?.value ?? "").trim(),
            email: (elements.email?.value ?? "").trim(),
            category: elements.category?.value ?? "",
            title: (elements.title?.value ?? "").trim(),
            content: (elements.content?.value ?? "").trim(),
            website: elements.website?.value ?? "",
        };

        const errors = [];
        if (!values.email) errors.push(["email", "회신받을 이메일을 입력해 주세요."]);
        else if (!isValidEmail(values.email)) errors.push(["email", "이메일 형식이 올바르지 않습니다."]);
        if (!values.category) errors.push(["category", "카테고리를 선택해 주세요."]);
        if (!values.title) errors.push(["title", "제목을 입력해 주세요."]);
        if (!values.content) errors.push(["content", "내용을 입력해 주세요."]);

        errors.forEach(([key, msg]) => setFieldError(key, msg));

        if (errors.length > 0) {
            elements[errors[0][0]]?.focus();
            return null;
        }
        return values;
    };

    // ── Submit ────────────────────────────────────────────────────────────

    const setLoading = (loading) => {
        if (!elements.submitBtn) return;
        elements.submitBtn.disabled = loading;
        elements.submitBtn.textContent = loading ? "보내는 중…" : "문의 보내기";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearAllErrors();

        const values = validate();
        if (!values) return;

        setLoading(true);

        try {
            const response = await fetch("/api/v1/qna/contacts", {
                method: "POST",
                headers: {"Content-Type": "application/json", Accept: "application/json"},
                body: JSON.stringify({
                    category: values.category,
                    title: values.title,
                    content: values.content,
                    guestEmail: values.email,
                    guestName: values.name || null,
                    website: values.website,
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
            // 성공 시에는 페이지가 전환되므로 사실상 실패 경로에서만 복원된다.
            setLoading(false);
        }
    };

    elements.form?.addEventListener("submit", handleSubmit);
});
