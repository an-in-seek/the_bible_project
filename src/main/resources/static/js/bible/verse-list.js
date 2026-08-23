import {BibleReaderStore, BookStore, ChapterStore, LastReadStore, TranslationStore, VerseStore} from "/js/storage-util.js?v=2.7";
import {applyOAuthBackGuardIfNeeded, buildLoginRedirectUrl, checkAuthStatus, refreshAccessToken} from "/js/auth/auth-check.js";
import {bindNavSelectLabelFit, fitNavSelectLabel, setupDialogScrollLock} from "/js/common-util.js?v=2.4";
import {showConfirm} from "/js/confirm-dialog.js?v=1.0";
import {bindFromBackButton} from "/js/nav-restore.js?v=1.1";
import {initWordStats} from "/js/bible/word-stats.js?v=1.3";

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
    bookOrder: null,
    bookName: null,
    chapterNumber: null,
    verseNumber: null,
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
    stateLoadPromise: null
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

const fontState = {
    step: DEFAULT_FONT_STEP,
    expanded: false
};

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
        fontLiveRegion: get("verseFontLiveRegion")
    };
}

function parseIntParam(params, key) {
    const value = parseInt(params.get(key), 10);
    return Number.isNaN(value) ? null : value;
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
        }
        const url = buildChapterUrl(direction);
        const response = await fetch(url, {credentials: "omit"});
        if (!response.ok) {
            throw new Error("데이터 로딩 실패");
        }
        const data = await response.json();
        updateStateFromChapter(data);
        updateVerseUrl();
        memoState.cache = new Map();
        chapterMemoState.memoId = null;
        chapterMemoState.content = null;
        chapterMemoState.loaded = false;
        updateChapterMemoButton();
        renderChapter(data, []);
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

function renderChapter(data, highlights) {
    const chapter = data.book.chapter;
    updateLabels();
    if (elements.verseTable) {
        elements.verseTable.innerHTML = chapter.verses.map(renderVerseRow).join("");
    }
    if (elements.prevBtn) {
        elements.prevBtn.disabled = data.isFirst;
    }
    if (elements.nextBtn) {
        elements.nextBtn.disabled = data.isLast;
    }
    const verseNumber = state.verseNumber ?? VerseStore.consumeVerseNumber();
    if (verseNumber) {
        if (state.verseNumber) {
            state.verseNumber = null;
            VerseStore.consumeVerseNumber();
        }
        highlightVerse(verseNumber);
    } else {
        window.scrollTo(0, 0);
    }
    applyHighlights(highlights);
    resetSelectionState();
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

function renderVerseRow(verse) {
    const v = verse.verseNumber;
    const memo = memoState.cache.get(String(v));
    const hasMemo = memo && memo.content;
    const verseClass = hasMemo ? "verse-text text-body verse-has-memo" : "verse-text text-body";
    return `
            <tr>
              <td>${v}</td>
              <td>
                <div class="${verseClass}" id="verse-text-${v}" data-verse="${v}">${verse.text}</div>
                <div class="memo-container d-none mt-3" id="memo-${v}">
                  <div class="form-group">
                    <textarea class="form-control mb-2" rows="3" placeholder="메모를 입력하세요..." id="memo-input-${v}"></textarea>
                    <div class="text-end">
                      <button class="btn btn-sm btn-danger memo-delete-btn" data-verse="${v}">🗑️ 삭제</button>
                      <button class="btn btn-sm btn-primary memo-save-btn" data-verse="${v}">💾 저장</button>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          `;
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

function buildSelectedText() {
    const verseNumbers = getSelectedVerseNumbers();
    const translationLabel = state.translationType || state.translationName || "";
    const header = `${translationLabel} ${state.bookName} ${state.chapterNumber}장`.trim();
    const lines = verseNumbers.map(verseNum => {
        const verseEl = document.querySelector(`.verse-text[data-verse="${verseNum}"]`);
        const text = verseEl ? verseEl.textContent.trim() : "";
        return `${verseNum} ${text}`.trim();
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

document.addEventListener("DOMContentLoaded", init);
