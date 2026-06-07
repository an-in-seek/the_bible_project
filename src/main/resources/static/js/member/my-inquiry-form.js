import {buildLoginRedirectUrl, checkAuthStatus} from "/js/auth/auth-check.js";
import {fetchWithAuthRetry} from "/js/common-util.js?v=2.3";

const getInquiryIdFromPath = () => {
    // Matches /web/member/my-inquiries/{id}/edit
    const match = window.location.pathname.match(/\/my-inquiries\/(\d+)\/edit$/);
    return match ? match[1] : null;
};

const isEditMode = () => window.location.pathname.endsWith("/edit");

document.addEventListener("DOMContentLoaded", () => {
    const editMode = isEditMode();
    const inquiryId = editMode ? getInquiryIdFromPath() : null;

    // ── Top-nav title & back button ───────────────────────────────────────

    const pageTitleLabel = document.getElementById("pageTitleLabel");
    if (pageTitleLabel) {
        pageTitleLabel.textContent = editMode ? "문의 수정" : "문의 작성";
        pageTitleLabel.classList.remove("d-none");
    }

    const backButton = document.getElementById("topNavBackButton");
    if (backButton) {
        backButton.classList.remove("d-none");
        backButton.addEventListener("click", () => history.back());
    }

    // ── Submit button label ───────────────────────────────────────────────

    const submitBtn = document.getElementById("myInquirySubmitBtn");
    if (submitBtn) {
        submitBtn.textContent = editMode ? "저장" : "등록";
    }

    const elements = {
        skeleton: document.getElementById("myInquiryFormSkeleton"),
        formCard: document.getElementById("myInquiryFormCard"),
        loadError: document.getElementById("myInquiryFormError2"),
        form: document.getElementById("myInquiryForm"),
        category: document.getElementById("myInquiryCategory"),
        title: document.getElementById("myInquiryTitle"),
        titleCount: document.getElementById("myInquiryTitleCount"),
        content: document.getElementById("myInquiryContent"),
        contentCount: document.getElementById("myInquiryContentCount"),
        formError: document.getElementById("myInquiryFormError"),
        submitBtn,
        cancelBtn: document.getElementById("myInquiryCancelBtn"),
    };

    const redirectToLogin = () => {
        const returnUrl = editMode
            ? `/web/member/my-inquiries/${inquiryId}/edit`
            : "/web/member/my-inquiries/new";
        window.location.replace(buildLoginRedirectUrl(returnUrl));
    };

    const showLoadError = () => {
        elements.skeleton?.classList.add("d-none");
        elements.formCard?.classList.add("d-none");
        elements.loadError?.classList.remove("d-none");
    };

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
        if (elements.titleCount) {
            elements.titleCount.textContent = elements.title.value.length;
        }
    });

    elements.content?.addEventListener("input", () => {
        if (elements.contentCount) {
            elements.contentCount.textContent = elements.content.value.length;
        }
    });

    // ── Cancel button ─────────────────────────────────────────────────────

    elements.cancelBtn?.addEventListener("click", () => {
        if (editMode && inquiryId) {
            window.location.href = `/web/member/my-inquiries/${inquiryId}`;
        } else {
            window.location.href = "/web/member/my-inquiries";
        }
    });

    // ── Prefill for edit mode ─────────────────────────────────────────────

    const prefill = (inquiry) => {
        if (elements.category) elements.category.value = inquiry.category ?? "";
        if (elements.title) {
            elements.title.value = inquiry.title ?? "";
            if (elements.titleCount) elements.titleCount.textContent = elements.title.value.length;
        }
        if (elements.content) {
            elements.content.value = inquiry.content ?? "";
            if (elements.contentCount) elements.contentCount.textContent = elements.content.value.length;
        }
    };

    const loadForEdit = async () => {
        if (!inquiryId) { showLoadError(); return; }

        elements.skeleton?.classList.remove("d-none");
        elements.formCard?.classList.add("d-none");

        try {
            const response = await fetchWithAuthRetry(`/api/v1/qna/inquiries/${inquiryId}`, {
                credentials: "include",
                headers: {Accept: "application/json"},
            });

            if (response.status === 401) { redirectToLogin(); return; }
            if (!response.ok) { showLoadError(); return; }

            const data = await response.json().catch(() => null);
            if (!data) { showLoadError(); return; }

            // Cannot edit if not RECEIVED
            if (data.status !== "RECEIVED") {
                window.location.replace(`/web/member/my-inquiries/${inquiryId}`);
                return;
            }

            prefill(data);
            elements.skeleton?.classList.add("d-none");
            elements.formCard?.classList.remove("d-none");
        } catch {
            showLoadError();
        }
    };

    // ── Submit ────────────────────────────────────────────────────────────

    const handleSubmit = async (e) => {
        e.preventDefault();
        hideFormError();

        const category = elements.category?.value ?? "";
        const title = (elements.title?.value ?? "").trim();
        const content = (elements.content?.value ?? "").trim();

        if (!category) { showFormError("카테고리를 선택해 주세요."); return; }
        if (!title) { showFormError("제목을 입력해 주세요."); return; }
        if (!content) { showFormError("내용을 입력해 주세요."); return; }

        if (elements.submitBtn) elements.submitBtn.disabled = true;

        try {
            const url = editMode
                ? `/api/v1/qna/inquiries/${inquiryId}`
                : "/api/v1/qna/inquiries";
            const method = editMode ? "PUT" : "POST";

            const response = await fetchWithAuthRetry(url, {
                method,
                credentials: "include",
                headers: {"Content-Type": "application/json", Accept: "application/json"},
                body: JSON.stringify({category, title, content}),
            });

            if (response.status === 401) { redirectToLogin(); return; }
            if (!response.ok) {
                const err = await response.json().catch(() => null);
                showFormError(err?.message ?? (editMode ? "수정에 실패했습니다. 다시 시도해 주세요." : "등록에 실패했습니다. 다시 시도해 주세요."));
                return;
            }

            const data = await response.json().catch(() => null);
            const returnedId = data?.id ?? inquiryId;
            window.location.href = `/web/member/my-inquiries/${returnedId}`;
        } catch {
            showFormError("요청 중 오류가 발생했습니다. 다시 시도해 주세요.");
        } finally {
            if (elements.submitBtn) elements.submitBtn.disabled = false;
        }
    };

    elements.form?.addEventListener("submit", handleSubmit);

    // ── Boot ─────────────────────────────────────────────────────────────

    checkAuthStatus({
        onAuthenticated: async () => {
            if (editMode) {
                await loadForEdit();
            }
            // create mode: form is already visible, nothing to load
        },
        onUnauthenticated: redirectToLogin,
        onError: showLoadError,
    });
});
