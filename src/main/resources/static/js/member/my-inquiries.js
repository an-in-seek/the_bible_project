import {buildLoginRedirectUrl, checkAuthStatus} from "/js/auth/auth-check.js";
import {fetchWithAuthRetry} from "/js/common-util.js?v=2.4";

const PAGE_SIZE = 20;
const VALID_STATUSES = ["", "RECEIVED", "ANSWERED", "CLOSED"];
const DEFAULT_STATUS = "";
const SCROLL_ROOT_MARGIN = "200px";

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

const state = {
    activeStatus: DEFAULT_STATUS,
    page: 0,
    hasNext: false,
    loading: false,
};

document.addEventListener("DOMContentLoaded", () => {
    const pageTitleLabel = document.getElementById("pageTitleLabel");
    if (pageTitleLabel) {
        pageTitleLabel.textContent = "나의 문의";
        pageTitleLabel.classList.remove("d-none");
    }

    const backButton = document.getElementById("topNavBackButton");
    if (backButton) {
        backButton.classList.remove("d-none");
        backButton.addEventListener("click", () => history.back());
    }

    const elements = {
        skeleton: document.getElementById("myInquiriesSkeleton"),
        list: document.getElementById("myInquiriesList"),
        empty: document.getElementById("myInquiriesEmpty"),
        loader: document.getElementById("myInquiriesLoader"),
        sentinel: document.getElementById("myInquiriesSentinel"),
        tabButtons: {
            "": document.getElementById("myInquiriesTabAll"),
            RECEIVED: document.getElementById("myInquiriesTabReceived"),
            ANSWERED: document.getElementById("myInquiriesTabAnswered"),
            CLOSED: document.getElementById("myInquiriesTabClosed"),
        },
    };

    const redirectToLogin = () => {
        window.location.replace(buildLoginRedirectUrl("/web/member/my-inquiries"));
    };

    const setLoaderVisible = (visible) => {
        if (!elements.loader) return;
        if (visible) elements.loader.removeAttribute("hidden");
        else elements.loader.setAttribute("hidden", "");
    };

    // ── Tab ──────────────────────────────────────────────────────────────

    const applyTabActive = (status) => {
        for (const key of VALID_STATUSES) {
            const btn = elements.tabButtons[key];
            if (!btn) continue;
            const on = key === status;
            btn.classList.toggle("active", on);
            btn.setAttribute("aria-selected", on ? "true" : "false");
        }
    };

    // ── List rendering ───────────────────────────────────────────────────

    const createInquiryCard = (inquiry) => {
        const card = document.createElement("a");
        card.className = "my-inquiry-card";
        card.href = `/web/member/my-inquiries/${inquiry.id}`;

        const header = document.createElement("div");
        header.className = "my-inquiry-card-header";

        const badges = document.createElement("div");
        badges.className = "my-inquiry-card-badges";

        const catBadge = document.createElement("span");
        catBadge.className = "my-inquiry-category-badge";
        catBadge.textContent = CATEGORY_LABELS[inquiry.category] ?? inquiry.category;

        const statusBadge = document.createElement("span");
        statusBadge.className = `my-inquiry-status-badge ${STATUS_BADGE_CLASS[inquiry.status] ?? ""}`;
        statusBadge.textContent = STATUS_LABELS[inquiry.status] ?? inquiry.status;

        badges.append(catBadge, statusBadge);

        const dateSpan = document.createElement("span");
        dateSpan.className = "my-inquiry-card-date";
        dateSpan.textContent = formatDate(inquiry.createdAt);

        header.append(badges, dateSpan);

        const title = document.createElement("div");
        title.className = "my-inquiry-card-title";
        title.textContent = inquiry.title || "";

        card.append(header, title);
        return card;
    };

    const renderErrorState = () => {
        if (!elements.list) return;
        elements.list.innerHTML = "";
        elements.empty?.classList.add("d-none");

        const errorBlock = document.createElement("div");
        errorBlock.className = "my-inquiries-empty";

        const message = document.createElement("p");
        message.className = "mb-2";
        message.textContent = "문의 목록을 불러오지 못했습니다.";

        const retryButton = document.createElement("button");
        retryButton.type = "button";
        retryButton.className = "btn btn-outline-primary btn-sm";
        retryButton.textContent = "다시 시도";
        retryButton.addEventListener("click", async () => {
            state.page = 0;
            await loadList(false);
        });

        errorBlock.append(message, retryButton);
        elements.list.appendChild(errorBlock);
    };

    // ── API calls ────────────────────────────────────────────────────────

    const loadList = async (append = false) => {
        if (state.loading) return;

        state.loading = true;
        if (append) setLoaderVisible(true);
        if (!append) elements.skeleton?.classList.remove("d-none");

        try {
            let url = `/api/v1/qna/inquiries?page=${state.page}&size=${PAGE_SIZE}`;
            if (state.activeStatus) url += `&status=${state.activeStatus}`;

            const response = await fetchWithAuthRetry(url, {
                credentials: "include",
                headers: {Accept: "application/json"},
            });

            if (response.status === 401) return redirectToLogin();
            if (!response.ok) throw new Error("Failed to load inquiries");

            const data = await response.json().catch(() => null);
            if (!data) throw new Error("Invalid response");

            if (!append && elements.list) elements.list.innerHTML = "";

            const content = Array.isArray(data.content) ? data.content : [];
            if (content.length > 0) {
                if (elements.list) {
                    const fragment = document.createDocumentFragment();
                    content.forEach((item) => fragment.appendChild(createInquiryCard(item)));
                    elements.list.appendChild(fragment);
                }
                elements.empty?.classList.add("d-none");
            } else if (!append) {
                elements.list?.replaceChildren();
                elements.empty?.classList.remove("d-none");
            }

            state.hasNext = data.hasNext === true;
        } catch {
            if (append && state.page > 0) state.page -= 1;
            state.hasNext = false;
            renderErrorState();
        } finally {
            elements.skeleton?.classList.add("d-none");
            setLoaderVisible(false);
            state.loading = false;
        }
    };

    // ── Infinite scroll ──────────────────────────────────────────────────

    let scrollObserver = null;
    const initInfiniteScroll = () => {
        if (!elements.sentinel || scrollObserver) return;
        scrollObserver = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    if (!state.loading && state.hasNext) {
                        state.page += 1;
                        loadList(true);
                    }
                }
            },
            {root: null, rootMargin: SCROLL_ROOT_MARGIN, threshold: 0}
        );
        scrollObserver.observe(elements.sentinel);
    };

    // ── Tab sticky sentinel ──────────────────────────────────────────────

    const tabSentinel = document.getElementById("myInquiriesTabsSentinel");
    const tabsEl = document.getElementById("myInquiriesTabs");
    if (tabSentinel && tabsEl && "IntersectionObserver" in window) {
        const rootStyles = getComputedStyle(document.documentElement);
        const navHeight = parseInt(rootStyles.getPropertyValue("--top-nav-height"), 10) || 52;
        const stickyObserver = new IntersectionObserver(
            ([entry]) => tabsEl.classList.toggle("is-stuck", !entry.isIntersecting),
            {threshold: 0, rootMargin: `-${navHeight + 1}px 0px 0px 0px`}
        );
        stickyObserver.observe(tabSentinel);
    }

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

    for (const status of VALID_STATUSES) {
        const btn = elements.tabButtons[status];
        btn?.addEventListener("click", async () => {
            if (state.activeStatus === status) return;
            state.activeStatus = status;
            applyTabActive(status);
            state.page = 0;
            await loadList(false);
        });
    }

    // ── Boot ─────────────────────────────────────────────────────────────

    checkAuthStatus({
        onAuthenticated: async () => {
            applyTabActive(state.activeStatus);
            await loadList(false);
            initInfiniteScroll();
        },
        onUnauthenticated: redirectToLogin,
        onError: renderErrorState,
    });
});
