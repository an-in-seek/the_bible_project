import {fetchWithAuthRetry} from "/js/common-util.js?v=2.4";

/**
 * Configuration constants
 */
const API_CONFIG = {
    BASE_URL: "/api/v1/game/bible-quiz",
    ENDPOINTS: {
        STAGES: "/stages",
        START: "/start",
        ANSWER: "/answer",
        COMPLETE: "/complete"
    }
};

const UI_CLASSES = {
    HIDDEN: "d-none",
    BUSY: "aria-busy",
    CORRECT: "is-correct",
    WRONG: "is-wrong",
    SELECTED: "is-selected"
};

/**
 * Service for API interactions
 */
const ApiService = {
    fetchStageData: async (stageNumber) => {
        try {
            const response = await fetchWithAuthRetry(
                `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STAGES}/${stageNumber}`,
                {credentials: "same-origin"}
            );
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error("Failed to fetch stage data:", error);
            return null;
        }
    },
    startStage: async (stageNumber, mode, reviewType) => {
        try {
            const response = await fetchWithAuthRetry(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STAGES}/${stageNumber}${API_CONFIG.ENDPOINTS.START}`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({mode: mode.toUpperCase(), reviewType, startedAt: new Date().toISOString()}),
                credentials: "same-origin"
            });
            return response.ok ? await response.json() : null;
        } catch (error) {
            console.error("Failed to start stage:", error);
            return null;
        }
    },
    submitAnswer: async (stageNumber, payload) => {
        try {
            const response = await fetchWithAuthRetry(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STAGES}/${stageNumber}${API_CONFIG.ENDPOINTS.ANSWER}`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({...payload, mode: payload.mode.toUpperCase(), answeredAt: new Date().toISOString()}),
                credentials: "same-origin"
            });
            return response.ok ? await response.json() : null;
        } catch (error) {
            console.error("Failed to submit answer:", error);
            return null;
        }
    },
    completeStage: async (stageNumber, payload) => {
        try {
            const response = await fetchWithAuthRetry(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STAGES}/${stageNumber}${API_CONFIG.ENDPOINTS.COMPLETE}`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({...payload, mode: payload.mode.toUpperCase(), completedAt: new Date().toISOString()}),
                credentials: "same-origin"
            });
            return response.ok ? await response.json() : null;
        } catch (error) {
            console.error("Failed to complete stage:", error);
            return null;
        }
    }
};

const ReviewModes = Object.freeze({
    FULL: "full"
});

/**
 * DOM manipulation helper
 */
const DomHelper = {
    getElements: () => {
        const get = (id) => document.getElementById(id);
        return {
            quizLoading: get("quizLoading"),
            quizError: get("quizError"),
            quizHero: get("quizHero"),
            quizPanel: get("quizPanel"),
            quizComplete: get("quizComplete"),
            quizQuestionProgress: get("quizQuestionProgress"),
            quizQuestionProgressBar: get("quizQuestionProgressBar"),
            quizTitle: get("quizTitle"),
            quizQuestion: get("quizQuestion"),
            quizOptions: get("quizOptions"),
            quizFeedback: get("quizFeedback"),
            quizNext: get("quizNext"),
            quizScore: get("quizScore"),
            quizSummary: get("quizSummary"),
            summaryAccuracyStat: get("summaryAccuracyStat"),
            summaryAccuracy: get("summaryAccuracy"),
            summaryCount: get("summaryCount"),
            quizHeroLead: get("quizHeroLead"),
            quizReviewSelect: get("quizReviewSelect"),
            quizReviewNote: get("quizReviewNote"),
            quizReviewFullButton: get("quizReviewFullButton"),
            quizModeLabel: get("quizModeLabel"),
            quizNextStageButton: get("quizNextStageButton"),
            backButton: get("topNavBackButton"),
            pageTitleLabel: get("pageTitleLabel")
        };
    },

    setElementText: (element, text) => {
        if (element) element.textContent = text;
    },

    toggleVisibility: (element, isVisible) => {
        if (!element) return;
        if (isVisible) element.classList.remove(UI_CLASSES.HIDDEN);
        else element.classList.add(UI_CLASSES.HIDDEN);
    },

    setBusy: (element, isBusy) => {
        if (element) element.setAttribute(UI_CLASSES.BUSY, isBusy ? "true" : "false");
    },

    updateProgressBar: (element, value, max, min = 1) => {
        if (!element) return;
        element.max = max;
        element.value = value;
        element.setAttribute("aria-valuemin", String(min));
        element.setAttribute("aria-valuemax", String(max));
        element.setAttribute("aria-valuenow", String(value));
    },

    createOptionButton: (text, onClick) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "quiz-option";
        button.textContent = text;
        button.addEventListener("click", onClick);
        return button;
    }
};

/**
 * Main Application Logic
 */
const App = {
    elements: null,
    state: {
        stage: 0,
        questions: [],
        questionCount: 0,
        index: 0,
        score: 0,
        answered: false,
        selectedIndex: null,
        submitting: false,
        mode: 'record', // 'record', 'review'
        reviewType: ReviewModes.FULL,
        cachedStageData: null
    },

    init: async () => {
        App.elements = DomHelper.getElements();
        if (!App.elements.quizPanel) return;

        App.initNav();

        const urlParams = new URLSearchParams(window.location.search);
        const requestedStage = parseInt(urlParams.get("stage"), 10);
        const stageNumber = Number.isNaN(requestedStage) ? 1 : requestedStage;

        const data = await ApiService.fetchStageData(stageNumber);
        if (!data) {
            App.hideLoading();
            App.showGlobalError("퀴즈를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.");
            return;
        }

        App.hideLoading();
        DomHelper.toggleVisibility(App.elements.quizHero, true);

        App.state.stage = data.stageNumber;
        App.state.questionCount = data.questionCount ?? 0;
        App.state.cachedStageData = {stage: data.stageNumber, data};

        const progress = data.progress;

        App.updateHeroLead(progress);

        const hasInProgressQuiz = progress.hasInProgress;

        if (progress.isBlocked) {
            App.showAccessBlocked();
        } else if (hasInProgressQuiz) {
            const mode = progress.isReviewOnly ? "review" : "record";
            App.state.mode = mode;
            App.state.reviewType = progress.currentReviewType || ReviewModes.FULL;

            const {quizHeroLead, quizPanel, quizReviewSelect} = App.elements;
            DomHelper.toggleVisibility(quizReviewSelect, false);
            DomHelper.toggleVisibility(quizPanel, true);
            App.setModeLabel(mode);

            if (mode === "review") {
                DomHelper.setElementText(quizHeroLead, "기록에 반영되지 않는 복습 모드입니다.");
            } else {
                DomHelper.setElementText(quizHeroLead, "");
            }

            App.loadStageData();
        } else if (progress.isReviewOnly) {
            App.showReviewSelection();
        } else {
            App.startQuiz("record", progress.currentReviewType);
        }

        App.bindEvents();
    },

    initNav: () => {
        const {backButton, pageTitleLabel} = App.elements;
        if (pageTitleLabel) {
            pageTitleLabel.textContent = "성경 퀴즈";
            DomHelper.toggleVisibility(pageTitleLabel, true);
        }
        if (backButton) {
            DomHelper.toggleVisibility(backButton, true);
            backButton.addEventListener("click", () => window.location.href = "/web/game/bible-quiz/map");
        }
    },

    updateHeroLead: (progress) => {
        const {quizHeroLead, quizTitle} = App.elements;
        if (quizTitle) {
            DomHelper.setElementText(quizTitle, `STAGE ${progress.stageNumber}`);
        }
        if (!quizHeroLead) return;

        if (progress.isBlocked) {
            DomHelper.setElementText(quizHeroLead, "아직 진행할 수 없는 스테이지입니다.");
            quizHeroLead.classList.remove(UI_CLASSES.HIDDEN);
        } else {
            DomHelper.setElementText(quizHeroLead, "");
            quizHeroLead.classList.add(UI_CLASSES.HIDDEN);
        }
    },

    setModeLabel: (mode) => {
        const {quizModeLabel} = App.elements;
        if (!quizModeLabel) return;

        if (mode === "review") {
            quizModeLabel.textContent = "복습 모드";
            quizModeLabel.classList.add("is-review");
        } else if (mode === "record") {
            quizModeLabel.textContent = "기록 중";
            quizModeLabel.classList.remove("is-review");
        } else {
            quizModeLabel.textContent = "";
            quizModeLabel.classList.remove("is-review");
        }
    },

    showReviewSelection: () => {
        const {
            quizReviewSelect,
            quizReviewNote,
            quizReviewFullButton,
            quizPanel
        } = App.elements;

        DomHelper.toggleVisibility(quizReviewSelect, true);
        DomHelper.toggleVisibility(quizPanel, false);
        App.setModeLabel("review");

        if (quizReviewNote) {
            DomHelper.setElementText(quizReviewNote, "복습 모드는 기록과 랭킹에 반영되지 않습니다.");
        }

        if (quizReviewFullButton) {
            quizReviewFullButton.onclick = () => App.startQuiz("review", ReviewModes.FULL);
        }

        App.updateReviewButtons();
    },

    startQuiz: async (mode, reviewType = ReviewModes.FULL) => {
        App.state.mode = mode;
        App.state.reviewType = reviewType || ReviewModes.FULL;

        const {quizHeroLead, quizPanel, quizReviewSelect} = App.elements;
        DomHelper.toggleVisibility(quizReviewSelect, false);
        DomHelper.toggleVisibility(quizPanel, true);
        App.setModeLabel(mode);

        if (mode === "review") {
            DomHelper.setElementText(quizHeroLead, "기록에 반영되지 않는 복습 모드입니다.");
        } else {
            DomHelper.setElementText(quizHeroLead, "");
        }

        const startProgress = await ApiService.startStage(App.state.stage, mode, App.state.reviewType);
        if (startProgress && App.state.cachedStageData) {
            App.state.cachedStageData.data.progress = startProgress;
        }

        App.loadStageData();
    },

    updateReviewButtons: async () => {
        const {
            quizReviewFullButton
        } = App.elements;

        if (!quizReviewFullButton) return;

        DomHelper.setElementText(quizReviewFullButton, "확인 중...");
        quizReviewFullButton.setAttribute("aria-busy", "true");

        if (App.state.cachedStageData && App.state.cachedStageData.stage !== App.state.stage) {
            App.state.cachedStageData = null;
        }

        const data = App.state.cachedStageData
            ? App.state.cachedStageData.data
            : await ApiService.fetchStageData(App.state.stage);
        if (!data || !data.questions || data.questions.length === 0) {
            quizReviewFullButton.setAttribute("aria-busy", "false");
            return;
        }

        if (!App.state.cachedStageData) {
            App.state.cachedStageData = {stage: App.state.stage, data};
        }

        const totalCount = data.questionCount ?? data.questions.length;
        DomHelper.setElementText(quizReviewFullButton, `복습 (${totalCount}문제)`);

        quizReviewFullButton.setAttribute("aria-busy", "false");
    },

    loadStageData: async () => {
        DomHelper.setBusy(App.elements.quizPanel, true);

        if (App.state.cachedStageData && App.state.cachedStageData.stage !== App.state.stage) {
            App.state.cachedStageData = null;
        }

        const data = App.state.cachedStageData
            ? App.state.cachedStageData.data
            : await ApiService.fetchStageData(App.state.stage);

        if (!data || !data.questions || data.questions.length === 0) {
            App.showError("퀴즈를 불러올 수 없습니다", "잠시 후 다시 시도해주세요.");
            return;
        }

        if (!App.state.cachedStageData) {
            App.state.cachedStageData = {stage: App.state.stage, data};
        }

        App.state.questionCount = data.questionCount ?? data.questions.length;

        let reviewedQuestions = App.state.mode === "review"
            ? App.applyReviewQuestions(data.questions)
            : data.questions;

        if (reviewedQuestions.length === 0) {
            App.state.reviewType = ReviewModes.FULL;
            reviewedQuestions = data.questions;
        }

        const progress = data.progress || {};
        App.state.questions = reviewedQuestions;
        const rawIndex = Number.isInteger(progress.currentQuestionIndex) ? progress.currentQuestionIndex : 0;
        App.state.index = Math.min(Math.max(rawIndex, 0), reviewedQuestions.length - 1);
        App.state.score = App.state.mode !== "review"
            ? (Number.isInteger(progress.currentScore) ? progress.currentScore : 0)
            : 0;
        if (App.state.mode === "review" && progress.currentReviewType) {
            App.state.reviewType = progress.currentReviewType;
        }
        App.state.answered = false;
        App.state.selectedIndex = null;

        App.renderQuestion();
    },

    applyReviewQuestions: (questions) => {
        return questions;
    },

    renderQuestion: () => {
        const {questions, index} = App.state;
        const currentQuestion = questions[index];
        const {
            quizQuestion,
            quizOptions,
            quizNext,
            quizQuestionProgress,
            quizQuestionProgressBar,
            quizPanel,
            quizFeedback
        } = App.elements;

        DomHelper.setBusy(quizPanel, true);

        DomHelper.setElementText(quizQuestion, currentQuestion.question);

        quizOptions.innerHTML = "";
        currentQuestion.options.forEach((opt, idx) => {
            const btn = DomHelper.createOptionButton(opt, () => App.selectOption(idx));
            quizOptions.appendChild(btn);
        });

        DomHelper.setElementText(quizFeedback, "");
        quizFeedback.classList.remove(UI_CLASSES.CORRECT, UI_CLASSES.WRONG);

        quizNext.disabled = true;
        DomHelper.setElementText(quizNext, "정답 확인");

        DomHelper.setElementText(quizQuestionProgress, `${index + 1} / ${questions.length}`);
        DomHelper.updateProgressBar(quizQuestionProgressBar, index + 1, questions.length);

        App.state.answered = false;
        App.state.selectedIndex = null;

        DomHelper.setBusy(quizPanel, false);
    },

    selectOption: (index) => {
        if (App.state.answered) return;

        App.state.selectedIndex = index;
        const buttons = App.elements.quizOptions.querySelectorAll(".quiz-option");
        buttons.forEach((btn, idx) => {
            if (idx === index) btn.classList.add(UI_CLASSES.SELECTED);
            else btn.classList.remove(UI_CLASSES.SELECTED);
        });

        App.elements.quizNext.disabled = false;
    },

    handleNext: async () => {
        if (!App.state.answered) {
            await App.gradeAnswer();
        } else {
            await App.nextQuestion();
        }
    },

    gradeAnswer: async () => {
        if (App.state.submitting) return;
        const {questions, index, selectedIndex} = App.state;
        const currentQuestion = questions[index];
        const {quizNext} = App.elements;
        App.state.submitting = true;
        if (quizNext) quizNext.disabled = true;
        const response = await ApiService.submitAnswer(App.state.stage, {
            questionId: currentQuestion.id,
            selectedIndex,
            questionIndex: index,
            mode: App.state.mode
        });
        App.state.submitting = false;
        if (quizNext) quizNext.disabled = false;

        if (!response) {
            App.showError("정답을 확인할 수 없습니다", "잠시 후 다시 시도해주세요.");
            return;
        }

        const isCorrect = response.isCorrect;
        const correctIndex = response.correctIndex;

        App.state.answered = true;
        App.state.score = response.currentScore ?? App.state.score;

        const buttons = App.elements.quizOptions.querySelectorAll(".quiz-option");
        buttons.forEach((btn, idx) => {
            btn.disabled = true;
            if (idx === correctIndex) {
                btn.classList.add(UI_CLASSES.CORRECT);
                btn.textContent += " (정답)";
            } else if (idx === selectedIndex && !isCorrect) {
                btn.classList.add(UI_CLASSES.WRONG);
                btn.textContent += " (오답)";
            }
        });

        const {quizFeedback} = App.elements;
        if (isCorrect) {
            DomHelper.setElementText(quizFeedback, "😊 잘하셨어요 정답입니다!");
            quizFeedback.classList.add(UI_CLASSES.CORRECT);
        } else {
            DomHelper.setElementText(quizFeedback, "🥲 아쉽지만 오답입니다. 말씀을 다시 읽어보면 도움이 될 거예요!");
            quizFeedback.classList.add(UI_CLASSES.WRONG);
        }

        DomHelper.setElementText(quizNext, index === questions.length - 1 ? "완료" : "다음 문제");

    },

    nextQuestion: async () => {
        const {index, questions} = App.state;
        if (index < questions.length - 1) {
            App.state.index++;
            App.renderQuestion();
        } else {
            await App.finishQuiz();
        }
    },

    finishQuiz: async () => {
        const {stage, score, questions, mode} = App.state;
        const {
            quizPanel,
            quizComplete,
            quizScore,
            quizSummary,
            summaryAccuracyStat,
            summaryAccuracy,
            summaryCount,
            quizNextStageButton
        } = App.elements;

        const completion = await ApiService.completeStage(stage, {
            mode,
            score,
            questionCount: questions.length
        });

        if (quizNextStageButton && completion?.nextStage) {
            quizNextStageButton.href = `/web/game/bible-quiz?stage=${completion.nextStage}`;
        }

        DomHelper.setBusy(quizPanel, false);
        DomHelper.toggleVisibility(quizPanel, false);
        DomHelper.toggleVisibility(quizComplete, true);

        const totalCount = App.state.questionCount || questions.length;
        DomHelper.setElementText(quizScore, `점수 ${score} / ${totalCount}`);
        DomHelper.toggleVisibility(quizSummary, true);
        DomHelper.toggleVisibility(summaryAccuracyStat, mode !== "review");

        if (quizSummary && summaryAccuracy && summaryCount && completion) {
            if (mode !== "review") {
                const accuracyText = completion.accuracy === null ? "-%" : `${completion.accuracy}%`;
                DomHelper.setElementText(summaryAccuracy, accuracyText);
            }
            DomHelper.setElementText(summaryCount, `${completion.reviewCount}회`);
        }
    },

    hideLoading: () => {
        DomHelper.toggleVisibility(App.elements.quizLoading, false);
    },

    showGlobalError: (message) => {
        App.hideLoading();
        const {quizError} = App.elements;
        if (quizError) {
            quizError.textContent = message;
            DomHelper.toggleVisibility(quizError, true);
        }
    },

    showError: (title, message) => {
        const {
            quizQuestion,
            quizOptions,
            quizNext,
            quizPanel,
            quizQuestionProgressBar,
            quizQuestionProgress: quizQuestionProgressText
        } = App.elements;
        DomHelper.setBusy(quizPanel, false);
        DomHelper.setElementText(quizQuestion, title);
        DomHelper.setElementText(quizOptions, message);
        quizNext.disabled = true;

        DomHelper.setElementText(quizQuestionProgressText, "0 / 0");
        DomHelper.updateProgressBar(quizQuestionProgressBar, 0, 0, 0);
    },

    showAccessBlocked: () => {
        const {
            quizPanel,
            quizComplete,
            quizQuestion,
            quizOptions,
            quizNext,
            quizQuestionProgressBar,
            quizQuestionProgress: quizQuestionProgressText
        } = App.elements;
        DomHelper.setBusy(quizPanel, false);
        DomHelper.toggleVisibility(quizPanel, true);
        DomHelper.toggleVisibility(quizComplete, false);

        DomHelper.setElementText(quizQuestion, "아직 진행할 수 없는 스테이지입니다.");
        DomHelper.setElementText(quizOptions, "현재 진행 가능한 스테이지를 선택해주세요.");
        quizNext.disabled = true;

        DomHelper.setElementText(quizQuestionProgressText, "0 / 0");
        DomHelper.updateProgressBar(quizQuestionProgressBar, 0, 0, 0);
    },

    bindEvents: () => {
        const {quizNext} = App.elements;
        if (quizNext) {
            quizNext.addEventListener("click", App.handleNext);
        }
    }
};

document.addEventListener("DOMContentLoaded", App.init);
