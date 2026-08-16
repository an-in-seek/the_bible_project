import { formatNumberWithComma } from "/js/common-util.js";
import { checkAuthStatus, buildLoginRedirectUrl } from "/js/auth/auth-check.js";
import { createRestoreStore, restoreScroll } from "/js/nav-restore.js?v=1.0";
import { syncDeepLinkParams } from "/js/deep-link-util.js?v=1.0";

const API = {
    POSTS: "/api/v1/community/posts",
    TOP_POSTS: "/api/v1/community/posts/top",
};

const PAGE_SIZE = 20;
const NOTICE_PAGE_SIZE = 1;
const SCROLL_ROOT_MARGIN = "200px";
const NOTICE_TYPE = "NOTICE";
const NOTICE_CATEGORY = "공지";
const DEFAULT_CATEGORY = "all";

const CATEGORY_CONFIG = {
    all: { sort: "latest" },
    "인기": { sort: "popular" },
    "공지": { sort: "latest", type: NOTICE_TYPE },
    "자유": { sort: "latest", type: "FREE" },
    "Q&A": { sort: "latest", type: "QUESTION" },
    "기도나눔": { sort: "latest", type: "PRAY" },
};

const TYPE_LABELS = {
    FREE: "자유",
    QUESTION: "Q&A",
    NOTICE: "공지",
    PRAY: "기도",
};

const DEFAULT_EMPTY_MESSAGE = "아직 등록된 글이 없습니다<br>첫 번째 글을 작성해보세요!";

/** 뒤로가기/새로고침 복귀 시 활성 탭·더보기 깊이·스크롤 위치 복원을 위한 sessionStorage 키. */
const RESTORE_KEY = "communityListRestore";

const restoreStore = createRestoreStore(RESTORE_KEY);

