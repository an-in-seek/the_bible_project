import {BookStore, TranslationStore} from "/js/storage-util.js?v=2.7";

const UI_CLASSES = {
    HIDDEN: "d-none",
    COLLAPSED: "collapsed"
};

const STORAGE_KEYS = {
    SECTION_STATE: "bookList_sectionState"
};

const API_CONFIG = {
    TRANSLATIONS: "/api/v1/bibles/translations"
};

const ROUTES = {
    TRANSLATION_LIST: "/web/bible/translation",
    BOOK_LIST: "/web/bible/book",
    CHAPTER_LIST: "/web/bible/chapter"
};

const DomHelper = {
    getElements: () => {
        const get = id => document.getElementById(id);
        return {
            translationLink: get("topNavTranslationLink"),
            searchLink: get("topNavSearchLink"),
            translationTypeLabel: get("translationTypeLabel"),
            pageTitleLabel: get("pageTitleLabel"),
            oldTestamentList: get("oldTestamentList"),
            oldTestamentCount: get("oldTestamentCount"),
            oldTestamentToggle: get("oldTestamentToggle"),
            newTestamentList: get("newTestamentList"),
            newTestamentCount: get("newTestamentCount"),
            newTestamentToggle: get("newTestamentToggle"),
            bookSearchInput: get("bookSearchInput"),
            bookSearchClear: get("bookSearchClear"),
            bookSearchEmpty: get("bookSearchEmpty")
        };
    }
};

const SectionToggle = {
    loadState: () => {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEYS.SECTION_STATE);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    },

    saveState: state => {
        sessionStorage.setItem(STORAGE_KEYS.SECTION_STATE, JSON.stringify(state));
    },

    isExpanded: sectionKey => {
        const state = SectionToggle.loadState();
        return state[sectionKey] !== false;
    },

    toggle: sectionKey => {
        const state = SectionToggle.loadState();
        const currentlyExpanded = state[sectionKey] !== false;
        state[sectionKey] = !currentlyExpanded;
        SectionToggle.saveState(state);
        return !currentlyExpanded;
    },

    apply: (toggleButton, bodyElement, expanded) => {
        if (!toggleButton || !bodyElement) return;
        toggleButton.setAttribute("aria-expanded", String(expanded));
        bodyElement.classList.toggle(UI_CLASSES.COLLAPSED, !expanded);
    },

    init: (toggleButton, bodyElement, sectionKey) => {
        if (!toggleButton || !bodyElement) return;

        const expanded = SectionToggle.isExpanded(sectionKey);
        SectionToggle.apply(toggleButton, bodyElement, expanded);

        toggleButton.addEventListener("click", () => {
            const newExpanded = SectionToggle.toggle(sectionKey);
            SectionToggle.apply(toggleButton, bodyElement, newExpanded);
        });
    }
};

