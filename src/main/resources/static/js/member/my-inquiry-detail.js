import {buildLoginRedirectUrl, checkAuthStatus} from "/js/auth/auth-check.js";
import {fetchWithAuthRetry} from "/js/common-util.js?v=2.3";

const CATEGORY_LABELS = {
    ACCOUNT: "계정/로그인",
    CONTENT: "성경/콘텐츠",
    GAME: "게임",
    BUG: "오류/버그",
    SUGGESTION: "제안/건의",
    ETC: "기타",
};

const STATUS_LABELS = {
    RECEIVED: "접수",
    ANSWERED: "답변완료",
    CLOSED: "종료",
};

const STATUS_BADGE_CLASS = {
    RECEIVED: "badge-received",
    ANSWERED: "badge-answered",
    CLOSED: "badge-closed",
};

const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("ko-KR", {year: "numeric", month: "2-digit", day: "2-digit"});
};

const getInquiryIdFromPath = () => {
    const parts = window.location.pathname.split("/");
    const id = parts[parts.length - 1];
    return id && /^\d+$/.test(id) ? id : null;
};

document.addEventListener("DOMContentLoaded", () => {
    const pageTitleLabel = document.getElementById("pageTitleLabel");
    if (pageTitleLabel) {
        pageTitleLabel.textContent = "문의 상세";
        pageTitleLabel.classList.remove("d-none");
    }

    const backButton = document.getElementById("topNavBackButton");
    if (backButton) {
        backButton.classList.remove("d-none");
        backButton.addEventListener("click", () => {
            if (document.referrer && document.referrer.includes("/web/member/my-inquiries")) {
                history.back();
            } else {
                window.location.href = "/web/member/my-inquiries";
            }
        });
    }

    const inquiryId = getInquiryIdFromPath();

    const elements = {
        skeleton: document.getElementById("myInquiryDetailSkeleton"),
        detailCard: document.getElementById("myInquiryDetailCard"),
        errorBlock: document.getElementById("myInquiryDetailError"),
        categoryBadge: document.getElementById("myInquiryCategoryBadge"),
        statusBadge: document.getElementById("myInquiryStatusBadge"),
        title: document.getElementById("myInquiryTitle"),
        date: document.getElementById("myInquiryDate"),
        content: document.getElementById("myInquiryContent"),
        actions: document.getElementById("myInquiryActions"),
        editBtn: document.getElementById("myInquiryEditBtn"),
        deleteBtn: document.getElementById("myInquiryDeleteBtn"),
        editPanel: document.getElementById("myInquiryEditPanel"),
        editCancelBtn: document.getElementById("myInquiryEditCancelBtn"),
        editCancelBtn2: document.getElementById("myInquiryEditCancelBtn2"),
        editForm: document.getElementById("myInquiryEditForm"),
        editCategory: document.getElementById("myInquiryEditCategory"),
        editTitle: document.getElementById("myInquiryEditTitle"),
        editContent: document.getElementById("myInquiryEditContent"),
        editError: document.getElementById("myInquiryEditError"),
        answerContent: document.getElementById("myInquiryAnswerContent"),
        answeredAt: document.getElementById("myInquiryAnsweredAt"),
    };

    let currentInquiry = null;

    const redirectToLogin = () => {
        window.location.replace(buildLoginRedirectUrl(`/web/member/my-inquiries/${inquiryId ?? ""}`));
    };

    const showError = () => {
        elements.skeleton?.classList.add("d-none");
        elements.detailCard?.classList.add("d-none");
        elements.errorBlock?.classList.remove("d-none");
    };

    // ── Edit form ────────────────────────────────────────────────────────

    const showEditForm = () => {
        if (!currentInquiry) return;
        if (elements.editCategory) elements.editCategory.value = currentInquiry.category ?? "";
        if (elements.editTitle) elements.editTitle.value = currentInquiry.title ?? "";
        if (elements.editContent) elements.editContent.value = currentInquiry.content ?? "";
        elements.editError?.classList.add("d-none");
        elements.editPanel?.classList.remove("d-none");
        elements.editTitle?.focus();
    };

    const hideEditForm = () => {
        elements.editPanel?.classList.add("d-none");
        elements.editForm?.reset();
        elements.editError?.classList.add("d-none");
    };

    const showEditError = (msg) => {
        if (!elements.editError) return;
        elements.editError.textContent = msg;
        elements.editError.classList.remove("d-none");
    };

    // ── Render ───────────────────────────────────────────────────────────

    const render = (inquiry) => {
        currentInquiry = inquiry;

        if (elements.categoryBadge) {
            elements.categoryBadge.textContent = CATEGORY_LABELS[inquiry.category] ?? inquiry.category;
        }
        if (elements.statusBadge) {
            elements.statusBadge.className = `my-inquiry-status-badge ${STATUS_BADGE_CLASS[inquiry.status] ?? ""}`;
            elements.statusBadge.textContent = STATUS_LABELS[inquiry.status] ?? inquiry.status;
        }
        if (elements.title) elements.title.textContent = inquiry.title ?? "";
        if (elements.date) elements.date.textContent = `작성일: ${formatDate(inquiry.createdAt)}`;

        if (elements.content) {
            elements.content.textContent = inquiry.content ?? "";
        }

        // 수정/삭제 버튼: 작성자 본인이고 RECEIVED 상태일 때만
        const canModify = inquiry.isAuthor && inquiry.status === "RECEIVED";
        if (canModify) {
            elements.actions?.classList.remove("d-none");
        } else {
            elements.actions?.classList.add("d-none");
        }

        // 답변 영역
        if (inquiry.answerContent) {
            if (elements.answerContent) {
                elements.answerContent.textContent = inquiry.answerContent;
            }
            if (elements.answeredAt && inquiry.answeredAt) {
                elements.answeredAt.textContent = `답변일: ${formatDate(inquiry.answeredAt)}`;
                elements.answeredAt.classList.remove("d-none");
            }
        } else {
            if (elements.answerContent) {
                elements.answerContent.innerHTML = '<p class="my-inquiry-answer-pending">답변 대기 중입니다.</p>';
            }
        }

        elements.skeleton?.classList.add("d-none");
        elements.detailCard?.classList.remove("d-none");
    };

    // ── API calls ────────────────────────────────────────────────────────

    const loadDetail = async () => {
        if (!inquiryId) { showError(); return; }

        try {
            const response = await fetchWithAuthRetry(`/api/v1/qna/inquiries/${inquiryId}`, {
                credentials: "include",
                headers: {Accept: "application/json"},
            });

            if (response.status === 401) { redirectToLogin(); return; }
            if (!response.ok) { showError(); return; }

            const data = await response.json().catch(() => null);
            if (!data) { showError(); return; }

            render(data);
        } catch {
            showError();
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();

        const category = elements.editCategory?.value ?? "";
        const title = (elements.editTitle?.value ?? "").trim();
        const content = (elements.editContent?.value ?? "").trim();

        if (!category) { showEditError("카테고리를 선택해 주세요."); return; }
        if (!title) { showEditError("제목을 입력해 주세요."); return; }
        if (!content) { showEditError("내용을 입력해 주세요."); return; }

        const submitBtn = elements.editForm?.querySelector("[type=submit]");
        if (submitBtn) submitBtn.disabled = true;
        elements.editError?.classList.add("d-none");

        try {
            const response = await fetchWithAuthRetry(`/api/v1/qna/inquiries/${inquiryId}`, {
                method: "PUT",
                credentials: "include",
                headers: {"Content-Type": "application/json", Accept: "application/json"},
                body: JSON.stringify({category, title, content}),
            });

            if (response.status === 401) { redirectToLogin(); return; }
            if (!response.ok) {
                const err = await response.json().catch(() => null);
                showEditError(err?.message ?? "수정에 실패했습니다. 다시 시도해 주세요.");
                return;
            }

            const data = await response.json().catch(() => null);
            if (data) {
                hideEditForm();
                render(data);
            }
        } catch {
            showEditError("요청 중 오류가 발생했습니다. 다시 시도해 주세요.");
        } finally {
            const submitBtn = elements.editForm?.querySelector("[type=submit]");
            if (submitBtn) submitBtn.disabled = false;
        }
    };

    const handleDelete = async () => {
        if (!confirm("문의를 삭제하시겠습니까? 삭제된 문의는 복구할 수 없습니다.")) return;

        try {
            const response = await fetchWithAuthRetry(`/api/v1/qna/inquiries/${inquiryId}`, {
                method: "DELETE",
                credentials: "include",
                headers: {Accept: "application/json"},
            });

            if (response.status === 401) { redirectToLogin(); return; }
            if (response.status === 204 || response.ok) {
                window.location.href = "/web/member/my-inquiries";
                return;
            }

            const err = await response.json().catch(() => null);
            alert(err?.message ?? "삭제에 실패했습니다. 다시 시도해 주세요.");
        } catch {
            alert("요청 중 오류가 발생했습니다. 다시 시도해 주세요.");
        }
    };

    // ── Scroll-to-top ────────────────────────────────────────────────────

    const scrollTopBtn = document.getElementById("scrollToTopBtn");
    if (scrollTopBtn) {
        window.addEventListener("scroll", () => {
            scrollTopBtn.classList.toggle("is-visible", window.scrollY > 300);
        });
        scrollTopBtn.addEventListener("click", () => {
            window.scrollTo({top: 0, behavior: "smooth"});
        });
    }

    // ── Event wiring ─────────────────────────────────────────────────────

    elements.editBtn?.addEventListener("click", showEditForm);
    elements.editCancelBtn?.addEventListener("click", hideEditForm);
    elements.editCancelBtn2?.addEventListener("click", hideEditForm);
    elements.editForm?.addEventListener("submit", handleEdit);
    elements.deleteBtn?.addEventListener("click", handleDelete);

    // ── Boot ─────────────────────────────────────────────────────────────

    checkAuthStatus({
        onAuthenticated: loadDetail,
        onUnauthenticated: redirectToLogin,
        onError: showError,
    });
});
