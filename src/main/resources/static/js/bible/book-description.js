import {BookStore, TranslationStore} from "/js/storage-util.js?v=2.7";

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const parsedTranslationId = parseInt(urlParams.get("translationId"), 10);
    const parsedBookOrder = parseInt(urlParams.get("bookOrder"), 10);
    const storedTranslationId = TranslationStore.getCurrentTranslationId();
    const storedBookOrder = BookStore.getCurrentBookOrder();
    const translationId = Number.isNaN(parsedTranslationId)
        ? storedTranslationId
        : parsedTranslationId;
    let bookOrder = Number.isNaN(parsedBookOrder) ? storedBookOrder : parsedBookOrder;
    if (Number.isNaN(parsedBookOrder)
        && !Number.isNaN(parsedTranslationId)
        && storedTranslationId
        && parsedTranslationId !== storedTranslationId) {
        bookOrder = null;
    }

    const state = {
        translationId,
        bookOrder,
        translationType: null,
        translationLanguage: null,
        bookName: null,
    };

    const navDOM = {
        backButton: document.getElementById("topNavBackButton"),
        translationLink: document.getElementById("topNavTranslationLink"),
        searchLink: document.getElementById("topNavSearchLink"),
        translationTypeLabel: document.getElementById("translationTypeLabel"),
        pageTitleLabel: document.getElementById("pageTitleLabel"),
    };

    const dom = {
        translationTypeLabel: navDOM.translationTypeLabel,
        pageTitleLabel: navDOM.pageTitleLabel,
        summaryLabel: document.getElementById("summaryLabel"),
        summary: document.getElementById("summary"),
        authorLabel: document.getElementById("authorLabel"),
        author: document.getElementById("author"),
        writtenYearLabel: document.getElementById("writtenYearLabel"),
        writtenYear: document.getElementById("writtenYear"),
        historicalPeriodLabel: document.getElementById("historicalPeriodLabel"),
        historicalPeriod: document.getElementById("historicalPeriod"),
        backgroundLabel: document.getElementById("backgroundLabel"),
        background: document.getElementById("background"),
        contentLabel: document.getElementById("contentLabel"),
        content: document.getElementById("content"),
        prevBtn: document.getElementById("prevBookBtn"),
        nextBtn: document.getElementById("nextBookBtn"),
        chapterSelectLinkLabel: document.getElementById("chapterSelectLinkLabel"),
        chapterSelectLink: document.getElementById("bookSelectLink"),
    };

    const init = async () => {
        setupBackButton();
        initNav();

        if (!state.translationId) {
            redirectToTranslation();
            return;
        }

        const translationInfo = await ensureTranslationInfo();
        state.translationType = translationInfo.type;
        state.translationLanguage = translationInfo.language;

        if (!state.bookOrder) {
            redirectToBookList();
            return;
        }

        const books = await ensureBookList();
        state.bookName = resolveBookName(books);
        if (!state.bookName) {
            redirectToBookList();
            return;
        }

        updateHeader();
        updateLanguageLabels();
        updateDescriptionUrl(state.bookOrder);
        setupPrevNext(books);

        await loadBookDetail();
    };

    const setupBackButton = () => {
        if (!navDOM.backButton) {
            return;
        }
        navDOM.backButton.classList.remove("d-none");
        navDOM.backButton.addEventListener("click", () => {
            if (history.length > 1) {
                history.back();
                return;
            }
            const targetUrl = state.translationId && state.bookOrder
                ? `/web/bible/chapter?translationId=${state.translationId}&bookOrder=${state.bookOrder}`
                : "/web/bible/translation";
            window.location.href = targetUrl;
        });
    };

    const initNav = () => {
        if (navDOM.translationLink) {
            navDOM.translationLink.classList.remove("d-none");
            navDOM.translationLink.addEventListener("click", () => {
                const returnUrl = new URL("/web/bible/book/description", window.location.origin);
                if (state.translationId) {
                    returnUrl.searchParams.set("translationId", state.translationId);
                }
                if (state.bookOrder) {
                    returnUrl.searchParams.set("bookOrder", state.bookOrder);
                }
                TranslationStore.saveTranslationReturnPath(`${returnUrl.pathname}${returnUrl.search}`);
            });
        }
        if (navDOM.searchLink) {
            navDOM.searchLink.classList.remove("d-none");
        }
        if (navDOM.pageTitleLabel) {
            navDOM.pageTitleLabel.classList.remove("d-none");
        }
    };

    const getStoredTranslation = () => ({
        id: TranslationStore.getCurrentTranslationId(),
        type: TranslationStore.getCurrentTranslationType(),
        name: TranslationStore.getCurrentTranslationName(),
        language: TranslationStore.getCurrentTranslationLanguage(),
    });

    const hasCompleteTranslation = (stored, targetId) =>
        stored.id === targetId && stored.type && stored.name && stored.language;

    const ensureTranslationInfo = async () => {
        const stored = getStoredTranslation();
        if (hasCompleteTranslation(stored, state.translationId)) {
            return stored;
        }
        try {
            const response = await fetch("/api/v1/bibles/translations");
            if (!response.ok) {
                throw new Error("번역본 정보를 불러오는 중 오류가 발생했습니다.");
            }
            const translations = await response.json();
            const match = translations.find(item => item.translationId === state.translationId);
            if (match) {
                const translation = {
                    id: match.translationId,
                    name: match.translationName,
                    type: match.translationType,
                    language: match.translationLanguage,
                };
                TranslationStore.saveCurrentTranslation(translation);
                return translation;
            }
        } catch (error) {
            console.warn(error.message);
        }
        return stored;
    };

    const ensureBookList = async () => {
        const cached = BookStore.getListForTranslation(state.translationId);
        if (cached && cached.length > 0) {
            return cached;
        }
        try {
            const response = await fetch(`/api/v1/bibles/translations/${state.translationId}/books`);
            if (!response.ok) {
                throw new Error("데이터를 불러오는 중 오류가 발생했습니다.");
            }
            const data = await response.json();
            BookStore.saveListForTranslation(state.translationId, data);
            return data;
        } catch (error) {
            console.warn(error.message);
        }
        return null;
    };

    const resolveBookName = books => {
        let bookName = BookStore.getBookName(state.translationId, state.bookOrder);
        if (!bookName && books) {
            const currentBook = books.find(book => book.bookOrder === state.bookOrder);
            if (currentBook) {
                BookStore.saveCurrentBook(currentBook);
                bookName = currentBook.bookName;
            }
        }
        return bookName;
    };

    const updateHeader = () => {
        if (dom.translationTypeLabel) {
            dom.translationTypeLabel.textContent = state.translationType;
        }
        if (dom.pageTitleLabel) {
            dom.pageTitleLabel.textContent = state.bookName;
        }
        if (dom.chapterSelectLinkLabel) {
            dom.chapterSelectLinkLabel.textContent = state.bookName;
        }
        if (dom.chapterSelectLink) {
            dom.chapterSelectLink.href = `/web/bible/chapter?translationId=${state.translationId}&bookOrder=${state.bookOrder}`;
        }
    };

    const updateLanguageLabels = () => {
        if (!state.translationLanguage) {
            return;
        }
        if (state.translationLanguage === "ko") {
            dom.summaryLabel.textContent = "요약";
            dom.authorLabel.textContent = "저자";
            dom.writtenYearLabel.textContent = "년도";
            dom.historicalPeriodLabel.textContent = "시대";
            dom.backgroundLabel.textContent = "배경";
            dom.contentLabel.textContent = "내용";
            return;
        }
        if (state.translationLanguage === "en") {
            dom.summaryLabel.textContent = "Summary";
            dom.authorLabel.textContent = "Author";
            dom.writtenYearLabel.textContent = "Written Year";
            dom.historicalPeriodLabel.textContent = "Historical Period";
            dom.backgroundLabel.textContent = "Background";
            dom.contentLabel.textContent = "Content";
        }
    };

    const updateDescriptionUrl = currentBookOrder => {
        const targetUrl = new URL("/web/bible/book/description", window.location.origin);
        targetUrl.searchParams.set("translationId", state.translationId);
        targetUrl.searchParams.set("bookOrder", currentBookOrder);
        history.replaceState(null, "", `${targetUrl.pathname}${targetUrl.search}`);
    };

    let _books = null;

    const setupPrevNext = books => {
        if (!books || books.length === 0) {
            return;
        }
        _books = books;
        updatePrevNextState();
    };

    const updatePrevNextState = () => {
        if (!_books) {
            return;
        }
        const currentIndex = _books.findIndex(book => book.bookOrder === state.bookOrder);
        if (dom.prevBtn) {
            dom.prevBtn.disabled = currentIndex <= 0;
            dom.prevBtn.onclick = () => {
                if (currentIndex > 0) {
                    navigateToBook(_books[currentIndex - 1]);
                }
            };
        }
        if (dom.nextBtn) {
            dom.nextBtn.disabled = currentIndex >= _books.length - 1;
            dom.nextBtn.onclick = () => {
                if (currentIndex < _books.length - 1) {
                    navigateToBook(_books[currentIndex + 1]);
                }
            };
        }
    };

    const navigateToBook = async book => {
        BookStore.saveCurrentBook(book);
        state.bookOrder = book.bookOrder;
        state.bookName = book.bookName;

        const targetUrl = new URL("/web/bible/book/description", window.location.origin);
        targetUrl.searchParams.set("translationId", state.translationId);
        targetUrl.searchParams.set("bookOrder", state.bookOrder);
        history.pushState({translationId: state.translationId, bookOrder: state.bookOrder}, "", `${targetUrl.pathname}${targetUrl.search}`);

        updateHeader();
        if (dom.chapterSelectLink) {
            dom.chapterSelectLink.href = `/web/bible/chapter?translationId=${state.translationId}&bookOrder=${state.bookOrder}`;
        }
        updatePrevNextState();
        await loadBookDetail();
    };

    const loadBookDetail = async () => {
        try {
            const response = await fetch(`/api/v1/bibles/translations/${state.translationId}/books/${state.bookOrder}`);
            if (!response.ok) {
                throw new Error("책 정보를 불러오는 데 실패했습니다.");
            }
            const data = await response.json();
            if (dom.pageTitleLabel) {
                dom.pageTitleLabel.textContent = data.bookName;
            }
            if (dom.summary) {
                dom.summary.textContent = data.description.summary;
            }
            if (dom.author) {
                dom.author.textContent = data.description.author;
            }
            if (dom.writtenYear) {
                dom.writtenYear.textContent = data.description.writtenYear;
            }
            if (dom.historicalPeriod) {
                dom.historicalPeriod.textContent = data.description.historicalPeriod;
            }
            if (dom.background) {
                dom.background.textContent = data.description.background;
            }
            if (dom.content) {
                dom.content.innerHTML = data.description.content;
            }
            if (dom.chapterSelectLinkLabel) {
                dom.chapterSelectLinkLabel.textContent = data.bookName;
            }
        } catch (error) {
            alert("에러: " + error.message);
        }
    };

    const redirectToTranslation = () => {
        window.location.href = "/web/bible/translation";
    };

    const redirectToBookList = () => {
        const bookUrl = new URL("/web/bible/book", window.location.origin);
        bookUrl.searchParams.set("translationId", state.translationId);
        window.location.href = `${bookUrl.pathname}${bookUrl.search}`;
    };

    window.addEventListener("popstate", async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const parsedBookOrder = parseInt(urlParams.get("bookOrder"), 10);
        if (!Number.isNaN(parsedBookOrder)) {
            state.bookOrder = parsedBookOrder;
            const books = _books || await ensureBookList();
            state.bookName = resolveBookName(books);
            updateHeader();
            if (dom.chapterSelectLink) {
                dom.chapterSelectLink.href = `/web/bible/chapter?translationId=${state.translationId}&bookOrder=${state.bookOrder}`;
            }
            updatePrevNextState();
            await loadBookDetail();
        }
    });

    init();
});
