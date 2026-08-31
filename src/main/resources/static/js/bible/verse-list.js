import {BibleReaderStore, BookStore, ChapterStore, LastReadStore, TranslationStore, VerseStore} from "/js/storage-util.js?v=2.7";
import {applyOAuthBackGuardIfNeeded, buildLoginRedirectUrl, checkAuthStatus, refreshAccessToken} from "/js/auth/auth-check.js";
import {bindNavSelectLabelFit, fitNavSelectLabel, setupDialogScrollLock} from "/js/common-util.js?v=2.4";
import {showConfirm} from "/js/confirm-dialog.js?v=1.0";
import {bindFromBackButton} from "/js/nav-restore.js?v=1.1";
import {initWordStats} from "/js/bible/word-stats.js?v=1.7";

const UI_CLASSES = {
    HIDDEN: "d-none"
};

const API_CONFIG = {
    TRANSLATIONS: "/api/v1/bibles/translations",
    MEMOS_BASE: "/api/v1/bibles/translations",
    HIGHLIGHTS_BASE: "/api/v1/bibles/translations",
    READING_BASE: "/api/v1/bible/reading"
};

const ROUTES = {
    TRANSLATION_LIST: "/web/bible/translation",
    BOOK_LIST: "/web/bible/book",
    CHAPTER_LIST: "/web/bible/chapter",
    VERSE_LIST: "/web/bible/verse",
    SEARCH: "/web/bible/search"
};

const HIGHLIGHT_COLORS = [
    {id: "yellow", label: "노랑", className: "verse-highlight-yellow"},
    {id: "green", label: "초록", className: "verse-highlight-green"},
    {id: "pink", label: "핑크", className: "verse-highlight-pink"},
    {id: "blue", label: "파랑", className: "verse-highlight-blue"},
    {id: "purple", label: "보라", className: "verse-highlight-purple"},
    {id: "orange", label: "주황", className: "verse-highlight-orange"}
];

const state = {
    translationId: null,
    translationType: null,
    translationName: null,
    compareTranslationId: null,
    compareTranslationType: null,
    compareTranslationName: null,
    bookOrder: null,
    bookName: null,
    chapterNumber: null,
    verseNumber: null,
    // 사전에서 넘어온 표제어 강조. verseNumber 와 달리 첫 렌더 뒤에도 살아 있어야 한다 —
    // 대역을 켜고 끄면 같은 장을 다시 그리므로 그때 다시 칠해야 한다.
    // 설계 문서: docs/bible/bible-verse-word-focus-design.md §6.2
    focusWord: null,
    focusVerseNumber: null,
    fromSearch: false,
    fromMypage: false,
    fromMyMemo: false
};

const selection = {
    selected: new Set(),
    menuOpen: false,
    highlightMap: new Map()
};

const memoState = {
    auth: createAuthState("메모 기능은 로그인 후 사용할 수 있습니다."),
    cache: new Map()
};

const highlightState = {
    auth: createAuthState("형광펜 기능은 로그인 후 사용할 수 있습니다.")
};

const readState = {
    auth: createAuthState("읽음 표시는 로그인 후 사용할 수 있습니다."),
    isRead: false,
    loading: false,
    loadingChapterKey: null
};

const chapterMemoState = {
    memoId: null,
    content: null,
    loaded: false
};

const chapterState = {
    loadToken: 0,
    dirtyMemos: new Set(),
    dirtyHighlights: new Set(),
    readDirty: false,
    status: "idle",
    stateLoadPromise: null,
    restoreVerseNumber: null // 대역 토글로 같은 장을 다시 그릴 때 읽던 자리를 지킨다
};

const VERSE_FONT_SIZES = {
    1: "0.875rem",
    2: "1.0rem",
    3: "1.125rem",
    4: "1.3125rem",
    5: "1.5rem"
};
const FONT_STEP_LABELS = {1: "가장 작게", 2: "작게", 3: "기본", 4: "크게", 5: "가장 크게"};
const DEFAULT_FONT_STEP = 3;

/** `bible_word.term` 의 컬럼 길이. 실제 표제어 최대는 9자라 손으로 만든 URL 만 걸린다. */
const FOCUS_WORD_MAX_LENGTH = 50;
const HANGUL_SYLLABLE = /[가-힣]/;

const fontState = {
    step: DEFAULT_FONT_STEP,
    expanded: false
};

// 대역 비교 (설계 문서: docs/bible/bible-compare-design.md)
const compareState = {
    verses: [],      // 현재 장의 대역 절 목록
    error: null,     // 문자열이면 로딩 실패 — 대역 칸에 그대로 보여 준다
    expanded: false  // 번역본 선택 패널 열림 여부
};

const COMPARE_TRANSLATION_KEY = "bibleCompareTranslationId";

/**
 * 대역 번역본 선택은 storage-util.js 가 아니라 이 화면에 둔다.
 * 그 모듈은 15개 파일이 `?v=2.7` 로 import 하고 있어, export 를 늘리면 여기서만 `?v=` 를
 * 올릴 수 없다 — 올리면 URL 이 달라져 모듈 인스턴스가 둘로 갈라지고, 안 올리면 캐시된
 * 옛 사본에 새 export 가 없어 import 가 깨진다.
 */
const CompareStore = {
    get() {
        try {
            const parsed = parseInt(localStorage.getItem(COMPARE_TRANSLATION_KEY), 10);
            return Number.isInteger(parsed) ? parsed : null;
        } catch (e) {
            return null; // storage 차단 환경
        }
    },
    save(translationId) {
        try {
            if (translationId) {
                localStorage.setItem(COMPARE_TRANSLATION_KEY, String(translationId));
            } else {
                localStorage.removeItem(COMPARE_TRANSLATION_KEY);
            }
        } catch (e) {
            // 영속화에 실패해도 이번 세션 동안은 동작한다
        }
    }
};

