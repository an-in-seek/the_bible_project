import {BookStore, ChapterStore, TranslationStore, VerseStore} from "/js/storage-util.js?v=2.3";
import {formatNumberWithComma} from "/js/common-util.js?v=2.3";
import {initPopularSearchDialog} from "/js/popular-search.js?v=1.3";

const UI_CLASSES = {
    HIDDEN: "d-none",
    VISIBLE: "is-visible"
};

const API_CONFIG = {
    TRANSLATIONS: "/api/v1/bibles/translations",
    KEYWORD_RANKING: "/api/v1/bibles/search-keywords/ranking"
};

const ROUTES = {
    TRANSLATION_LIST: "/web/bible/translation",
    VERSE_LIST: "/web/bible/verse"
};

const CONFIG = {
    SCROLL_THRESHOLD: 300,
    PAGE_SIZE: 50,
    SCROLL_LOAD_OFFSET: 200,
    RANKING_LIMIT: 3
};

const DomHelper = {
    getElements: () => {
        const get = id => document.getElementById(id);
        return {
            backButton: get("topNavBackButton"),
            translationLink: get("topNavTranslationLink"),
            translationTypeLabel: get("translationTypeLabel"),
            pageTitleLabel: get("pageTitleLabel"),
            searchLink: get("topNavSearchLink"),
            keywordInput: get("keywordInput"),
            searchForm: get("searchForm"),
            clearBtn: get("clearBtn"),
            searchBtn: get("searchBtn"),
            bookFilterContainer: get("bookFilterContainer"),
            bookFilterSelect: get("bookFilterSelect"),
            resultCount: get("resultCount"),
            emptyState: get("searchEmptyState"),
            searchLoading: get("searchLoading"),
            searchLoadingMessage: get("searchLoadingMessage"),
            searchResultList: get("searchResultList"),
            scrollToTopBtn: get("scrollToTopBtn"),
            rankingSection: get("bibleKeywordRankingSection"),
            rankingList: get("bibleKeywordRankingList")
        };
    }
};

/** 뒤로가기/새로고침 복귀 시 더보기 깊이·스크롤 위치 복원을 위한 sessionStorage 키. */
const RESTORE_KEY = "bibleVerseSearchRestore";

