import {setupDialogScrollLock} from "/js/common-util.js?v=2.4";

/**
 * 성경 책/장 단어 빈도 통계 다이얼로그.
 * 설계 문서: docs/bible/word-frequency-design.md §10
 *
 * 책 화면과 장 화면이 같은 UI 를 쓰므로 이 모듈 하나로 처리한다.
 * 호출 측은 각자의 state 로 엔드포인트만 만들어 넘긴다.
 */

const TIMEOUT_MS = 5000;
const DICTIONARY_API = "/api/v1/study/dictionaries";
const DICTIONARY_WEB = "/web/study/dictionary";

// 클라우드 표시 개수 — 전체 목록이 아래에 그대로 있으므로 줄여도 정보 손실이 없다
const cloudCountFor = (width) => (width < 400 ? 25 : width < 700 ? 35 : 45);

const FONT_MIN_PX = 12;
const FONT_MAX_PX_MOBILE = 32;
const FONT_MAX_PX_DESKTOP = 40;

// 아르키메데스 나선 배치 파라미터
const ANGLE_STEP = 0.15;
const RADIUS_FACTOR = 4;
const ASPECT = 1.7;          // 가로로 넓은 덩어리를 만든다
const MAX_ATTEMPTS = 800;
const PADDING = 4;

const RESIZE_DEBOUNCE_MS = 200;

const els = {};
let state = {items: [], config: null, lastWidth: 0};
let resizeTimer = null;
let measureContext = null;

const getMeasureContext = () => {
    if (measureContext) return measureContext;
    try {
        measureContext = document.createElement("canvas").getContext("2d");
    } catch (_) {
        measureContext = null;
    }
    return measureContext;
};

const fetchStats = async (endpoint) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        // 인증이 필요 없는 공개 API 다. fetchWithAuthRetry 를 쓰지 않는다.
        const res = await fetch(endpoint, {signal: controller.signal, credentials: "omit"});
        if (!res.ok) return null;
        return await res.json();
    } catch (_) {
        return null;
    } finally {
        clearTimeout(timer);
    }
};

/** 빈도 구간을 4단계로 나눈다. 색은 보조 수단이고 크기가 주 표현이다. */
const tierOf = (count, maxCount) => {
    const ratio = maxCount > 0 ? count / maxCount : 0;
    if (ratio >= 0.6) return 1;
    if (ratio >= 0.3) return 2;
    if (ratio >= 0.12) return 3;
    return 4;
};

const collides = (rect, placed) => placed.some(p =>
    rect.x < p.x + p.w && rect.x + rect.w > p.x && rect.y < p.y + p.h && rect.y + rect.h > p.y
);

/**
 * 나선을 따라 자리를 찾아 배치한다. 자리를 못 찾은 단어는 클라우드에서 생략되지만
 * 아래 목록에는 그대로 남으므로 정보가 사라지지 않는다.
 */
const layoutCloud = (items, maxCount, isMobile) => {
    const ctx = getMeasureContext();
    if (!ctx) return null;

    const fontMax = isMobile ? FONT_MAX_PX_MOBILE : FONT_MAX_PX_DESKTOP;
    const placed = [];

    items.forEach(item => {
        const size = FONT_MIN_PX + (fontMax - FONT_MIN_PX) * Math.sqrt(item.count / maxCount);
        ctx.font = `700 ${size}px sans-serif`;
        const w = ctx.measureText(item.word).width + PADDING * 2;
        const h = size * 1.25 + PADDING;

        let angle = 0;
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            angle += ANGLE_STEP;
            const r = RADIUS_FACTOR * angle;
            const cx = r * Math.cos(angle) * ASPECT;
            const cy = r * Math.sin(angle);
            const rect = {x: cx - w / 2, y: cy - h / 2, w, h};
            if (!collides(rect, placed)) {
                placed.push({...rect, word: item.word, count: item.count, size, item});
                break;
            }
        }
    });

    if (placed.length === 0) return null;

    const minX = Math.min(...placed.map(p => p.x));
    const maxX = Math.max(...placed.map(p => p.x + p.w));
    const minY = Math.min(...placed.map(p => p.y));
    const maxY = Math.max(...placed.map(p => p.y + p.h));
    return {placed, minX, minY, width: maxX - minX, height: maxY - minY};
};