const HTML_ESCAPES = {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"};

let elements = null;

function createAuthState(message) {
    return {
        checked: false,
        allowed: false,
        checking: false,
        redirected: false,
        message
    };
}

function getElements() {
    const get = id => document.getElementById(id);
    return {
        backButton: get("topNavBackButton"),
        translationLink: get("topNavTranslationLink"),
        searchLink: get("topNavSearchLink"),
        translationTypeLabel: get("translationTypeLabel"),
        pageTitleLabel: get("pageTitleLabel"),
        verseTable: get("verseTableBody"),
        prevBtn: get("prevChapterBtn"),
        markReadBtn: get("markReadBtn"),
        chapterMemoBtn: get("chapterMemoBtn"),
        chapterMemoPanel: get("chapterMemoPanel"),
        chapterMemoInput: get("chapterMemoInput"),
        chapterMemoSaveBtn: get("chapterMemoSaveBtn"),
        chapterMemoDeleteBtn: get("chapterMemoDeleteBtn"),
        chapterMemoCloseBtn: get("chapterMemoCloseBtn"),
        chapterSelectLink: get("chapterSelectLink"),
        chapterSelectLinkLabel: get("chapterSelectLinkLabel"),
        nextBtn: get("nextChapterBtn"),
        fab: get("verseFab"),
        fontControl: get("verseFontControl"),
        fontToggle: get("verseFontToggle"),
        fontPanel: get("verseFontPanel"),
        fontStepper: document.querySelector("#verseFontPanel .verse-font-stepper"),
        fontReset: get("verseFontReset"),
        fontClose: get("verseFontClose"),
        fontLiveRegion: get("verseFontLiveRegion"),
        compareControl: get("verseCompareControl"),
        compareToggle: get("verseCompareToggle"),
        compareToggleLabel: get("verseCompareToggleLabel"),
        comparePanel: get("verseComparePanel"),
        compareNotice: get("verseCompareNotice"),
        compareNoticeText: get("verseCompareNoticeText"),
        compareRetryBtn: get("verseCompareRetryBtn")
    };
}

function parseIntParam(params, key) {
    const value = parseInt(params.get(key), 10);
    return Number.isNaN(value) ? null : value;
}

/**
 * `?word=` 를 읽는다. URL 에서 온 값이므로 길이만 자르고 그대로 문자열로 쓴다.
 * 정규식으로 만들지 않으므로 이스케이프할 것이 없다(설계 문서 §6.1).
 */
function parseFocusWord(params) {
    const raw = (params.get("word") ?? "").trim();
    if (!raw || raw.length > FOCUS_WORD_MAX_LENGTH) {
        return null;
    }
    return raw;
}

function resolveInitialState() {
    const params = new URLSearchParams(window.location.search);
    const parsedTranslationId = parseIntParam(params, "translationId");
    const parsedBookOrder = parseIntParam(params, "bookOrder");
    const parsedChapterNumber = parseIntParam(params, "chapterNumber");
    const parsedVerseNumber = parseIntParam(params, "verseNumber");

    const storedTranslationId = TranslationStore.getCurrentTranslationId();
    const storedBookOrder = BookStore.getCurrentBookOrder();
    const storedChapterNumber = ChapterStore.getNumber();

    const canUseStoredBookOrder = parsedTranslationId === null
        || (storedTranslationId && parsedTranslationId === storedTranslationId);

    state.translationId = parsedTranslationId ?? storedTranslationId ?? null;
    state.bookOrder = parsedBookOrder ?? (canUseStoredBookOrder ? storedBookOrder : null) ?? null;

    let chapterNumber = parsedChapterNumber ?? storedChapterNumber ?? null;
    if (parsedChapterNumber === null
        && parsedBookOrder !== null
        && storedBookOrder
        && parsedBookOrder !== storedBookOrder) {
        chapterNumber = null;
    }

    state.chapterNumber = chapterNumber;
    state.verseNumber = parsedVerseNumber;

    // 강조할 표제어. 가리킬 절이 없으면 칠할 대상도 없으므로 verseNumber 와 함께만 산다.
    state.focusWord = parseFocusWord(params);
    state.focusVerseNumber = state.focusWord ? parsedVerseNumber : null;

    // 공유받은 링크가 보낸 사람과 같은 화면을 열어야 하므로 URL 이 우선이다.
    state.compareTranslationId = parseIntParam(params, "compareTranslationId") ?? CompareStore.get();

    const fromValue = params.get("from");
    state.fromSearch = fromValue === "search";
    state.fromMypage = fromValue === "mypage";
    state.fromDictionary = fromValue === "dictionary";
    state.fromMyMemo = fromValue === "my-memo";
}

async function init() {
    elements = getElements();
    resolveInitialState();

    if (!state.translationId) {
        redirectToTranslation();
        return;
    }

    const translationInfo = await ensureTranslationInfo();
    state.translationType = translationInfo.type;
    state.translationName = translationInfo.name;

    if (!state.bookOrder) {
        redirectToBookList();
        return;
    }

    if (!state.chapterNumber) {
        redirectToChapterList();
        return;
    }

    const books = await ensureBookList();
    state.bookName = resolveBookName(books);
    if (!state.bookName) {
        redirectToBookList();
        return;
    }

    initNav();
    resolveCompareTranslation();
    updateLabels();
    updateVerseUrl();
    saveLastRead();
    bindEvents();
    initWordStatsDialog();
    initFabMenu();
    syncFontStepFromBoot();
    bindFontControlEvents();

    await loadChapter("CURRENT");
}

// 장 단위 단어 빈도 통계 (설계 문서: docs/bible/word-frequency-design.md)
function initWordStatsDialog() {
    initWordStats({
        triggerId: "wordStatsBtn",
        buildEndpoint: () =>
            `/api/v1/bibles/translations/${state.translationId}/books/${state.bookOrder}`
            + `/chapters/${state.chapterNumber}/word-stats?limit=300`,
        buildTitle: () => `${state.bookName} ${state.chapterNumber}장 단어 통계`,
        buildSearchUrl: (word) =>
            `${ROUTES.SEARCH}?keyword=${encodeURIComponent(word)}`
            + `&translationId=${state.translationId}&bookOrder=${state.bookOrder}`,
    });
}

function initNav() {
    const {backButton, translationLink, searchLink, pageTitleLabel} = elements;
    setupBackButton(backButton);
    if (translationLink) {
        translationLink.classList.remove(UI_CLASSES.HIDDEN);
        translationLink.addEventListener("click", () => {
            TranslationStore.saveTranslationReturnPath(buildVerseUrl());
        });
    }
    if (searchLink) {
        searchLink.classList.remove(UI_CLASSES.HIDDEN);
    }
    if (pageTitleLabel) {
        pageTitleLabel.classList.remove(UI_CLASSES.HIDDEN);
    }
}

function setupBackButton(button) {
    if (!button) {
        return;
    }
    button.classList.remove(UI_CLASSES.HIDDEN);
    bindFromBackButton(button, {
        backOn: ["search", "mypage", "dictionary", "my-memo", "history", "intertestamental"],
        // 기본 동작: 장(chapter) 리스트로 이동. backOn 의 특수 케이스만 history.back() 유지.
        fallback: () => {
            window.location.href = state.translationId && state.bookOrder
                ? `${ROUTES.CHAPTER_LIST}?translationId=${state.translationId}&bookOrder=${state.bookOrder}`
                : ROUTES.TRANSLATION_LIST;
        },
    });
}

function bindEvents() {
    const {prevBtn, nextBtn, verseTable, markReadBtn} = elements;
    if (prevBtn) {
        prevBtn.addEventListener("click", () => loadChapter("PREV"));
    }
    if (nextBtn) {
        nextBtn.addEventListener("click", () => loadChapter("NEXT"));
    }
    if (markReadBtn) {
        markReadBtn.addEventListener("click", handleMarkRead);
    }
    bindChapterMemoEvents();
    if (verseTable) {
        verseTable.addEventListener("click", handleVerseClick);
        verseTable.addEventListener("keydown", handleMemoInputAttempt);
        verseTable.addEventListener("beforeinput", handleMemoInputAttempt);
    }
    document.addEventListener("click", handleGlobalOutsideClick);
    document.addEventListener("keydown", handleFabEscapeKey);
    bindCompareControlEvents();
    bindNavSelectLabelFit(elements.chapterSelectLinkLabel);
}

function updateLabels() {
    const {translationTypeLabel, pageTitleLabel, chapterSelectLinkLabel, chapterSelectLink} = elements;
    if (translationTypeLabel) {
        translationTypeLabel.textContent = state.translationType;
    }
    if (pageTitleLabel) {
        pageTitleLabel.textContent = `${state.bookName} ${state.chapterNumber}`;
    }
    if (chapterSelectLinkLabel) {
        chapterSelectLinkLabel.textContent = `${state.bookName} ${state.chapterNumber}`;
        fitNavSelectLabel(chapterSelectLinkLabel);
    }
    if (chapterSelectLink) {
        chapterSelectLink.href = `${ROUTES.CHAPTER_LIST}?translationId=${state.translationId}&bookOrder=${state.bookOrder}`;
    }
}

function getStoredTranslation() {
    return {
        id: TranslationStore.getCurrentTranslationId(),
        type: TranslationStore.getCurrentTranslationType(),
        name: TranslationStore.getCurrentTranslationName(),
        language: TranslationStore.getCurrentTranslationLanguage()
    };
}

function hasCompleteTranslation(stored, targetId) {
    return stored.id === targetId && stored.type && stored.name && stored.language;
}

async function ensureTranslationInfo() {
    const stored = getStoredTranslation();
    if (hasCompleteTranslation(stored, state.translationId)) {
        return stored;
    }
    try {
        const response = await fetch(API_CONFIG.TRANSLATIONS);
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
                language: match.translationLanguage
            };
            TranslationStore.saveCurrentTranslation(translation);
            return translation;
        }
    } catch (error) {
        console.warn(error.message);
    }
    return stored;
}

