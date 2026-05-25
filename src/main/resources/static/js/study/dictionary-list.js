import {initPopularSearchDialog} from "/js/popular-search.js?v=1.3";

const API_CONFIG = {
    BASE_URL: "/api/v1/study/dictionaries",
    RANKING_URL: "/api/v1/study/dictionaries/search-keywords/ranking"
};

const UI_CLASSES = {
    HIDDEN: "d-none",
    VISIBLE: "is-visible"
};

const CONFIG = {
    SCROLL_THRESHOLD: 300,
    SCROLL_LOAD_OFFSET: 200,
    PAGE_SIZE: 50,
    RANKING_LIMIT: 3
};

const DomHelper = {
    getElements: () => {
        const get = id => document.getElementById(id);
        return {
            backButton: get("topNavBackButton"),
            pageTitleLabel: get("pageTitleLabel"),
            keywordInput: get("dictionaryKeywordInput"),
            searchForm: get("dictionarySearchForm"),
            searchBtn: get("dictionarySearchBtn"),
            clearBtn: get("dictionaryClearBtn"),
            resultCount: get("dictionaryResultCount"),
            rankingSection: get("dictionaryKeywordRankingSection"),
            rankingList: get("dictionaryKeywordRankingList"),
            emptyState: get("dictionaryEmptyState"),
            dictionaryLoading: get("dictionaryLoading"),
            listContainer: get("dictionaryList"),
            scrollToTopBtn: get("scrollToTopBtn"),
        };
    },

    setElementText: (element, text) => {
        if (element) element.textContent = text;
    },

    setElementHtml: (element, html) => {
        if (element) element.innerHTML = html;
    },

    toggleVisibility: (element, isVisible) => {
        if (!element) return;
        if (isVisible) element.classList.remove(UI_CLASSES.HIDDEN);
        else element.classList.add(UI_CLASSES.HIDDEN);
    },

    toggleClass: (element, className, enabled) => {
        if (!element) return;
        element.classList.toggle(className, enabled);
    }
};

const ApiService = {
    fetchDictionaryPage: async ({keyword, page, size}) => {
        const url = new URL(API_CONFIG.BASE_URL, window.location.origin);
        if (keyword) {
            url.searchParams.set("keyword", keyword);
        }
        url.searchParams.set("page", String(page));
        url.searchParams.set("size", String(size));
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("사전 조회 실패");
        }
        return response.json();
    },

    fetchKeywordRanking: async limit => {
        const url = new URL(API_CONFIG.RANKING_URL, window.location.origin);
        url.searchParams.set("limit", String(limit));
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("인기 검색어 조회 실패");
        }
        return response.json();
    }
};

