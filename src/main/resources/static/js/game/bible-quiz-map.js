import {fetchWithAuthRetry} from "/js/common-util.js?v=2.3";

// ==========================================
// Constants & Configuration
// ==========================================
const API_CONFIG = {
    BASE_URL: "/api/v1/game/bible-quiz",
    ENDPOINTS: {
        STAGES: "/stages",
        RESET: "/progress/reset"
    }
};

const UI_CLASSES = {
    CARD: "stage-card",
    STATUS_BADGE: "stage-status",
    ICON: "stage-status-icon",
    FLOW: {
        RIGHT: "flow-right",
        LEFT: "flow-left",
        DOWN: "flow-down",
        END: "flow-end"
    },
    STATE: {
        COMPLETED: "is-complete",
        CURRENT: "is-current",
        LOCKED: "is-locked",
        CLICKABLE: "is-clickable",
        VISIBLE: "is-visible"
    }
};

// SVG ring circumference (r=34 → 2πr ≈ 213.6)
const RING_CIRCUMFERENCE = 213.6;

// ==========================================
// Pure Utilities & Logic
// ==========================================

const getStageCardProps = ({stageNumber, questionCount, isCompleted, isCurrent, isLocked, lastScore}) => {
    let label = "잠김";
    let meta = "";
    let route = null;
    let stars = "";
    const cssClasses = [UI_CLASSES.CARD];

    if (isCompleted) {
        cssClasses.push(UI_CLASSES.STATE.COMPLETED);
        label = "완료";
        if (lastScore !== null && questionCount > 0) {
            const percent = Math.round((lastScore / questionCount) * 100);
            meta = `${lastScore}/${questionCount}점 (${percent}%)`;
            // Star rating based on score percentage
            if (percent >= 90) stars = "★★★";
            else if (percent >= 70) stars = "★★☆";
            else stars = "★☆☆";
        } else {
            meta = "클리어";
        }
        route = `/web/game/bible-quiz?stage=${stageNumber}`;
    } else if (isCurrent) {
        cssClasses.push(UI_CLASSES.STATE.CURRENT);
        label = "현재";
        meta = `${questionCount}문제`;
        route = `/web/game/bible-quiz?stage=${stageNumber}`;
    } else {
        cssClasses.push(UI_CLASSES.STATE.LOCKED);
        label = "잠김";
        meta = "";
    }

    const isClickable = !isLocked;
    if (isClickable) cssClasses.push(UI_CLASSES.STATE.CLICKABLE);

    return {
        label,
        meta,
        stars,
        route,
        isClickable,
        cssClasses: cssClasses.join(" "),
        statusIcon: isCompleted ? "✓" : (isCurrent ? "▶" : "🔒")
    };
};

const calculateFlowDirection = (index, totalItems, columns) => {
    if (index === totalItems - 1) return UI_CLASSES.FLOW.END;
    if (columns === 1) return UI_CLASSES.FLOW.DOWN;

    const row = Math.floor(index / columns);
    const col = index % columns;
    const isRowEven = row % 2 === 0;
    const maxRow = Math.floor((totalItems - 1) / columns);

    if (isRowEven) {
        if (col < columns - 1) return UI_CLASSES.FLOW.RIGHT;
        return (row < maxRow) ? UI_CLASSES.FLOW.DOWN : UI_CLASSES.FLOW.END;
    }

    if (col > 0) return UI_CLASSES.FLOW.LEFT;
    return (row < maxRow) ? UI_CLASSES.FLOW.DOWN : UI_CLASSES.FLOW.END;
};

// ==========================================
// API Service
// ==========================================

const ApiService = {
    fetchStages: async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        try {
            const response = await fetchWithAuthRetry(
                `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STAGES}`,
                {signal: controller.signal, credentials: "same-origin"}
            );
            return response.ok ? await response.json() : null;
        } catch (e) {
            console.error("Failed to fetch stages", e);
            return null;
        } finally {
            clearTimeout(timeoutId);
        }
    },
    resetProgress: async () => {
        try {
            const response = await fetchWithAuthRetry(
                `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RESET}`,
                {method: "POST", credentials: "same-origin"}
            );
            return response.ok;
        } catch (e) {
            console.error("Failed to reset progress", e);
            return false;
        }
    }
};

// ==========================================
// DOM Manipulation & Rendering
// ==========================================