async function ensureBookList() {
    const cached = BookStore.getListForTranslation(state.translationId);
    if (cached && cached.length > 0) {
        return cached;
    }
    try {
        const response = await fetch(`${API_CONFIG.TRANSLATIONS}/${state.translationId}/books`);
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
}

function resolveBookName(books) {
    let bookName = BookStore.getBookName(state.translationId, state.bookOrder);
    if (!bookName && books) {
        const currentBook = books.find(book => book.bookOrder === state.bookOrder);
        if (currentBook) {
            BookStore.saveCurrentBook(currentBook);
            bookName = currentBook.bookName;
        }
    }
    return bookName;
}

function buildVerseUrl() {
    const targetUrl = new URL(ROUTES.VERSE_LIST, window.location.origin);
    targetUrl.searchParams.set("translationId", state.translationId);
    targetUrl.searchParams.set("bookOrder", state.bookOrder);
    targetUrl.searchParams.set("chapterNumber", state.chapterNumber);
    if (state.verseNumber) {
        targetUrl.searchParams.set("verseNumber", state.verseNumber);
        // word 는 verseNumber 없이는 가리킬 절이 없다. 항상 함께 붙이거나 함께 뺀다.
        if (state.focusWord) {
            targetUrl.searchParams.set("word", state.focusWord);
        }
    }
    if (state.compareTranslationId) {
        targetUrl.searchParams.set("compareTranslationId", state.compareTranslationId);
    }
    return `${targetUrl.pathname}${targetUrl.search}`;
}

function updateVerseUrl() {
    history.replaceState(null, "", buildVerseUrl());
}

function getCurrentChapterKey() {
    return `${state.translationId}:${state.bookOrder}:${state.chapterNumber}`;
}

function isCurrentChapter(chapterKey) {
    return chapterKey === getCurrentChapterKey();
}

function saveLastRead() {
    LastReadStore.save({
        translationId: state.translationId,
        bookOrder: state.bookOrder,
        chapterNumber: state.chapterNumber
    });
}

async function loadChapter(direction) {
    try {
        const loadToken = ++chapterState.loadToken;
        chapterState.dirtyMemos.clear();
        chapterState.dirtyHighlights.clear();
        chapterState.readDirty = false;
        chapterState.status = "loading";
        chapterState.stateLoadPromise = null;
        readState.loading = false;
        readState.loadingChapterKey = null;
        if (direction !== "CURRENT") {
            state.verseNumber = null;
            // 다른 장의 절을 가리키던 값이다. 강조도 함께 버린다.
            state.focusWord = null;
            state.focusVerseNumber = null;
        }
        const url = buildChapterUrl(direction);
        // CURRENT 는 목적지 장을 이미 알고 있으므로 대역을 함께 띄운다.
        // PREV/NEXT 는 /navigate 응답이 목적지를 정해 주므로(책 경계 판단이 서버에 있다) 순차다.
        const eagerCompare = (direction === "CURRENT" && isCompareOn())
            ? fetchCompareChapter(state.bookOrder, state.chapterNumber)
            : null;
        const response = await fetch(url, {credentials: "omit"});
        if (!response.ok) {
            throw new Error("데이터 로딩 실패");
        }
        const data = await response.json();
        // 늦게 도착한 응답이 state.bookOrder/chapterNumber 를 되돌려 놓지 않도록 먼저 끊는다
        if (loadToken !== chapterState.loadToken) {
            return;
        }
        updateStateFromChapter(data);
        updateVerseUrl();
        memoState.cache = new Map();
        chapterMemoState.memoId = null;
        chapterMemoState.content = null;
        chapterMemoState.loaded = false;
        updateChapterMemoButton();

        const compare = isCompareOn()
            ? await (eagerCompare ?? fetchCompareChapter(state.bookOrder, state.chapterNumber))
            : null;
        // 장을 연달아 넘기면 먼저 보낸 대역 응답이 나중에 도착할 수 있다.
        // 토큰을 보지 않으면 다른 장의 본문이 대역 칸에 붙는다 — 오류도 빈칸도 아닌 오답이다.
        if (loadToken !== chapterState.loadToken) {
            return;
        }
        renderChapter(data, [], compare);
        readState.isRead = false;
        updateReadButton();

        chapterState.stateLoadPromise = applyChapterState(loadToken);
        await chapterState.stateLoadPromise;
    } catch (error) {
        showAlert("장 정보를 불러오지 못했습니다.", "danger");
        console.error(error);
    }
}

function buildChapterUrl(direction) {
    const base = `${API_CONFIG.TRANSLATIONS}/${state.translationId}/books/${state.bookOrder}/chapters/${state.chapterNumber}`;
    if (direction === "CURRENT") {
        return `${base}/verses`;
    }
    return `${base}/navigate?direction=${direction}`;
}

function buildChapterStateUrl() {
    return `${API_CONFIG.TRANSLATIONS}/${state.translationId}/books/${state.bookOrder}/chapters/${state.chapterNumber}/state`;
}

function updateStateFromChapter(data) {
    state.bookOrder = data.book.bookOrder;
    state.bookName = data.book.bookName;
    state.chapterNumber = data.book.chapter.chapterNumber;
    BookStore.saveCurrentBook({
        bookOrder: state.bookOrder,
        bookName: state.bookName
    });
    ChapterStore.saveNumber(state.chapterNumber);
    saveLastRead();
}

function renderChapter(data, highlights, compare) {
    const chapter = data.book.chapter;
    updateLabels();
    compareState.verses = compare?.verses ?? [];
    compareState.error = compare?.error ?? null;
    const rows = mergeChapterVerses(chapter.verses ?? [], compareState.verses);
    if (elements.verseTable) {
        elements.verseTable.innerHTML = rows.map(renderVerseRow).join("");
    }
    renderCompareNotice(rows);
    if (elements.prevBtn) {
        elements.prevBtn.disabled = data.isFirst;
    }
    if (elements.nextBtn) {
        elements.nextBtn.disabled = data.isLast;
    }
    const verseNumber = state.verseNumber ?? VerseStore.consumeVerseNumber();
    const restoreVerseNumber = chapterState.restoreVerseNumber;
    chapterState.restoreVerseNumber = null;
    if (verseNumber) {
        if (state.verseNumber) {
            state.verseNumber = null;
            VerseStore.consumeVerseNumber();
        }
        highlightVerse(verseNumber);
    } else if (restoreVerseNumber) {
        // 대역을 켜고 끌 때는 같은 장을 다시 그리는 것뿐이라 읽던 자리를 지킨다.
        restoreVerseIntoView(restoreVerseNumber);
    } else {
        window.scrollTo(0, 0);
    }
    if (verseNumber && state.focusWord) {
        state.focusVerseNumber = verseNumber;
    }
    // 스포트라이트가 아니라 여기서 칠한다. 대역 토글은 highlightVerse 를 타지 않고
    // 같은 장을 다시 그리므로, 렌더 경로에 붙여야 강조가 살아남는다.
    applyFocusWord();
    applyHighlights(highlights);
    resetSelectionState();
}

/**
 * 두 번역본의 절을 절 번호로 맞춘다.
 *
 * 한쪽을 기준으로 삼고 다른 쪽을 붙이면 "대역에만 있는 절"(ASV 기준 막 9:44·9:46 등)이
 * 화면에서 조용히 사라진다. 그래서 **양쪽 절 번호의 합집합**을 오름차순으로 놓는다.
 *
 * 절 번호가 같아도 같은 내용이라는 보장은 없다(RVR1909 욥기는 3~5절씩 밀려 있다).
 * 그 사실은 renderCompareNotice 가 화면에 적는다.
 * 설계 문서: docs/bible/bible-compare-design.md §2
 */
function mergeChapterVerses(primaryVerses, compareVerses) {
    const primaryMap = new Map(primaryVerses.map(verse => [verse.verseNumber, verse.text]));
    const compareMap = new Map(compareVerses.map(verse => [verse.verseNumber, verse.text]));
    return [...new Set([...primaryMap.keys(), ...compareMap.keys()])]
        .sort((a, b) => a - b)
        .map(verseNumber => ({
            verseNumber,
            text: primaryMap.get(verseNumber) ?? null,
            compareText: compareMap.get(verseNumber) ?? null
        }));
}

function highlightVerse(verseNumber) {
    setTimeout(() => {
        const targetVerse = document.querySelector(`.verse-text[data-verse="${verseNumber}"]`);
        if (!targetVerse) {
            return;
        }
        const targetTd = targetVerse.closest("td");
        const targetRow = targetVerse.closest("tr");

        // 오버레이 생성 + 스포트라이트 대상 즉시 설정
        const overlay = document.createElement("div");
        overlay.className = "verse-spotlight-overlay";
        document.body.appendChild(overlay);

        targetVerse.classList.add("verse-spotlight-target");
        if (targetTd) {
            targetTd.classList.add("verse-spotlight-target-td");
        }
        // 구절 번호 칸까지 함께 강조되도록 행(tr) 전체에 카드 스타일 적용
        if (targetRow) {
            targetRow.classList.add("verse-spotlight-target-row");
        }

        // 오버레이 페이드인 + 스크롤 이동 동시 실행
        requestAnimationFrame(() => {
            overlay.classList.add("is-active");
            targetVerse.scrollIntoView({behavior: "smooth", block: "center"});
        });

        let dismissed = false;
        const dismiss = () => {
            if (dismissed) {
                return;
            }
            dismissed = true;
            overlay.classList.remove("is-active");
            targetVerse.classList.remove("verse-spotlight-target");
            if (targetTd) {
                targetTd.classList.remove("verse-spotlight-target-td");
            }
            if (targetRow) {
                targetRow.classList.remove("verse-spotlight-target-row");
            }
            overlay.addEventListener("transitionend", () => overlay.remove(), {once: true});
        };

        // 클릭으로 해제
        overlay.addEventListener("click", dismiss, {once: true});

        // 4초 후 자동 해제
        setTimeout(dismiss, 4000);
    }, 100);
}

/**
 * 사전에서 넘어온 표제어를 그 절 안에서 찾아 칠한다.
 *
 * 대역 칸(`.verse-compare-text`)은 건드리지 않는다. 대역은 읽기 전용이고
 * (bible-compare-design.md §6), 표제어는 주 번역본 기준으로 고른 말이다.
 *
 * **renderChapter 가 표를 다시 그린 직후에만 부른다.** 같은 DOM 에 두 번 부르면
 * 이미 칠한 `<mark>` 안의 글자를 다시 칠해 마크가 중첩된다.
 * 설계 문서: docs/bible/bible-verse-word-focus-design.md §6
 */
function applyFocusWord() {
    if (!state.focusWord || !state.focusVerseNumber) {
        return;
    }
    const verseEl = document.querySelector(`.verse-text[data-verse="${state.focusVerseNumber}"]`);
    if (!verseEl) {
        // 주 번역본에 없는 절(대역에만 있는 절)이면 `.verse-text` 자체가 없다. 조용히 넘어간다.
        return;
    }
    paintFocusWord(verseEl, state.focusWord);
}

/**
 * `.verse-text` 안의 텍스트 노드를 찾아 표제어 자리를 `<mark>` 로 감싼다.
 *
 * 메모 컨테이너는 `.verse-text` 의 형제라 순회 범위 밖이다(renderVerseRow).
 */
function paintFocusWord(verseEl, word) {
    const walker = document.createTreeWalker(verseEl, NodeFilter.SHOW_TEXT);
    const targets = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        targets.push(node); // 먼저 모은다 — 순회 중에 노드를 바꾸면 walker 가 흔들린다
    }
    targets.forEach(node => paintTextNode(node, word));
}

/**
 * 표제어가 시작되는 자리를 찾는다.
 *
 * **정규식을 만들지 않는다.** `word` 는 URL 에서 온 값이라 `new RegExp` 에 넣으면 `(` 하나로
 * SyntaxError 가 나고 `(a+)+b` 같은 값이 탭을 멈춰 세운다.
 *
 * 앞 글자가 한글이면 버린다. 한국어는 접미가 붙는 언어라 어간이 어절 앞에 온다 —
 * `사랑하시니라` 의 `사랑` 은 살리고 `적그리스도` 안의 `그리스도` 는 버린다.
 */
function findFocusStarts(text, word) {
    const starts = [];
    for (let i = text.indexOf(word); i !== -1; i = text.indexOf(word, i + word.length)) {
        if (i > 0 && HANGUL_SYLLABLE.test(text[i - 1])) {
            continue;
        }
        starts.push(i);
    }
    return starts;
}

/**
 * 노드를 조각내지 않고 조각을 모아 통째로 바꾼다. splitText 를 반복하면 자를 때마다 뒤쪽
 * 오프셋이 밀려, 매치가 둘 이상인 절에서 엉뚱한 자리를 감싼다.
 *
 * `<mark>` 안에 들어가는 것은 본문에서 잘라 낸 조각이고 `word` 자체가 아니다. textContent 로
 * 넣으므로 이스케이프할 것도 없다.
 */
function paintTextNode(node, word) {
    const text = node.nodeValue;
    const starts = findFocusStarts(text, word);
    if (starts.length === 0) {
        return;
    }
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    starts.forEach(start => {
        if (start > cursor) {
            fragment.append(text.slice(cursor, start));
        }
        const mark = document.createElement("mark");
        mark.className = "verse-word-focus";
        mark.textContent = text.slice(start, start + word.length);
        fragment.append(mark);
        cursor = start + word.length;
    });
    if (cursor < text.length) {
        fragment.append(text.slice(cursor));
    }
    node.parentNode.replaceChild(fragment, node);
}

/**
 * 대역 본문은 `.verse-text` / `data-verse` / `verse-text-{n}` 을 절대 쓰지 않는다.
 *
 * 이 파일은 절 요소를 문서 전역에서 찾는다(`querySelectorAll(".verse-text")`,
 * `querySelector('.verse-text[data-verse="N"]')`). 대역이 같은 이름을 쓰면 형광펜이 대역에
 * 칠해지고, 복사·공유가 다른 번역본 본문을 집어 간다. 오류는 나지 않고 값만 틀린다.
 * 설계 문서: docs/bible/bible-compare-design.md §4.2
 */