const App = {
    elements: null,
    state: {
        translationId: null,
        allBooks: []
    },

    init: async () => {
        App.elements = DomHelper.getElements();
        App.initNav();
        App.initSectionToggles();

        App.state.translationId = App.getTranslationId();
        if (!App.state.translationId) {
            window.location.href = ROUTES.TRANSLATION_LIST;
            return;
        }

        const translationInfo = await App.ensureTranslationInfo(App.state.translationId);
        App.updateTranslationLabels(translationInfo);

        if (!App.renderFromSessionStorage(App.state.translationId)) {
            await App.fetchBooksFromAPI(App.state.translationId);
        }

        App.initBookSearch();
    },

    initNav: () => {
        const {translationLink, searchLink, pageTitleLabel} = App.elements;
        if (translationLink) {
            translationLink.classList.remove(UI_CLASSES.HIDDEN);
            translationLink.addEventListener("click", () => {
                TranslationStore.saveTranslationReturnPath(ROUTES.BOOK_LIST);
            });
        }
        if (searchLink) {
            searchLink.classList.remove(UI_CLASSES.HIDDEN);
        }
        if (pageTitleLabel) {
            pageTitleLabel.classList.remove(UI_CLASSES.HIDDEN);
        }
    },

    initSectionToggles: () => {
        SectionToggle.init(App.elements.oldTestamentToggle, App.elements.oldTestamentList, "old");
        SectionToggle.init(App.elements.newTestamentToggle, App.elements.newTestamentList, "new");
    },

    getTranslationId: () => {
        const urlParams = new URLSearchParams(window.location.search);
        const translationIdParam = parseInt(urlParams.get("translationId"), 10);
        return Number.isNaN(translationIdParam)
            ? TranslationStore.getCurrentTranslationId()
            : translationIdParam;
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

    updateTranslationLabels: translationInfo => {
        const {translationTypeLabel, pageTitleLabel} = App.elements;
        if (translationTypeLabel && translationInfo.type) {
            translationTypeLabel.textContent = translationInfo.type;
        }
        if (pageTitleLabel && translationInfo.name) {
            pageTitleLabel.textContent = translationInfo.name;
        }
    },

    renderFromSessionStorage: translationId => {
        const books = BookStore.getListForTranslation(translationId);
        if (books) {
            App.renderBooks(books, translationId);
            return true;
        }
        return false;
    },

    createBookButton: (book, translationId) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "book-tile";
        button.textContent = book.bookName;
        button.dataset.bookId = book.bookId;
        button.dataset.bookName = book.bookName;
        button.addEventListener("click", () => {
            BookStore.saveCurrentBook(book);
            const targetUrl = new URL(ROUTES.CHAPTER_LIST, window.location.origin);
            targetUrl.searchParams.set("translationId", translationId);
            targetUrl.searchParams.set("bookOrder", book.bookOrder);
            window.location.href = `${targetUrl.pathname}${targetUrl.search}`;
        });
        return button;
    },

    renderGroup: (list, listElement, countElement, translationId) => {
        if (!listElement) {
            return;
        }
        listElement.innerHTML = "";
        list.forEach(book => listElement.appendChild(App.createBookButton(book, translationId)));
        if (countElement) {
            countElement.textContent = `${list.length}권`;
        }
    },

    renderBooks: (books, translationId) => {
        App.state.allBooks = books;
        const oldTestament = [];
        const newTestament = [];
        books.forEach(book => {
            if (book.testamentType === "OLD") {
                oldTestament.push(book);
            } else if (book.testamentType === "NEW") {
                newTestament.push(book);
            }
        });
        App.renderGroup(oldTestament, App.elements.oldTestamentList, App.elements.oldTestamentCount, translationId);
        App.renderGroup(newTestament, App.elements.newTestamentList, App.elements.newTestamentCount, translationId);
        BookStore.saveListForTranslation(translationId, books);
    },

    initBookSearch: () => {
        const {bookSearchInput, bookSearchClear} = App.elements;
        if (!bookSearchInput) return;

        bookSearchInput.addEventListener("input", () => {
            const keyword = bookSearchInput.value.trim();
            bookSearchClear.classList.toggle(UI_CLASSES.HIDDEN, keyword.length === 0);
            App.filterBooks(keyword);
        });

        bookSearchClear.addEventListener("click", () => {
            bookSearchInput.value = "";
            bookSearchClear.classList.add(UI_CLASSES.HIDDEN);
            App.filterBooks("");
            bookSearchInput.focus();
        });
    },

    filterBooks: keyword => {
        const {allBooks} = App.state;
        const translationId = App.state.translationId;
        if (!allBooks.length) return;

        const filtered = keyword
            ? allBooks.filter(book => book.bookName.includes(keyword))
            : allBooks;

        const oldTestament = [];
        const newTestament = [];
        filtered.forEach(book => {
            if (book.testamentType === "OLD") oldTestament.push(book);
            else if (book.testamentType === "NEW") newTestament.push(book);
        });

        App.renderGroup(oldTestament, App.elements.oldTestamentList, App.elements.oldTestamentCount, translationId);
        App.renderGroup(newTestament, App.elements.newTestamentList, App.elements.newTestamentCount, translationId);

        const {oldTestamentToggle, oldTestamentList, newTestamentToggle, newTestamentList, bookSearchEmpty} = App.elements;

        const oldSection = oldTestamentToggle?.closest(".book-section");
        const newSection = newTestamentToggle?.closest(".book-section");

        if (oldSection) oldSection.classList.toggle(UI_CLASSES.HIDDEN, oldTestament.length === 0);
        if (newSection) newSection.classList.toggle(UI_CLASSES.HIDDEN, newTestament.length === 0);

        if (keyword && oldTestament.length > 0) SectionToggle.apply(oldTestamentToggle, oldTestamentList, true);
        if (keyword && newTestament.length > 0) SectionToggle.apply(newTestamentToggle, newTestamentList, true);

        if (!keyword) {
            if (oldSection) oldSection.classList.remove(UI_CLASSES.HIDDEN);
            if (newSection) newSection.classList.remove(UI_CLASSES.HIDDEN);
            SectionToggle.apply(oldTestamentToggle, oldTestamentList, SectionToggle.isExpanded("old"));
            SectionToggle.apply(newTestamentToggle, newTestamentList, SectionToggle.isExpanded("new"));
        }

        if (bookSearchEmpty) {
            bookSearchEmpty.classList.toggle(UI_CLASSES.HIDDEN, filtered.length > 0 || !keyword);
        }
    },

    fetchBooksFromAPI: async translationId => {
        try {
            const response = await fetch(`${API_CONFIG.TRANSLATIONS}/${translationId}/books`);
            if (!response.ok) {
                throw new Error("데이터를 불러오는 중 오류가 발생했습니다.");
            }
            const data = await response.json();
            App.renderBooks(data, translationId);
        } catch (error) {
            alert(error.message);
        }
    }
};

document.addEventListener("DOMContentLoaded", App.init);
