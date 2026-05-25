import {buildLoginRedirectUrl, checkAuthStatus} from "/js/auth/auth-check.js";
import {fetchWithAuthRetry} from "/js/common-util.js?v=2.3";

const PAGE_SIZE = 20;
const VALID_TABS = ["book", "chapter", "verse"];
const DEFAULT_TAB = "verse";
const SCROLL_ROOT_MARGIN = "200px";

const TAB_SPEC = {
    book: {
        listEndpoint: "/api/v1/bibles/my-book-memos",
        translationsEndpoint: "/api/v1/bibles/my-book-memos/translations",
        booksEndpoint: "/api/v1/bibles/my-book-memos/books",
        cardRef: (m) => m.bookName,
        cardHref: (m) =>
            `/web/bible/chapter?translationId=${encodeURIComponent(m.translationId)}` +
            `&bookOrder=${encodeURIComponent(m.bookOrder)}&from=my-memo`,
        empty: {
            title: "아직 작성한 책 메모가 없습니다",
            desc: "성경 책 페이지에서 책 전체에 대한 메모를 남겨보세요.",
            ctaText: "성경 책 목록으로 가기",
            ctaHref: "/web/bible/translation",
        },
    },
    chapter: {
        listEndpoint: "/api/v1/bibles/my-chapter-memos",
        translationsEndpoint: "/api/v1/bibles/my-chapter-memos/translations",
        booksEndpoint: "/api/v1/bibles/my-chapter-memos/books",
        cardRef: (m) => `${m.bookName} ${m.chapterNumber}장`,
        cardHref: (m) =>
            `/web/bible/verse?translationId=${encodeURIComponent(m.translationId)}` +
            `&bookOrder=${encodeURIComponent(m.bookOrder)}` +
            `&chapterNumber=${encodeURIComponent(m.chapterNumber)}&from=my-memo`,
        empty: {
            title: "아직 작성한 장 메모가 없습니다",
            desc: "성경 장 화면에서 그 장에 대한 묵상을 남겨보세요.",
            ctaText: "성경 읽으러 가기",
            ctaHref: "/web/bible/translation",
        },
    },
    verse: {
        listEndpoint: "/api/v1/bibles/my-memos",
        translationsEndpoint: "/api/v1/bibles/my-memos/translations",
        booksEndpoint: "/api/v1/bibles/my-memos/books",
        cardRef: (m) => `${m.bookName} ${m.chapterNumber}:${m.verseNumber}`,
        cardHref: (m) =>
            `/web/bible/verse?translationId=${encodeURIComponent(m.translationId)}` +
            `&bookOrder=${encodeURIComponent(m.bookOrder)}` +
            `&chapterNumber=${encodeURIComponent(m.chapterNumber)}` +
            `&verseNumber=${encodeURIComponent(m.verseNumber)}&from=my-memo`,
        empty: {
            title: "아직 작성한 메모가 없습니다",
            desc: "성경 본문에서 마음에 와닿은 구절에 메모를 남겨보세요.",
            ctaText: "성경 읽으러 가기",
            ctaHref: "/web/bible/translation",
        },
    },
};

const createTabState = () => ({
    page: 0,
    hasNext: false,
    loading: false,
    translationFilter: null,
    bookFilter: null,
});

const state = {
    activeTab: DEFAULT_TAB,
    byTab: {
        book: createTabState(),
        chapter: createTabState(),
        verse: createTabState(),
    },
    counts: {book: null, chapter: null, verse: null},
};

const cur = () => state.byTab[state.activeTab];
const spec = () => TAB_SPEC[state.activeTab];

const formatMemoDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("ko-KR", {year: "numeric", month: "2-digit", day: "2-digit"});
};

const parseTabFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    return VALID_TABS.includes(tab) ? tab : DEFAULT_TAB;
};