function renderVerseRow(row) {
    const v = row.verseNumber;
    const memo = memoState.cache.get(String(v));
    const hasMemo = memo && memo.content;
    const verseClass = hasMemo ? "verse-text text-body verse-has-memo" : "verse-text text-body";
    const compareOnly = row.text === null;
    // 주 번역본에 없는 절은 .verse-text 자체를 만들지 않는다.
    // 선택·메모·형광펜이 붙을 자리가 없어야 읽기 전용이 마크업으로 강제된다.
    const primaryCell = compareOnly
        ? `<div class="verse-compare-only-note">대역에만 있는 절</div>`
        : `<div class="${verseClass}" id="verse-text-${v}" data-verse="${v}">${row.text}</div>`;
    const memoCell = compareOnly ? "" : `
                <div class="memo-container d-none mt-3" id="memo-${v}">
                  <div class="form-group">
                    <textarea class="form-control mb-2" rows="3" placeholder="메모를 입력하세요..." id="memo-input-${v}"></textarea>
                    <div class="text-end">
                      <button class="btn btn-sm btn-danger memo-delete-btn" data-verse="${v}">🗑️ 삭제</button>
                      <button class="btn btn-sm btn-primary memo-save-btn" data-verse="${v}">💾 저장</button>
                    </div>
                  </div>
                </div>`;
    return `
            <tr${compareOnly ? ' class="verse-row-compare-only"' : ""}>
              <td>${v}</td>
              <td>
                <div class="verse-body${isCompareRendered() ? " has-compare" : ""}">
                  ${primaryCell}
                  ${renderCompareCell(row)}
                </div>${memoCell}
              </td>
            </tr>
          `;
}

function renderCompareCell(row) {
    if (!isCompareRendered()) {
        return "";
    }
    const tag = `<span class="verse-compare-tag" aria-hidden="true">${escapeHtml(compareTagLabel())}</span>`;
    if (row.compareText === null) {
        // 빈칸으로 두면 "이 번역본에는 이 절이 없다"가 아니라 무언가 덜 그려진 것처럼 보인다
        return `<div class="verse-compare-text is-empty" data-compare-verse="${row.verseNumber}">
                  ${tag}<span class="verse-compare-body">—</span>
                </div>`;
    }
    return `<div class="verse-compare-text" data-compare-verse="${row.verseNumber}">
              ${tag}<span class="verse-compare-body">${row.compareText}</span>
            </div>`;
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"]/g, ch => HTML_ESCAPES[ch]);
}

async function handleVerseClick(event) {
    const actionTarget = event.target;
    if (actionTarget.classList.contains("memo-save-btn")) {
        await saveMemo(actionTarget.dataset.verse);
        return;
    }
    if (actionTarget.classList.contains("memo-delete-btn")) {
        await deleteMemo(actionTarget.dataset.verse);
        return;
    }
    if (actionTarget.closest(".memo-container")) {
        return;
    }
    const verseEl = actionTarget.closest(".verse-text[data-verse]");
    if (!verseEl) {
        return;
    }
    const verseNum = verseEl.getAttribute("data-verse");
    const isSelected = toggleVerseSelection(verseNum);
    if (!isSelected) {
        // 선택 해제 시 — 메모 컨테이너 닫기 (FAB 메모 액션으로 열린 일반 verse 포함)
        hideMemo(verseNum);
    } else if (verseEl.classList.contains("verse-has-memo")) {
        // 메모 있는 verse 는 선택 시 자동 표시
        showMemo(verseNum);
    }
}

function handleMemoInputAttempt(event) {
    if (!isMemoInputTarget(event.target)) {
        return;
    }
    if (memoState.auth.allowed) {
        return;
    }
    if (memoState.auth.checked || memoState.auth.checking) {
        event.preventDefault();
        return;
    }
    event.preventDefault();
    requestAuth(memoState.auth);
}

function isMemoInputTarget(target) {
    return target
        && (target.matches("textarea[id^='memo-input-']") || target.matches("input[id^='memo-input-']"));
}

function requestAuth(authState) {
    if (authState.checking) {
        return;
    }
    authState.checking = true;
    checkAuthStatus({
        onAuthenticated: () => {
            setAuthState(authState, true);
        },
        onUnauthenticated: () => {
            setAuthState(authState, false);
            if (authState.redirected) {
                return;
            }
            authState.redirected = true;
            alert(authState.message);
            window.location.href = buildLoginRedirectUrl();
        },
        onError: () => {
            setAuthState(authState, false);
        }
    });
}

function setAuthState(authState, allowed) {
    authState.checked = true;
    authState.allowed = allowed;
    authState.checking = false;
}

function applyAuthSnapshot(authenticated) {
    const allowed = Boolean(authenticated);
    setAuthState(memoState.auth, allowed);
    setAuthState(highlightState.auth, allowed);
    setAuthState(readState.auth, allowed);
}

function mergeMemoState(memos) {
    const merged = new Map();
    chapterState.dirtyMemos.forEach(verseNum => {
        const localMemo = memoState.cache.get(String(verseNum));
        if (localMemo && localMemo.content) {
            merged.set(String(verseNum), localMemo);
        }
    });
    if (Array.isArray(memos)) {
        memos.forEach(memo => {
            const key = String(memo.verseNumber);
            if (!chapterState.dirtyMemos.has(key)) {
                merged.set(key, memo);
            }
        });
    }
    memoState.cache = merged;
}

function applyMemoIndicators() {
    document.querySelectorAll(".verse-text.verse-has-memo").forEach(el => {
        el.classList.remove("verse-has-memo");
    });
    memoState.cache.forEach((memo, verseNum) => {
        if (!memo || !memo.content) {
            return;
        }
        const verseEl = document.querySelector(`.verse-text[data-verse="${verseNum}"]`);
        if (verseEl) {
            verseEl.classList.add("verse-has-memo");
        }
    });
}

async function fetchChapterState() {
    const url = buildChapterStateUrl();
    try {
        let response = await fetch(url, {
            method: "GET",
            credentials: "include",
            headers: {
                Accept: "application/json"
            }
        });
        if (response.status === 401) {
            const refreshed = await refreshAccessToken();
            if (!refreshed) {
                return {status: "unauthorized"};
            }
            response = await fetch(url, {
                method: "GET",
                credentials: "include",
                headers: {
                    Accept: "application/json"
                }
            });
            if (response.status === 401) {
                return {status: "unauthorized"};
            }
        }
        if (!response.ok) {
            throw new Error("사용자 상태 조회 실패");
        }
        return {status: "ok", data: await response.json()};
    } catch (error) {
        console.warn(error.message);
        return {status: "error"};
    }
}

async function applyChapterState(loadToken) {
    const stateResult = await fetchChapterState();
    if (loadToken !== chapterState.loadToken) {
        return;
    }
    if (stateResult?.status === "ok") {
        chapterState.status = "ready";
        applyAuthSnapshot(true);
        applyOAuthBackGuardIfNeeded();
        mergeMemoState(stateResult.data.memos);
        refreshOpenMemoInputs();
        applyMemoIndicators();
        if (!chapterState.readDirty) {
            readState.isRead = Boolean(stateResult.data.isRead);
        }
        updateReadButton();
        applyHighlightsMerged(stateResult.data.highlights || [], chapterState.dirtyHighlights);
        if (stateResult.data.chapterMemo) {
            chapterMemoState.memoId = stateResult.data.chapterMemo.chapterMemoId;
            chapterMemoState.content = stateResult.data.chapterMemo.content;
        } else {
            chapterMemoState.memoId = null;
            chapterMemoState.content = null;
        }
        chapterMemoState.loaded = true;
        updateChapterMemoButton();
        return;
    }
    if (stateResult?.status === "unauthorized") {
        chapterState.status = "unauthorized";
        applyAuthSnapshot(false);
        readState.isRead = false;
        updateReadButton();
        chapterMemoState.memoId = null;
        chapterMemoState.content = null;
        chapterMemoState.loaded = false;
        updateChapterMemoButton();
        return;
    }
    chapterState.status = "error";
}

async function ensureChapterStateReady() {
    if (chapterState.status === "ready" || chapterState.status === "unauthorized") {
        return true;
    }
    if (chapterState.status === "loading" && chapterState.stateLoadPromise) {
        await chapterState.stateLoadPromise;
        if (chapterState.status === "ready" || chapterState.status === "unauthorized") {
            return true;
        }
    }
    const loadToken = chapterState.loadToken;
    chapterState.status = "loading";
    chapterState.stateLoadPromise = applyChapterState(loadToken);
    await chapterState.stateLoadPromise;
    return chapterState.status === "ready" || chapterState.status === "unauthorized";
}

function refreshOpenMemoInputs() {
    document.querySelectorAll(".memo-container:not(.d-none)").forEach(container => {
        const verseNum = container.id.replace("memo-", "");
        const textarea = document.getElementById(`memo-input-${verseNum}`);
        if (!textarea) {
            return;
        }
        if (textarea.value.trim().length > 0) {
            return;
        }
        const memo = memoState.cache.get(String(verseNum));
        textarea.value = memo ? memo.content : "";
    });
}

function showMemo(verseNum) {
    const memoContainer = document.getElementById(`memo-${verseNum}`);
    if (!memoContainer) {
        return;
    }
    memoContainer.classList.remove("d-none");
    const textarea = document.getElementById(`memo-input-${verseNum}`);
    if (textarea) {
        const memo = memoState.cache.get(String(verseNum));
        textarea.value = memo ? memo.content : "";
    }
}

function hideMemo(verseNum) {
    const memoContainer = document.getElementById(`memo-${verseNum}`);
    if (memoContainer) {
        memoContainer.classList.add("d-none");
    }
}