const App = {
    elements: null,
    state: {
        currentPage: 0,
        hasNext: false,
        isLoading: false,
        activeKeyword: "",
        totalCount: null,
        from: null
    },

    init: () => {
        App.elements = DomHelper.getElements();
        if (!App.elements.searchForm) {
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        App.state.from = urlParams.get("from");

        App.initNav();
        App.bindEvents();
        App.loadKeywordRanking();
        App.initRankingDialog();

        const initialKeyword = urlParams.get("keyword") ?? "";
        if (App.elements.keywordInput) {
            App.elements.keywordInput.value = initialKeyword;
        }
        App.startSearch(initialKeyword);
    },

    initNav: () => {
        const {pageTitleLabel, backButton} = App.elements;
        if (pageTitleLabel) {
            pageTitleLabel.textContent = "성경 사전";
            pageTitleLabel.classList.remove(UI_CLASSES.HIDDEN);
        }
        if (backButton) {
            backButton.classList.remove(UI_CLASSES.HIDDEN);
            backButton.addEventListener("click", () => {
                window.location.href = App.state.from === "home" ? "/" : "/web/study";
            });
        }
    },

    bindEvents: () => {
        const {keywordInput, clearBtn, searchForm, scrollToTopBtn} = App.elements;

        if (keywordInput) {
            keywordInput.focus();
            keywordInput.addEventListener("input", () => {
                if (clearBtn) {
                    clearBtn.disabled = keywordInput.value.trim().length === 0;
                }
            });
        }

        if (clearBtn) {
            clearBtn.disabled = keywordInput?.value.trim().length === 0;
            clearBtn.addEventListener("click", () => {
                if (keywordInput) {
                    keywordInput.value = "";
                    keywordInput.focus();
                }
                App.clearResults();
                App.startSearch("");
            });
        }

        if (searchForm) {
            searchForm.addEventListener("submit", event => {
                event.preventDefault();
                const keyword = keywordInput?.value ?? "";
                App.startSearch(keyword);
            });
        }

        if (scrollToTopBtn) {
            scrollToTopBtn.addEventListener("click", () => {
                window.scrollTo({top: 0, behavior: "smooth"});
            });
            window.addEventListener("scroll", App.updateScrollToTopVisibility, {passive: true});
            App.updateScrollToTopVisibility();
        }

        window.addEventListener("scroll", App.maybeLoadNextPage, {passive: true});
    },

    renderKeywordRanking: data => {
        const {rankingSection, rankingList, keywordInput} = App.elements;
        if (!rankingSection || !rankingList) {
            return;
        }

        const items = Array.isArray(data?.items) ? data.items : [];
        rankingList.replaceChildren();

        if (items.length === 0) {
            DomHelper.toggleVisibility(rankingSection, false);
            return;
        }

        items.forEach(item => {
            const li = document.createElement("li");
            li.className = "popular-search-item";

            const button = document.createElement("button");
            button.type = "button";
            button.className = "popular-search-link";
            button.setAttribute("aria-label", `순위 ${item.rank}위, ${item.keyword} 사전 검색`);
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

        DomHelper.toggleVisibility(rankingSection, true);
    },

    loadKeywordRanking: async () => {
        try {
            const data = await ApiService.fetchKeywordRanking(CONFIG.RANKING_LIMIT);
            App.renderKeywordRanking(data);
        } catch (error) {
            console.error(error);
            const {rankingSection} = App.elements;
            DomHelper.toggleVisibility(rankingSection, false);
        }
    },

    initRankingDialog: () => {
        initPopularSearchDialog({
            triggers: {
                dictionary: {
                    title: "성경 사전 인기 검색어",
                    endpoint: "/api/v1/study/dictionaries/search-keywords/ranking",
                    ariaTemplate: "순위 {rank}위, {keyword} 사전 검색",
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

    updateScrollToTopVisibility: () => {
        const {scrollToTopBtn} = App.elements;
        if (!scrollToTopBtn) {
            return;
        }
        const shouldShow = window.scrollY >= CONFIG.SCROLL_THRESHOLD;
        DomHelper.toggleClass(scrollToTopBtn, UI_CLASSES.VISIBLE, shouldShow);
    },

    setEmptyState: (message, detail) => {
        const {emptyState, listContainer, dictionaryLoading} = App.elements;
        if (emptyState) {
            emptyState.innerHTML = "";
            const title = document.createElement("p");
            title.className = detail ? "mb-1" : "mb-0";
            title.textContent = message;
            emptyState.appendChild(title);
            if (detail) {
                const body = document.createElement("p");
                body.className = "small mb-0";
                body.textContent = detail;
                emptyState.appendChild(body);
            }
            DomHelper.toggleVisibility(emptyState, true);
        }
        DomHelper.toggleVisibility(listContainer, false);
        DomHelper.toggleVisibility(dictionaryLoading, false);
    },

    setResultsVisible: () => {
        const {emptyState, listContainer, dictionaryLoading} = App.elements;
        DomHelper.toggleVisibility(emptyState, false);
        DomHelper.toggleVisibility(listContainer, true);
        DomHelper.toggleVisibility(dictionaryLoading, false);
    },

    setLoading: loading => {
        const {searchBtn, keywordInput, clearBtn} = App.elements;
        if (searchBtn) searchBtn.disabled = loading;
        if (keywordInput) keywordInput.disabled = loading;
        if (clearBtn) clearBtn.disabled = loading;
    },

    setLoadingState: message => {
        const {resultCount, emptyState, dictionaryLoading, listContainer} = App.elements;

        // Hide other states
        DomHelper.toggleVisibility(emptyState, false);
        DomHelper.toggleVisibility(listContainer, false);

        // Show spinner
        DomHelper.toggleVisibility(dictionaryLoading, true);

        // Update valid result count if needed or clear it
        if (resultCount) {
            // Optional: Show "Loading..." text in result count if strictly needed, 
            // but usually the spinner is enough. 
            // For consistency with other pages, we might want to clear it or leave it.
            // Let's clear it to reduce noise while spinner is valid.
            resultCount.textContent = "";
        }
    },

    resetSearchState: () => {
        App.state.currentPage = 0;
        App.state.hasNext = false;
        App.state.isLoading = false;
        App.state.activeKeyword = "";
        App.state.totalCount = null;
    },

    updateResultCount: () => {
        const {resultCount} = App.elements;
        if (!resultCount) {
            return;
        }
        if (App.state.totalCount === null) {
            resultCount.textContent = "";
            return;
        }
        if (App.state.activeKeyword) {
            resultCount.textContent = `"${App.state.activeKeyword}"에 대한 결과 ${App.state.totalCount}건`;
        } else {
            resultCount.textContent = `성경 사전 ${App.state.totalCount}건`;
        }
    },

    createSummary: description => {
        const normalized = (description ?? "").trim();
        if (!normalized) {
            return {text: "설명이 등록되지 않았습니다.", isEmpty: true};
        }
        if (normalized.length <= 140) {
            return {text: normalized, isEmpty: false};
        }
        return {text: `${normalized.substring(0, 140).trimEnd()}…`, isEmpty: false};
    },

    escapeHtml: str => {
        const div = document.createElement("div");
        div.textContent = String(str ?? "");
        return div.innerHTML;
    },

    escapeRegExp: str => String(str ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),

    highlight: (text, keyword) => {
        const safe = App.escapeHtml(text);
        const trimmed = (keyword ?? "").trim();
        if (!trimmed) {
            return safe;
        }
        const pattern = App.escapeRegExp(trimmed);
        if (!pattern) {
            return safe;
        }
        const re = new RegExp(pattern, "gi");
        return safe.replace(re, match => `<mark class="dictionary-mark">${match}</mark>`);
    },

    buildDetailLink: id => {
        const params = new URLSearchParams();
        if (App.state.activeKeyword) {
            params.set("keyword", App.state.activeKeyword);
        }
        const queryString = params.toString();
        return queryString ? `/web/study/dictionary/${id}?${queryString}` : `/web/study/dictionary/${id}`;
    },

    appendResults: items => {
        const {listContainer} = App.elements;
        if (!listContainer) {
            return;
        }
        const keyword = App.state.activeKeyword;
        const fragment = document.createDocumentFragment();

        items.forEach(item => {
            const link = document.createElement("a");
            link.className = "dictionary-item";
            link.href = App.buildDetailLink(item.id);
            link.setAttribute("aria-label", `${item.term ?? ""} 사전 항목 상세 보기`);

            const body = document.createElement("div");
            body.className = "dictionary-item-body";

            const title = document.createElement("h2");
            title.className = "dictionary-item-term";
            title.innerHTML = App.highlight(item.term ?? "", keyword);

            const {text: summaryText, isEmpty} = App.createSummary(item.description);
            const summary = document.createElement("p");
            summary.className = isEmpty ? "dictionary-item-summary is-empty" : "dictionary-item-summary";
            summary.innerHTML = isEmpty ? App.escapeHtml(summaryText) : App.highlight(summaryText, keyword);

            body.appendChild(title);
            body.appendChild(summary);

            const chevron = document.createElement("span");
            chevron.className = "dictionary-item-chevron";
            chevron.setAttribute("aria-hidden", "true");
            chevron.textContent = "›";

            link.appendChild(body);
            link.appendChild(chevron);
            fragment.appendChild(link);
        });

        listContainer.appendChild(fragment);
    },

    updateUrl: () => {
        const params = new URLSearchParams();
        if (App.state.activeKeyword) {
            params.set("keyword", App.state.activeKeyword);
        }
        const queryString = params.toString();
        const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
        history.replaceState(null, "", newUrl);
    },

    fetchDictionaryPage: async page => {
        if (App.state.isLoading || !App.state.hasNext) {
            return;
        }
        App.state.isLoading = true;
        if (page === 0) {
            App.setLoading(true);
            App.setLoadingState("검색 중...");
        }
        try {
            const data = await ApiService.fetchDictionaryPage({
                keyword: App.state.activeKeyword,
                page,
                size: CONFIG.PAGE_SIZE
            });
            const items = Array.isArray(data.content) ? data.content : [];
            if (page === 0) {
                if (typeof data.totalCount === "number") {
                    App.state.totalCount = data.totalCount;
                }
                if (items.length === 0) {
                    if (App.state.activeKeyword) {
                        App.setEmptyState("다른 용어로 다시 시도해 보세요.");
                    } else {
                        App.setEmptyState("등록된 사전 항목이 없습니다.");
                    }
                    App.updateResultCount();
                    App.state.hasNext = false;
                    return;
                }
            }
            App.setResultsVisible();
            App.appendResults(items);
            const sliceHasNext = data.hasNext === true;
            const pageHasNext = typeof data.last === "boolean" ? !data.last : false;
            App.state.hasNext = sliceHasNext || pageHasNext || items.length === CONFIG.PAGE_SIZE;
            App.updateResultCount();
        } catch (error) {
            console.error(error);
            if (page === 0) {
                const {resultCount} = App.elements;
                if (resultCount) {
                    resultCount.textContent = "검색 중 오류가 발생했습니다.";
                }
                App.setEmptyState("잠시 후 다시 시도해 주세요.");
            }
        } finally {
            App.state.isLoading = false;
            if (page === 0) {
                App.setLoading(false);
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
            App.fetchDictionaryPage(App.state.currentPage);
        }
    },

    normalizeKeyword: keyword => (keyword ?? "").trim(),

    clearResults: () => {
        const {listContainer, resultCount} = App.elements;
        if (listContainer) {
            listContainer.innerHTML = "";
        }
        if (resultCount) {
            resultCount.textContent = "";
        }
    },

    startSearch: async keyword => {
        App.clearResults();
        App.resetSearchState();
        App.state.activeKeyword = App.normalizeKeyword(keyword);
        App.state.hasNext = true;
        App.state.currentPage = 0;
        App.updateUrl();
        App.setLoadingState("목록을 불러오는 중입니다.");
        await App.fetchDictionaryPage(0);
        App.maybeLoadNextPage();
    }
};

document.addEventListener("DOMContentLoaded", App.init);
