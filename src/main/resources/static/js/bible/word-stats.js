import {setupDialogScrollLock} from "/js/common-util.js?v=2.4";

/**
 * 성경 책/장 단어 빈도 통계 다이얼로그.
 * 설계 문서: docs/bible/word-frequency-design.md §10
 *
 * 책 화면과 장 화면이 같은 UI 를 쓰므로 이 모듈 하나로 처리한다.
 * 호출 측은 각자의 state 로 엔드포인트만 만들어 넘긴다.
 *
 * 클라우드와 목록은 중복이 아니라 역할 분담이다. 클라우드는 인상, 목록은 정확한 수치를
 * 맡는다. 목록의 빈도 비례 막대(--ratio)가 그 정확성 쪽을 담당한다.
 */

const TIMEOUT_MS = 5000;
const DICTIONARY_API = "/api/v1/study/dictionaries";
const DICTIONARY_WEB = "/web/study/dictionary";

/**
 * 이 아래 기준값들이 재는 것은 **다이얼로그 본문 폭이지 뷰포트 폭이 아니다.**
 *
 * 다이얼로그 최대 폭이 680px 이라 본문은 아무리 넓은 화면에서도 ~646px 를 넘지 못한다.
 * 뷰포트를 가정한 700/400 을 그대로 쓰던 동안 45개 구간에는 영원히 도달하지 못했고,
 * 데스크톱도 늘 좁은 화면용 글자 크기로 그려지고 있었다.
 */
const NARROW_BODY_WIDTH = 500;

// 클라우드 표시 개수 — 전체 목록이 아래에 그대로 있으므로 줄여도 정보 손실이 없다
const cloudCountFor = (bodyWidth) => (bodyWidth < 360 ? 25 : bodyWidth < NARROW_BODY_WIDTH ? 35 : 45);

/**
 * **CSS 의 `.word-stats-cloud` 와 반드시 같은 값이어야 한다.**
 * 캔버스로 잰 폭으로 충돌 박스를 만들고 그리기는 SVG 가 하므로, 둘이 다른 폰트를 쓰면
 * 박스가 실제 글자와 어긋나 단어가 겹치거나 헛되이 벌어진다. 지정을 빼면 캔버스는
 * generic `sans-serif`(윈도우 Arial), SVG 는 페이지 상속 폰트로 갈라진다.
 */
const CLOUD_FONT_FAMILY =
    'system-ui, -apple-system, "Segoe UI", Roboto, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';

// 모바일 하한을 12px 로 두면 터치로 누를 수 없을 만큼 작아진다.
// 최대/최소 비율이 곧 위계의 세기다 — 좁으면 1위 단어가 눈에 띄지 않는다.
const FONT_MIN_PX_MOBILE = 15;
const FONT_MIN_PX_DESKTOP = 13;
const FONT_MAX_PX_MOBILE = 40;
const FONT_MAX_PX_DESKTOP = 52;

// 아르키메데스 나선 배치 파라미터
const ANGLE_STEP = 0.15;     // 중심 부근의 각 스텝 상한
const ARC_STEP_PX = 6;       // 나선을 따라 한 번에 나아가는 호 길이
const RADIUS_FACTOR = 4;
const ASPECT = 1.7;          // 가로로 넓은 덩어리를 만든다
const MAX_ATTEMPTS = 4000;
// 단어 사이 여백. 4 로 두면 '땅' 과 '하나님' 이 붙어 '땅하나님' 한 덩어리로 읽힌다.
const PADDING = 8;

const RESIZE_DEBOUNCE_MS = 200;

/** 사용자에게 보이는 날짜는 KST 로 고정한다(.claude/rules/time-and-locale.md). */
const CALCULATED_AT_FORMAT = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
});

const els = {};
let state = {items: [], config: null, lastWidth: 0, popoverOpener: null};
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

    const fontMin = isMobile ? FONT_MIN_PX_MOBILE : FONT_MIN_PX_DESKTOP;
    const fontMax = isMobile ? FONT_MAX_PX_MOBILE : FONT_MAX_PX_DESKTOP;
    const placed = [];

    items.forEach(item => {
        // sqrt 로 압축한 이 값이 크기와 색을 함께 결정한다(같은 축이므로 서로 어긋나지 않는다)
        const weight = Math.sqrt(item.count / maxCount);
        const size = fontMin + (fontMax - fontMin) * weight;
        ctx.font = `700 ${size}px ${CLOUD_FONT_FAMILY}`;
        const w = ctx.measureText(item.word).width + PADDING * 2;
        const h = size * 1.25 + PADDING;

        let angle = 0;
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            const r = RADIUS_FACTOR * angle;
            const cx = r * Math.cos(angle) * ASPECT;
            const cy = r * Math.sin(angle);
            const rect = {x: cx - w / 2, y: cy - h / 2, w, h};
            if (!collides(rect, placed)) {
                placed.push({...rect, word: item.word, count: item.count, size, weight, item});
                break;
            }
            // 각 스텝을 반지름에 반비례시켜 **호 길이를 일정하게** 유지한다.
            // 고정 각 스텝은 바깥으로 갈수록 한 번에 수십 px 씩 건너뛰어 빈자리를 지나쳐 버린다.
            // 글자를 키운 뒤 43개 중 8개가 배치되지 못하고 사라지던 원인이 이것이었다.
            angle += r < 1 ? ANGLE_STEP : Math.min(ANGLE_STEP, ARC_STEP_PX / r);
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
    const layout = layoutCloud(items.slice(0, count), maxCount, containerWidth < NARROW_BODY_WIDTH);
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
        text.setAttribute("class", "word-stats-cloud-word");
        // 4단계로 끊으면 6회와 5회 사이에 눈에 띄는 색 절벽이 생긴다. 연속 보간으로 없앤다.
        text.style.setProperty("--t", p.weight.toFixed(3));
        // 클라우드는 장식이다. 접근성 경로는 아래 목록으로 통일한다.
        text.setAttribute("aria-hidden", "true");
        text.setAttribute("tabindex", "-1");
        text.textContent = p.word;
        text.addEventListener("click", () => openPopover(p.item, text));
        svg.appendChild(text);
    });
    wrap.classList.remove("d-none");
};