async function saveMemo(verseNum) {
    if (!await ensureChapterStateReady()) {
        showAlert("사용자 상태를 불러오는 중입니다. 잠시 후 다시 시도해주세요.", "danger");
        return;
    }
    if (!memoState.auth.allowed) {
        requestAuth(memoState.auth);
        return;
    }
    const requestChapterKey = getCurrentChapterKey();
    const textarea = document.getElementById(`memo-input-${verseNum}`);
    if (!textarea) {
        showAlert("메모 입력란을 찾을 수 없습니다", "danger");
        return;
    }
    const value = textarea.value.trim();
    if (!value) {
        return;
    }
    try {
        const response = await fetch(buildMemoUrl(verseNum), {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify({
                content: value
            })
        });
        if (!isCurrentChapter(requestChapterKey)) {
            return;
        }
        if (response.status === 401) {
            requestAuth(memoState.auth);
            return;
        }
        if (!response.ok) {
            throw new Error("메모 저장 실패");
        }
        const memo = await response.json();
        memoState.cache.set(String(verseNum), memo);
        const verseTextEl = document.querySelector(`.verse-text[data-verse="${verseNum}"]`);
        if (verseTextEl) {
            verseTextEl.classList.add("verse-has-memo");
        }
        chapterState.dirtyMemos.add(String(verseNum));
        hideMemo(verseNum);
    } catch (error) {
        showAlert("메모 저장 중 오류가 발생했습니다.", "danger");
        console.error(error);
    }
}

async function deleteMemo(verseNum) {
    if (!await ensureChapterStateReady()) {
        showAlert("사용자 상태를 불러오는 중입니다. 잠시 후 다시 시도해주세요.", "danger");
        return;
    }
    if (!memoState.auth.allowed) {
        requestAuth(memoState.auth);
        return;
    }
    const confirmed = await showConfirm("이 구절의 메모를 삭제하시겠습니까?", {
        title: "메모 삭제",
        confirmText: "삭제",
        cancelText: "취소",
        danger: true,
    });
    if (!confirmed) {
        return;
    }
    const requestChapterKey = getCurrentChapterKey();
    try {
        const response = await fetch(buildMemoUrl(verseNum), {
            method: "DELETE",
            credentials: "include"
        });
        if (!isCurrentChapter(requestChapterKey)) {
            return;
        }
        if (response.status === 401) {
            requestAuth(memoState.auth);
            return;
        }
        if (!response.ok) {
            throw new Error("메모 삭제 실패");
        }
        memoState.cache.delete(String(verseNum));
        const verseTextEl = document.querySelector(`.verse-text[data-verse="${verseNum}"]`);
        if (verseTextEl) {
            verseTextEl.classList.remove("verse-has-memo");
        }
        chapterState.dirtyMemos.add(String(verseNum));
        hideMemo(verseNum);
    } catch (error) {
        showAlert("메모 삭제 중 오류가 발생했습니다.", "danger");
        console.error(error);
    }
}

function buildMemoUrl(verseNum) {
    return `${API_CONFIG.MEMOS_BASE}/${state.translationId}/books/${state.bookOrder}/chapters/${state.chapterNumber}/verses/${parseInt(verseNum, 10)}/memo`;
}

function buildHighlightUrl(verseNum) {
    return `${API_CONFIG.HIGHLIGHTS_BASE}/${state.translationId}/books/${state.bookOrder}/chapters/${state.chapterNumber}/verses/${parseInt(verseNum, 10)}/highlight`;
}

function showAlert(message, type = "success") {
    alert(`${type}: ` + message);
}

function redirectToTranslation() {
    window.location.href = ROUTES.TRANSLATION_LIST;
}

function redirectToBookList() {
    const bookUrl = new URL(ROUTES.BOOK_LIST, window.location.origin);
    bookUrl.searchParams.set("translationId", state.translationId);
    window.location.href = `${bookUrl.pathname}${bookUrl.search}`;
}

function redirectToChapterList() {
    const chapterUrl = new URL(ROUTES.CHAPTER_LIST, window.location.origin);
    chapterUrl.searchParams.set("translationId", state.translationId);
    chapterUrl.searchParams.set("bookOrder", state.bookOrder);
    window.location.href = `${chapterUrl.pathname}${chapterUrl.search}`;
}

function initFabMenu() {
    const fab = elements.fab;
    if (!fab) {
        return;
    }
    const toggle = fab.querySelector("[data-fab-toggle]");
    const menu = fab.querySelector("[data-fab-menu]");
    const highlightMenu = fab.querySelector("[data-fab-highlight]");
    if (toggle) {
        toggle.addEventListener("click", () => toggleFabMenu());
    }
    if (menu) {
        menu.addEventListener("click", handleFabMenuClick);
    }
    if (highlightMenu) {
        highlightMenu.addEventListener("click", handleHighlightPick);
    }
    fab.addEventListener("click", handleFabBackdropClick);
    syncFabStateFromDom();
    updateFabVisibility();
}

function handleFabBackdropClick(event) {
    if (event.target === elements.fab) {
        closeFabMenu();
    }
}

function handleGlobalOutsideClick(event) {
    // FAB 외부 클릭 처리
    const fab = elements?.fab;
    if (fab && !fab.classList.contains("d-none") && !event.target.closest("#verseFab")) {
        closeFabMenu();
    }
    // 폰트 패널 외부 클릭 — 사용자 클릭 지점 존중(returnFocus: false).
    // toggleFontPanel 내부에서 패널에 포커스가 남아 있고 returnFocus=false 인 경우
    // blur() 처리하여 hidden 요소에 포커스가 머무는 a11y 위반을 방지한다.
    if (fontState.expanded && !event.target.closest("#verseFontControl")) {
        toggleFontPanel(false, {returnFocus: false});
    }
    // 대역 선택 패널 외부 클릭 — 폰트 패널과 같은 규칙
    if (compareState.expanded && !event.target.closest("#verseCompareControl")) {
        toggleComparePanel(false, {returnFocus: false});
    }
}

function handleFabEscapeKey(event) {
    if (event.key !== "Escape") {
        return;
    }
    // 1. 장 메모 패널 — native <dialog>는 ESC를 자동 처리하므로 다른 ESC 동작과 충돌하지 않게 우선 차단
    if (elements.chapterMemoPanel?.open) {
        return;
    }
    // 2. 폰트 패널 — Esc 는 명시적 닫기이므로 토글로 포커스 복귀
    if (fontState.expanded) {
        toggleFontPanel(false, {returnFocus: true});
        return;
    }
    // 2-1. 대역 선택 패널 — 같은 규칙
    if (compareState.expanded) {
        toggleComparePanel(false, {returnFocus: true});
        return;
    }
    // 3. FAB
    const fab = elements?.fab;
    if (!fab || fab.classList.contains("d-none")) {
        return;
    }
    closeFabMenu();
}

function toggleVerseSelection(verseNum) {
    const number = String(verseNum);
    const verseEl = document.querySelector(`.verse-text[data-verse="${number}"]`);
    if (!verseEl) {
        return false;
    }
    if (selection.selected.has(number)) {
        selection.selected.delete(number);
        verseEl.classList.remove("active");
        updateFabVisibility();
        return false;
    } else {
        selection.selected.add(number);
        verseEl.classList.add("active");
        updateFabVisibility();
        return true;
    }
}

function resetSelectionState() {
    selection.selected.clear();
    document.querySelectorAll(".verse-text.active").forEach(el => {
        el.classList.remove("active");
        const verseNum = el.getAttribute("data-verse");
        if (verseNum) {
            hideMemo(verseNum);
        }
    });
    updateFabVisibility();
    closeFabMenu();
}

function updateFabVisibility() {
    const fab = elements?.fab;
    if (!fab) {
        return;
    }
    if (selection.selected.size > 0) {
        fab.classList.remove(UI_CLASSES.HIDDEN);
    } else {
        fab.classList.add(UI_CLASSES.HIDDEN);
    }
}

function syncFabStateFromDom() {
    const fab = elements?.fab;
    if (!fab) {
        return;
    }
    const menu = fab.querySelector("[data-fab-menu]");
    const menuOpen = fab.classList.contains("is-open")
        || (menu && menu.getAttribute("aria-hidden") === "false");
    selection.menuOpen = Boolean(menuOpen);
}

function toggleFabMenu() {
    syncFabStateFromDom();
    selection.menuOpen = !selection.menuOpen;
    const fab = elements?.fab;
    if (!fab) {
        return;
    }
    fab.classList.toggle("is-open", selection.menuOpen);
    const toggle = fab.querySelector("[data-fab-toggle]");
    const menu = fab.querySelector("[data-fab-menu]");
    if (toggle) {
        toggle.setAttribute("aria-expanded", String(selection.menuOpen));
    }
    if (menu) {
        menu.setAttribute("aria-hidden", String(!selection.menuOpen));
    }
    if (selection.menuOpen) {
        openHighlightMenu();
    } else {
        closeHighlightMenu();
    }
}

function closeFabMenu() {
    selection.menuOpen = false;
    const fab = elements?.fab;
    if (fab) {
        fab.classList.remove("is-open");
        const toggle = fab.querySelector("[data-fab-toggle]");
        const menu = fab.querySelector("[data-fab-menu]");
        if (toggle) {
            toggle.setAttribute("aria-expanded", "false");
        }
        if (menu) {
            menu.setAttribute("aria-hidden", "true");
        }
    }
    closeHighlightMenu();
}

async function handleFabMenuClick(event) {
    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) {
        return;
    }
    const action = actionButton.dataset.action;
    switch (action) {
        case "copy":
            copySelectedVerses();
            closeFabMenu();
            break;
        case "memo":
            await openMemoForSelected();
            closeFabMenu();
            break;
        case "share":
            shareSelectedVerses();
            closeFabMenu();
            break;
        default:
            break;
    }
}

