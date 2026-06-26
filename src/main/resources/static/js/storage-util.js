// /js/storage-util.js

// 스토리지 키 상수
export const STORAGE_KEYS = Object.freeze({
    CURRENT_TRANSLATION: "currentTranslation",
    TRANSLATION_RETURN_PATH: "translationReturnPath",
    CURRENT_BOOK: "currentBook",
    BOOK_DATA_PREFIX: "bible_book",
    TRANSLATION_BOOKS_PREFIX: "bible_translation",
    CHAPTER_ID: "chapterId",
    CHAPTER_NUMBER: "chapterNumber",
    VERSE_ID: "verseId",
    VERSE_NUMBER: "verseNumber",
    LAST_READ_LOCATION: "lastReadLocation",
    THEME_PREFERENCE: "themePreference",
    // 앱 설치 유도 배너 — 설계: docs/googleplay/app-install-banner-prd.md (12장)
    APP_INSTALL_BANNER_DISMISSED_AT: "elseeker_app_install_banner_dismissed_at",
    APP_INSTALL_BANNER_SHOWN_IN_SESSION: "elseeker_app_install_banner_shown_in_session"
});

// === Local Storage Utility ===
export const LocalStore = {
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },
    get(key) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    },
    remove(key) {
        localStorage.removeItem(key);
    },
    consume(key) {
        const item = this.get(key);
        this.remove(key);
        return item;
    }
};

// === Session Storage Utility ===
export const SessionStore = {
    set(key, value) {
        sessionStorage.setItem(key, JSON.stringify(value));
    },
    get(key) {
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    },
    remove(key) {
        sessionStorage.removeItem(key);
    },
    consume(key) {
        const item = this.get(key);
        this.remove(key);
        return item;
    }
};

// 번역본 관련
export const TranslationStore = {
    saveCurrentTranslation(translation) {
        LocalStore.set(STORAGE_KEYS.CURRENT_TRANSLATION, translation);
    },
    getCurrentTranslationId() {
        const currentTranslation = LocalStore.get(STORAGE_KEYS.CURRENT_TRANSLATION);
        return currentTranslation ? parseInt(currentTranslation.id) : null;

    },
    getCurrentTranslationType() {
        const currentTranslation = LocalStore.get(STORAGE_KEYS.CURRENT_TRANSLATION);
        return currentTranslation ? currentTranslation.type : null;
    },
    getCurrentTranslationName() {
        const currentTranslation = LocalStore.get(STORAGE_KEYS.CURRENT_TRANSLATION);
        return currentTranslation ? currentTranslation.name : null;
    },
    getCurrentTranslationLanguage() {
        const currentTranslation = LocalStore.get(STORAGE_KEYS.CURRENT_TRANSLATION);
        return currentTranslation ? currentTranslation.language : null;
    },
    saveTranslationReturnPath(path) {
        SessionStore.set(STORAGE_KEYS.TRANSLATION_RETURN_PATH, path);
    },
    consumeTranslationReturnPath() {
        return SessionStore.consume(STORAGE_KEYS.TRANSLATION_RETURN_PATH) || "/web/bible/book";
    }
}

// 책 관련
export const BookStore = {
    saveCurrentBook(book) {
        LocalStore.set(STORAGE_KEYS.CURRENT_BOOK, book);
    },
    getCurrentBookOrder() {
        const currentBook = LocalStore.get(STORAGE_KEYS.CURRENT_BOOK);
        return currentBook ? parseInt(currentBook.bookOrder) : null;
    },
    getBookName(translationId, bookOrder) {
        const key = `${STORAGE_KEYS.TRANSLATION_BOOKS_PREFIX}_${translationId}`;
        const books = SessionStore.get(key);
        if (!books) {
            return null;
        }
        const book = books.find(book => book.bookOrder === bookOrder);
        return book ? book.bookName : null;
    },
    saveListForTranslation(translationId, books) {
        const key = `${STORAGE_KEYS.TRANSLATION_BOOKS_PREFIX}_${translationId}`;
        SessionStore.set(key, books);
    },
    getListForTranslation(translationId) {
        const key = `${STORAGE_KEYS.TRANSLATION_BOOKS_PREFIX}_${translationId}`;
        return SessionStore.get(key);
    },
    saveDetail(translationId, bookOrder, bookDetail) {
        const key = `${STORAGE_KEYS.BOOK_DATA_PREFIX}_${translationId}_${bookOrder}`;
        SessionStore.set(key, bookDetail);
    },
    getDetail(translationId, bookOrder) {
        const key = `${STORAGE_KEYS.BOOK_DATA_PREFIX}_${translationId}_${bookOrder}`;
        return SessionStore.get(key);
    },
};