const App = {
    state: {
        activeCategory: "all",
        page: 0,
        hasNext: true,
        isLoading: false,
        abortController: null,
        observer: null,
        // 복원 대상: 더보기로 펼쳤던 페이지 깊이와 스크롤 위치(초기 로드 시 1회 소비).
        pendingRestorePage: 0,
        pendingRestoreScroll: null,
    },

    init() {
        App.setPageTitle();
        App.initWriteButtons();
        App.initCategoryTabs();
        App.initTop3MoreLink();
        App.initNoticeMoreLink();
        App.initScrollTop();
        App.initInfiniteScroll();
        App.loadTopPosts();
        App.loadNoticePosts();

        // 결과 클릭 등으로 페이지를 떠날 때(또는 bfcache 진입 시) 복원 상태를 저장.
        window.addEventListener("pagehide", () => App.saveRestoreState());

        const initialCategory = App.getInitialCategory();

        // 뒤로가기/새로고침으로 동일 탭에 복귀한 경우, 더보기 깊이·스크롤을 복원한다.
        const saved = restoreStore.load();
        if (saved && saved.tab === initialCategory) {
            App.state.pendingRestorePage = Number(saved.page) || 0;
            App.state.pendingRestoreScroll = Number.isFinite(saved.scrollY) ? saved.scrollY : null;
        }

        App.selectCategory(initialCategory, { isInitial: true });
    },

    saveRestoreState() {
        restoreStore.save({
            tab: App.state.activeCategory,
            page: App.state.page,
            scrollY: window.scrollY || window.pageYOffset || 0,
        });
    },

    setPageTitle() {
        const pageTitleLabel = document.getElementById("pageTitleLabel");
        if (pageTitleLabel) {
            pageTitleLabel.textContent = "커뮤니티";
            pageTitleLabel.classList.remove("d-none");
        }
    },

    initWriteButtons() {
        const buttons = [
            document.getElementById("btnWriteDesktop"),
            document.getElementById("btnWriteMobile"),
        ].filter(Boolean);

        buttons.forEach(btn => {
            btn.addEventListener("click", () => {
                App.handleWriteClick();
            });
        });
    },

    handleWriteClick() {
        checkAuthStatus({
            onAuthenticated: (data) => {
                const nickname = (data?.nickname || "").trim();
                if (!nickname) {
                    alert("닉네임을 먼저 입력해 주세요.");
                    const returnUrl = "/web/community/write";
                    const params = new URLSearchParams({focus: "nickname", returnUrl});
                    window.location.href = `/web/member/mypage?${params.toString()}`;
                    return;
                }
                window.location.href = "/web/community/write";
            },
            onUnauthenticated: () => {
                alert("글 작성은 로그인 후 이용 가능합니다.");
                window.location.href = buildLoginRedirectUrl("/web/community/write");
            },
            onError: () => {
                alert("글 작성은 로그인 후 이용 가능합니다.");
                window.location.href = buildLoginRedirectUrl("/web/community/write");
            },
        });
    },

    initCategoryTabs() {
        const tabs = document.querySelectorAll(".community-tab");
        if (tabs.length === 0) return;

        tabs.forEach(tab => {
            tab.addEventListener("click", () => {
                const category = tab.dataset.category || "all";
                App.selectCategory(category);
            });
        });
    },

    initTop3MoreLink() {
        const moreLinks = document.querySelectorAll(".top3-widget .widget-more");
        if (moreLinks.length === 0) return;

        moreLinks.forEach(link => {
            link.addEventListener("click", event => {
                event.preventDefault();
                App.selectCategory("인기");
            });
        });
    },

    initNoticeMoreLink() {
        const moreLinks = document.querySelectorAll(".notice-widget .notice-more");
        if (moreLinks.length === 0) return;

        moreLinks.forEach(link => {
            link.addEventListener("click", event => {
                event.preventDefault();
                App.selectCategory(NOTICE_CATEGORY);
            });
        });
    },

    initScrollTop() {
        const scrollTopBtn = document.getElementById("scrollToTopBtn");
        if (!scrollTopBtn) return;

        window.addEventListener("scroll", () => {
            if (window.scrollY > 300) {
                scrollTopBtn.classList.add("is-visible");
            } else {
                scrollTopBtn.classList.remove("is-visible");
            }
        });

        scrollTopBtn.addEventListener("click", () => {
            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        });
    },

    getInitialCategory() {
        const params = new URLSearchParams(window.location.search);
        const paramCategory = params.get("category");
        if (paramCategory && CATEGORY_CONFIG[paramCategory]) {
            return paramCategory;
        }
        const activeTab = document.querySelector(".community-tab.active");
        return activeTab?.dataset.category || DEFAULT_CATEGORY;
    },

    selectCategory(category, opts = {}) {
        if (!category) return;

        // 사용자가 직접 탭을 전환하면 복원 의도를 폐기한다(오늘처럼 page 0부터 새로 로드).
        if (!opts.isInitial) {
            App.state.pendingRestorePage = 0;
            App.state.pendingRestoreScroll = null;
        }

        App.state.activeCategory = category;
        // 상단 공유 버튼이 쿼리를 그대로 실어 보내므로, 보고 있는 탭을 URL 에 남겨야 딥링크가 된다.
        // 읽는 쪽은 getInitialCategory. 설계 문서: docs/common/url-share.md
        syncDeepLinkParams({ category: category === DEFAULT_CATEGORY ? null : category });
        App.updateTabState(category);
        App.toggleTop3(category === "all");

        App.resetPagination();

        const config = CATEGORY_CONFIG[category];
        if (config?.unsupported) {
            App.clearFeed();
            App.setEmptyState(true, "준비 중인 카테고리입니다.");
            return;
        }

        if (opts.isInitial && App.state.pendingRestorePage > 0) {
            App.restoreFeedDepth(category);
            return;
        }

        App.loadPosts(category, { append: false });

        // 깊이는 없고 스크롤만 복원할 경우(첫 페이지 복귀): 단일 로드 후 스크롤 복원.
        if (opts.isInitial && App.state.pendingRestoreScroll != null) {
            App.consumeRestoreScroll();
        }
    },

    /**
     * 더보기로 펼쳤던 페이지(0..pendingRestorePage)를 기존 loadPosts append 경로로 순차 재로드한 뒤
     * 스크롤 위치를 복원한다. 기존 page/hasNext 증가 의미를 그대로 사용해 다음 "더보기"가 이어지도록 한다.
     */
    async restoreFeedDepth(category) {
        const targetPage = App.state.pendingRestorePage;
        App.state.pendingRestorePage = 0;

        // 첫 페이지(append=false)로 피드를 초기화하며 로드.
        await App.loadPosts(category, { append: false });

        // 이후 페이지를 append=true 로 순차 로드. state.page 는 다음에 가져올 페이지 번호이므로,
        // state.page 가 targetPage 에 도달하면(= 저장 시점과 동일한 깊이) 멈춰 다음 "더보기"가 이어지게 한다.
        while (App.state.hasNext && App.state.page < targetPage) {
            await App.loadPosts(category, { append: true });
        }

        App.consumeRestoreScroll();
    },

    /** 저장해 둔 스크롤 위치를 렌더 후 1회 복원. */
    consumeRestoreScroll() {
        if (App.state.pendingRestoreScroll == null) return;
        const y = App.state.pendingRestoreScroll;
        App.state.pendingRestoreScroll = null;
        restoreScroll(y);
    },

    resetPagination() {
        if (App.state.abortController) {
            App.state.abortController.abort();
        }
        App.state.page = 0;
        App.state.hasNext = true;
        App.state.isLoading = false;
        App.setLoaderVisible(false);
    },

    updateTabState(category) {
        const tabs = document.querySelectorAll(".community-tab");
        tabs.forEach(tab => {
            const isActive = tab.dataset.category === category;
            tab.classList.toggle("active", isActive);
            tab.setAttribute("aria-selected", String(isActive));
        });
    },

    toggleTop3(show) {
        const feedTop3 = document.getElementById("feedTop3");
        const mobileTop3 = document.getElementById("mobileTop3");

        if (feedTop3) feedTop3.hidden = !show;
        if (mobileTop3) mobileTop3.hidden = !show;
    },

    async loadPosts(category, { append }) {
        const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.all;
        if (App.state.isLoading) return;
        if (append && !App.state.hasNext) return;

        const params = new URLSearchParams();
        const page = append ? App.state.page : 0;
        params.set("page", String(page));
        params.set("size", String(PAGE_SIZE));
        params.set("order", config.sort || "latest");
        if (config.type) {
            params.set("type", config.type);
        }

        if (!append) {
            App.clearFeed();
            App.setEmptyState(false);
        }
        App.setLoaderVisible(true);
        App.state.isLoading = true;

        const controller = new AbortController();
        App.state.abortController = controller;

        try {
            const response = await fetch(`${API.POSTS}?${params.toString()}`, {
                signal: controller.signal,
                credentials: "include",
                headers: {
                    Accept: "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`게시글 조회 실패 (${response.status})`);
            }

            const payload = await response.json();
            App.state.hasNext = Boolean(payload?.hasNext);
            if (App.state.hasNext) {
                App.state.page = page + 1;
            }
            App.renderPosts(payload?.content || [], { append });
        } catch (error) {
            if (error.name === "AbortError") return;
            if (!append) {
                App.clearFeed();
                App.setEmptyState(true, "게시글을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
            }
            App.state.hasNext = false;
        } finally {
            App.state.isLoading = false;
            App.setLoaderVisible(false);
        }
    },

    renderPosts(posts, { append }) {
        const { feedList, emptyState, loader } = App.getFeedElements();
        if (!feedList || !emptyState) return;

        const visiblePosts = App.state.activeCategory === NOTICE_CATEGORY
            ? (posts || [])
            : (posts || []).filter(post => post?.type !== NOTICE_TYPE);

        if (!append) {
            App.clearFeed();
        }

        if (!visiblePosts || visiblePosts.length === 0) {
            if (!append) {
                App.setEmptyState(true, DEFAULT_EMPTY_MESSAGE);
            }
            return;
        }

        const fragment = document.createDocumentFragment();
        visiblePosts.forEach(post => {
            fragment.appendChild(App.createPostCard(post));
        });

        const anchor = loader || emptyState;
        feedList.insertBefore(fragment, anchor);
        App.setEmptyState(false);
    },

    createPostCard(post) {
        const card = document.createElement("a");
        card.className = "feed-card";
        card.dataset.category = App.getTypeLabel(post.type);
        card.href = App.buildPostUrl(post.id);

        const topRow = document.createElement("div");
        topRow.className = "feed-top-row";

        const badges = document.createElement("div");
        badges.className = "feed-badges";

        const categoryBadge = document.createElement("span");
        categoryBadge.className = "feed-category-badge";
        categoryBadge.textContent = App.getTypeLabel(post.type);
        badges.appendChild(categoryBadge);

        if (post.isPopular) {
            const popularBadge = document.createElement("span");
            popularBadge.className = "feed-category-badge";
            popularBadge.textContent = "인기";
            badges.appendChild(popularBadge);
        }

        const title = document.createElement("h4");
        title.className = "feed-title";
        title.textContent = post.title || "";
        topRow.appendChild(badges);
        topRow.appendChild(title);
        card.appendChild(topRow);

        const previewText = post.preview || post.summary || "";
        if (previewText) {
            const preview = document.createElement("div");
            preview.className = "feed-preview";
            preview.textContent = previewText;
            card.appendChild(preview);
        }

        const footer = document.createElement("div");
        footer.className = "feed-footer";

        const userInfo = document.createElement("div");
        userInfo.className = "feed-user-info";

        const metaCol = document.createElement("div");
        metaCol.className = "feed-meta-col";

        const author = document.createElement("span");
        author.className = "feed-author";
        author.textContent = post.authorNickname || "익명";

        const time = document.createElement("span");
        time.className = "feed-time";
        time.textContent = App.formatRelativeTime(post.createdAt);

        metaCol.appendChild(author);
        metaCol.appendChild(time);
        userInfo.appendChild(metaCol);

        const actions = document.createElement("div");
        actions.className = "feed-actions";

        actions.appendChild(App.createActionPill("👀", post.viewCount));
        actions.appendChild(App.createActionPill("❤️", post.reactionCount));
        actions.appendChild(App.createActionPill("💬", post.commentCount));

        footer.appendChild(userInfo);
        footer.appendChild(actions);
        card.appendChild(footer);

        return card;
    },

    createActionPill(icon, value) {
        const pill = document.createElement("span");
        pill.className = "action-pill";

        const iconSpan = document.createElement("i");
        iconSpan.className = "icon";
        iconSpan.textContent = icon;

        const text = document.createTextNode(` ${formatNumberWithComma(value || 0)}`);

        pill.appendChild(iconSpan);
        pill.appendChild(text);
        return pill;
    },

    getTypeLabel(type) {
        return TYPE_LABELS[type] || type || "기타";
    },

    formatRelativeTime(isoString) {
        if (!isoString) return "";
        const target = new Date(isoString);
        if (Number.isNaN(target.getTime())) return "";

        const diffMs = Date.now() - target.getTime();
        const diffSeconds = Math.floor(diffMs / 1000);
        if (diffSeconds < 60) return `${Math.max(diffSeconds, 0)}초 전`;

        const diffMinutes = Math.floor(diffSeconds / 60);
        if (diffMinutes < 60) return `${diffMinutes}분 전`;

        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours}시간 전`;

        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays}일 전`;

        const diffWeeks = Math.floor(diffDays / 7);
        if (diffWeeks < 4) return `${diffWeeks}주 전`;

        const diffMonths = Math.floor(diffDays / 30);
        if (diffMonths < 12) return `${diffMonths}개월 전`;

        const diffYears = Math.floor(diffDays / 365);
        return `${diffYears}년 전`;
    },

    setEmptyState(visible, message) {
        const { emptyState, emptyText } = App.getFeedElements();
        if (!emptyState || !emptyText) return;

        if (message) {
            emptyText.innerHTML = message;
        }

        emptyState.style.display = visible ? "block" : "none";
    },

    setLoaderVisible(visible) {
        const { loader } = App.getFeedElements();
        if (!loader) return;
        loader.hidden = !visible;
    },

    clearFeed() {
        const { feedList, emptyState } = App.getFeedElements();
        if (!feedList || !emptyState) return;

        const cards = feedList.querySelectorAll(".feed-card");
        cards.forEach(card => card.remove());
    },

    getFeedElements() {
        const feedList = document.querySelector(".feed-list");
        const emptyState = feedList?.querySelector(".feed-empty") || null;
        const emptyText = emptyState?.querySelector(".empty-text") || null;
        const loader = feedList?.querySelector("#feedLoader") || null;
        const sentinel = feedList?.querySelector("#feedSentinel") || null;
        return { feedList, emptyState, emptyText, loader, sentinel };
    },

    initInfiniteScroll() {
        const { sentinel } = App.getFeedElements();
        if (!sentinel || App.state.observer) return;

        App.state.observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        App.loadNextPage();
                    }
                });
            },
            {
                root: null,
                rootMargin: SCROLL_ROOT_MARGIN,
                threshold: 0,
            }
        );

        App.state.observer.observe(sentinel);
    },

    loadNextPage() {
        if (App.state.isLoading || !App.state.hasNext) return;
        App.loadPosts(App.state.activeCategory, { append: true });
    },

    async loadTopPosts() {
        try {
            const response = await fetch(API.TOP_POSTS, {
                credentials: "include",
                headers: {
                    Accept: "application/json",
                },
            });
            if (!response.ok) {
                throw new Error(`인기글 조회 실패 (${response.status})`);
            }
            const posts = await response.json();
            App.renderTopPosts(posts || []);
        } catch (error) {
            // Fail silently; keep empty state text in the widget.
        }
    },

    renderTopPosts(posts) {
        const lists = document.querySelectorAll(".top3-list");
        if (lists.length === 0) return;

        const visiblePosts = (posts || []).filter(post => post?.type !== NOTICE_TYPE);

        lists.forEach(list => {
            const cardClass = list.dataset.cardClass || "";
            list.innerHTML = "";

            if (!visiblePosts || visiblePosts.length === 0) {
                const empty = document.createElement("div");
                empty.className = "top3-empty";
                empty.textContent = "인기글이 아직 없습니다.";
                list.appendChild(empty);
                return;
            }

            const fragment = document.createDocumentFragment();
            visiblePosts.slice(0, 3).forEach((post, index) => {
                fragment.appendChild(App.createTopPostCard(post, index + 1, cardClass));
            });

            list.appendChild(fragment);
        });
    },

    async loadNoticePosts() {
        const lists = document.querySelectorAll(".notice-list");
        if (lists.length === 0) return;

        const params = new URLSearchParams();
        params.set("page", "0");
        params.set("size", String(NOTICE_PAGE_SIZE));
        params.set("order", "latest");
        params.set("type", NOTICE_TYPE);

        try {
            const response = await fetch(`${API.POSTS}?${params.toString()}`, {
                credentials: "include",
                headers: {
                    Accept: "application/json",
                },
            });
            if (!response.ok) {
                throw new Error(`공지사항 조회 실패 (${response.status})`);
            }
            const payload = await response.json();
            App.renderNoticePosts(payload?.content || []);
        } catch (error) {
            App.renderNoticePosts([]);
        }
    },

    renderNoticePosts(posts) {
        const lists = document.querySelectorAll(".notice-list");
        if (lists.length === 0) return;

        const visiblePosts = (posts || []).slice(0, 1);

        lists.forEach(list => {
            list.innerHTML = "";

            if (!visiblePosts || visiblePosts.length === 0) {
                const empty = document.createElement("div");
                empty.className = "notice-empty";
                empty.textContent = "공지사항이 없습니다.";
                list.appendChild(empty);
                return;
            }

            const fragment = document.createDocumentFragment();
            visiblePosts.forEach(post => {
                fragment.appendChild(App.createNoticeItem(post));
            });
            list.appendChild(fragment);
        });
    },

    createNoticeItem(post) {
        const item = document.createElement("a");
        item.className = "pinned-notice-item";
        item.href = App.buildPostUrl(post.id);

        const title = document.createElement("span");
        title.className = "pinned-title";
        title.textContent = post.title || "공지사항";

        const date = document.createElement("span");
        date.className = "pinned-date";
        date.textContent = App.formatDate(post.createdAt);

        item.appendChild(title);
        item.appendChild(date);
        return item;
    },

    formatDate(isoString) {
        if (!isoString) return "";
        const date = new Date(isoString);
        if (Number.isNaN(date.getTime())) return "";
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}.${month}.${day}`;
    },

    createTopPostCard(post, rank, cardClass) {
        const card = document.createElement("a");
        card.className = ["feed-card", cardClass].filter(Boolean).join(" ");
        card.dataset.rank = String(rank);
        card.href = App.buildPostUrl(post.id);

        const topRow = document.createElement("div");
        topRow.className = "feed-top-row";

        const badges = document.createElement("div");
        badges.className = "feed-badges";

        const categoryBadge = document.createElement("span");
        categoryBadge.className = "feed-category-badge";
        categoryBadge.textContent = App.getTypeLabel(post.type);
        badges.appendChild(categoryBadge);

        const title = document.createElement("h4");
        title.className = "feed-title";
        title.textContent = post.title || "";
        topRow.appendChild(badges);
        topRow.appendChild(title);
        card.appendChild(topRow);

        const footer = document.createElement("div");
        footer.className = "feed-footer";

        const actions = document.createElement("div");
        actions.className = "feed-actions";
        actions.appendChild(App.createActionPill("👀", post.viewCount));
        actions.appendChild(App.createActionPill("❤️", post.reactionCount));
        actions.appendChild(App.createActionPill("💬", post.commentCount));

        footer.appendChild(actions);
        card.appendChild(footer);

        return card;
    },

    buildPostUrl(id) {
        if (!id) return "#";
        return `/web/community/${id}`;
    },
};

document.addEventListener("DOMContentLoaded", App.init);