const renderCloud = (items, maxCount, containerWidth) => {
    const svg = els.cloud;
    const wrap = els.cloudWrap;
    if (!svg || !wrap) return;

    const count = cloudCountFor(containerWidth);
    const layout = layoutCloud(items.slice(0, count), maxCount, containerWidth < 700);
    if (!layout) {
        // canvas 측정이 안 되는 환경 — 클라우드를 숨기고 목록만 보여 준다
        wrap.classList.add("d-none");
        return;
    }

    svg.replaceChildren();
    svg.setAttribute("viewBox", `${layout.minX} ${layout.minY} ${layout.width} ${layout.height}`);
    // 실제로 배치된 개수를 읽어야 한다. 전체 목록 길이를 쓰면 스크린리더가
    // "상위 100개" 라고 읽는데 화면에는 35개만 있다.
    svg.setAttribute("aria-label", buildCloudLabel(layout.placed.length, items[0], maxCount));

    const ns = "http://www.w3.org/2000/svg";
    layout.placed.forEach(p => {
        const text = document.createElementNS(ns, "text");
        text.setAttribute("x", String(p.x + p.w / 2));
        text.setAttribute("y", String(p.y + p.h / 2));
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "central");
        text.setAttribute("font-size", String(p.size));
        text.setAttribute("class", `word-stats-cloud-word tier-${tierOf(p.count, maxCount)}`);
        // 클라우드는 장식이다. 접근성 경로는 아래 목록으로 통일한다.
        text.setAttribute("aria-hidden", "true");
        text.setAttribute("tabindex", "-1");
        text.textContent = p.word;
        text.addEventListener("click", () => openPopover(p.item));
        svg.appendChild(text);
    });
    wrap.classList.remove("d-none");
};

const buildCloudLabel = (placedCount, topItem, maxCount) => {
    if (!topItem) return "단어 워드클라우드";
    return `상위 ${placedCount}개 단어 워드클라우드. 가장 많이 나온 단어는 ${topItem.word} ${maxCount}회`;
};

const renderList = (items, maxCount) => {
    const list = els.list;
    if (!list) return;

    list.replaceChildren(...items.map(item => {
        const li = document.createElement("li");
        li.className = "word-stats-item";

        const link = document.createElement("a");
        link.className = `word-stats-link tier-${tierOf(item.count, maxCount)}`;
        link.href = state.config.buildSearchUrl(item.word);
        link.setAttribute("aria-label", `${item.word}, ${item.count}회`);
        link.addEventListener("click", (event) => {
            // 사전 뜻이 있으면 바로 이동하지 않고 팝오버로 선택지를 준다
            if (item.dictionaryId) {
                event.preventDefault();
                openPopover(item);
            }
        });

        const term = document.createElement("span");
        term.className = "word-stats-term";
        term.textContent = item.word;

        const count = document.createElement("span");
        count.className = "word-stats-count";
        count.textContent = `(${item.count})`;

        link.append(term, count);
        li.appendChild(link);
        return li;
    }));
};

const openPopover = async (item) => {
    const popover = els.popover;
    if (!popover) return;

    els.popoverTerm.textContent = item.word;
    els.popoverDesc.textContent = "";
    els.popoverSearch.href = state.config.buildSearchUrl(item.word);

    if (item.dictionaryId) {
        els.popoverDict.href = `${DICTIONARY_WEB}/${item.dictionaryId}`;
        els.popoverDict.classList.remove("d-none");
        const detail = await fetchStats(`${DICTIONARY_API}/${item.dictionaryId}`);
        els.popoverDesc.textContent = detail?.description ?? "";
    } else {
        els.popoverDict.classList.add("d-none");
    }

    popover.classList.remove("d-none");
};