function openHighlightMenu() {
    const menu = elements?.fab?.querySelector("[data-fab-highlight]");
    if (!menu) {
        return;
    }
    menu.setAttribute("aria-hidden", "false");
    menu.classList.add("is-open");
}

function closeHighlightMenu() {
    const menu = elements?.fab?.querySelector("[data-fab-highlight]");
    if (menu) {
        menu.setAttribute("aria-hidden", String(!selection.menuOpen));
        if (selection.menuOpen) {
            menu.classList.add("is-open");
        } else {
            menu.classList.remove("is-open");
        }
    }
}

async function handleHighlightPick(event) {
    const colorButton = event.target.closest("[data-highlight]");
    if (!colorButton) {
        return;
    }
    const colorId = colorButton.dataset.highlight;
    await applyHighlightToSelection(colorId);
    closeHighlightMenu();
    closeFabMenu();
}

async function applyHighlightToSelection(colorId) {
    if (!await ensureChapterStateReady()) {
        showAlert("사용자 상태를 불러오는 중입니다. 잠시 후 다시 시도해주세요.", "danger");
        return;
    }
    if (!highlightState.auth.allowed) {
        requestAuth(highlightState.auth);
        return;
    }
    const verseNumbers = getSelectedVerseNumbers();
    if (verseNumbers.length === 0) {
        return;
    }
    if (colorId === "clear") {
        await Promise.all(verseNumbers.map(async verseNum => {
            if (selection.highlightMap.has(String(verseNum))) {
                await deleteHighlight(verseNum);
            }
        }));
        resetSelectionState();
        return;
    }
    const colorConfig = HIGHLIGHT_COLORS.find(color => color.id === colorId);
    if (!colorConfig) {
        return;
    }
    await Promise.all(verseNumbers.map(async verseNum => {
        const current = selection.highlightMap.get(String(verseNum));
        if (current && current.id === colorConfig.id) {
            await deleteHighlight(verseNum);
        } else {
            await upsertHighlight(verseNum, colorConfig.id);
        }
    }));
    resetSelectionState();
}

async function openMemoForSelected() {
    if (!await ensureChapterStateReady()) {
        showAlert("사용자 상태를 불러오는 중입니다. 잠시 후 다시 시도해주세요.", "danger");
        return;
    }
    if (!memoState.auth.allowed) {
        requestAuth(memoState.auth);
        return;
    }
    const verseNumbers = getSelectedVerseNumbers();
    verseNumbers.forEach(verseNum => showMemo(verseNum));
    if (verseNumbers.length > 0) {
        const firstTextarea = document.getElementById(`memo-input-${verseNumbers[0]}`);
        if (firstTextarea) {
            firstTextarea.focus();
            const len = firstTextarea.value.length;
            firstTextarea.setSelectionRange(len, len);
        }
    }
}

function applyHighlights(highlights) {
    const colorClasses = HIGHLIGHT_COLORS.map(color => color.className);
    document.querySelectorAll(".verse-text").forEach(el => {
        colorClasses.forEach(className => el.classList.remove(className));
    });
    selection.highlightMap.clear();
    if (!highlights || highlights.length === 0) {
        return;
    }
    highlights.forEach(item => {
        const colorConfig = HIGHLIGHT_COLORS.find(color => color.id === item.color);
        if (!colorConfig) {
            return;
        }
        setHighlightFromServer(item.verseNumber, colorConfig);
    });
}

function setHighlightFromServer(verseNum, colorConfig) {
    const verseEl = document.querySelector(`.verse-text[data-verse="${verseNum}"]`);
    if (!verseEl) {
        return;
    }
    HIGHLIGHT_COLORS.forEach(color => verseEl.classList.remove(color.className));
    verseEl.classList.add(colorConfig.className);
    selection.highlightMap.set(String(verseNum), colorConfig);
}

function applyHighlightsMerged(highlights, dirtySet) {
    const preserve = dirtySet instanceof Set ? dirtySet : new Set();
    const colorClasses = HIGHLIGHT_COLORS.map(color => color.className);
    document.querySelectorAll(".verse-text").forEach(el => {
        const verseNum = String(el.getAttribute("data-verse"));
        if (preserve.has(verseNum)) {
            return;
        }
        colorClasses.forEach(className => el.classList.remove(className));
    });
    const preservedHighlights = new Map();
    preserve.forEach(verseNum => {
        const existing = selection.highlightMap.get(String(verseNum));
        if (existing) {
            preservedHighlights.set(String(verseNum), existing);
        }
    });
    selection.highlightMap.clear();
    if (!highlights || highlights.length === 0) {
        preservedHighlights.forEach((config, verseNum) => {
            selection.highlightMap.set(String(verseNum), config);
        });
        return;
    }
    highlights.forEach(item => {
        const verseKey = String(item.verseNumber);
        if (preserve.has(verseKey)) {
            return;
        }
        const colorConfig = HIGHLIGHT_COLORS.find(color => color.id === item.color);
        if (!colorConfig) {
            return;
        }
        setHighlightFromServer(item.verseNumber, colorConfig);
    });
    preservedHighlights.forEach((config, verseNum) => {
        selection.highlightMap.set(String(verseNum), config);
    });
}

async function upsertHighlight(verseNum, colorId) {
    const requestChapterKey = getCurrentChapterKey();
    const response = await fetch(buildHighlightUrl(verseNum), {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
        },
        body: JSON.stringify({color: colorId})
    });
    if (!isCurrentChapter(requestChapterKey)) {
        return;
    }
    if (response.status === 401) {
        requestAuth(highlightState.auth);
        return;
    }
    if (!response.ok) {
        showAlert("형광펜 저장에 실패했습니다.", "danger");
        return;
    }
    const highlight = await response.json();
    const colorConfig = HIGHLIGHT_COLORS.find(color => color.id === highlight.color);
    if (!colorConfig) {
        return;
    }
    setHighlightFromServer(highlight.verseNumber, colorConfig);
    chapterState.dirtyHighlights.add(String(verseNum));
}

async function deleteHighlight(verseNum) {
    const requestChapterKey = getCurrentChapterKey();
    const response = await fetch(buildHighlightUrl(verseNum), {
        method: "DELETE",
        credentials: "include"
    });
    if (!isCurrentChapter(requestChapterKey)) {
        return;
    }
    if (response.status === 401) {
        requestAuth(highlightState.auth);
        return;
    }
    if (!response.ok) {
        showAlert("형광펜 삭제에 실패했습니다.", "danger");
        return;
    }
    const verseEl = document.querySelector(`.verse-text[data-verse="${verseNum}"]`);
    if (verseEl) {
        const current = selection.highlightMap.get(String(verseNum));
        if (current) {
            verseEl.classList.remove(current.className);
        }
    }
    selection.highlightMap.delete(String(verseNum));
    chapterState.dirtyHighlights.add(String(verseNum));
}

function updateReadButton() {
    const btn = elements?.markReadBtn;
    if (!btn) {
        return;
    }
    if (readState.isRead) {
        btn.classList.remove("btn-outline-success");
        btn.classList.add("btn-success", "read-done");
        btn.disabled = true;
    } else {
        btn.classList.remove("btn-success", "read-done");
        btn.classList.add("btn-outline-success");
        btn.disabled = false;
    }
}

async function handleMarkRead() {
    if (!await ensureChapterStateReady()) {
        showAlert("사용자 상태를 불러오는 중입니다. 잠시 후 다시 시도해주세요.", "danger");
        return;
    }
    if (!readState.auth.allowed) {
        requestAuth(readState.auth);
        return;
    }
    const requestChapterKey = getCurrentChapterKey();
    if (readState.isRead || readState.loading) {
        return;
    }
    readState.loading = true;
    readState.loadingChapterKey = requestChapterKey;
    const btn = elements?.markReadBtn;
    if (btn) {
        btn.disabled = true;
    }
    try {
        const response = await fetch(`${API_CONFIG.READING_BASE}/chapters/read`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify({
                translationId: state.translationId,
                bookOrder: state.bookOrder,
                chapterNumber: state.chapterNumber
            })
        });
        if (!isCurrentChapter(requestChapterKey)) {
            return;
        }
        if (response.status === 401) {
            requestAuth(readState.auth);
            if (btn) {
                btn.disabled = false;
            }
            return;
        }
        if (!response.ok) {
            throw new Error("읽음 표시 실패");
        }
        readState.isRead = true;
        chapterState.readDirty = true;
        updateReadButton();
    } catch (error) {
        if (!isCurrentChapter(requestChapterKey)) {
            return;
        }
        showAlert("읽음 표시 중 오류가 발생했습니다.", "danger");
        console.error(error);
        if (btn) {
            btn.disabled = false;
        }
    } finally {
        if (readState.loadingChapterKey === requestChapterKey) {
            readState.loading = false;
            readState.loadingChapterKey = null;
        }
    }
}

function getSelectedVerseNumbers() {
    return Array.from(selection.selected)
        .map(Number)
        .sort((a, b) => a - b)
        .map(String);
}

/**
 * 선택한 절을 복사·공유 문자열로 만든다.
 *
 * 조회는 표 안으로 범위를 좁힌다. 문서 전역에서 `.verse-text[data-verse]` 를 찾으면 나중에
 * 같은 속성을 쓰는 요소가 생겼을 때 다른 본문을 집어 간다.
 */
function buildSelectedText() {
    const scope = elements.verseTable ?? document;
    const translationLabel = state.translationType || state.translationName || "";
    const compareLabel = compareTagLabel();
    const header = `${translationLabel} ${state.bookName} ${state.chapterNumber}장`.trim();
    const lines = [];
    getSelectedVerseNumbers().forEach(verseNum => {
        const verseEl = scope.querySelector(`.verse-text[data-verse="${verseNum}"]`);
        if (!verseEl) {
            return;
        }
        lines.push(`${verseNum} ${verseEl.textContent.trim()}`.trim());
        if (!isCompareOn()) {
            return;
        }
        const compareEl = verseEl.closest("tr")?.querySelector(".verse-compare-text:not(.is-empty) .verse-compare-body");
        const compareText = compareEl ? compareEl.textContent.trim() : "";
        if (compareText) {
            lines.push(`  [${compareLabel}] ${compareText}`);
        }
    });
    return [header, ...lines].filter(Boolean).join("\n");
}

