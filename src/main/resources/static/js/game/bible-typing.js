import {fetchWithAuthRetry} from "/js/common-util.js?v=2.3";

const apiBase = "/api/v1/bible";
const sessionApi = "/api/v1/game/bible-typing/sessions";
const resumeApi = "/api/v1/game/bible-typing/progress";
const FIXED_TRANSLATION_CODE = "KRV";

const UI_STATUS = {
    WAITING: "대기",
    IN_PROGRESS: "진행",
    COMPLETED: "완료"
};

const elements = {
    translationSelect: document.getElementById("typingTranslationSelect"),
    bookSelect: document.getElementById("typingBookSelect"),
    chapterSelect: document.getElementById("typingChapterSelect"),
    verseList: document.getElementById("typingVerseList"),
    message: document.getElementById("typingMessage"),
    actionBar: document.querySelector(".typing-action-bar"),
    startBtn: document.getElementById("typingStartBtn"),
    resetBtn: document.getElementById("typingResetBtn"),
    verseHeader: document.getElementById("typingVerseHeader"),
    verseStatus: document.getElementById("typingVerseStatus"),
    progressText: document.getElementById("typingProgressText"),
    progressBar: document.getElementById("typingProgressBar"),
    cpm: document.getElementById("typingCpm"),
    accuracy: document.getElementById("typingAccuracy"),
    elapsedTime: document.getElementById("typingElapsedTime"),
    sessionSummary: document.getElementById("typingSessionSummary"),
    sessionSummaryText: document.getElementById("typingSessionSummaryText"),
    backButton: document.getElementById("topNavBackButton"),
    pageTitleLabel: document.getElementById("pageTitleLabel"),
    loadingEl: document.getElementById("typingLoading"),
    errorEl: document.getElementById("typingError"),
    contentEl: document.getElementById("typingContent")
};

const state = {
    translations: [],
    books: [],
    chapters: [],
    verses: [],
    verseStates: [],
    tokenMap: new Map(),
    currentIndex: 0,
    sessionActive: false,
    practiceStarted: false,
    sessionKey: null,
    transitioning: false,
    composing: false,
    pendingCompleteIndex: null,
    startedAt: null,
    endedAt: null,
    sessionSummary: null,
    timerId: null
};

const fetchJson = async (url) => {
    const response = await fetchWithAuthRetry(url, {credentials: "same-origin"});
    if (!response.ok) {
        throw new Error(`요청 실패: ${response.status}`);
    }
    return response.json();
};

const showMessage = (message) => {
    if (!elements.message) return;
    elements.message.textContent = message;
    elements.message.classList.remove("d-none");
};

const clearMessage = () => {
    if (!elements.message) return;
    elements.message.textContent = "";
    elements.message.classList.add("d-none");
};

const parseNumber = (value) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
};

const getQueryParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
        translationId: parseNumber(params.get("translationId")),
        bookOrder: parseNumber(params.get("bookOrder")),
        chapterNumber: parseNumber(params.get("chapterNumber"))
    };
};

const updateQueryParams = (params, replace = false) => {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === undefined) {
            url.searchParams.delete(key);
        } else {
            url.searchParams.set(key, String(value));
        }
    });
    if (replace) {
        window.history.replaceState({}, "", url);
    } else {
        window.history.pushState({}, "", url);
    }
};

const normalizeText = (text) => {
    return text.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
};