document.addEventListener("DOMContentLoaded", () => {
    const pageTitleLabel = document.getElementById("pageTitleLabel");
    if (pageTitleLabel) {
        pageTitleLabel.textContent = "나의 성경 메모";
        pageTitleLabel.classList.remove("d-none");
    }

    const backButton = document.getElementById("topNavBackButton");
    if (backButton) {
        backButton.classList.remove("d-none");
        backButton.addEventListener("click", () => history.back());
    }

    const elements = {
        skeleton: document.getElementById("myMemoSkeleton"),
        list: document.getElementById("myMemoList"),
        empty: document.getElementById("myMemoEmpty"),
        emptyTitle: document.getElementById("myMemoEmptyTitle"),
        emptyDesc: document.getElementById("myMemoEmptyDesc"),
        emptyCta: document.getElementById("myMemoEmptyCta"),
        loader: document.getElementById("myMemoLoader"),
        sentinel: document.getElementById("myMemoSentinel"),
        filter: document.getElementById("myMemoFilter"),
        translationSelect: document.getElementById("myMemoTranslationFilter"),
        bookSelect: document.getElementById("myMemoBookFilter"),
        tabButtons: {
            book: document.getElementById("myMemoTabBook"),
            chapter: document.getElementById("myMemoTabChapter"),
            verse: document.getElementById("myMemoTabVerse"),
        },
        tabBadges: {
            book: document.getElementById("myMemoTabBookBadge"),
            chapter: document.getElementById("myMemoTabChapterBadge"),
            verse: document.getElementById("myMemoTabVerseBadge"),
        },
    };

    const redirectToLogin = () => {
        const returnUrl = `/web/member/my-memo?tab=${state.activeTab}`;
        window.location.replace(buildLoginRedirectUrl(returnUrl));
    };

    const updateTabBadge = (tab) => {
        const badge = elements.tabBadges[tab];
        const count = state.counts[tab];
        if (!badge) return;
        if (count == null || count <= 0) {
            badge.classList.add("d-none");
            badge.textContent = "";
            return;
        }
        badge.classList.remove("d-none");
        badge.textContent = count >= 100 ? "99+" : String(count);
    };

    const setLoaderVisible = (visible) => {
        if (!elements.loader) return;
        if (visible) elements.loader.removeAttribute("hidden");
        else elements.loader.setAttribute("hidden", "");
    };

    let scrollObserver = null;
    const initInfiniteScroll = () => {
        if (!elements.sentinel || scrollObserver) return;
        scrollObserver = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) loadNextPage();
            },
            {root: null, rootMargin: SCROLL_ROOT_MARGIN, threshold: 0}
        );
        scrollObserver.observe(elements.sentinel);
    };

    const loadNextPage = () => {
        const t = cur();
        if (t.loading || !t.hasNext) return;
        t.page += 1;
        loadList(true);
    };

    const applyTabActive = (tab) => {
        for (const key of VALID_TABS) {
            const btn = elements.tabButtons[key];
            if (!btn) continue;
            const on = key === tab;
            btn.classList.toggle("active", on);
            btn.setAttribute("aria-selected", on ? "true" : "false");
        }
    };

    const applyEmptyCopy = () => {
        const s = spec();
        if (elements.emptyTitle) elements.emptyTitle.textContent = s.empty.title;
        if (elements.emptyDesc) elements.emptyDesc.textContent = s.empty.desc;
        if (elements.emptyCta) {
            elements.emptyCta.textContent = s.empty.ctaText;
            elements.emptyCta.setAttribute("href", s.empty.ctaHref);
        }
    };

    const createMemoCard = (memo) => {
        const s = spec();
        const card = document.createElement("a");
        card.className = "my-memo-card";
        card.href = s.cardHref(memo);

        const header = document.createElement("div");
        header.className = "my-memo-card-header";

        const refSpan = document.createElement("span");
        refSpan.className = "my-memo-card-ref";
        refSpan.textContent = s.cardRef(memo);

        const dateSpan = document.createElement("span");
        dateSpan.className = "my-memo-card-date";
        dateSpan.textContent = formatMemoDate(memo.updatedAt);

        const content = document.createElement("div");
        content.className = "my-memo-card-content";
        content.textContent = memo.content || "";

        header.append(refSpan, dateSpan);
        card.append(header, content);
        return card;
    };

    const renderErrorState = () => {
        if (!elements.list) return;
        elements.list.innerHTML = "";
        elements.empty?.classList.add("d-none");

        const errorBlock = document.createElement("div");
        errorBlock.className = "my-memo-empty";

        const message = document.createElement("p");
        message.className = "mb-2";
        message.textContent = "메모를 불러오지 못했습니다.";

        const retryButton = document.createElement("button");
        retryButton.type = "button";
        retryButton.className = "btn btn-outline-primary btn-sm";
        retryButton.textContent = "다시 시도";
        retryButton.addEventListener("click", async () => {
            cur().page = 0;
            await loadList(false);
        });

        errorBlock.append(message, retryButton);
        elements.list.appendChild(errorBlock);
    };

    const loadBooks = async (tab, translationId) => {
        if (!elements.bookSelect) return;

        elements.bookSelect.innerHTML = '<option value="">전체 성경</option>';
        elements.bookSelect.disabled = true;
        state.byTab[tab].bookFilter = null;

        if (!translationId) return;

        try {
            const response = await fetchWithAuthRetry(
                `${TAB_SPEC[tab].booksEndpoint}?translationId=${translationId}`,
                {credentials: "include", headers: {Accept: "application/json"}}
            );
            if (response.status === 401) return redirectToLogin();
            if (!response.ok) return;

            const books = await response.json().catch(() => []);
            if (!Array.isArray(books) || books.length === 0) return;

            if (state.activeTab !== tab) return; // race guard

            books.forEach((book) => {
                const option = document.createElement("option");
                option.value = String(book.bookOrder);
                option.textContent = book.bookName;
                elements.bookSelect.appendChild(option);
            });
            elements.bookSelect.disabled = false;
        } catch {
            elements.bookSelect.disabled = true;
        }
    };

    const loadTranslations = async (tab) => {
        if (!elements.translationSelect || !elements.filter) return;
        const t = state.byTab[tab];

        elements.translationSelect.innerHTML = '<option value="">전체 번역본</option>';
        elements.bookSelect.innerHTML = '<option value="">전체 성경</option>';
        elements.bookSelect.disabled = true;

        try {
            const response = await fetchWithAuthRetry(TAB_SPEC[tab].translationsEndpoint, {
                credentials: "include",
                headers: {Accept: "application/json"},
            });
            if (response.status === 401) return redirectToLogin();
            if (!response.ok) return;

            const translations = await response.json().catch(() => []);
            if (state.activeTab !== tab) return; // race guard

            if (!Array.isArray(translations) || translations.length === 0) {
                elements.filter.classList.add("d-none");
                return;
            }

            elements.filter.classList.remove("d-none");

            translations.forEach((translation) => {
                const option = document.createElement("option");
                option.value = String(translation.translationId);
                option.textContent = translation.translationName;
                elements.translationSelect.appendChild(option);
            });

            if (translations.length === 1) {
                const [translation] = translations;
                elements.translationSelect.value = String(translation.translationId);
                t.translationFilter = translation.translationId;
                await loadBooks(tab, t.translationFilter);
            } else if (t.translationFilter != null) {
                elements.translationSelect.value = String(t.translationFilter);
                await loadBooks(tab, t.translationFilter);
                if (elements.bookSelect && t.bookFilter != null) {
                    elements.bookSelect.value = String(t.bookFilter);
                }
            }
        } catch {
            // 필터 로드 실패 시 목록 조회는 계속 진행
        }
    };

    const loadList = async (append = false) => {
        const t = cur();
        const s = spec();
        if (t.loading) return;

        const requestedTab = state.activeTab;
        t.loading = true;
        if (append) setLoaderVisible(true);
        if (!append) elements.skeleton?.classList.remove("d-none");

        try {
            let url = `${s.listEndpoint}?page=${t.page}&size=${PAGE_SIZE}`;
            if (t.translationFilter != null) url += `&translationId=${t.translationFilter}`;
            if (t.bookFilter != null) url += `&bookOrder=${t.bookFilter}`;

            const response = await fetchWithAuthRetry(url, {
                credentials: "include",
                headers: {Accept: "application/json"},
            });
            if (state.activeTab !== requestedTab) return; // race guard
            if (response.status === 401) return redirectToLogin();
            if (!response.ok) throw new Error("Failed to load memos");

            const data = await response.json().catch(() => null);
            if (!data) throw new Error("Invalid memo response");
            if (state.activeTab !== requestedTab) return; // race guard

            if (!append && elements.list) elements.list.innerHTML = "";

            const content = Array.isArray(data.content) ? data.content : [];
            if (content.length > 0) {
                if (elements.list) {
                    const fragment = document.createDocumentFragment();
                    content.forEach((memo) => fragment.appendChild(createMemoCard(memo)));
                    elements.list.appendChild(fragment);
                }
                elements.empty?.classList.add("d-none");
            } else if (!append) {
                elements.list?.replaceChildren();
                applyEmptyCopy();
                elements.empty?.classList.remove("d-none");
            }

            // 필터가 없을 때만 배지 갱신 (배지 = 탭 전체 개수; 필터 적용 시 totalCount 는 필터된 수)
            if (!append && data.totalCount != null &&
                t.translationFilter == null && t.bookFilter == null) {
                state.counts[requestedTab] = data.totalCount;
                updateTabBadge(requestedTab);
            }

            t.hasNext = data.hasNext === true;
        } catch (error) {
            if (append && t.page > 0) t.page -= 1;
            t.hasNext = false;
            renderErrorState();
        } finally {
            elements.skeleton?.classList.add("d-none");
            setLoaderVisible(false);
            t.loading = false;
        }
    };

    const prefetchCounts = async () => {
        try {
            const response = await fetchWithAuthRetry(
                "/api/v1/bibles/my-memo-counts",
                {credentials: "include", headers: {Accept: "application/json"}}
            );
            if (!response.ok) return;
            const data = await response.json().catch(() => null);
            if (!data) return;
            for (const tab of VALID_TABS) {
                if (typeof data[tab] === "number") {
                    state.counts[tab] = data[tab];
                    updateTabBadge(tab);
                }
            }
        } catch {
            // 프리페치 실패는 무시
        }
    };

    const switchTab = async (target) => {
        if (!VALID_TABS.includes(target) || target === state.activeTab) return;
        state.activeTab = target;
        applyTabActive(target);

        const url = `${window.location.pathname}?tab=${target}`;
        history.replaceState({tab: target}, "", url);

        elements.list?.replaceChildren();
        elements.empty?.classList.add("d-none");

        await loadTranslations(target);

        const t = state.byTab[target];
        t.page = 0;
        await loadList(false);
    };

    // 필터 이벤트
    elements.translationSelect?.addEventListener("change", async () => {
        const t = cur();
        const value = elements.translationSelect.value;
        t.translationFilter = value ? parseInt(value, 10) : null;
        await loadBooks(state.activeTab, t.translationFilter);
        t.page = 0;
        await loadList(false);
    });

    elements.bookSelect?.addEventListener("change", async () => {
        const t = cur();
        const value = elements.bookSelect.value;
        t.bookFilter = value ? parseInt(value, 10) : null;
        t.page = 0;
        await loadList(false);
    });

    // 탭 클릭
    for (const tab of VALID_TABS) {
        const btn = elements.tabButtons[tab];
        btn?.addEventListener("click", () => switchTab(tab));
    }

    // Scroll-to-top 버튼
    const scrollTopBtn = document.getElementById("scrollToTopBtn");
    if (scrollTopBtn) {
        window.addEventListener("scroll", () => {
            scrollTopBtn.classList.toggle("is-visible", window.scrollY > 300);
        });
        scrollTopBtn.addEventListener("click", () => {
            window.scrollTo({top: 0, behavior: "smooth"});
        });
    }

    // Sticky 탭 감지 — sentinel 이 fixed nav 아래 관찰 영역에서 벗어나면 is-stuck 토글
    const tabSentinel = document.getElementById("myMemoTabsSentinel");
    const tabsEl = document.getElementById("myMemoTabs");
    if (tabSentinel && tabsEl && "IntersectionObserver" in window) {
        const rootStyles = getComputedStyle(document.documentElement);
        const navHeight = parseInt(rootStyles.getPropertyValue("--top-nav-height"), 10) || 52;
        const stickyObserver = new IntersectionObserver(
            ([entry]) => tabsEl.classList.toggle("is-stuck", !entry.isIntersecting),
            {threshold: 0, rootMargin: `-${navHeight + 1}px 0px 0px 0px`}
        );
        stickyObserver.observe(tabSentinel);
    }

    checkAuthStatus({
        onAuthenticated: async () => {
            state.activeTab = parseTabFromUrl();
            applyTabActive(state.activeTab);

            // 탭 배지용 카운트 프리페치 (단일 round-trip)
            prefetchCounts();

            await loadTranslations(state.activeTab);
            await loadList(false);
            initInfiniteScroll();
        },
        onUnauthenticated: redirectToLogin,
        onError: renderErrorState,
    });
});