const closePopover = () => els.popover?.classList.add("d-none");

const render = (data) => {
    const items = data?.items ?? [];
    state.items = items;

    if (items.length === 0) {
        els.status.textContent = "아직 집계되지 않았습니다.";
        els.status.classList.remove("d-none");
        els.cloudWrap.classList.add("d-none");
        els.list.replaceChildren();
        els.footnote.classList.add("d-none");
        return;
    }

    els.status.classList.add("d-none");
    const maxCount = items[0].count;
    state.lastWidth = els.list.clientWidth || window.innerWidth;

    renderCloud(items, maxCount, state.lastWidth);
    renderList(items, maxCount);

    if (data.truncated) {
        els.footnote.textContent = `상위 ${items.length}개만 표시`;
        els.footnote.classList.remove("d-none");
    } else {
        els.footnote.classList.add("d-none");
    }
};

const bindResize = () => {
    if (typeof ResizeObserver !== "function" || !els.dialog) return;
    const observer = new ResizeObserver(() => {
        if (!els.dialog.open || state.items.length === 0) return;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const width = els.list.clientWidth || window.innerWidth;
            if (Math.abs(width - state.lastWidth) < 24) return;
            state.lastWidth = width;
            renderCloud(state.items, state.items[0].count, width);
        }, RESIZE_DEBOUNCE_MS);
    });
    observer.observe(els.dialog);
};

const cacheElements = () => {
    const get = id => document.getElementById(id);
    els.dialog = get("wordStatsDialog");
    els.title = get("wordStatsTitle");
    els.status = get("wordStatsStatus");
    els.cloudWrap = get("wordStatsCloudWrap");
    els.cloud = get("wordStatsCloud");
    els.list = get("wordStatsList");
    els.footnote = get("wordStatsFootnote");
    els.closeBtn = get("wordStatsCloseBtn");
    els.popover = get("wordStatsPopover");
    els.popoverTerm = get("wordStatsPopoverTerm");
    els.popoverDesc = get("wordStatsPopoverDesc");
    els.popoverDict = get("wordStatsPopoverDict");
    els.popoverSearch = get("wordStatsPopoverSearch");
    els.popoverClose = get("wordStatsPopoverClose");
    return Boolean(els.dialog && els.list);
};

/**
 * @param {Object} config
 * @param {string} config.triggerId          다이얼로그를 여는 버튼 id
 * @param {Function} config.buildEndpoint    () => string  통계 API URL
 * @param {Function} config.buildTitle       () => string  다이얼로그 제목
 * @param {Function} config.buildSearchUrl   (word) => string  단어 검색 이동 URL
 */
export const initWordStats = (config) => {
    const trigger = document.getElementById(config.triggerId);
    if (!trigger || !cacheElements()) return;

    state.config = config;
    setupDialogScrollLock(els.dialog);
    bindResize();

    els.closeBtn?.addEventListener("click", () => els.dialog.close());
    els.popoverClose?.addEventListener("click", closePopover);
    els.dialog.addEventListener("close", closePopover);

    trigger.addEventListener("click", async () => {
        if (typeof els.dialog.showModal !== "function") return;

        els.title.textContent = config.buildTitle();
        els.status.textContent = "불러오는 중…";
        els.status.classList.remove("d-none");
        els.cloudWrap.classList.add("d-none");
        els.list.replaceChildren();
        els.footnote.classList.add("d-none");
        closePopover();

        els.dialog.showModal();
        els.closeBtn?.focus();

        const data = await fetchStats(config.buildEndpoint());
        if (data === null) {
            els.status.textContent = "통계를 불러오지 못했습니다.";
            return;
        }
        render(data);
    });
};