const createSessionKey = () => {
    if (state.sessionKey) return state.sessionKey;
    if (window.crypto?.randomUUID) {
        state.sessionKey = window.crypto.randomUUID();
    } else {
        state.sessionKey = `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
    return state.sessionKey;
};

const createOption = (value, label) => {
    const option = document.createElement("option");
    option.value = String(value);
    option.textContent = label;
    return option;
};

const clearChildren = (element) => {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
};

const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
};

const getVerseElapsedSeconds = (startedAt, endedAt) => {
    if (!startedAt || !endedAt) return 0;
    return Math.max(0, Math.floor((endedAt - startedAt) / 1000));
};

const computeAccuracyPercent = (correct, total, precision = 0) => {
    if (total === 0) return 0;
    const value = (correct / total) * 100;
    return precision === 0 ? Math.round(value) : Number(value.toFixed(precision));
};

const computeCpm = (totalTyped, elapsedSeconds, precision = 0) => {
    const elapsedMinutes = elapsedSeconds / 60;
    if (elapsedMinutes <= 0) return 0;
    const value = totalTyped / elapsedMinutes;
    return precision === 0 ? Math.round(value) : Number(value.toFixed(precision));
};

const finalizeVerseMetrics = (verseState) => {
    if (!verseState.startedAt) {
        verseState.startedAt = new Date();
    }
    if (!verseState.endedAt) {
        verseState.endedAt = new Date();
    }
    verseState.elapsedSeconds = getVerseElapsedSeconds(verseState.startedAt, verseState.endedAt);
    const typedLength = verseState.typedText.length;
    const correctCount = countCorrectCharsRaw(verseState.originalText, verseState.typedText);
    verseState.accuracy = computeAccuracyPercent(correctCount, typedLength, 2);
    verseState.cpm = computeCpm(typedLength, verseState.elapsedSeconds, 2);
};

const computeSessionStats = () => {
    const completedVerses = state.verseStates.filter((verse) => verse.completed);
    const completedCount = completedVerses.length;
    const totalElapsedSeconds = completedVerses.reduce((sum, verse) => sum + (verse.elapsedSeconds || 0), 0);
    const totalTypedChars = completedVerses.reduce(
        (sum, verse) => sum + (verse.typedText?.length || 0),
        0
    );
    const totalCorrectChars = completedVerses.reduce((sum, verse) => {
        const typedChars = verse.typedText?.length || 0;
        const accuracy = Number.isFinite(verse.accuracy) ? verse.accuracy : 0;
        const correctChars = Math.floor((typedChars * accuracy) / 100);
        return sum + correctChars;
    }, 0);

    return {
        totalVerses: state.verses.length,
        completedVerses: completedCount,
        totalTypedChars,
        accuracy: computeAccuracyPercent(totalCorrectChars, totalTypedChars, 2),
        cpm: computeCpm(totalTypedChars, totalElapsedSeconds, 2),
        totalElapsedSeconds
    };
};

const setVerseStatus = (label) => {
    if (elements.verseStatus) elements.verseStatus.textContent = label;
};

const updateMetrics = () => {
    const totalVerses = state.verses.length;
    const completedVerses = state.verseStates.filter((verse) => verse.completed).length;
    const progress = totalVerses === 0 ? 0 : Math.round((completedVerses / totalVerses) * 100);
    const allCompleted = totalVerses > 0 && completedVerses === totalVerses;
    const useSummary = Boolean(state.sessionSummary) && (!state.sessionActive || allCompleted);
    const completedStats = computeSessionStats();
    let accuracyValue = useSummary ? state.sessionSummary.accuracy : completedStats.accuracy;
    let cpmValue = useSummary ? state.sessionSummary.cpm : completedStats.cpm;
    let elapsedSeconds = useSummary ? state.sessionSummary.totalElapsedSeconds : completedStats.totalElapsedSeconds;
    if (!useSummary) {
        accuracyValue = Math.round(accuracyValue);
        cpmValue = Math.round(cpmValue);
    }

    if (elements.progressText) elements.progressText.textContent = `${progress}%`;
    if (elements.progressBar) elements.progressBar.style.width = `${progress}%`;
    if (elements.cpm) elements.cpm.textContent = `${cpmValue}`;
    if (elements.accuracy) elements.accuracy.textContent = `${accuracyValue}`;
    if (elements.elapsedTime) {
        if (useSummary || elapsedSeconds > 0) {
            elements.elapsedTime.textContent = formatDuration(elapsedSeconds);
        } else if (state.startedAt || state.sessionActive) {
            elements.elapsedTime.textContent = formatDuration(0);
        } else {
            elements.elapsedTime.textContent = "00:00";
        }
    }
};

const toggleButton = (button, shouldShow) => {
    if (!button) return;
    button.classList.toggle("d-none", !shouldShow);
};

const getUiStatus = () => {
    const hasVerses = state.verseStates.length > 0;
    const allCompleted = hasVerses && state.verseStates.every((verse) => verse.completed);
    if (allCompleted) return UI_STATUS.COMPLETED;
    if (state.practiceStarted) return UI_STATUS.IN_PROGRESS;
    return UI_STATUS.WAITING;
};

const updateActionButtons = (status = getUiStatus()) => {
    const isWaiting = status === UI_STATUS.WAITING;
    toggleButton(elements.startBtn, isWaiting);
    toggleButton(elements.resetBtn, !isWaiting);
    const hasVisibleButton = !elements.startBtn?.classList.contains("d-none") || !elements.resetBtn?.classList.contains("d-none");
    toggleButton(elements.actionBar, hasVisibleButton);
};

const showSessionSummary = () => {
    if (!elements.sessionSummary) return;
    elements.sessionSummary.classList.remove("d-none");
    elements.sessionSummaryText.textContent = "선택한 장의 모든 구절을 마쳤습니다. 기록을 저장했습니다.";
};

const resetSessionState = () => {
    state.sessionActive = false;
    state.practiceStarted = false;
    state.sessionKey = null;
    state.transitioning = false;
    state.composing = false;
    state.pendingCompleteIndex = null;
    state.startedAt = null;
    state.endedAt = null;
    state.sessionSummary = null;
    state.currentIndex = 0;
    state.verseStates = state.verses.map((verse) => ({
        verseNumber: verse.verseNumber,
        originalText: verse.text,
        normalizedText: normalizeText(verse.text),
        typedText: "",
        normalizedTyped: "",
        correctCount: 0,
        accuracy: 0,
        cpm: 0,
        saved: false,
        completed: false,
        startedAt: null,
        endedAt: null,
        elapsedSeconds: 0
    }));
    state.tokenMap.clear();
    if (state.timerId) {
        clearInterval(state.timerId);
        state.timerId = null;
    }
    setVerseStatus("대기");
    if (elements.sessionSummary) elements.sessionSummary.classList.add("d-none");
    updateMetrics();
    updateActionButtons();
};

const ensureTokenized = (row, normalizedText) => {
    const content = row.querySelector(".typing-verse-content");
    if (!content || row.dataset.tokenized === "true") return;
    clearChildren(content);
    const tokens = [];
    for (const char of normalizedText) {
        const span = document.createElement("span");
        span.className = "typing-token";
        span.textContent = char;
        content.appendChild(span);
        tokens.push(span);
    }
    if (tokens.length === 0) {
        const span = document.createElement("span");
        span.className = "typing-token";
        span.textContent = " ";
        content.appendChild(span);
        tokens.push(span);
    }
    state.tokenMap.set(row.dataset.index, tokens);
    row.dataset.tokenized = "true";
};

const updateTokenClasses = (row, normalizedText, normalizedInput) => {
    const tokens = state.tokenMap.get(row.dataset.index);
    if (!tokens) return;
    const inputLength = normalizedInput.length;
    tokens.forEach((token, index) => {
        token.classList.remove("is-correct", "is-current", "is-incorrect");
        if (index < inputLength) {
            if (normalizedInput[index] === normalizedText[index]) {
                token.classList.add("is-correct");
            } else {
                token.classList.add("is-incorrect");
            }
        } else if (index === inputLength) {
            token.classList.add("is-current");
        }
    });
};

const countCorrectChars = (normalizedText, normalizedInput) => {
    const length = Math.min(normalizedText.length, normalizedInput.length);
    let count = 0;
    for (let i = 0; i < length; i += 1) {
        if (normalizedText[i] === normalizedInput[i]) {
            count += 1;
        }
    }
    return count;
};

const countCorrectCharsRaw = (originalText, typedText) => {
    const length = Math.min(originalText.length, typedText.length);
    let count = 0;
    for (let i = 0; i < length; i += 1) {
        if (originalText[i] === typedText[i]) {
            count += 1;
        }
    }
    return count;
};

const activateVerse = (index) => {
    const verseRows = elements.verseList.querySelectorAll(".typing-verse-row");
    verseRows.forEach((row, rowIndex) => {
        const input = row.querySelector(".typing-verse-input");
        if (!input) return;
        const isActive = rowIndex === index;
        row.classList.toggle("is-active", isActive);
        const verseState = state.verseStates[rowIndex];
        const isEnabled = isActive && state.practiceStarted && !verseState?.completed;
        input.disabled = !isEnabled;
        input.readOnly = !isEnabled;
        if (isEnabled) {
            ensureTokenized(row, verseState.normalizedText);
            updateTokenClasses(row, verseState.normalizedText, verseState.normalizedTyped);
        }
    });
};

const focusVerseInput = (index) => {
    const row = elements.verseList.querySelector(`.typing-verse-row[data-index="${index}"]`);
    if (!row) return;
    const input = row.querySelector(".typing-verse-input");
    if (!input) return;
    input.focus();
    input.scrollIntoView({block: "center", behavior: "smooth"});

    if (window.visualViewport) {
        const scrollAfterKeyboard = () => {
            input.scrollIntoView({block: "center", behavior: "smooth"});
            window.visualViewport.removeEventListener("resize", scrollAfterKeyboard);
        };
        window.visualViewport.addEventListener("resize", scrollAfterKeyboard, {once: true});
    }
};

const formatLocalDateTime = (date) => {
    return date.toISOString();
};

const updateSession = async () => {
    if (!state.sessionKey) return;
    const payload = {
        endedAt: formatLocalDateTime(state.endedAt || new Date())
    };

    const response = await fetchWithAuthRetry(`${sessionApi}/${state.sessionKey}/end`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload),
        credentials: "same-origin"
    });

    if (!response.ok) {
        throw new Error(`요청 실패: ${response.status}`);
    }
};

const endSession = async () => {
    if (!state.sessionActive && !state.startedAt) return;
    state.sessionActive = false;
    state.practiceStarted = false;
    const inputs = elements.verseList.querySelectorAll(".typing-verse-input");
    inputs.forEach((input) => {
        input.disabled = true;
        input.readOnly = true;
    });
    state.endedAt = new Date();
    if (state.timerId) {
        clearInterval(state.timerId);
        state.timerId = null;
    }
    setVerseStatus("완료");
    updateMetrics();
    updateActionButtons();

    try {
        await updateSession();
        const selection = getQueryParams();
        const progress = await fetchLatestProgress(selection);
        if (progress) {
            applyProgressSummary(progress, state.sessionKey);
        }
        showSessionSummary();
    } catch (error) {
        showMessage("세션 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }
};

const handleResetSession = async () => {
    if (!confirm("현재 진행 중인 연습 기록을 포함해, 해당 장의 모든 기록이 삭제됩니다. 계속하시겠습니까?")) {
        return;
    }

    try {
        const params = getQueryParams();
        const query = new URLSearchParams({
            translationId: String(params.translationId),
            bookOrder: String(params.bookOrder),
            chapterNumber: String(params.chapterNumber)
        });

        const response = await fetchWithAuthRetry(`${sessionApi}?${query.toString()}`, {
            method: "DELETE",
            credentials: "same-origin"
        });

        if (!response.ok) {
            throw new Error(`초기화 실패: ${response.status}`);
        }

        // 로컬 스토리지 초기화 및 상태 리셋
        resetSessionState();

        // 초기화 후 UI 반영 (다시 로드)
        await loadSelections();
        renderVerses();
        updateHeader();
    } catch (error) {
        console.error(error);
        showMessage("기록 초기화 중 오류가 발생했습니다.");
    }
};

const saveVerseProgress = async (verseState) => {
    if (verseState.saved) return;
    const params = getQueryParams();
    const payload = {
        sessionKey: createSessionKey(),
        translationId: params.translationId,
        bookOrder: params.bookOrder,
        chapterNumber: params.chapterNumber,
        verseNumber: verseState.verseNumber,
        typedText: verseState.typedText,
        startedAt: verseState.startedAt ? formatLocalDateTime(verseState.startedAt) : null,
        endedAt: verseState.endedAt ? formatLocalDateTime(verseState.endedAt) : null,
        completed: verseState.completed
    };

    const response = await fetchWithAuthRetry(`${resumeApi}/verses`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload),
        credentials: "same-origin"
    });
    if (!response.ok) {
        throw new Error(`저장 실패: ${response.status}`);
    }
    verseState.saved = true;
};

const handleVerseComplete = async (index) => {
    const verseState = state.verseStates[index];
    verseState.endedAt = new Date();
    finalizeVerseMetrics(verseState);
    verseState.completed = true;
    const row = elements.verseList.querySelector(`.typing-verse-row[data-index="${index}"]`);
    if (row) {
        row.classList.remove("is-active");
        row.classList.add("is-complete");
        const input = row.querySelector(".typing-verse-input");
        if (input) {
            input.disabled = true;
            input.blur();
        }
        updateTokenClasses(row, verseState.normalizedText, verseState.normalizedText);
    }
    if (index + 1 < state.verseStates.length) {
        state.transitioning = true;
        state.currentIndex = index + 1;
        activateVerse(state.currentIndex);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                focusVerseInput(state.currentIndex);
                state.transitioning = false;
            });
        });
    } else {
        try {
            await saveVerseProgress(verseState);
        } catch (error) {
            showMessage("구절 기록 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
            return;
        }
        await endSession();
        return;
    }
    saveVerseProgress(verseState).catch(() => {
        showMessage("구절 기록 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    });
};

const handleInput = (event) => {
    if (state.transitioning) return;
    const target = event.target;
    if (!(target instanceof HTMLTextAreaElement)) return;
    const sanitizedValue = target.value.replace(/\r?\n/g, "");
    if (sanitizedValue !== target.value) {
        target.value = sanitizedValue;
    }
    const index = Number.parseInt(target.dataset.index, 10);
    if (Number.isNaN(index) || index !== state.currentIndex) return;

    const verseState = state.verseStates[index];
    const normalizedInput = normalizeText(target.value);
    const normalizedText = verseState.normalizedText;
    const correctCount = countCorrectChars(normalizedText, normalizedInput);

    if (!verseState.startedAt) {
        verseState.startedAt = new Date();
    }

    verseState.typedText = target.value;
    verseState.normalizedTyped = normalizedInput;
    verseState.correctCount = correctCount;

    const row = elements.verseList.querySelector(`.typing-verse-row[data-index="${index}"]`);
    if (row) {
        updateTokenClasses(row, normalizedText, normalizedInput);
    }

    updateMetrics();

    if (normalizedInput.length > 0 && !state.sessionActive) {
        state.sessionActive = true;
        if (!state.startedAt) {
            state.startedAt = new Date();
        } else {
            state.endedAt = null;
        }
        createSessionKey();
        setVerseStatus("진행 중");
        state.timerId = setInterval(updateMetrics, 1000);
        updateActionButtons();
    }

    if (target.value === verseState.originalText && !verseState.completed) {
        if (state.composing) {
            state.pendingCompleteIndex = index;
            return;
        }
        handleVerseComplete(index);
    }
};

const renderVerses = () => {
    clearChildren(elements.verseList);
    state.verses.forEach((verse, index) => {
        const row = document.createElement("div");
        row.className = "typing-verse-row";
        row.dataset.index = String(index);
        row.dataset.verseNumber = String(verse.verseNumber);

        const textLine = document.createElement("div");
        textLine.className = "typing-verse-text";

        const number = document.createElement("span");
        number.className = "typing-verse-number";
        number.textContent = String(verse.verseNumber);

        const content = document.createElement("span");
        content.className = "typing-verse-content";
        content.textContent = verse.text;

        textLine.appendChild(number);
        textLine.appendChild(content);

        const input = document.createElement("textarea");
        input.className = "form-control typing-verse-input";
        input.rows = 2;
        input.placeholder = "여기에 구절을 입력해 주세요.";
        input.disabled = true;
        input.readOnly = true;
        input.dataset.index = String(index);
        input.setAttribute("aria-label", `${verse.verseNumber}절 입력`);
        input.addEventListener("beforeinput", (event) => {
            if (state.transitioning) {
                event.preventDefault();
            }
        });
        input.addEventListener("input", handleInput);
        input.addEventListener("keydown", (event) => {
            if (state.transitioning) {
                event.preventDefault();
            }
            if (event.key === "Enter") {
                event.preventDefault();
                const verseState = state.verseStates[index];
                if (input.value === verseState.originalText && !verseState.completed) {
                    handleVerseComplete(index);
                }
            }
        });
        input.addEventListener("compositionstart", () => {
            state.composing = true;
        });
        input.addEventListener("compositionend", () => {
            state.composing = false;
            if (state.pendingCompleteIndex !== null) {
                const pendingIndex = state.pendingCompleteIndex;
                state.pendingCompleteIndex = null;
                if (pendingIndex === state.currentIndex) {
                    handleVerseComplete(pendingIndex);
                }
            }
        });

        row.appendChild(textLine);
        row.appendChild(input);
        elements.verseList.appendChild(row);
    });
    activateVerse(state.currentIndex);
};

const updateHeader = () => {
    const params = getQueryParams();
    const translation = state.translations.find((item) => item.id === params.translationId);
    const book = state.books.find((item) => item.bookOrder === params.bookOrder);
    const chapterNumber = params.chapterNumber;
    const translationTitle = translation ? `${translation.name} (${translation.code})` : "번역본 선택";
    const bookChapterTitle = book && chapterNumber ? `${book.name} ${chapterNumber}장` : "선택한 구절";
    if (elements.verseHeader) elements.verseHeader.textContent = `${translationTitle} · ${bookChapterTitle}`;
};

const loadSelections = async () => {
    clearMessage();
    const params = getQueryParams();
    const needsFallback = !params.translationId || !params.bookOrder || !params.chapterNumber;
    const latestSelection = needsFallback ? await fetchLatestProgressSelection() : null;
    state.translations = await fetchJson(`${apiBase}/translations`);
    if (state.translations.length === 0) {
        showMessage("사용 가능한 번역본이 없습니다.");
        return null;
    }
    const fixedTranslation = state.translations.find((item) => item.code === FIXED_TRANSLATION_CODE);
    let translationId = fixedTranslation?.id
        ?? params.translationId
        ?? latestSelection?.translationId
        ?? state.translations[0].id;
    if (!state.translations.some((item) => item.id === translationId)) {
        translationId = state.translations[0].id;
    }

    clearChildren(elements.translationSelect);
    if (fixedTranslation) {
        elements.translationSelect.appendChild(
            createOption(fixedTranslation.id, `${fixedTranslation.name} (${fixedTranslation.code})`)
        );
        elements.translationSelect.value = String(fixedTranslation.id);
        elements.translationSelect.disabled = true;
    } else {
        state.translations.forEach((item) => {
            elements.translationSelect.appendChild(createOption(item.id, `${item.name} (${item.code})`));
        });
        elements.translationSelect.value = String(translationId);
        elements.translationSelect.disabled = false;
    }

    state.books = await fetchJson(`${apiBase}/books?translationId=${translationId}`);
    if (state.books.length === 0) {
        showMessage("선택한 번역본에 책 정보가 없습니다.");
        return null;
    }
    let bookOrder = params.bookOrder ?? latestSelection?.bookOrder ?? state.books[0].bookOrder;
    if (!state.books.some((item) => item.bookOrder === bookOrder)) {
        bookOrder = state.books[0].bookOrder;
    }

    clearChildren(elements.bookSelect);
    state.books.forEach((item) => {
        elements.bookSelect.appendChild(createOption(item.bookOrder, item.name));
    });
    elements.bookSelect.value = String(bookOrder);

    state.chapters = await fetchJson(`${apiBase}/chapters?translationId=${translationId}&bookOrder=${bookOrder}`);
    if (state.chapters.length === 0) {
        showMessage("선택한 책에 장 정보가 없습니다.");
        return null;
    }
    let chapterNumber = params.chapterNumber ?? latestSelection?.chapterNumber ?? state.chapters[0].chapterNumber;
    if (!state.chapters.some((item) => item.chapterNumber === chapterNumber)) {
        chapterNumber = state.chapters[0].chapterNumber;
    }

    clearChildren(elements.chapterSelect);
    state.chapters.forEach((item) => {
        elements.chapterSelect.appendChild(createOption(item.chapterNumber, `${item.chapterNumber}장`));
    });
    elements.chapterSelect.value = String(chapterNumber);

    if (
        params.translationId !== translationId
        || params.bookOrder !== bookOrder
        || params.chapterNumber !== chapterNumber
    ) {
        updateQueryParams({translationId, bookOrder, chapterNumber}, true);
    }
    return {translationId, bookOrder, chapterNumber};
};

const fetchLatestProgress = async (selection) => {
    const {translationId, bookOrder, chapterNumber} = selection;
    const response = await fetchWithAuthRetry(
        `${resumeApi}?translationId=${translationId}&bookOrder=${bookOrder}&chapterNumber=${chapterNumber}`,
        {credentials: "same-origin"}
    );
    if (response.status === 204) return null;
    if (!response.ok) {
        throw new Error(`요청 실패: ${response.status}`);
    }
    return response.json();
};

const fetchLatestProgressSelection = async () => {
    const response = await fetchWithAuthRetry(`${resumeApi}/latest`, {credentials: "same-origin"});
    if (response.status === 204) return null;
    if (!response.ok) {
        throw new Error(`요청 실패: ${response.status}`);
    }
    return response.json();
};

const applyProgressSummary = (progress, sessionKey) => {
    if (!progress) return false;
    if (sessionKey && progress.sessionKey !== sessionKey) return false;
    state.sessionSummary = {
        accuracy: progress.accuracy,
        cpm: progress.cpm,
        totalElapsedSeconds: progress.totalElapsedSeconds
    };
    updateMetrics();
    return true;
};

const applyResumeProgress = (progress, selection) => {
    if (!progress || !Array.isArray(progress.verses) || progress.verses.length === 0) return false;
    const verseMap = new Map(progress.verses.map((verse) => [verse.verseNumber, verse]));
    state.sessionKey = progress.sessionKey;

    state.verseStates = state.verseStates.map((verse) => {
        const saved = verseMap.get(verse.verseNumber);
        if (!saved) return verse;
        let normalizedTyped = normalizeText(saved.typedText || "");
        if (saved.completed && normalizedTyped.length === 0) {
            normalizedTyped = verse.normalizedText;
        }
        const correctCount = countCorrectChars(verse.normalizedText, normalizedTyped);
        return {
            ...verse,
            typedText: saved.typedText,
            normalizedTyped,
            correctCount,
            accuracy: saved.accuracy ?? computeAccuracyPercent(
                countCorrectCharsRaw(verse.originalText, saved.typedText || ""),
                (saved.typedText || "").length,
                2
            ),
            cpm: saved.cpm ?? computeCpm((saved.typedText || "").length, saved.elapsedSeconds || 0, 2),
            completed: saved.completed,
            saved: true,
            elapsedSeconds: saved.elapsedSeconds || 0
        };
    });

    // Calculate totalElapsedSeconds from saved verses
    const firstIncomplete = state.verseStates.findIndex((verse) => !verse.completed);
    const allCompleted = firstIncomplete === -1 && state.verseStates.length > 0;
    state.currentIndex = allCompleted ? state.verseStates.length - 1 : firstIncomplete;
    state.practiceStarted = !allCompleted;
    setVerseStatus(allCompleted ? "완료" : "진행");

    if (!allCompleted) {
        const latestVerse = progress.verses.reduce((latest, current) => {
            const latestTime = Number(new Date(latest.createdAt));
            const currentTime = Number(new Date(current.createdAt));
            return currentTime > latestTime ? current : latest;
        });
        if (latestVerse.elapsedSeconds > 0) {
            state.startedAt = new Date(Date.now() - latestVerse.elapsedSeconds * 1000);
            state.endedAt = new Date(state.startedAt.getTime() + latestVerse.elapsedSeconds * 1000);
        }
    }

    const rows = elements.verseList.querySelectorAll(".typing-verse-row");
    rows.forEach((row, index) => {
        const verseState = state.verseStates[index];
        if (!verseState) return;
        const saved = verseMap.get(verseState.verseNumber);
        const input = row.querySelector(".typing-verse-input");
        if (input) {
            if (saved) {
                input.value = saved.typedText || "";
            }
            input.disabled = verseState.completed;
            input.readOnly = verseState.completed;
        }
        if (!state.tokenMap.get(row.dataset.index)) {
            ensureTokenized(row, verseState.normalizedText);
        }
        if (verseState.completed) {
            row.classList.add("is-complete");
            updateTokenClasses(row, verseState.normalizedText, verseState.normalizedText);
        }
    });

    if (!allCompleted) {
        activateVerse(state.currentIndex);
        requestAnimationFrame(() => {
            focusVerseInput(state.currentIndex);
        });
    }
    applyProgressSummary(progress, progress.sessionKey);
    updateMetrics();
    updateActionButtons();
    return true;
};

const loadVerses = async (selection) => {
    const {translationId, bookOrder, chapterNumber} = selection;
    const url = `${apiBase}/verses?translationId=${translationId}&bookOrder=${bookOrder}&chapterNumber=${chapterNumber}`;

    const initializeEmpty = (message) => {
        showMessage(message);
        state.verses = [];
        resetSessionState();
        renderVerses();
        updateHeader();
        updateMetrics();
    };

    let verses;
    try {
        verses = await fetchJson(url);
    } catch {
        initializeEmpty("구절 데이터를 불러오지 못했습니다.");
        return;
    }

    if (!Array.isArray(verses) || verses.length === 0) {
        initializeEmpty("선택한 장에 구절 데이터가 없습니다.");
        return;
    }

    state.verses = verses;
    resetSessionState();
    toggleButton(elements.actionBar, false);
    renderVerses();
    updateHeader();
    updateMetrics();

    try {
        const progress = await fetchLatestProgress(selection);
        if (progress) {
            applyResumeProgress(progress, selection);
        }
    } catch {
        showMessage("이어하기 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }

    updateActionButtons();
};


const startSession = () => {
    if (state.verses.length === 0) return;
    state.practiceStarted = true;
    createSessionKey();
    setVerseStatus("입력 준비");
    activateVerse(state.currentIndex);
    focusVerseInput(state.currentIndex);
    updateActionButtons();
};

const bindEvents = () => {
    elements.translationSelect?.addEventListener("change", async (event) => {
        const translationId = parseNumber(event.target.value);
        updateQueryParams({translationId, bookOrder: null, chapterNumber: null});
        const selection = await loadSelections();
        if (selection) await loadVerses(selection);
    });

    elements.bookSelect?.addEventListener("change", async (event) => {
        const params = getQueryParams();
        const bookOrder = parseNumber(event.target.value);
        updateQueryParams({translationId: params.translationId, bookOrder, chapterNumber: null});
        const selection = await loadSelections();
        if (selection) await loadVerses(selection);
    });

    elements.chapterSelect?.addEventListener("change", async (event) => {
        const params = getQueryParams();
        const chapterNumber = parseNumber(event.target.value);
        updateQueryParams({
            translationId: params.translationId,
            bookOrder: params.bookOrder,
            chapterNumber
        });
        const selection = await loadSelections();
        if (selection) await loadVerses(selection);
    });

    elements.startBtn?.addEventListener("click", () => {
        startSession();
    });

    elements.resetBtn?.addEventListener("click", handleResetSession);
};

const initialize = async () => {
    try {
        if (elements.backButton) {
            elements.backButton.classList.remove("d-none");
            elements.backButton.addEventListener("click", () => {
                window.location.href = "/web/game";
            });
        }
        if (elements.pageTitleLabel) {
            elements.pageTitleLabel.textContent = "성경 타자";
            elements.pageTitleLabel.classList.remove("d-none");
        }
        const selection = await loadSelections();
        if (elements.loadingEl) elements.loadingEl.classList.add("d-none");
        if (!selection) {
            if (elements.errorEl) {
                elements.errorEl.textContent = "데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
                elements.errorEl.classList.remove("d-none");
            }
            return;
        }
        if (elements.contentEl) elements.contentEl.classList.remove("d-none");
        await loadVerses(selection);
        bindEvents();
        window.addEventListener("popstate", async () => {
            const updatedSelection = await loadSelections();
            if (updatedSelection) await loadVerses(updatedSelection);
        });
    } catch (error) {
        if (elements.loadingEl) elements.loadingEl.classList.add("d-none");
        if (elements.errorEl) {
            elements.errorEl.textContent = "데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
            elements.errorEl.classList.remove("d-none");
        }
    }
};

/* --- Top nav auto-hide on scroll --- */
(() => {
    let lastScrollY = window.scrollY;
    const SCROLL_THRESHOLD = 10;

    window.addEventListener('scroll', () => {
        const delta = window.scrollY - lastScrollY;
        if (Math.abs(delta) < SCROLL_THRESHOLD) return;

        if (delta > 0 && window.scrollY > 0) {
            document.body.classList.add('top-nav-hidden');
        } else {
            document.body.classList.remove('top-nav-hidden');
        }
        lastScrollY = window.scrollY;
    }, {passive: true});
})();

/* --- Mobile keyboard: dynamic bottom margin via visualViewport --- */
(() => {
    if (!window.visualViewport) return;

    const KEYBOARD_THRESHOLD = 150;
    const verseCard = document.querySelector(".typing-verse-card");
    if (!verseCard) return;

    window.visualViewport.addEventListener("resize", () => {
        const keyboardHeight = window.innerHeight - window.visualViewport.height;
        if (keyboardHeight > KEYBOARD_THRESHOLD) {
            verseCard.style.marginBottom = `${keyboardHeight}px`;
        } else {
            verseCard.style.marginBottom = "";
        }
    });
})();

document.addEventListener("DOMContentLoaded", initialize);