// 장 관련
export const ChapterStore = {
    saveNumber(number) {
        const parsed = parseInt(number);
        if (!isNaN(parsed)) {
            LocalStore.set(STORAGE_KEYS.CHAPTER_NUMBER, parsed);
        } else {
            console.warn("ChapterStore.saveNumber: 유효하지 않은 chapterNumber:", number);
        }
    },
    getNumber() {
        return parseInt(LocalStore.get(STORAGE_KEYS.CHAPTER_NUMBER));
    }
};

// 절 관련
export const VerseStore = {
    saveNumber(number) {
        const parsed = parseInt(number);
        if (!isNaN(parsed)) {
            SessionStore.set(STORAGE_KEYS.VERSE_NUMBER, parsed);
        } else {
            console.warn("VerseStore.saveNumber: 유효하지 않은 verseNumber:", number);
        }
    },
    consumeVerseNumber() {
        return SessionStore.consume(STORAGE_KEYS.VERSE_NUMBER);
    }
};

// 테마 선호도 관련 — 'light' | 'dark' | null(=시스템 따름)
export const ThemeStore = {
    get() {
        try {
            return localStorage.getItem(STORAGE_KEYS.THEME_PREFERENCE);
        } catch (e) {
            return null;
        }
    },
    set(value) {
        if (value !== "light" && value !== "dark") {
            return;
        }
        try {
            localStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, value);
        } catch (e) {
            // localStorage 차단 환경 — 영속화 실패해도 기능은 동작
        }
    },
    clear() {
        try {
            localStorage.removeItem(STORAGE_KEYS.THEME_PREFERENCE);
        } catch (e) {
            // ignore
        }
    }
};

// === Bible Reader Preferences ===
// 구절 본문 글씨 크기 단계(1~5) 영속화. 디바이스별 분리(서버 동기화 없음).
const BIBLE_READER_FONT_STEP_KEY = "bibleReaderFontStep";
const BIBLE_READER_FONT_STEP_DEFAULT = 3;

export const BibleReaderStore = {
    getFontStep() {
        // LocalStore.get 내부 JSON.parse 가 깨진 값에 throw 할 수 있으므로 흡수.
        try {
            const value = parseInt(LocalStore.get(BIBLE_READER_FONT_STEP_KEY), 10);
            return (Number.isInteger(value) && value >= 1 && value <= 5)
                ? value
                : BIBLE_READER_FONT_STEP_DEFAULT;
        } catch (e) {
            return BIBLE_READER_FONT_STEP_DEFAULT;
        }
    },
    saveFontStep(step) {
        const parsed = parseInt(step, 10);
        if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 5) {
            try {
                LocalStore.set(BIBLE_READER_FONT_STEP_KEY, parsed);
            } catch (e) {
                // storage 차단/할당 실패 환경 — 영속화 실패해도 기능은 동작
            }
        }
    }
};

// 마지막 읽기 위치 관련
export const LastReadStore = {
    save({translationId, bookOrder, chapterNumber}) {
        const parsedTranslationId = parseInt(translationId);
        const parsedBookOrder = parseInt(bookOrder);
        const parsedChapterNumber = parseInt(chapterNumber);
        if ([parsedTranslationId, parsedBookOrder, parsedChapterNumber].some(Number.isNaN)) {
            console.warn("LastReadStore.save: 유효하지 않은 위치 정보", {
                translationId,
                bookOrder,
                chapterNumber,
            });
            return;
        }
        LocalStore.set(STORAGE_KEYS.LAST_READ_LOCATION, {
            translationId: parsedTranslationId,
            bookOrder: parsedBookOrder,
            chapterNumber: parsedChapterNumber,
        });
    },
    get() {
        const stored = LocalStore.get(STORAGE_KEYS.LAST_READ_LOCATION);
        if (!stored) {
            return null;
        }
        const parsedTranslationId = parseInt(stored.translationId);
        const parsedBookOrder = parseInt(stored.bookOrder);
        const parsedChapterNumber = parseInt(stored.chapterNumber);
        if ([parsedTranslationId, parsedBookOrder, parsedChapterNumber].some(Number.isNaN)) {
            return null;
        }
        return {
            translationId: parsedTranslationId,
            bookOrder: parsedBookOrder,
            chapterNumber: parsedChapterNumber,
        };
    },
    clear() {
        LocalStore.remove(STORAGE_KEYS.LAST_READ_LOCATION);
    }
};