async function copySelectedVerses() {
    const text = buildSelectedText();
    if (!text) {
        return;
    }
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            fallbackCopy(text);
        }
    } catch (error) {
        fallbackCopy(text);
    }
}

async function shareSelectedVerses() {
    const text = buildSelectedText();
    if (!text) {
        return;
    }
    if (navigator.share) {
        try {
            await navigator.share({
                title: "성경 구절 공유",
                text
            });
            return;
        } catch (error) {
            // ignore and fallback
        }
    }
    copySelectedVerses();
}

function fallbackCopy(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
}

function bindChapterMemoEvents() {
    if (elements.chapterMemoBtn) {
        elements.chapterMemoBtn.addEventListener("click", handleChapterMemoClick);
    }
    if (elements.chapterMemoSaveBtn) {
        elements.chapterMemoSaveBtn.addEventListener("click", saveChapterMemo);
    }
    if (elements.chapterMemoDeleteBtn) {
        elements.chapterMemoDeleteBtn.addEventListener("click", deleteChapterMemo);
    }
    if (elements.chapterMemoCloseBtn) {
        elements.chapterMemoCloseBtn.addEventListener("click", closeChapterMemoPanel);
    }
    if (elements.chapterMemoPanel) {
        setupDialogScrollLock(elements.chapterMemoPanel);
        // backdrop click 시 닫기 — native dialog에서는 e.target===dialog일 때
        elements.chapterMemoPanel.addEventListener("click", (e) => {
            if (e.target === elements.chapterMemoPanel) {
                closeChapterMemoPanel();
            }
        });
    }
}

function updateChapterMemoButton() {
    const btn = elements?.chapterMemoBtn;
    if (!btn) {
        return;
    }
    const hasMemo = Boolean(chapterMemoState.content);
    btn.classList.toggle("btn-outline-secondary", !hasMemo);
    btn.classList.toggle("btn-secondary", hasMemo);
}

function openChapterMemoPanel() {
    const panel = elements?.chapterMemoPanel;
    if (!panel) {
        return;
    }
    const input = elements.chapterMemoInput;
    input.value = chapterMemoState.content || "";
    elements.chapterMemoDeleteBtn.classList.toggle("d-none", !chapterMemoState.memoId);
    panel.showModal();
    input.focus();
    const len = input.value.length;
    input.setSelectionRange(len, len);
}

function closeChapterMemoPanel() {
    const panel = elements?.chapterMemoPanel;
    if (!panel) {
        return;
    }
    panel.close();
}

async function handleChapterMemoClick() {
    if (!await ensureChapterStateReady()) {
        showAlert("사용자 상태를 불러오는 중입니다. 잠시 후 다시 시도해주세요.", "danger");
        return;
    }
    if (!memoState.auth.allowed) {
        requestAuth(memoState.auth);
        return;
    }
    openChapterMemoPanel();
}

async function saveChapterMemo() {
    const content = elements.chapterMemoInput.value.trim();
    if (!content) {
        return;
    }
    const requestChapterKey = getCurrentChapterKey();
    try {
        const response = await fetch(buildChapterMemoUrl(), {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify({content})
        });
        if (!isCurrentChapter(requestChapterKey)) {
            return;
        }
        if (response.status === 401) {
            requestAuth(memoState.auth);
            return;
        }
        if (!response.ok) {
            throw new Error("장 메모 저장 실패");
        }
        const memo = await response.json();
        chapterMemoState.memoId = memo.chapterMemoId;
        chapterMemoState.content = memo.content;
        updateChapterMemoButton();
        closeChapterMemoPanel();
    } catch (error) {
        showAlert("장 메모 저장 중 오류가 발생했습니다.", "danger");
        console.error(error);
    }
}

async function deleteChapterMemo() {
    const requestChapterKey = getCurrentChapterKey();
    try {
        const response = await fetch(buildChapterMemoUrl(), {
            method: "DELETE",
            credentials: "include"
        });
        if (!isCurrentChapter(requestChapterKey)) {
            return;
        }
        if (response.status === 401) {
            requestAuth(memoState.auth);
            return;
        }
        if (!response.ok) {
            throw new Error("장 메모 삭제 실패");
        }
        chapterMemoState.memoId = null;
        chapterMemoState.content = null;
        updateChapterMemoButton();
        closeChapterMemoPanel();
    } catch (error) {
        showAlert("장 메모 삭제 중 오류가 발생했습니다.", "danger");
        console.error(error);
    }
}

function buildChapterMemoUrl() {
    return `${API_CONFIG.MEMOS_BASE}/${state.translationId}/books/${state.bookOrder}/chapters/${state.chapterNumber}/chapter-memo`;
}

// ────────────────────────────────────────────────────────────────
// Verse Font Size 컨트롤
// 설계 문서: docs/bible/bible-verse-dynamic-font-size.md
// ────────────────────────────────────────────────────────────────

function syncFontStepFromBoot() {
    const bootStep = parseInt(document.documentElement.getAttribute("data-verse-font-step"), 10);
    // bootStep 이 유효하면 store 를 읽지 않는다(단락 평가).
    // LocalStore.get 내부 JSON.parse 가 깨진 값에 throw 할 경우 init 중단 방지.
    let resolved;
    if (bootStep >= 1 && bootStep <= 5) {
        resolved = bootStep;
    } else {
        try {
            resolved = BibleReaderStore.getFontStep();
        } catch (e) {
            resolved = DEFAULT_FONT_STEP;
        }
    }
    fontState.step = resolved;
    applyFontStep(fontState.step, {persist: false, announce: false, focus: false});
}

function applyFontStep(step, {persist = true, announce = true, focus = true} = {}) {
    // parseInt 결과가 NaN 이면 DEFAULT, 그 외에는 1~5 로 clamp.
    // (`parseInt(0) || DEFAULT` 는 1단계 ArrowLeft 시 0이 DEFAULT 로 폴백되어 3으로 튀는 버그가 있음)
    const parsed = parseInt(step, 10);
    const clamped = Number.isNaN(parsed)
        ? DEFAULT_FONT_STEP
        : Math.max(1, Math.min(5, parsed));
    fontState.step = clamped;

    document.documentElement.style.setProperty("--verse-font-size", VERSE_FONT_SIZES[clamped]);
    document.documentElement.setAttribute("data-verse-font-step", String(clamped));

    // stepper UI 동기화 + roving tabindex
    const dots = document.querySelectorAll(".verse-font-dot");
    dots.forEach(dot => {
        const dotStep = parseInt(dot.dataset.step, 10);
        const checked = dotStep === clamped;
        dot.setAttribute("aria-checked", String(checked));
        dot.setAttribute("tabindex", checked ? "0" : "-1");
        if (checked && focus && fontState.expanded) {
            dot.focus();
        }
    });

    if (elements?.fontReset) {
        elements.fontReset.disabled = (clamped === DEFAULT_FONT_STEP);
    }

    if (persist) {
        BibleReaderStore.saveFontStep(clamped);
    }
    if (announce && elements?.fontLiveRegion) {
        elements.fontLiveRegion.textContent =
            `글씨 크기: ${FONT_STEP_LABELS[clamped]} (${clamped}단계)`;
    }
}

function bindFontControlEvents() {
    if (!elements.fontControl) {
        return;
    }

    elements.fontToggle?.addEventListener("click", () => toggleFontPanel(!fontState.expanded));
    elements.fontClose?.addEventListener("click", () => toggleFontPanel(false));
    elements.fontReset?.addEventListener("click", () => applyFontStep(DEFAULT_FONT_STEP));

    elements.fontStepper?.addEventListener("click", (e) => {
        const dot = e.target.closest("[data-step]");
        if (dot) {
            applyFontStep(dot.dataset.step, {focus: false});
        }
    });

    elements.fontStepper?.addEventListener("keydown", (e) => {
        let nextStep = null;
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            nextStep = fontState.step - 1;
        } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            nextStep = fontState.step + 1;
        } else if (e.key === "Home") {
            nextStep = 1;
        } else if (e.key === "End") {
            nextStep = 5;
        }
        // Escape 는 stepper 에서 처리하지 않고 전역 handleFabEscapeKey 로 위임한다.
        // (중복 처리하면 document 까지 버블링되어 FAB까지 같이 닫힘)
        if (nextStep !== null) {
            applyFontStep(nextStep);
            e.preventDefault();
        }
    });
}

function toggleFontPanel(expand, {returnFocus = true} = {}) {
    const willCollapse = !expand && fontState.expanded;

    // 1) 닫기 직전: 패널 내부에 포커스가 남아 있다면 미리 캐시.
    //    포커스 이동/제거는 DOM 상태 플립 이후에 수행해야 한다.
    //    (현재 시점엔 토글이 display:none 이라 silent fail)
    let focusInsidePanel = false;
    let activeBeforeCollapse = null;
    if (willCollapse) {
        activeBeforeCollapse = document.activeElement;
        focusInsidePanel = !!(activeBeforeCollapse && elements.fontPanel?.contains(activeBeforeCollapse));
    }

    // 2) 상태/속성 플립
    fontState.expanded = Boolean(expand);
    elements.fontPanel?.classList.toggle(UI_CLASSES.HIDDEN, !fontState.expanded);
    elements.fontPanel?.setAttribute("aria-hidden", String(!fontState.expanded));
    elements.fontToggle?.setAttribute("aria-expanded", String(fontState.expanded));
    elements.fontControl?.setAttribute("data-expanded", String(fontState.expanded));

    // 3) 포커스 처리 — DOM 가시성 확정 후
    if (fontState.expanded) {
        const checked = elements.fontStepper?.querySelector('[aria-checked="true"]');
        checked?.focus();
    } else if (returnFocus) {
        // 명시적 닫기(Esc/×) — focusInsidePanel 여부와 무관하게 항상 토글로 복귀.
        // 사용자가 Tab 으로 패널 밖에 나간 뒤 Esc 누르는 시나리오도 보장.
        elements.fontToggle?.focus();
    } else if (focusInsidePanel) {
        // 외부 클릭 + 패널 내부에 포커스 남은 경우 — blur 하여 hidden 요소에 active 가 남지 않도록.
        // (.verse-text 는 div 라 non-focusable 이므로 이 분기가 실제 발동된다.)
        activeBeforeCollapse?.blur();
    }
}