const DomHelper = {
    getElements: () => {
        const stageList = document.getElementById("stageList");
        if (!stageList) return null;
        return {
            stageList,
            resetProgressButton: document.getElementById("resetProgressButton"),
            quizMapLoading: document.getElementById("quizMapLoading"),
            quizMapError: document.getElementById("quizMapError"),
            quizMapContent: document.getElementById("quizMapContent"),
            quizMapRingFill: document.getElementById("quizMapRingFill"),
            quizMapRingText: document.getElementById("quizMapRingText"),
            quizMapStatCompleted: document.getElementById("quizMapStatCompleted"),
            quizMapStatCurrent: document.getElementById("quizMapStatCurrent"),
            quizMapHeroSub: document.getElementById("quizMapHeroSub")
        };
    },

    getGridColumns: (stageList) => {
        const gridStyle = window.getComputedStyle(stageList).gridTemplateColumns;
        return (gridStyle && gridStyle !== "none")
            ? gridStyle.split(" ").filter(Boolean).length
            : 1;
    },

    getOrderedStages: (stageSummaries, columns, minColumns) => {
        if (columns < minColumns) return stageSummaries;
        const ordered = [];
        for (let i = 0; i < stageSummaries.length; i += columns) {
            const row = stageSummaries.slice(i, i + columns);
            const rowIndex = Math.floor(i / columns);
            ordered.push(...(rowIndex % 2 === 0 ? row : row.reverse()));
        }
        return ordered;
    },

    createCardElement: (summary) => {
        const {stageNumber, questionCount, isCompleted, isCurrent, isLocked, lastScore} = summary;
        const props = getStageCardProps({stageNumber, questionCount, isCompleted, isCurrent, isLocked, lastScore});

        const statusBadgeClass = [
            UI_CLASSES.STATUS_BADGE,
            isCompleted ? UI_CLASSES.STATE.COMPLETED : "",
            isCurrent ? UI_CLASSES.STATE.CURRENT : "",
            isLocked ? UI_CLASSES.STATE.LOCKED : ""
        ].join(" ").trim();

        const button = document.createElement("button");
        button.type = "button";
        button.className = props.cssClasses;
        button.disabled = !props.isClickable;
        if (props.route) button.dataset.route = props.route;
        if (isCurrent) {
            button.setAttribute("aria-current", "step");
            button.dataset.currentAnchor = "true";
        }

        // Timeline node (visible on mobile via CSS)
        const node = document.createElement("span");
        node.className = "stage-node";
        node.setAttribute("aria-hidden", "true");
        button.appendChild(node);

        // Header: number + badge
        const header = document.createElement("div");
        header.className = "stage-card-header";

        const number = document.createElement("span");
        number.className = "stage-number";
        number.textContent = `STAGE ${stageNumber}`;

        const badge = document.createElement("span");
        badge.className = statusBadgeClass;
        const icon = document.createElement("span");
        icon.className = UI_CLASSES.ICON;
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = props.statusIcon;
        badge.appendChild(icon);
        badge.appendChild(document.createTextNode(" " + props.label));

        header.appendChild(number);
        header.appendChild(badge);

        // Title
        const title = document.createElement("div");
        title.className = "stage-title";
        const titleText = summary.title?.trim() || "제목 없음";
        title.textContent = titleText;
        title.title = titleText;

        // Meta row
        const meta = document.createElement("div");
        meta.className = "stage-meta-row";

        if (props.stars) {
            const starsSpan = document.createElement("span");
            starsSpan.className = "stage-score-stars";
            starsSpan.setAttribute("aria-hidden", "true");
            starsSpan.textContent = props.stars;
            meta.appendChild(starsSpan);
        }

        if (props.meta) {
            const metaText = document.createElement("span");
            metaText.textContent = props.meta;
            meta.appendChild(metaText);
        }

        button.appendChild(header);
        button.appendChild(title);
        if (props.meta) button.appendChild(meta);

        return button;
    },

    updateFlowDirections: (stageList, columns) => {
        const cards = Array.from(stageList.querySelectorAll(`.${UI_CLASSES.CARD}`));
        if (!cards.length) return;

        const flowClasses = Object.values(UI_CLASSES.FLOW);
        cards.forEach(card => card.classList.remove(...flowClasses));

        const resolvedColumns = Number.isInteger(columns) ? columns : DomHelper.getGridColumns(stageList);
        cards.forEach((card, index) => {
            const directionClass = calculateFlowDirection(index, cards.length, resolvedColumns);
            card.classList.add(directionClass);
        });
    },

    animateCards: (stageList) => {
        const cards = Array.from(stageList.querySelectorAll(`.${UI_CLASSES.CARD}`));
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add(UI_CLASSES.STATE.VISIBLE);
            }, 40 + index * 30);
        });
    },

    scrollToCurrentStage: (stageList) => {
        const current = stageList.querySelector("[data-current-anchor]");
        if (!current) return;
        setTimeout(() => {
            current.scrollIntoView({behavior: "smooth", block: "center"});
        }, 400);
    },

    render: (elements, stageSummaries) => {
        const columns = DomHelper.getGridColumns(elements.stageList);
        const minColumns = parseInt(elements.stageList.dataset.snakeColumns, 10) || 2;
        const orderedStages = DomHelper.getOrderedStages(stageSummaries, columns, minColumns);
        const fragment = document.createDocumentFragment();
        orderedStages.forEach(summary => {
            fragment.appendChild(DomHelper.createCardElement(summary));
        });
        elements.stageList.replaceChildren(fragment);
        DomHelper.updateFlowDirections(elements.stageList, columns);
    },

    bindEvents: (elements) => {
        elements.stageList.addEventListener("click", (event) => {
            const target = event.target.closest("[data-route]");
            if (!target || !elements.stageList.contains(target)) return;
            window.location.href = target.dataset.route;
        });
        if (elements.resetProgressButton) {
            elements.resetProgressButton.addEventListener("click", async () => {
                if (!confirm("모든 스테이지 정보가 초기화됩니다. 정말 진행하시겠습니까?")) return;
                const ok = await ApiService.resetProgress();
                if (ok) window.location.href = "/web/game/bible-quiz?stage=1";
            });
        }
    },

    showError: (elements) => {
        if (elements.quizMapError) {
            elements.quizMapError.textContent = "퀴즈 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";
            elements.quizMapError.classList.remove("d-none");
        }
    },

    updateSummary: (elements, context, totalStages) => {
        const completed = Math.max(0, Math.min(context.lastCompletedStage, totalStages));
        const progressPercent = totalStages > 0 ? Math.round((completed / totalStages) * 100) : 0;

        // Ring animation
        if (elements.quizMapRingFill) {
            const offset = RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * progressPercent / 100);
            elements.quizMapRingFill.style.strokeDashoffset = String(offset);
        }

        if (elements.quizMapRingText) {
            elements.quizMapRingText.textContent = `${progressPercent}%`;
        }

        if (elements.quizMapStatCompleted) {
            elements.quizMapStatCompleted.innerHTML =
                `완료 <strong>${completed}</strong> / <strong>${totalStages}</strong> 스테이지`;
        }

        if (elements.quizMapStatCurrent) {
            if (completed >= totalStages) {
                elements.quizMapStatCurrent.innerHTML = `<strong>모든 스테이지를 클리어했어요!</strong>`;
            } else {
                elements.quizMapStatCurrent.innerHTML =
                    `현재 <strong>${context.currentStage}</strong> 스테이지 도전 가능`;
            }
        }

        // Update hero subtitle for all-complete
        if (elements.quizMapHeroSub && completed >= totalStages && totalStages > 0) {
            elements.quizMapHeroSub.textContent = "축하합니다! 모든 여정을 마쳤어요";
        }

        // Update mobile path progress
        if (totalStages > 0) {
            const pathPercent = Math.round((completed / totalStages) * 100);
            elements.stageList.style.setProperty("--path-progress", `${pathPercent}%`);
        }
    }
};

