import {buildLoginRedirectUrl, checkAuthStatus} from "/js/auth/auth-check.js";
import {fetchWithAuthRetry} from "/js/common-util.js?v=2.3";
import {showConfirm} from "/js/confirm-dialog.js?v=1.0";

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
            const ref = document.referrer || "";
            // 작성/수정 폼(/new, /{id}/edit)에서 진입한 경우 폼으로 되돌아가지 않고 목록으로 이동
            const fromForm = /\/web\/member\/my-inquiries\/(new|\d+\/edit)(\?.*)?$/.test(ref);
            if (!fromForm && ref.includes("/web/member/my-inquiries")) {
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
        editLink: document.getElementById("myInquiryEditLink"),
        deleteBtn: document.getElementById("myInquiryDeleteBtn"),
        answerContent: document.getElementById("myInquiryAnswerContent"),
        answeredAt: document.getElementById("myInquiryAnsweredAt"),
    };

    const redirectToLogin = () => {
        window.location.replace(buildLoginRedirectUrl(`/web/member/my-inquiries/${inquiryId ?? ""}`));
    };

    const showError = () => {
        elements.skeleton?.classList.add("d-none");
        elements.detailCard?.classList.add("d-none");
        elements.errorBlock?.classList.remove("d-none");
    };

    // ── Render ───────────────────────────────────────────────────────────

    const render = (inquiry) => {
        if (elements.categoryBadge) {
            elements.categoryBadge.textContent = CATEGORY_LABELS[inquiry.category] ?? inquiry.category;
        }
        if (elements.statusBadge) {
            elements.statusBadge.className = `my-inquiry-status-badge ${STATUS_BADGE_CLASS[inquiry.status] ?? ""}`;
            elements.statusBadge.textContent = STATUS_LABELS[inquiry.status] ?? inquiry.status;
        }
        if (elements.title) elements.title.textContent = inquiry.title ?? "";
        if (elements.date) elements.date.textContent = `작성일: ${formatDate(inquiry.createdAt)}`;
        if (elements.content) elements.content.textContent = inquiry.content ?? "";

        // 수정/삭제 버튼: 작성자 본인이고 RECEIVED 상태일 때만
        const canModify = inquiry.isAuthor && inquiry.status === "RECEIVED";
        if (canModify) {
            if (elements.editLink) {
                elements.editLink.href = `/web/member/my-inquiries/${inquiry.id}/edit`;
            }
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

    const handleDelete = async () => {
        if (!await showConfirm("문의를 삭제하시겠습니까? 삭제된 문의는 복구할 수 없습니다.", {title:"문의 삭제", confirmText:"삭제", danger:true})) return;

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

    // ── Event wiring ─────────────────────────────────────────────────────

    elements.deleteBtn?.addEventListener("click", handleDelete);

    // ── Boot ─────────────────────────────────────────────────────────────

    checkAuthStatus({
        onAuthenticated: loadDetail,
        onUnauthenticated: redirectToLogin,
        onError: showError,
    });
});