function readRestoreState() {
    try {
        const raw = sessionStorage.getItem(RESTORE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (_) {
        return null;
    }
}

function writeRestoreState(s) {
    try {
        sessionStorage.setItem(RESTORE_KEY, JSON.stringify(s));
    } catch (_) {
        /* sessionStorage 비활성/용량 초과 시 복원 기능만 비활성화 */
    }
}

const App = {
    elements: null,
    state: {
        translationId: null,
        translationType: null,
        currentPage: 0,
        hasNext: false,
        isLoading: false,
        totalCount: null,
        activeKeyword: "",
        initialKeyword: "",
        books: [],
        selectedBookOrder: null,
        abortController: null
    },
    _pendingRestorePage: 0,
    _pendingRestoreScroll: null,

    saveRestoreState: () => {
        if (!App.state.activeKeyword) {
            return;
        }
        writeRestoreState({
            keyword: App.state.activeKeyword,
            translationId: App.state.translationId,
            selectedBookOrder: App.state.selectedBookOrder ?? null,
            currentPage: App.state.currentPage,
            scrollY: window.scrollY || window.pageYOffset || 0
        });
    },

    init: async () => {
        App.elements = DomHelper.getElements();
        App.state.translationId = App.getTranslationId();
        App.state.initialKeyword = App.getInitialKeyword();

        if (!App.state.translationId) {
            App.redirectToTranslation();
            return;
        }

        window.addEventListener("pagehide", App.saveRestoreState);

        App.initNav();
        App.loadKeywordRanking();
        App.initRankingDialog();

        const translationInfo = await App.ensureTranslationInfo(App.state.translationId);
        App.state.translationType = translationInfo.type;
        App.updateTranslationTypeLabel();

        await App.fetchBooks();
        App.renderBookFilter();
        App.initFormControls();
        App.initResultHandlers();
        App.initScrollToTop();
        window.addEventListener("scroll", App.maybeLoadNextPage, {passive: true});

        if (App.state.initialKeyword) {
            if (App.elements.keywordInput) {
                App.elements.keywordInput.value = App.state.initialKeyword;
            }

            // 뒤로가기/새로고침으로 동일 검색 조건에 복귀한 경우, 더보기 깊이·스크롤을 복원한다.
            const saved = readRestoreState();
            if (
                saved &&
                saved.keyword === App.state.initialKeyword &&
                saved.translationId === App.state.translationId &&
                (saved.selectedBookOrder ?? null) === (App.state.selectedBookOrder ?? null)
            ) {
                App._pendingRestorePage = Number(saved.currentPage) || 0;
                App._pendingRestoreScroll = Number.isFinite(saved.scrollY) ? saved.scrollY : null;
            }

            App.startSearch(App.state.initialKeyword);
        } else {
            App.updateUrl();
        }
    },

    getTranslationId: () => {
        const urlParams = new URLSearchParams(window.location.search);
        const translationIdParam = parseInt(urlParams.get("translationId"), 10);
        return Number.isNaN(translationIdParam)
            ? TranslationStore.getCurrentTranslationId()
            : translationIdParam;
    },

    getInitialKeyword: () => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get("keyword") ?? "";
    },

    initNav: () => {
        const {backButton, translationLink, searchLink, pageTitleLabel} = App.elements;
        if (backButton) {
            backButton.classList.remove(UI_CLASSES.HIDDEN);
            backButton.addEventListener("click", () => {
                history.back();
            });
        }
        if (translationLink) {
            translationLink.classList.remove(UI_CLASSES.HIDDEN);
            translationLink.classList.add("nav-placeholder");
            translationLink.setAttribute("aria-hidden", "true");
            translationLink.setAttribute("tabindex", "-1");
        }
        if (searchLink) {
            searchLink.classList.remove(UI_CLASSES.HIDDEN);
            searchLink.classList.add("nav-placeholder");
        }
        if (pageTitleLabel) {
            pageTitleLabel.textContent = "성경 검색";
            pageTitleLabel.classList.remove(UI_CLASSES.HIDDEN);
        }
    },

    updateTranslationTypeLabel: () => {
        const {translationTypeLabel} = App.elements;
        if (translationTypeLabel) {
            translationTypeLabel.textContent = App.state.translationType ?? "";
        }
    },

    initFormControls: () => {
        const {clearBtn, keywordInput, searchForm} = App.elements;
        if (clearBtn && keywordInput) {
            clearBtn.addEventListener("click", () => {
                keywordInput.value = "";
                keywordInput.focus();
                App.resetToInitialView();
                App.resetSearchState();
                App.resetBookFilter();
                App.updateUrl();
            });

            keywordInput.addEventListener("input", () => {
                clearBtn.disabled = keywordInput.value.trim().length === 0;
            });
            keywordInput.focus();
            clearBtn.disabled = keywordInput.value.trim().length === 0;
        }

        if (searchForm && keywordInput) {
            searchForm.addEventListener("submit", async event => {
                event.preventDefault();
                await App.startSearch(keywordInput.value);
            });
        }
    },

    initResultHandlers: () => {
        const {searchResultList} = App.elements;
        if (searchResultList) {
            searchResultList.addEventListener("click", App.handleResultClick);
        }
    },

    initScrollToTop: () => {
        const {scrollToTopBtn} = App.elements;
        if (!scrollToTopBtn) {
            return;
        }

        scrollToTopBtn.addEventListener("click", () => {
            window.scrollTo({top: 0, behavior: "smooth"});
        });

        window.addEventListener("scroll", App.updateScrollToTopVisibility, {passive: true});
        App.updateScrollToTopVisibility();
    },

    updateScrollToTopVisibility: () => {
        const {scrollToTopBtn} = App.elements;
        if (!scrollToTopBtn) {
            return;
        }
        const shouldShow = window.scrollY >= CONFIG.SCROLL_THRESHOLD;
        scrollToTopBtn.classList.toggle(UI_CLASSES.VISIBLE, shouldShow);
    },

    setEmptyState: message => {
        const {emptyState, searchResultList} = App.elements;
        if (emptyState) {
            emptyState.textContent = message;
            emptyState.classList.remove(UI_CLASSES.HIDDEN);
        }
        App.hideLoading();
        if (searchResultList) {
            searchResultList.classList.add(UI_CLASSES.HIDDEN);
        }
    },

    setResultsVisible: () => {
        const {emptyState, searchResultList} = App.elements;
        if (emptyState) {
            emptyState.classList.add(UI_CLASSES.HIDDEN);
        }
        App.hideLoading();
        if (searchResultList) {
            searchResultList.classList.remove(UI_CLASSES.HIDDEN);
        }
    },

    hideEmptyState: () => {
        const {emptyState} = App.elements;
        if (emptyState) {
            emptyState.classList.add(UI_CLASSES.HIDDEN);
        }
    },

    showLoading: message => {
        const {searchLoading, searchLoadingMessage} = App.elements;
        if (searchLoading) {
            searchLoading.classList.remove(UI_CLASSES.HIDDEN);
            searchLoading.setAttribute("aria-busy", "true");
        }
        if (searchLoadingMessage) {
            searchLoadingMessage.textContent = message;
        }
    },

    hideLoading: () => {
        const {searchLoading} = App.elements;
        if (searchLoading) {
            searchLoading.classList.add(UI_CLASSES.HIDDEN);
            searchLoading.removeAttribute("aria-busy");
        }
    },

    setLoading: loading => {
        const {searchBtn, keywordInput, clearBtn} = App.elements;
        if (searchBtn) {
            searchBtn.disabled = loading;
        }
        if (keywordInput) {
            keywordInput.disabled = loading;
        }
        if (clearBtn) {
            clearBtn.disabled = loading;
        }
    },

    setLoadingState: message => {
        const {resultCount} = App.elements;
        if (!resultCount) {
            return;
        }
        App.hideEmptyState();
        App.showLoading(message);
        resultCount.textContent = message;
    },

    resetSearchState: () => {
        App.state.currentPage = 0;
        App.state.hasNext = false;
        App.state.totalCount = null;
        App.state.activeKeyword = "";
        App.state.isLoading = false;
    },

    buildSearchUrl: () => {
        const params = new URLSearchParams();
        params.set("translationId", App.state.translationId);
        if (App.state.activeKeyword) {
            params.set("keyword", App.state.activeKeyword);
        }
        const queryString = params.toString();
        return `${window.location.pathname}?${queryString}`;
    },

    updateUrl: () => {
        history.replaceState(null, "", App.buildSearchUrl());
    },

    updateResultCount: () => {
        const {resultCount} = App.elements;
        if (resultCount && App.state.totalCount !== null && App.state.activeKeyword) {
            resultCount.textContent = `"${App.state.activeKeyword}"에 대한 결과 ${formatNumberWithComma(App.state.totalCount)}건`;
        }
    },

    clearResults: () => {
        const {searchResultList, resultCount} = App.elements;
        if (searchResultList) {
            searchResultList.innerHTML = "";
        }
        if (resultCount) {
            resultCount.textContent = "";
        }
        App.hideLoading();
    },

    resetToInitialView: () => {
        const {searchResultList} = App.elements;
        App.clearResults();
        App.hideEmptyState();
        if (searchResultList) {
            searchResultList.classList.add(UI_CLASSES.HIDDEN);
        }
    },

    appendResults: items => {
        const {searchResultList} = App.elements;
        if (!searchResultList) {
            return;
        }
        items.forEach(item => {
            const resultItem = document.createElement("div");
            resultItem.className = "search-result-item verse-link";

            // 데이터 속성 설정 (클릭 이벤트용)
            resultItem.dataset.bookId = item.bookId;
            resultItem.dataset.bookOrder = item.bookOrder;
            resultItem.dataset.bookName = item.bookName;
            resultItem.dataset.chapterId = item.chapterId;
            resultItem.dataset.chapterNumber = item.chapterNumber;
            resultItem.dataset.verseId = item.verseId;
            resultItem.dataset.verseNumber = item.verseNumber;

            const highlightedText = item.text.replace(
                new RegExp(`(${App.state.activeKeyword})`, "gi"),
                "<span class=\"highlight-keyword\">$1</span>"
            );

            resultItem.innerHTML = `
                <div class="search-result-meta">
                    <span class="search-result-badge">${item.bookName} ${item.chapterNumber}:${item.verseNumber}</span>
                </div>
                <div class="search-result-text">
                    ${highlightedText}
                </div>
            `;
            searchResultList.appendChild(resultItem);
        });
    },

    cancelPendingFetch: () => {
        if (App.state.abortController) {
            App.state.abortController.abort();
            App.state.abortController = null;
        }
    },

    fetchSearchPage: async page => {
        if (!App.state.activeKeyword || App.state.isLoading || !App.state.hasNext) {
            return;
        }
        if (page === 0) {
            App.cancelPendingFetch();
        }
        const controller = new AbortController();
        App.state.abortController = controller;
        App.state.isLoading = true;
        if (page === 0) {
            App.setLoading(true);
            App.hideEmptyState();
            App.setLoadingState("검색 중...");
        }
        try {
            let searchUrl = `${API_CONFIG.TRANSLATIONS}/${App.state.translationId}/search?keyword=${encodeURIComponent(App.state.activeKeyword)}&page=${page}&size=${CONFIG.PAGE_SIZE}`;
            if (App.state.selectedBookOrder !== null) {
                searchUrl += `&bookOrder=${App.state.selectedBookOrder}`;
            }
            const response = await fetch(searchUrl, {signal: controller.signal});
            if (!response.ok) {
                throw new Error("검색 실패");
            }
            const data = await response.json();
            if (page === 0) {
                App.state.totalCount = data.totalCount ?? null;
                if (App.state.totalCount === 0) {
                    App.setEmptyState("다른 검색어로 다시 시도해 보세요.");
                    App.state.hasNext = false;
                }
                App.updateResultCount();
            }

            if (!data.content || data.content.length === 0) {
                if (page === 0) {
                    App.setEmptyState("다른 검색어로 다시 시도해 보세요.");
                }
                App.state.hasNext = false;
                return;
            }

            App.setResultsVisible();
            App.appendResults(data.content);
            App.state.hasNext = data.hasNext === true;
        } catch (error) {
            if (error.name === "AbortError") {
                return;
            }
            if (page === 0) {
                const {resultCount} = App.elements;
                if (resultCount) {
                    resultCount.textContent = "검색 중 오류가 발생했습니다.";
                }
                App.setEmptyState("잠시 후 다시 시도해 주세요.");
            }
            console.error(error);
        } finally {
            if (App.state.abortController === controller) {
                App.state.isLoading = false;
                if (page === 0) {
                    App.setLoading(false);
                    App.hideLoading();
                }
            }
        }
    },

    startSearch: async keyword => {
        const normalizedKeyword = keyword.trim();
        App.cancelPendingFetch();
        App.clearResults();
        App.resetSearchState();
        if (!normalizedKeyword) {
            App.resetToInitialView();
            App.updateUrl();
            // 빈 검색어로 새 검색 시작 시 복원 상태 초기화
            App._pendingRestorePage = 0;
            App._pendingRestoreScroll = null;
            return;
        }
        App.hideEmptyState();
        App.state.activeKeyword = normalizedKeyword;
        App.state.hasNext = true;
        App.state.currentPage = 0;
        App.updateUrl();

        // 복원 깊이: 뒤로가기/새로고침 복귀 시 1회 소비. 일반 검색은 0이므로 루프 미진입.
        const restorePage = App._pendingRestorePage || 0;
        App._pendingRestorePage = 0;

        await App.fetchSearchPage(0);

        // restorePage > 0 이면 1..restorePage 페이지를 순차 로드하여 더보기 깊이를 복원한다.
        for (let p = 1; p <= restorePage && App.state.hasNext; p++) {
            App.state.currentPage = p;
            // fetchSearchPage 내부 가드(hasNext, isLoading)를 우회하기 위해 직접 fetch 수행
            await App.fetchRestorePage(p);
        }

        // 복귀 시 저장해 둔 스크롤 위치를 결과 렌더 후 1회 복원.
        if (App._pendingRestoreScroll != null) {
            const y = App._pendingRestoreScroll;
            App._pendingRestoreScroll = null;
            requestAnimationFrame(() => window.scrollTo(0, y));
        }

        App.maybeLoadNextPage();
    },

    fetchRestorePage: async page => {
        const controller = new AbortController();
        App.state.abortController = controller;
        App.state.isLoading = true;
        try {
            let searchUrl = `${API_CONFIG.TRANSLATIONS}/${App.state.translationId}/search?keyword=${encodeURIComponent(App.state.activeKeyword)}&page=${page}&size=${CONFIG.PAGE_SIZE}`;
            if (App.state.selectedBookOrder !== null) {
                searchUrl += `&bookOrder=${App.state.selectedBookOrder}`;
            }
            const response = await fetch(searchUrl, {signal: controller.signal});
            if (!response.ok) {
                throw new Error("검색 실패");
            }
            const data = await response.json();
            if (!data.content || data.content.length === 0) {
                App.state.hasNext = false;
                return;
            }
            App.appendResults(data.content);
            App.state.hasNext = data.hasNext === true;
        } catch (error) {
            if (error.name === "AbortError") {
                return;
            }
            App.state.hasNext = false;
            console.error(error);
        } finally {
            if (App.state.abortController === controller) {
                App.state.isLoading = false;
            }
        }
    },

    maybeLoadNextPage: () => {
        if (!App.state.hasNext || App.state.isLoading) {
            return;
        }
        const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - CONFIG.SCROLL_LOAD_OFFSET;
        if (nearBottom) {
            App.state.currentPage += 1;
            App.fetchSearchPage(App.state.currentPage);
        }
    },

    handleResultClick: event => {
        const td = event.target.closest(".verse-link");
        if (!td) {
            return;
        }
        const selectedBookOrder = parseInt(td.dataset.bookOrder, 10);
        const selectedChapterNumber = parseInt(td.dataset.chapterNumber, 10);
        BookStore.saveCurrentBook({
            bookOrder: selectedBookOrder,
            bookName: td.dataset.bookName
        });
        ChapterStore.saveNumber(selectedChapterNumber);
        VerseStore.saveNumber(td.dataset.verseNumber);
        const targetUrl = new URL(ROUTES.VERSE_LIST, window.location.origin);
        targetUrl.searchParams.set("translationId", App.state.translationId);
        targetUrl.searchParams.set("bookOrder", selectedBookOrder);
        targetUrl.searchParams.set("chapterNumber", selectedChapterNumber);
        targetUrl.searchParams.set("verseNumber", td.dataset.verseNumber);
        targetUrl.searchParams.set("from", "search");
        window.location.href = `${targetUrl.pathname}${targetUrl.search}`;
    },

    getStoredTranslation: () => ({
        id: TranslationStore.getCurrentTranslationId(),
        type: TranslationStore.getCurrentTranslationType(),
        name: TranslationStore.getCurrentTranslationName(),
        language: TranslationStore.getCurrentTranslationLanguage()
    }),

    hasCompleteTranslation: (stored, targetId) =>
        stored.id === targetId && stored.type && stored.name && stored.language,

    ensureTranslationInfo: async targetId => {
        const stored = App.getStoredTranslation();
        if (App.hasCompleteTranslation(stored, targetId)) {
            return stored;
        }
        try {
            const response = await fetch(API_CONFIG.TRANSLATIONS);
            if (!response.ok) {
                throw new Error("번역본 정보를 불러오는 중 오류가 발생했습니다.");
            }
            const translations = await response.json();
            const match = translations.find(item => item.translationId === targetId);
            if (match) {
                const translation = {
                    id: match.translationId,
                    name: match.translationName,
                    type: match.translationType,
                    language: match.translationLanguage
                };
                TranslationStore.saveCurrentTranslation(translation);
                return translation;
            }
        } catch (error) {
            console.warn(error.message);
        }
        return stored;
    },

    fetchBooks: async () => {
        try {
            const response = await fetch(`${API_CONFIG.TRANSLATIONS}/${App.state.translationId}/books`);
            if (!response.ok) {
                return;
            }
            App.state.books = await response.json();
        } catch (error) {
            console.warn("책 목록 로드 실패:", error);
        }
    },

    renderBookFilter: () => {
        const {bookFilterContainer, bookFilterSelect} = App.elements;
        if (!bookFilterContainer || !bookFilterSelect || App.state.books.length === 0) {
            return;
        }

        App.state.books.forEach(book => {
            const option = document.createElement("option");
            option.value = book.bookOrder;
            option.textContent = book.bookName;
            bookFilterSelect.appendChild(option);
        });

        bookFilterSelect.addEventListener("change", App.handleBookFilterChange);
        bookFilterContainer.classList.remove(UI_CLASSES.HIDDEN);
    },

    resetBookFilter: () => {
        App.state.selectedBookOrder = null;
        const {bookFilterSelect} = App.elements;
        if (bookFilterSelect) {
            bookFilterSelect.value = "";
        }
    },

    handleBookFilterChange: async () => {
        const {bookFilterSelect} = App.elements;
        if (!bookFilterSelect) {
            return;
        }
        const value = bookFilterSelect.value;
        App.state.selectedBookOrder = value === "" ? null : parseInt(value, 10);

        if (App.state.activeKeyword) {
            App.cancelPendingFetch();
            App.clearResults();
            App.state.currentPage = 0;
            App.state.hasNext = true;
            App.state.totalCount = null;
            App.state.isLoading = false;
            await App.fetchSearchPage(0);
            App.maybeLoadNextPage();
        }
    },

    redirectToTranslation: () => {
        window.location.href = ROUTES.TRANSLATION_LIST;
    },

    initRankingDialog: () => {
        initPopularSearchDialog({
            triggers: {
                bible: {
                    title: "성경 구절 인기 검색어",
                    endpoint: "/api/v1/bibles/search-keywords/ranking",
                    ariaTemplate: "순위 {rank}위, {keyword} 구절 검색",
                    onItemClick: async (item) => {
                        const {keywordInput} = App.elements;
                        if (keywordInput) {
                            keywordInput.value = item.keyword ?? "";
                            keywordInput.focus();
                        }
                        await App.startSearch(item.keyword ?? "");
                    },
                },
            },
        });
    },

    loadKeywordRanking: async () => {
        const {rankingSection} = App.elements;
        try {
            const url = new URL(API_CONFIG.KEYWORD_RANKING, window.location.origin);
            url.searchParams.set("limit", String(CONFIG.RANKING_LIMIT));
            const response = await fetch(url, {credentials: "omit"});
            if (!response.ok) {
                throw new Error("인기 검색어 조회 실패");
            }
            const data = await response.json();
            App.renderKeywordRanking(data);
        } catch (error) {
            console.error(error);
            if (rankingSection) {
                rankingSection.classList.add(UI_CLASSES.HIDDEN);
            }
        }
    },

    renderKeywordRanking: data => {
        const {rankingSection, rankingList, keywordInput} = App.elements;
        if (!rankingSection || !rankingList) {
            return;
        }

        const items = Array.isArray(data?.items) ? data.items : [];
        rankingList.replaceChildren();

        if (items.length === 0) {
            rankingSection.classList.add(UI_CLASSES.HIDDEN);
            return;
        }

        items.forEach(item => {
            const li = document.createElement("li");
            li.className = "popular-search-item";

            const button = document.createElement("button");
            button.type = "button";
            button.className = "popular-search-link";
            button.setAttribute("aria-label", `순위 ${item.rank}위, ${item.keyword} 구절 검색`);
            if (item.rank <= 3) {
                button.classList.add(`top-rank-${item.rank}`);
            }
            button.addEventListener("click", async () => {
                if (keywordInput) {
                    keywordInput.value = item.keyword ?? "";
                    keywordInput.focus();
                }
                await App.startSearch(item.keyword ?? "");
            });

            const rank = document.createElement("span");
            rank.className = "popular-search-rank";
            rank.textContent = String(item.rank);

            const keyword = document.createElement("span");
            keyword.className = "popular-search-keyword";
            keyword.textContent = item.keyword;

            button.append(rank, keyword);
            li.appendChild(button);
            rankingList.appendChild(li);
        });

        rankingSection.classList.remove(UI_CLASSES.HIDDEN);
    }
};

document.addEventListener("DOMContentLoaded", App.init);