// ==========================================
// Main Application Logic
// ==========================================

const initNav = () => {
    const backButton = document.getElementById("topNavBackButton");
    const pageTitleLabel = document.getElementById("pageTitleLabel");
    if (pageTitleLabel) {
        pageTitleLabel.textContent = "성경 퀴즈 맵";
        pageTitleLabel.classList.remove("d-none");
    }
    if (backButton) {
        backButton.classList.remove("d-none");
        backButton.addEventListener("click", () => {
            window.location.href = "/web/game";
        });
    }
};

const App = {
    init: async () => {
        initNav();
        const elements = DomHelper.getElements();
        if (!elements) return;

        const response = await ApiService.fetchStages();
        if (!response?.stages?.length) {
            if (elements.quizMapLoading) elements.quizMapLoading.classList.add("d-none");
            DomHelper.showError(elements);
            return;
        }

        if (elements.quizMapLoading) elements.quizMapLoading.classList.add("d-none");
        if (elements.quizMapContent) elements.quizMapContent.classList.remove("d-none");

        const context = {
            currentStage: response.currentStage,
            lastCompletedStage: response.lastCompletedStage
        };

        if (elements.resetProgressButton) {
            elements.resetProgressButton.classList.toggle("d-none", context.lastCompletedStage < 1);
        }

        DomHelper.updateSummary(elements, context, response.totalStages);

        const state = {
            columns: DomHelper.getGridColumns(elements.stageList),
            stages: response.stages
        };

        DomHelper.bindEvents(elements);
        DomHelper.render(elements, response.stages);

        // Staggered entrance animation
        requestAnimationFrame(() => DomHelper.animateCards(elements.stageList));

        // Auto-scroll to current stage (mobile)
        DomHelper.scrollToCurrentStage(elements.stageList);

        // Handle resize for flow lines
        let resizeTimer;
        window.addEventListener("resize", () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const nextColumns = DomHelper.getGridColumns(elements.stageList);
                if (nextColumns !== state.columns) {
                    state.columns = nextColumns;
                    DomHelper.render(elements, state.stages);
                    requestAnimationFrame(() => DomHelper.animateCards(elements.stageList));
                } else {
                    DomHelper.updateFlowDirections(elements.stageList, nextColumns);
                }
            }, 120);
        });
    }
};

document.addEventListener("DOMContentLoaded", App.init);