const buildCloudLabel = (placedCount, topItem, maxCount) => {
    if (!topItem) return "워드클라우드";
    return `워드클라우드. 상위 ${placedCount}개 단어. 가장 많이 나온 단어는 ${topItem.word} ${maxCount}회`;
};

/** 무엇을 몇 번 센 것인지 한 줄로 알려 준다. 이게 없으면 숫자의 기준을 알 수 없다. */
const renderSummary = (data, items) => {
    els.summaryMain.textContent = `단어 ${items.length}개 · 모두 ${data.shownCount}회`;

    const at = data.calculatedAt
        ? `${CALCULATED_AT_FORMAT.format(new Date(data.calculatedAt))} 기준`
        : "";
    els.summaryMeta.textContent = at;
    els.summaryMeta.classList.toggle("d-none", at === "");
    els.summary.classList.remove("d-none");
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
        // 빈도 비례 막대의 길이. CSS 가 배경 그라데이션 폭으로 그린다.
        link.style.setProperty("--ratio", maxCount > 0 ? (item.count / maxCount).toFixed(3) : "0");
        link.addEventListener("click", (event) => {
            // 사전 뜻이 있으면 바로 이동하지 않고 팝오버로 선택지를 준다
            if (item.dictionaryId) {
                event.preventDefault();
                openPopover(item, link);
            }
        });

        const term = document.createElement("span");
        term.className = "word-stats-term";
        term.textContent = item.word;

        const count = document.createElement("span");
        count.className = "word-stats-count";
        count.textContent = `${item.count}회`;

        link.append(term, count);
        li.appendChild(link);
        return li;
    }));
};

const openPopover = async (item, opener) => {
    const popover = els.popover;
    if (!popover) return;

    state.popoverOpener = opener ?? null;
    els.popoverTerm.textContent = item.word;
    els.popoverCount.textContent = `${item.count}회`;
    els.popoverDesc.textContent = "";
    els.popoverSearch.href = state.config.buildSearchUrl(item.word);

    popover.classList.remove("d-none");
    els.popoverClose?.focus();

    if (item.dictionaryId) {
        els.popoverDict.href = `${DICTIONARY_WEB}/${item.dictionaryId}`;
        els.popoverDict.classList.remove("d-none");
        els.popoverDesc.textContent = "뜻풀이를 불러오는 중…";
        const detail = await fetchStats(`${DICTIONARY_API}/${item.dictionaryId}`);
        // 불러오는 사이에 다른 단어를 눌렀으면 그 결과를 덮어쓰지 않는다
        if (els.popoverTerm.textContent !== item.word) return;
        els.popoverDesc.textContent = detail?.description ?? "";
    } else {
        els.popoverDict.classList.add("d-none");
    }
};

const isPopoverOpen = () => els.popover != null && !els.popover.classList.contains("d-none");

const closePopover = () => {
    if (!isPopoverOpen()) return;
    els.popover.classList.add("d-none");
    // 포커스를 눌렀던 단어로 돌려준다. 없으면 다이얼로그 닫기 버튼으로 보낸다.
    const target = state.popoverOpener?.isConnected ? state.popoverOpener : els.closeBtn;
    state.popoverOpener = null;
    if (target instanceof HTMLElement) target.focus();
};

