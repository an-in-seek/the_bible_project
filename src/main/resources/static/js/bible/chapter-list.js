import {BookStore, ChapterStore, TranslationStore} from "/js/storage-util.js?v=2.7";
import {checkAuthStatus} from "/js/auth/auth-check.js";
import {bindNavSelectLabelFit, fitNavSelectLabel, setupDialogScrollLock} from "/js/common-util.js?v=2.4";
import {bindFromBackButton} from "/js/nav-restore.js?v=1.1";
import {initWordStats} from "/js/bible/word-stats.js?v=1.3";

const UI_CLASSES = {
    HIDDEN: "d-none"
};

const bookMemoState = {
    memoId: null,
    content: null,
    loaded: false
};

const API_CONFIG = {
    TRANSLATIONS: "/api/v1/bibles/translations",
    READING_BASE: "/api/v1/bible/reading"
};

const ROUTES = {
    TRANSLATION_LIST: "/web/bible/translation",
    BOOK_LIST: "/web/bible/book",
    CHAPTER_LIST: "/web/bible/chapter",
    CHAPTER_DESCRIPTION: "/web/bible/book/description",
    VERSE_LIST: "/web/bible/verse",
    OVERVIEW_VIDEO: "/web/study/bible-overview-video",
    PUBLIC_READING: "/web/study/public-reading-of-scripture",
    SEARCH: "/web/bible/search"
};

const DomHelper = {
    getElements: () => {
        const get = id => document.getElementById(id);
        return {
            backButton: get("topNavBackButton"),
            translationLink: get("topNavTranslationLink"),
            searchLink: get("topNavSearchLink"),
            translationTypeLabel: get("translationTypeLabel"),
            pageTitleLabel: get("pageTitleLabel"),
            bookDescription: get("bookDescription"),
            bookDescriptionSummary: get("bookDescriptionSummary"),
            overviewVideoBtn: get("overviewVideoBtn"),
            listenBibleBtn: get("listenBibleBtn"),
            gameBtn: get("gameBtn"),
            chapterList: get("chapterList"),
            prevBtn: get("prevBookBtn"),
            bookSelectLink: get("bookSelectLink"),
            bookSelectLinkLabel: get("bookSelectLinkLabel"),
            nextBtn: get("nextBookBtn"),
            bookMemoBtn: get("bookMemoBtn"),
            bookMemoPanel: get("bookMemoPanel"),
            bookMemoInput: get("bookMemoInput"),
            bookMemoSaveBtn: get("bookMemoSaveBtn"),
            bookMemoDeleteBtn: get("bookMemoDeleteBtn"),
            bookMemoCloseBtn: get("bookMemoCloseBtn")
        };
    }
};