// ------------ 대역 비교 (docs/bible/bible-compare-design.md) ------------

function isCompareOn() {
    return Boolean(state.compareTranslationId);
}

/**
 * 대역을 못 불러왔으면 대역 칸을 아예 그리지 않는다.
 * 절마다 "대역을 불러오지 못했습니다" 를 176번 적어 두면 그것이 곧 본문을 덮는다.
 * 실패는 목록 아래 안내 한 줄과 `다시 시도` 버튼이 맡는다.
 */
function isCompareRendered() {
    return isCompareOn() && !compareState.error;
}

function compareTagLabel() {
    return state.compareTranslationType || state.compareTranslationName || "";
}

function findCompareOption(translationId) {
    return elements.comparePanel?.querySelector(`[data-compare-id="${translationId}"]`) ?? null;
}

/**
 * 고른 대역 번역본이 실제로 쓸 수 있는지 확인하고 메타데이터를 채운다.
 *
 * 목록에 없는 id(숨김 번역본, 없는 번역본)는 **조용히 끈다.** 오류를 띄우면 링크를 잘못 받은
 * 사람이 성경을 못 읽는다.
 */
function resolveCompareTranslation() {
    state.compareTranslationType = null;
    state.compareTranslationName = null;
    if (state.compareTranslationId === state.translationId) {
        state.compareTranslationId = null; // 자기 자신과의 대역은 없다
    }
    if (state.compareTranslationId) {
        const option = findCompareOption(state.compareTranslationId);
        if (option) {
            state.compareTranslationType = option.dataset.compareType || null;
            state.compareTranslationName = option.dataset.compareName || null;
        } else {
            state.compareTranslationId = null;
        }
    }
    CompareStore.save(state.compareTranslationId);
    updateCompareToggleLabel();
    syncCompareOptions();
}

function updateCompareToggleLabel() {
    const {compareToggle, compareToggleLabel} = elements;
    if (!compareToggle || !compareToggleLabel) {
        return;
    }
    const on = isCompareOn();
    // 상단바는 늘 붙어 있으므로, 여기 라벨이 "지금 무엇과 무엇을 보고 있는지" 의 상시 표시다.
    compareToggleLabel.textContent = on ? compareTagLabel() : "＋";
    compareToggle.classList.toggle("is-active", on);
    const description = on ? `대역 비교: ${compareTagLabel()}` : "대역 비교 켜기";
    compareToggle.setAttribute("aria-label", description);
    compareToggle.setAttribute("title", description);
}

function syncCompareOptions() {
    const options = elements.comparePanel?.querySelectorAll("[data-compare-id]");
    if (!options) {
        return;
    }
    options.forEach(option => {
        const raw = option.dataset.compareId;
        const optionId = raw ? parseInt(raw, 10) : null;
        // 지금 읽고 있는 번역본은 대역 후보가 아니다
        const isCurrentTranslation = optionId === state.translationId;
        option.classList.toggle(UI_CLASSES.HIDDEN, isCurrentTranslation);
        const selected = optionId === state.compareTranslationId
            || (!optionId && !isCompareOn());
        option.setAttribute("aria-checked", String(selected));
        option.classList.toggle("is-active", selected);
    });
}

function bindCompareControlEvents() {
    if (!elements.compareControl) {
        return;
    }
    elements.compareToggle?.addEventListener("click", () => toggleComparePanel(!compareState.expanded));
    elements.comparePanel?.addEventListener("click", handleCompareOptionClick);
    // 재시도는 장을 다시 여는 것으로 충분하다. 본문 응답은 하루짜리 캐시라 사실상 대역만 다시 받는다.
    elements.compareRetryBtn?.addEventListener("click", () => loadChapter("CURRENT"));
}

function handleCompareOptionClick(event) {
    const option = event.target.closest("[data-compare-id]");
    if (!option) {
        return;
    }
    const raw = option.dataset.compareId;
    const parsed = raw ? parseInt(raw, 10) : null;
    toggleComparePanel(false);
    applyCompareTranslation(Number.isInteger(parsed) ? parsed : null);
}

function applyCompareTranslation(translationId) {
    const nextId = translationId === state.translationId ? null : translationId;
    if (nextId === state.compareTranslationId) {
        return;
    }
    chapterState.restoreVerseNumber = getTopVisibleVerseNumber();
    state.compareTranslationId = nextId;
    resolveCompareTranslation();
    updateVerseUrl();
    loadChapter("CURRENT");
}

function toggleComparePanel(expand, {returnFocus = true} = {}) {
    const willCollapse = !expand && compareState.expanded;
    let activeBeforeCollapse = null;
    let focusInsidePanel = false;
    if (willCollapse) {
        activeBeforeCollapse = document.activeElement;
        focusInsidePanel = !!(activeBeforeCollapse && elements.comparePanel?.contains(activeBeforeCollapse));
    }

    compareState.expanded = Boolean(expand);
    elements.comparePanel?.classList.toggle(UI_CLASSES.HIDDEN, !compareState.expanded);
    elements.comparePanel?.setAttribute("aria-hidden", String(!compareState.expanded));
    elements.compareToggle?.setAttribute("aria-expanded", String(compareState.expanded));
    elements.compareControl?.setAttribute("data-expanded", String(compareState.expanded));

    if (compareState.expanded) {
        // 상단바에 패널 둘이 동시에 열리면 좁은 화면에서 서로를 덮는다
        if (fontState.expanded) {
            toggleFontPanel(false, {returnFocus: false});
        }
        const active = elements.comparePanel?.querySelector('[aria-checked="true"]:not(.d-none)')
            ?? elements.comparePanel?.querySelector("[data-compare-id]");
        active?.focus();
    } else if (returnFocus) {
        elements.compareToggle?.focus();
    } else if (focusInsidePanel) {
        activeBeforeCollapse?.blur();
    }
}

/**
 * 대역 본문을 가져온다. **절대 reject 하지 않는다** — 대역 실패가 읽기를 막아서는 안 된다.
 */
async function fetchCompareChapter(bookOrder, chapterNumber) {
    const url = `${API_CONFIG.TRANSLATIONS}/${state.compareTranslationId}`
        + `/books/${bookOrder}/chapters/${chapterNumber}/verses`;
    try {
        // 본문과 같은 조건. 쿠키를 실어 보내면 공유 캐시가 응답을 사용자별로 취급한다.
        const response = await fetch(url, {credentials: "omit"});
        if (response.status === 404) {
            return {verses: [], error: "이 번역본에는 이 장이 없습니다."};
        }
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        return {verses: data?.book?.chapter?.verses ?? [], error: null};
    } catch (error) {
        console.warn("대역 본문을 불러오지 못했습니다.", error);
        return {verses: [], error: "대역을 불러오지 못했습니다."};
    }
}

/**
 * 절 수가 다를 때만 안내하고 싶은 유혹이 있지만, 절 수가 같은데도 밀려 있는 경우가 있다
 * (RVR1909 욥기 39장 — 양쪽 30절, 내용은 3절씩 어긋남). 조건을 달면 가장 크게 어긋난
 * 화면에서 안내가 사라진다. 그래서 대역을 켜면 늘 띄운다.
 */
function renderCompareNotice(rows) {
    const {compareNotice, compareNoticeText, compareRetryBtn} = elements;
    if (!compareNotice || !compareNoticeText) {
        return;
    }
    if (!isCompareOn()) {
        compareNotice.classList.add(UI_CLASSES.HIDDEN);
        compareNoticeText.textContent = "";
        compareRetryBtn?.classList.add(UI_CLASSES.HIDDEN);
        return;
    }
    compareNotice.classList.remove(UI_CLASSES.HIDDEN);
    if (compareState.error) {
        compareNoticeText.textContent = compareState.error;
        compareRetryBtn?.classList.remove(UI_CLASSES.HIDDEN);
        return;
    }
    compareRetryBtn?.classList.add(UI_CLASSES.HIDDEN);
    const missing = rows.filter(row => row.text !== null && row.compareText === null).length;
    const extra = rows.filter(row => row.text === null).length;
    const parts = ["번역본마다 절을 나누는 기준이 달라, 같은 번호가 같은 내용이 아닐 수 있습니다."];
    if (missing > 0) {
        parts.push(`대역에 없는 절 ${missing}개`);
    }
    if (extra > 0) {
        parts.push(`대역에만 있는 절 ${extra}개`);
    }
    compareNoticeText.textContent = parts.join(" · ");
}

function getTopVisibleVerseNumber() {
    const verses = elements.verseTable?.querySelectorAll(".verse-text[data-verse]");
    if (!verses) {
        return null;
    }
    const navOffset = 80; // 고정 상단바에 가려진 만큼은 "보이는" 것으로 치지 않는다
    for (const verseEl of verses) {
        if (verseEl.getBoundingClientRect().bottom > navOffset) {
            return verseEl.getAttribute("data-verse");
        }
    }
    return null;
}

function restoreVerseIntoView(verseNumber) {
    const verseEl = elements.verseTable?.querySelector(`.verse-text[data-verse="${verseNumber}"]`);
    verseEl?.scrollIntoView({block: "start", behavior: "auto"});
}

document.addEventListener("DOMContentLoaded", init);