const render = (data) => {
    const items = data?.items ?? [];
    state.items = items;

    if (items.length === 0) {
        els.status.textContent = "아직 집계되지 않았습니다.";
        els.status.classList.remove("d-none");
        els.summary.classList.add("d-none");
        els.cloudWrap.classList.add("d-none");
        els.listSection.classList.add("d-none");
        els.list.replaceChildren();
        els.footnote.classList.add("d-none");
        return;
    }

    els.status.classList.add("d-none");
    const maxCount = items[0].count;
    // 목록은 아직 숨겨져 있어 폭이 0 이다. 항상 보이는 본문 영역에서 잰다.
    state.lastWidth = els.body.clientWidth || window.innerWidth;

    renderSummary(data, items);
    renderCloud(items, maxCount, state.lastWidth);
    renderList(items, maxCount);
    els.listSection.classList.remove("d-none");

    if (data.truncated) {
        els.footnote.textContent = `단어가 더 있지만 상위 ${items.length}개까지만 표시합니다.`;
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
            const width = els.body.clientWidth || window.innerWidth;
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
    els.body = get("wordStatsBody");
    els.status = get("wordStatsStatus");
    els.summary = get("wordStatsSummary");
    els.summaryMain = get("wordStatsSummaryMain");
    els.summaryMeta = get("wordStatsSummaryMeta");
    els.cloudWrap = get("wordStatsCloudWrap");
    els.cloud = get("wordStatsCloud");
    els.listSection = get("wordStatsListSection");
    els.list = get("wordStatsList");
    els.footnote = get("wordStatsFootnote");
    els.closeBtn = get("wordStatsCloseBtn");
    els.popover = get("wordStatsPopover");
    els.popoverTerm = get("wordStatsPopoverTerm");
    els.popoverCount = get("wordStatsPopoverCount");
    els.popoverDesc = get("wordStatsPopoverDesc");
    els.popoverDict = get("wordStatsPopoverDict");
    els.popoverSearch = get("wordStatsPopoverSearch");
    els.popoverClose = get("wordStatsPopoverClose");
    return Boolean(els.dialog && els.list && els.body);
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
    els.dialog.addEventListener("close", () => {
        els.popover?.classList.add("d-none");
        state.popoverOpener = null;
    });

    // ESC 는 팝오버부터 닫는다. 그냥 두면 단어 하나 보려다 다이얼로그가 통째로 닫힌다.
    els.dialog.addEventListener("cancel", (event) => {
        if (!isPopoverOpen()) return;
        event.preventDefault();
        closePopover();
    });

    /*
     * 바깥 클릭 처리.
     *
     * `::backdrop` 을 누르면 이벤트의 target 이 다이얼로그 자신이 된다. 내부는 헤더와 본문이
     * 남김없이 덮고 있고 다이얼로그의 padding 도 0 이라, target 비교만으로 안팎을 가를 수 있다.
     * 좌표(getBoundingClientRect)로 판정하는 흔한 방법은 키보드로 버튼을 눌렀을 때
     * clientX/Y 가 0 으로 들어와 '바깥'으로 오인하고 창을 닫아 버린다.
     *
     * mousedown 위치를 함께 보는 것은 드래그 때문이다. 목록에서 글자를 긁다가 손을 바깥에서
     * 떼면 click 의 target 이 다이얼로그가 되어, 선택만 하려던 사용자의 창이 닫힌다.
     */
    let pressedOnBackdrop = false;
    // mousedown 이 아니라 pointerdown 이다. 터치에서 마우스 이벤트는 에뮬레이션이라
    // 상황에 따라 오지 않을 수 있고, 그러면 배경 탭이 조용히 먹지 않는다.
    els.dialog.addEventListener("pointerdown", (event) => {
        pressedOnBackdrop = event.target === els.dialog;
    });

    els.dialog.addEventListener("click", (event) => {
        const target = event.target;
        if (target === els.dialog && pressedOnBackdrop) {
            els.dialog.close();
            return;
        }
        // 팝오버 바깥을 누르면 팝오버만 닫는다. 단어를 누른 경우는 그 단어의 팝오버로 교체된다.
        if (!isPopoverOpen()) return;
        if (!(target instanceof Element)) return;
        if (target.closest(".word-stats-popover, .word-stats-link")) return;
        if (target.classList.contains("word-stats-cloud-word")) return;
        closePopover();
    });

    trigger.addEventListener("click", async () => {
        if (typeof els.dialog.showModal !== "function") return;

        els.title.textContent = config.buildTitle();
        els.status.textContent = "불러오는 중…";
        els.status.classList.remove("d-none");
        els.summary.classList.add("d-none");
        els.cloudWrap.classList.add("d-none");
        els.listSection.classList.add("d-none");
        els.list.replaceChildren();
        els.footnote.classList.add("d-none");
        els.popover?.classList.add("d-none");
        state.popoverOpener = null;

        els.dialog.showModal();
        /*
         * 닫기 버튼이 아니라 **다이얼로그 자신**에 포커스를 준다.
         *
         * showModal() 은 기본적으로 첫 번째 포커스 가능한 요소를 잡는데 그게 X 버튼이라,
         * 창을 열자마자 '닫기'가 선택된 상태로 보인다. 내용을 보러 연 사람에게 첫 제안이
         * 닫기인 셈이라 어색하고, 엔터를 잘못 누르면 바로 닫힌다.
         *
         * 컨테이너에 포커스를 두면 스크린리더가 aria-labelledby 로 연결된 제목을 읽어 주고,
         * Tab 을 누르면 DOM 순서대로 닫기 버튼부터 이어진다(WAI-ARIA APG 의 정보성
         * 다이얼로그 권장 방식).
         */
        els.dialog.focus();

        const data = await fetchStats(config.buildEndpoint());
        if (data === null) {
            els.status.textContent = "통계를 불러오지 못했습니다.";
            return;
        }
        render(data);
    });
};