const App = {
    elements: null,
    isAuthenticated: false,
    state: {
        translationId: null,
        bookOrder: null,
        fromMyMemo: false,
        fromSearch: false
    },

    init: async () => {
        App.elements = DomHelper.getElements();
        App.initStateFromUrl();
        App.initNav();

        if (!App.state.translationId) {
            App.redirectToTranslation();
            return;
        }

        const translationInfo = await App.ensureTranslationInfo();
        App.updateTranslationLabel(translationInfo);

        if (!App.state.bookOrder) {
            App.redirectToBookList();
            return;
        }

        const books = await App.ensureBookList();
        const bookName = App.resolveBookName(books);
        if (!bookName) {
            App.redirectToBookList();
            return;
        }

        App.updateHeader(translationInfo.type, bookName);
        App.initWordStatsDialog();
        App.setupPrevNext(books);

        await App.initAuthStatus();
        App.bindBookMemoEvents();
        App.loadBookMemo();

        if (!App.renderFromSessionStorage()) {
            await App.fetchChaptersFromAPI();
        } else {
            await App.applyReadBadges();
        }
    },

    initAuthStatus: () => {
        return new Promise(resolve => {
            checkAuthStatus({
                onAuthenticated: () => {
                    App.isAuthenticated = true;
                    resolve();
                },
                onUnauthenticated: () => {
                    App.isAuthenticated = false;
                    resolve();
                },
                onError: () => {
                    App.isAuthenticated = false;
                    resolve();
                }
            });
        });
    },

    fetchReadChapters: async () => {
        if (!App.isAuthenticated) {
            return new Set();
        }
        try {
            const url = `${API_CONFIG.READING_BASE}/chapters/read?translationId=${App.state.translationId}&bookOrder=${App.state.bookOrder}`;
            const response = await fetch(url, {
                method: "GET",
                credentials: "include",
                headers: {Accept: "application/json"}
            });
            if (response.status === 401) {
                App.isAuthenticated = false;
                return new Set();
            }
            if (!response.ok) {
                throw new Error("읽음 상태 조회 실패");
            }
            const data = await response.json();
            return new Set(data.chapterNumbers);
        } catch (error) {
            console.warn(error.message);
            return new Set();
        }
    },

    applyReadBadges: async () => {
        const readChapters = await App.fetchReadChapters();
        if (readChapters.size === 0) {
            return;
        }
        const tiles = document.querySelectorAll(".chapter-tile");
        tiles.forEach(tile => {
            const chapterNumber = parseInt(tile.textContent, 10);
            if (readChapters.has(chapterNumber)) {
                tile.classList.add("chapter-read");
            }
        });
    },

    initStateFromUrl: () => {
        const urlParams = new URLSearchParams(window.location.search);
        const parsedTranslationId = parseInt(urlParams.get("translationId"), 10);
        const parsedBookOrder = parseInt(urlParams.get("bookOrder"), 10);
        const storedTranslationId = TranslationStore.getCurrentTranslationId();
        const storedBookOrder = BookStore.getCurrentBookOrder();
        const canUseStoredBookOrder = Number.isNaN(parsedTranslationId)
            || (storedTranslationId && parsedTranslationId === storedTranslationId);
        App.state.translationId = Number.isNaN(parsedTranslationId)
            ? storedTranslationId
            : parsedTranslationId;
        App.state.bookOrder = Number.isNaN(parsedBookOrder)
            ? (canUseStoredBookOrder ? storedBookOrder : null)
            : parsedBookOrder;
        App.state.fromMyMemo = urlParams.get("from") === "my-memo";
        App.state.fromSearch = urlParams.get("from") === "search";
    },

    initNav: () => {
        const {backButton, translationLink, searchLink, pageTitleLabel, bookSelectLinkLabel} = App.elements;
        App.setupBackButton(backButton);
        if (translationLink) {
            translationLink.classList.remove(UI_CLASSES.HIDDEN);
            translationLink.addEventListener("click", () => {
                const returnUrl = new URL(ROUTES.CHAPTER_LIST, window.location.origin);
                if (App.state.translationId) {
                    returnUrl.searchParams.set("translationId", App.state.translationId);
                }
                if (App.state.bookOrder) {
                    returnUrl.searchParams.set("bookOrder", App.state.bookOrder);
                }
                TranslationStore.saveTranslationReturnPath(`${returnUrl.pathname}${returnUrl.search}`);
            });
        }
        if (searchLink) {
            searchLink.classList.remove(UI_CLASSES.HIDDEN);
        }
        if (pageTitleLabel) {
            pageTitleLabel.classList.remove(UI_CLASSES.HIDDEN);
        }
        bindNavSelectLabelFit(bookSelectLinkLabel);
    },

    setupBackButton: (button) => {
        if (!button) {
            return;
        }
        button.classList.remove(UI_CLASSES.HIDDEN);
        bindFromBackButton(button, {
            backOn: ["my-memo", "search", "history"],
            fallback: () => {
                window.location.href = App.state.translationId
                    ? `${ROUTES.BOOK_LIST}?translationId=${App.state.translationId}`
                    : ROUTES.TRANSLATION_LIST;
            },
        });
    },

    getStoredTranslation: () => ({
        id: TranslationStore.getCurrentTranslationId(),
        type: TranslationStore.getCurrentTranslationType(),
        name: TranslationStore.getCurrentTranslationName(),
        language: TranslationStore.getCurrentTranslationLanguage()
    }),

    hasCompleteTranslation: (stored, targetId) =>
        stored.id === targetId && stored.type && stored.name && stored.language,

    ensureTranslationInfo: async () => {
        const stored = App.getStoredTranslation();
        if (App.hasCompleteTranslation(stored, App.state.translationId)) {
            return stored;
        }
        try {
            const response = await fetch(API_CONFIG.TRANSLATIONS);
            if (!response.ok) {
                throw new Error("번역본 정보를 불러오는 중 오류가 발생했습니다.");
            }
            const translations = await response.json();
            const match = translations.find(item => item.translationId === App.state.translationId);
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

    ensureBookList: async () => {
        const cached = BookStore.getListForTranslation(App.state.translationId);
        if (cached && cached.length > 0) {
            return cached;
        }
        try {
            const response = await fetch(`${API_CONFIG.TRANSLATIONS}/${App.state.translationId}/books`);
            if (!response.ok) {
                throw new Error("데이터를 불러오는 중 오류가 발생했습니다.");
            }
            const data = await response.json();
            BookStore.saveListForTranslation(App.state.translationId, data);
            return data;
        } catch (error) {
            console.warn(error.message);
        }
        return null;
    },

    resolveBookName: books => {
        let bookName = BookStore.getBookName(App.state.translationId, App.state.bookOrder);
        if (!bookName && books) {
            const currentBook = books.find(book => book.bookOrder === App.state.bookOrder);
            if (currentBook) {
                BookStore.saveCurrentBook(currentBook);
                bookName = currentBook.bookName;
            }
        }
        return bookName;
    },

    updateTranslationLabel: translationInfo => {
        if (App.elements.translationTypeLabel && translationInfo.type) {
            App.elements.translationTypeLabel.textContent = translationInfo.type;
        }
    },

    updateHeader: (translationType, bookName) => {
        const {
            translationTypeLabel,
            pageTitleLabel,
            bookSelectLinkLabel,
            bookSelectLink,
            bookDescription,
            overviewVideoBtn
        } = App.elements;
        if (translationTypeLabel && translationType) {
            translationTypeLabel.textContent = translationType;
        }
        if (pageTitleLabel) {
            pageTitleLabel.textContent = bookName;
        }
        if (bookSelectLinkLabel) {
            bookSelectLinkLabel.textContent = bookName;
            fitNavSelectLabel(bookSelectLinkLabel);
        }
        if (bookSelectLink) {
            bookSelectLink.href = `${ROUTES.BOOK_LIST}?translationId=${App.state.translationId}`;
        }
        if (bookDescription) {
            bookDescription.href = `${ROUTES.CHAPTER_DESCRIPTION}?translationId=${App.state.translationId}&bookOrder=${App.state.bookOrder}`;
        }
        if (overviewVideoBtn) {
            overviewVideoBtn.href = `${ROUTES.OVERVIEW_VIDEO}?bookOrder=${App.state.bookOrder}&from=chapter-list`;
        }
        if (App.elements.listenBibleBtn) {
            App.elements.listenBibleBtn.href = `${ROUTES.PUBLIC_READING}?bookOrder=${App.state.bookOrder}&from=chapter-list`;
        }
        if (App.elements.gameBtn) {
            App.elements.gameBtn.href = `/web/game/bible-ox-quiz/map?bookOrder=${App.state.bookOrder}&from=chapter-list`;
        }
    },

    setupPrevNext: books => {
        if (!books || books.length === 0) {
            return;
        }
        App._books = books;
        App.updatePrevNextState();
    },

    updatePrevNextState: () => {
        const books = App._books;
        if (!books) {
            return;
        }
        const currentIndex = books.findIndex(book => book.bookOrder === App.state.bookOrder);
        if (App.elements.prevBtn) {
            App.elements.prevBtn.disabled = currentIndex <= 0;
            App.elements.prevBtn.onclick = () => {
                if (currentIndex > 0) {
                    const prevBook = books[currentIndex - 1];
                    BookStore.saveCurrentBook(prevBook);
                    App.navigateToBook(prevBook.bookOrder, prevBook.bookName);
                }
            };
        }
        if (App.elements.nextBtn) {
            App.elements.nextBtn.disabled = currentIndex >= books.length - 1;
            App.elements.nextBtn.onclick = () => {
                if (currentIndex < books.length - 1) {
                    const nextBook = books[currentIndex + 1];
                    BookStore.saveCurrentBook(nextBook);
                    App.navigateToBook(nextBook.bookOrder, nextBook.bookName);
                }
            };
        }
    },

    renderFromSessionStorage: () => {
        const bookData = BookStore.getDetail(App.state.translationId, App.state.bookOrder);
        if (bookData) {
            App.renderChapters(bookData);
            return true;
        }
        return false;
    },

    renderChapters: data => {
        const {
            bookSelectLinkLabel,
            pageTitleLabel,
            bookDescriptionSummary,
            chapterList
        } = App.elements;
        if (bookSelectLinkLabel) {
            bookSelectLinkLabel.textContent = data.book.bookName;
            fitNavSelectLabel(bookSelectLinkLabel);
        }
        if (pageTitleLabel) {
            pageTitleLabel.textContent = data.book.bookName;
        }
        if (bookDescriptionSummary) {
            bookDescriptionSummary.textContent = data.book.descriptionSummary || "";
        }
        if (chapterList) {
            chapterList.innerHTML = "";
            data.book.chapters.forEach(chapter => {
                const tile = document.createElement("button");
                tile.type = "button";
                tile.className = "chapter-tile";
                tile.textContent = chapter.chapterNumber;
                tile.addEventListener("click", () => {
                    ChapterStore.saveNumber(chapter.chapterNumber);
                    const targetUrl = new URL(ROUTES.VERSE_LIST, window.location.origin);
                    targetUrl.searchParams.set("translationId", App.state.translationId);
                    targetUrl.searchParams.set("bookOrder", App.state.bookOrder);
                    targetUrl.searchParams.set("chapterNumber", chapter.chapterNumber);
                    window.location.href = `${targetUrl.pathname}${targetUrl.search}`;
                });
                chapterList.appendChild(tile);
            });
        }
        BookStore.saveDetail(App.state.translationId, App.state.bookOrder, data);
        window.scrollTo({top: 0, behavior: "smooth"});
        App.applyReadBadges();
    },

    fetchChaptersFromAPI: async () => {
        try {
            const response = await fetch(`${API_CONFIG.TRANSLATIONS}/${App.state.translationId}/books/${App.state.bookOrder}/chapters`);
            if (!response.ok) {
                throw new Error("데이터를 불러오는 중 오류가 발생했습니다.");
            }
            const data = await response.json();
            App.renderChapters(data);
        } catch (error) {
            alert(error.message);
        }
    },

    navigateToBook: async (bookOrder, bookName) => {
        App.state.bookOrder = bookOrder;
        const targetUrl = new URL(ROUTES.CHAPTER_LIST, window.location.origin);
        targetUrl.searchParams.set("translationId", App.state.translationId);
        targetUrl.searchParams.set("bookOrder", App.state.bookOrder);
        history.pushState({translationId: App.state.translationId, bookOrder}, "", `${targetUrl.pathname}${targetUrl.search}`);

        if (bookName) {
            App.updateHeader(TranslationStore.getCurrentTranslationType(), bookName);
        }

        App.updatePrevNextState();

        if (!App.renderFromSessionStorage()) {
            await App.fetchChaptersFromAPI();
        }

        bookMemoState.memoId = null;
        bookMemoState.content = null;
        bookMemoState.loaded = false;
        App.updateBookMemoButton();
        App.loadBookMemo();
    },

    // 책 단위 단어 빈도 통계 (설계 문서: docs/bible/word-frequency-design.md)
    // 이 화면은 새로고침 없이 이전/다음 책으로 이동하므로, 제목을 캡처하지 않고
    // 열 때마다 현재 상태에서 읽는다. 리스너는 한 번만 등록한다.
    initWordStatsDialog: () => {
        initWordStats({
            triggerId: "wordStatsBtn",
            buildEndpoint: () =>
                `/api/v1/bibles/translations/${App.state.translationId}/books/${App.state.bookOrder}/word-stats?limit=100`,
            buildTitle: () => {
                const name = BookStore.getBookName(App.state.translationId, App.state.bookOrder);
                return name ? `${name} 단어 통계` : "단어 통계";
            },
            buildSearchUrl: (word) =>
                `${ROUTES.SEARCH}?keyword=${encodeURIComponent(word)}`
                + `&translationId=${App.state.translationId}&bookOrder=${App.state.bookOrder}`,
        });
    },

    bindBookMemoEvents: () => {
        const el = App.elements;
        if (el.bookMemoBtn) {
            el.bookMemoBtn.addEventListener("click", App.handleBookMemoClick);
        }
        if (el.bookMemoSaveBtn) {
            el.bookMemoSaveBtn.addEventListener("click", App.saveBookMemo);
        }
        if (el.bookMemoDeleteBtn) {
            el.bookMemoDeleteBtn.addEventListener("click", App.deleteBookMemo);
        }
        if (el.bookMemoCloseBtn) {
            el.bookMemoCloseBtn.addEventListener("click", App.closeBookMemoPanel);
        }
        if (el.bookMemoPanel) {
            setupDialogScrollLock(el.bookMemoPanel);
            // backdrop click 시 닫기 — native dialog에서는 e.target===dialog일 때
            el.bookMemoPanel.addEventListener("click", (e) => {
                if (e.target === el.bookMemoPanel) App.closeBookMemoPanel();
            });
        }
    },

    buildBookMemoUrl: () => {
        return `${API_CONFIG.TRANSLATIONS}/${App.state.translationId}/books/${App.state.bookOrder}/book-memo`;
    },

    loadBookMemo: async () => {
        if (!App.isAuthenticated) {
            bookMemoState.memoId = null;
            bookMemoState.content = null;
            bookMemoState.loaded = false;
            App.updateBookMemoButton();
            return;
        }
        try {
            const url = App.buildBookMemoUrl();
            const response = await fetch(url, {
                method: "GET",
                credentials: "include",
                headers: {Accept: "application/json"}
            });
            if (response.status === 204) {
                bookMemoState.memoId = null;
                bookMemoState.content = null;
            } else if (response.ok) {
                const memo = await response.json();
                bookMemoState.memoId = memo.bookMemoId;
                bookMemoState.content = memo.content;
            } else if (response.status === 401) {
                App.isAuthenticated = false;
                bookMemoState.memoId = null;
                bookMemoState.content = null;
            }
        } catch (error) {
            console.warn("책 메모 조회 실패:", error.message);
        }
        bookMemoState.loaded = true;
        App.updateBookMemoButton();
    },

    updateBookMemoButton: () => {
        const btn = App.elements?.bookMemoBtn;
        if (!btn) return;
        const hasMemo = Boolean(bookMemoState.content);
        btn.classList.toggle("book-action-btn-active", hasMemo);
    },

    handleBookMemoClick: () => {
        if (!App.isAuthenticated) {
            const currentUrl = window.location.pathname + window.location.search;
            window.location.href = `/web/auth/login?returnUrl=${encodeURIComponent(currentUrl)}`;
            return;
        }
        App.openBookMemoPanel();
    },

    openBookMemoPanel: () => {
        const panel = App.elements?.bookMemoPanel;
        if (!panel) return;
        const input = App.elements.bookMemoInput;
        input.value = bookMemoState.content || "";
        App.elements.bookMemoDeleteBtn.classList.toggle("d-none", !bookMemoState.memoId);
        panel.showModal();
        input.focus();
        const len = input.value.length;
        input.setSelectionRange(len, len);
    },

    closeBookMemoPanel: () => {
        const panel = App.elements?.bookMemoPanel;
        if (!panel) return;
        panel.close();
    },

    saveBookMemo: async () => {
        const content = App.elements.bookMemoInput.value.trim();
        if (!content) return;
        try {
            const response = await fetch(App.buildBookMemoUrl(), {
                method: "PUT",
                credentials: "include",
                headers: {"Content-Type": "application/json", Accept: "application/json"},
                body: JSON.stringify({content})
            });
            if (response.status === 401) {
                window.location.href = `/web/auth/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`;
                return;
            }
            if (!response.ok) throw new Error("책 메모 저장 실패");
            const memo = await response.json();
            bookMemoState.memoId = memo.bookMemoId;
            bookMemoState.content = memo.content;
            App.updateBookMemoButton();
            App.closeBookMemoPanel();
        } catch (error) {
            alert("책 메모 저장 중 오류가 발생했습니다.");
            console.error(error);
        }
    },

    deleteBookMemo: async () => {
        try {
            const response = await fetch(App.buildBookMemoUrl(), {
                method: "DELETE",
                credentials: "include"
            });
            if (response.status === 401) {
                window.location.href = `/web/auth/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`;
                return;
            }
            if (!response.ok) throw new Error("책 메모 삭제 실패");
            bookMemoState.memoId = null;
            bookMemoState.content = null;
            App.updateBookMemoButton();
            App.closeBookMemoPanel();
        } catch (error) {
            alert("책 메모 삭제 중 오류가 발생했습니다.");
            console.error(error);
        }
    },

    redirectToTranslation: () => {
        window.location.href = ROUTES.TRANSLATION_LIST;
    },

    redirectToBookList: () => {
        const bookUrl = new URL(ROUTES.BOOK_LIST, window.location.origin);
        bookUrl.searchParams.set("translationId", App.state.translationId);
        window.location.href = `${bookUrl.pathname}${bookUrl.search}`;
    }
};

document.addEventListener("DOMContentLoaded", App.init);

window.addEventListener("popstate", async () => {
    App.initStateFromUrl();
    if (!App.state.translationId || !App.state.bookOrder) {
        return;
    }
    const books = App._books || await App.ensureBookList();
    const bookName = App.resolveBookName(books);
    if (bookName) {
        App.updateHeader(TranslationStore.getCurrentTranslationType(), bookName);
    }
    if (App.elements.bookDescription) {
        App.elements.bookDescription.href = `${ROUTES.CHAPTER_DESCRIPTION}?translationId=${App.state.translationId}&bookOrder=${App.state.bookOrder}`;
    }
    if (App.elements.overviewVideoBtn) {
        App.elements.overviewVideoBtn.href = `${ROUTES.OVERVIEW_VIDEO}?bookOrder=${App.state.bookOrder}&from=chapter-list`;
    }
    if (App.elements.listenBibleBtn) {
        App.elements.listenBibleBtn.href = `${ROUTES.PUBLIC_READING}?bookOrder=${App.state.bookOrder}&from=chapter-list`;
    }
    if (App.elements.gameBtn) {
        App.elements.gameBtn.href = `/web/game/bible-ox-quiz/map?bookOrder=${App.state.bookOrder}&from=chapter-list`;
    }
    App.updatePrevNextState();
    if (!App.renderFromSessionStorage()) {
        await App.fetchChaptersFromAPI();
    }
    App.loadBookMemo();
});
