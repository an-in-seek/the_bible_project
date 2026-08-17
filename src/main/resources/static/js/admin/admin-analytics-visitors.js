import {fetchAdmin} from "/js/admin/admin-common.js";

const API_BASE = "/api/v1/admin/analytics/visitors";
const PAGE_SIZE = 20;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/* ------------------------------------------------------------------ 날짜 유틸 */

const toIsoDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

const addDays = (d, n) => {
    const copy = new Date(d);
    copy.setDate(copy.getDate() + n);
    return copy;
};

/** "YYYY-MM-DD" 를 로컬 달력 날짜로 파싱한다. new Date(str) 은 UTC 로 해석돼 요일이 하루 밀린다. */
const parseIsoDate = (iso) => {
    const [y, m, d] = String(iso).split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
};

const weekdayOf = (iso) => WEEKDAYS[parseIsoDate(iso).getDay()];

const isWeekend = (iso) => {
    const day = parseIsoDate(iso).getDay();
    return day === 0 || day === 6;
};

const diffDays = (fromIso, toIso) =>
    Math.round((parseIsoDate(toIso) - parseIsoDate(fromIso)) / 86400000) + 1;

/* ------------------------------------------------------------------ 표시 유틸 */

const formatNumber = (n) => (n ?? 0).toLocaleString("ko-KR");

const escapeHtml = (s) => String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const announce = (message) => {
    const el = document.querySelector("[data-dash-status]");
    if (el) el.textContent = message;
};

const setBusy = (selector, busy) => {
    const el = document.querySelector(selector);
    if (el) el.setAttribute("aria-busy", busy ? "true" : "false");
};

/* --------------------------------------------------------------------- 통신 */

const fetchDaily = (from, to) => fetchAdmin(`${API_BASE}/summary?from=${from}&to=${to}`);
const fetchOverview = (from, to) => fetchAdmin(`${API_BASE}/overview?from=${from}&to=${to}`);
const fetchPages = (date, page = 0, size = PAGE_SIZE) =>
    fetchAdmin(`${API_BASE}/pages?date=${date}&page=${page}&size=${size}`);

/* --------------------------------------------------------------------- 상태 */

const state = {
    from: null,
    to: null,
    pageDate: null,
    pageIndex: 0,
};

const KPI_KEYS = [
    "todayPageView",
    "todayUniqueVisitor",
    "last7PageView",
    "last30UniqueVisitor",
    "last30UniqueMember",
];

/* ------------------------------------------------------------------ KPI 카드 */

const renderKpi = (key, value) => {
    const el = document.querySelector(`[data-kpi="${key}"]`);
    if (!el) return;
    el.classList.remove("is-loading", "is-error");
    el.textContent = formatNumber(value);
};

const markKpisError = () => {
    KPI_KEYS.forEach((key) => {
        const el = document.querySelector(`[data-kpi="${key}"]`);
        if (!el) return;
        el.classList.remove("is-loading");
        el.classList.add("is-error");
        el.textContent = "조회 실패";
    });
};

const setKpisLoading = () => {
    KPI_KEYS.forEach((key) => {
        const el = document.querySelector(`[data-kpi="${key}"]`);
        if (!el) return;
        el.classList.remove("is-error");
        el.classList.add("is-loading");
        el.textContent = "0";
    });
};

/**
 * 증감률을 표시한다. 기준값이 0 이면 비율을 계산할 수 없어 증감량만 보여 준다.
 * @param {string} key data-kpi-trend 키
 * @param {number} current 현재 구간 값
 * @param {number} previous 비교 구간 값
 * @param {string} caption 비교 대상 설명
 * @param {string} [hint] 마우스 오버 시 보충 설명
 */
const renderTrend = (key, current, previous, caption, hint) => {
    const host = document.querySelector(`[data-kpi-trend="${key}"]`);
    if (!host) return;

    const delta = current - previous;
    const dir = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
    const arrow = dir === "up" ? "▲" : dir === "down" ? "▼" : "―";
    const rate = previous > 0 ? Math.round(Math.abs(delta) / previous * 100) : null;
    const amount = formatNumber(Math.abs(delta));
    const text = dir === "flat"
        ? "변화 없음"
        : rate === null ? `${arrow} ${amount}` : `${arrow} ${rate}% (${amount})`;

    host.innerHTML = `
        <span class="analytics-kpi-delta" data-dir="${dir}">${escapeHtml(text)}</span>
        <span class="analytics-kpi-delta-caption">${escapeHtml(caption)}</span>
    `;
    if (hint) host.querySelector(".analytics-kpi-delta").title = hint;
};

const clearTrend = (key) => {
    const host = document.querySelector(`[data-kpi-trend="${key}"]`);
    if (host) host.innerHTML = "";
};

/** 최근 14일 일별 데이터로 어제 대비 / 지난주 대비 증감을 계산한다. */
const loadTrends = async (today) => {
    const from = toIsoDate(addDays(parseIsoDate(today), -13));
    try {
        const data = await fetchDaily(from, today);
        const byDate = new Map((data?.items ?? []).map((i) => [i.date, i]));
        const at = (offset) => {
            const iso = toIsoDate(addDays(parseIsoDate(today), offset));
            return byDate.get(iso) ?? {pageViewCount: 0, uniqueVisitorCount: 0};
        };
        const sumRange = (startOffset, endOffset, field) => {
            let total = 0;
            for (let o = startOffset; o <= endOffset; o += 1) total += at(o)[field] ?? 0;
            return total;
        };

        const partialHint = "오늘은 아직 집계 중인 값으로, 어제 하루 전체와 비교한 결과입니다.";
        renderTrend("todayPageView", at(0).pageViewCount, at(-1).pageViewCount, "어제 대비", partialHint);
        renderTrend("todayUniqueVisitor", at(0).uniqueVisitorCount, at(-1).uniqueVisitorCount, "어제 대비", partialHint);
        renderTrend(
            "last7PageView",
            sumRange(-6, 0, "pageViewCount"),
            sumRange(-13, -7, "pageViewCount"),
            "직전 7일 대비",
        );
    } catch (e) {
        console.error(e);
        ["todayPageView", "todayUniqueVisitor", "last7PageView"].forEach(clearTrend);
    }
};

const loadKpis = async () => {
    const today = toIsoDate(new Date());
    const last7From = toIsoDate(addDays(new Date(), -6));
    const last30From = toIsoDate(addDays(new Date(), -29));

    setKpisLoading();
    setBusy(".analytics-kpi-grid", true);
    try {
        const [todayOverview, last7Overview, last30Overview] = await Promise.all([
            fetchOverview(today, today),
            fetchOverview(last7From, today),
            fetchOverview(last30From, today),
        ]);
        renderKpi("todayPageView", todayOverview?.totalPageViewCount);
        renderKpi("todayUniqueVisitor", todayOverview?.periodUniqueVisitorCount);
        renderKpi("last7PageView", last7Overview?.totalPageViewCount);
        renderKpi("last30UniqueVisitor", last30Overview?.periodUniqueVisitorCount);
        renderKpi("last30UniqueMember", last30Overview?.periodAuthenticatedUniqueMemberCount);
        await loadTrends(today);
    } catch (e) {
        console.error(e);
        markKpisError();
    } finally {
        setBusy(".analytics-kpi-grid", false);
    }
};

/* ------------------------------------------------------------------- 일별 표 */

const renderDailyTable = (items) => {
    const tbody = document.querySelector("[data-daily-tbody]");
    const tfoot = document.querySelector("[data-daily-tfoot]");
    if (!tbody) return;

    if (!items.length) {
        tbody.innerHTML = `<tr><td colspan="3" class="analytics-state-cell">선택한 기간에 데이터가 없습니다.</td></tr>`;
        if (tfoot) tfoot.hidden = true;
        return;
    }

    // 최근 날짜가 위로 오는 편이 확인하기 쉽다.
    const rows = [...items].sort((a, b) => (a.date < b.date ? 1 : -1));
    tbody.innerHTML = rows
        .map((item) => `
            <tr${isWeekend(item.date) ? ' class="analytics-weekend"' : ""}>
                <td class="analytics-date-cell">${escapeHtml(item.date)}<span class="analytics-weekday">${weekdayOf(item.date)}</span></td>
                <td class="analytics-num">${formatNumber(item.pageViewCount)}</td>
                <td class="analytics-num">${formatNumber(item.uniqueVisitorCount)}</td>
            </tr>
        `)
        .join("");

    if (!tfoot) return;
    const totalPv = items.reduce((sum, i) => sum + (i.pageViewCount ?? 0), 0);
    const totalUv = items.reduce((sum, i) => sum + (i.uniqueVisitorCount ?? 0), 0);
    tfoot.querySelector("[data-daily-total-pv]").textContent = formatNumber(totalPv);
    // 일별 고유 방문자를 더한 값이라 기간 내 중복은 제거되지 않는다.
    tfoot.querySelector("[data-daily-total-uv]").textContent = formatNumber(totalUv);
    tfoot.hidden = false;
};

/* --------------------------------------------------------------------- 차트 */

const chart = {
    wrapper: null,
    svg: null,
    grid: null,
    area: null,
    lines: {},
    points: null,
    crosshair: null,
    tooltip: null,
    coords: [],
    items: [],
};

/** 축 라벨이 5, 10, 25 같은 값으로 끊기도록 최대값을 올림한다. */
const niceCeil = (value) => {
    if (value <= 4) return 4;
    const exponent = Math.floor(Math.log10(value));
    const base = 10 ** exponent;
    const scaled = value / base;
    const step = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 2.5 ? 2.5 : scaled <= 5 ? 5 : 10;
    return step * base;
};

const buildLinePath = (coords, key) =>
    coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c[key].toFixed(1)}`).join(" ");

const renderChart = () => {
    const {wrapper, svg, grid, area, lines, points, crosshair} = chart;
    if (!wrapper || !svg) return;

    const items = chart.items;
    if (!items.length) {
        wrapper.classList.add("is-empty");
        grid.innerHTML = "";
        points.innerHTML = "";
        area.setAttribute("d", "");
        lines.pv.setAttribute("d", "");
        lines.uv.setAttribute("d", "");
        chart.coords = [];
        svg.removeAttribute("aria-label");
        return;
    }
    wrapper.classList.remove("is-empty");

    // viewBox 를 실제 픽셀 폭과 1:1 로 맞춘다. 그래야 모바일에서 축 라벨이 축소되지 않는다.
    // 최소값을 크게 잡으면 좁은 화면(320px 등)에서 viewBox 가 실제 폭보다 넓어져
    // SVG 가 축소되고 1:1 이 깨진다. 측정이 실패했을 때만 대체값을 쓴다.
    const measured = Math.round(svg.clientWidth || wrapper.clientWidth || 0);
    const width = measured >= 120 ? measured : 320;
    const height = width < 480 ? 190 : width < 768 ? 220 : 270;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.style.height = `${height}px`;

    const compact = width < 480;
    const maxValue = niceCeil(Math.max(...items.map((i) => Math.max(i.pageViewCount ?? 0, i.uniqueVisitorCount ?? 0)), 1));
    const yLabelWidth = formatNumber(maxValue).length * (compact ? 6.5 : 7.5) + 8;
    const padding = {
        top: 12,
        right: compact ? 10 : 16,
        bottom: 26,
        left: Math.max(compact ? 26 : 34, yLabelWidth),
    };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const baseline = padding.top + chartH;

    const step = items.length > 1 ? chartW / (items.length - 1) : 0;
    const singleOffset = items.length === 1 ? chartW / 2 : 0;
    const yOf = (value) => baseline - ((value ?? 0) / maxValue) * chartH;

    chart.coords = items.map((item, i) => ({
        x: padding.left + singleOffset + step * i,
        pv: yOf(item.pageViewCount),
        uv: yOf(item.uniqueVisitorCount),
        item,
    }));

    // 가로 격자 + Y축 라벨
    const ratios = compact ? [0, 0.5, 1] : [0, 0.25, 0.5, 0.75, 1];
    const gridMarkup = ratios.map((r) => {
        const y = baseline - chartH * r;
        const label = formatNumber(Math.round(maxValue * r));
        return `
            <line class="${r === 0 ? "analytics-chart-baseline" : "analytics-chart-grid-line"}"
                  x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"></line>
            <text class="analytics-chart-axis-label" x="${padding.left - 6}" y="${y + 4}" text-anchor="end">${label}</text>
        `;
    }).join("");

    // X축 라벨 배치. "MM-DD" 의 실제 렌더 폭과 앵커(start/middle/end)까지 감안해
    // 좌우 경계를 계산한다. 중앙 정렬만 가정하면 끝 라벨이 앵커 때문에 왼쪽으로
    // 밀려 직전 라벨과 겹친다.
    const labelWidth = compact ? 34 : 38;
    const gap = 8;
    const maxLabels = Math.max(2, Math.floor(chartW / (labelWidth + gap)));
    const stride = Math.max(1, Math.ceil(items.length / maxLabels));

    const anchorOf = (x) => x <= padding.left + 4
        ? "start"
        : x >= width - padding.right - 4 ? "end" : "middle";
    const boundsOf = (x, anchor) => {
        const left = anchor === "start" ? x : anchor === "end" ? x - labelWidth : x - labelWidth / 2;
        return {left, right: left + labelWidth};
    };
    const labelTag = (c, anchor) =>
        `<text class="analytics-chart-axis-label" x="${c.x.toFixed(1)}" y="${height - 8}" text-anchor="${anchor}">${escapeHtml(c.item.date.slice(5))}</text>`;

    const lastCoord = chart.coords[chart.coords.length - 1];
    const lastAnchor = anchorOf(lastCoord.x);
    const lastBounds = boundsOf(lastCoord.x, lastAnchor);

    // 가장 최근 날짜는 반드시 남기고, 나머지를 왼쪽부터 채운다.
    const parts = [];
    let cursor = -Infinity;
    chart.coords.forEach((c, i) => {
        if (i === chart.coords.length - 1) return;
        if (i % stride !== 0) return;
        const anchor = anchorOf(c.x);
        const bounds = boundsOf(c.x, anchor);
        if (bounds.left < cursor + gap) return;
        if (bounds.right + gap > lastBounds.left) return;
        cursor = bounds.right;
        parts.push(labelTag(c, anchor));
    });
    if (chart.coords.length > 1) parts.push(labelTag(lastCoord, lastAnchor));
    else parts.push(labelTag(lastCoord, "middle"));
    const xLabels = parts.join("");

    grid.innerHTML = gridMarkup + xLabels;

    lines.pv.setAttribute("d", buildLinePath(chart.coords, "pv"));
    lines.uv.setAttribute("d", buildLinePath(chart.coords, "uv"));

    const first = chart.coords[0];
    const last = chart.coords[chart.coords.length - 1];
    area.setAttribute(
        "d",
        `M${first.x.toFixed(1)},${baseline} ${buildLinePath(chart.coords, "pv").slice(1)} L${last.x.toFixed(1)},${baseline} Z`,
    );

    points.innerHTML = chart.coords
        .map((c, i) => `
            <circle class="analytics-chart-point" data-series="pv" data-index="${i}" cx="${c.x.toFixed(1)}" cy="${c.pv.toFixed(1)}" r="3.5"></circle>
            <circle class="analytics-chart-point" data-series="uv" data-index="${i}" cx="${c.x.toFixed(1)}" cy="${c.uv.toFixed(1)}" r="3.5"></circle>
        `)
        .join("");

    crosshair.setAttribute("y1", padding.top);
    crosshair.setAttribute("y2", baseline);

    // 점이 적으면 선만으로는 값을 짚기 어려우니 항상 표시한다.
    wrapper.classList.toggle("is-sparse", items.length <= 14);

    const totalPv = items.reduce((sum, i) => sum + (i.pageViewCount ?? 0), 0);
    svg.setAttribute(
        "aria-label",
        `${items[0].date} 부터 ${items[items.length - 1].date} 까지 일별 페이지뷰와 고유 방문자 추이. 총 페이지뷰 ${formatNumber(totalPv)}회.`,
    );
};

const hideTooltip = () => {
    chart.tooltip?.classList.remove("is-visible");
    chart.crosshair?.classList.remove("is-active");
    chart.points?.querySelectorAll(".is-active").forEach((el) => el.classList.remove("is-active"));
};

const showTooltipAt = (index) => {
    const coord = chart.coords[index];
    const {tooltip, crosshair, wrapper, svg} = chart;
    if (!coord || !tooltip) return;

    const {item} = coord;
    tooltip.innerHTML = `
        <div class="analytics-tooltip-date">${escapeHtml(item.date)} (${weekdayOf(item.date)})</div>
        <div class="analytics-tooltip-row">
            <span><i class="analytics-tooltip-dot" data-series="pv"></i>페이지뷰</span>
            <b>${formatNumber(item.pageViewCount)}</b>
        </div>
        <div class="analytics-tooltip-row">
            <span><i class="analytics-tooltip-dot" data-series="uv"></i>고유 방문자</span>
            <b>${formatNumber(item.uniqueVisitorCount)}</b>
        </div>
    `;
    tooltip.classList.add("is-visible");

    // 툴팁이 래퍼 밖으로 나가지 않도록 좌우를 잡아 준다.
    const offsetLeft = svg.offsetLeft + coord.x;
    const offsetTop = svg.offsetTop + Math.min(coord.pv, coord.uv);
    const half = tooltip.offsetWidth / 2;
    const clampedLeft = Math.min(Math.max(offsetLeft, half + 2), wrapper.clientWidth - half - 2);
    tooltip.style.left = `${clampedLeft}px`;
    tooltip.style.top = `${Math.max(offsetTop - 10, tooltip.offsetHeight + 4)}px`;

    crosshair.setAttribute("x1", coord.x);
    crosshair.setAttribute("x2", coord.x);
    crosshair.classList.add("is-active");

    chart.points.querySelectorAll(".is-active").forEach((el) => el.classList.remove("is-active"));
    chart.points.querySelectorAll(`[data-index="${index}"]`).forEach((el) => el.classList.add("is-active"));
};

const nearestIndex = (clientX) => {
    if (!chart.coords.length) return -1;
    const rect = chart.svg.getBoundingClientRect();
    const x = clientX - rect.left;
    let best = 0;
    let bestDistance = Infinity;
    chart.coords.forEach((c, i) => {
        const distance = Math.abs(c.x - x);
        if (distance < bestDistance) {
            bestDistance = distance;
            best = i;
        }
    });
    return best;
};

const initChart = () => {
    chart.wrapper = document.querySelector(".analytics-chart-wrapper");
    chart.svg = document.querySelector("[data-chart]");
    if (!chart.wrapper || !chart.svg) return;

    chart.grid = chart.svg.querySelector("[data-chart-grid]");
    chart.area = chart.svg.querySelector("[data-chart-area]");
    chart.lines = {
        pv: chart.svg.querySelector('[data-chart-line="pv"]'),
        uv: chart.svg.querySelector('[data-chart-line="uv"]'),
    };
    chart.points = chart.svg.querySelector("[data-chart-points]");
    chart.crosshair = chart.svg.querySelector("[data-chart-crosshair]");
    chart.tooltip = chart.wrapper.querySelector("[data-chart-tooltip]");

    const onPointerMove = (ev) => {
        const index = nearestIndex(ev.clientX);
        if (index >= 0) showTooltipAt(index);
    };

    chart.svg.addEventListener("pointerdown", onPointerMove);
    chart.svg.addEventListener("pointermove", onPointerMove);
    chart.svg.addEventListener("pointerleave", hideTooltip);
    // 터치로 훑은 뒤에는 손을 떼면 정리한다.
    chart.svg.addEventListener("pointerup", (ev) => {
        if (ev.pointerType !== "mouse") hideTooltip();
    });
    chart.svg.addEventListener("pointercancel", hideTooltip);

    // 폭이 바뀌면 픽셀 기준이 달라지므로 다시 그린다.
    if (typeof ResizeObserver === "function") {
        let frame = 0;
        const observer = new ResizeObserver(() => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                hideTooltip();
                renderChart();
            });
        });
        observer.observe(chart.wrapper);
    } else {
        window.addEventListener("resize", () => {
            hideTooltip();
            renderChart();
        });
    }
};

/* --------------------------------------------------------------- 페이지 순위 */

const renderPagination = (pagination, totalPages, current) => {
    if (totalPages <= 1) {
        pagination.innerHTML = "";
        return;
    }

    // 페이지가 많아도 버튼이 화면을 덮지 않도록 현재 위치 주변만 노출한다.
    const windowSize = 5;
    let start = Math.max(0, current - Math.floor(windowSize / 2));
    const end = Math.min(totalPages, start + windowSize);
    start = Math.max(0, end - windowSize);

    const parts = [];
    if (current > 0) parts.push(`<a href="#" data-page-go="${current - 1}" aria-label="이전 페이지">‹</a>`);
    if (start > 0) {
        parts.push(`<a href="#" data-page-go="0">1</a>`);
        if (start > 1) parts.push(`<span aria-hidden="true">…</span>`);
    }
    for (let i = start; i < end; i += 1) {
        parts.push(i === current
            ? `<span class="active" aria-current="page">${i + 1}</span>`
            : `<a href="#" data-page-go="${i}">${i + 1}</a>`);
    }
    if (end < totalPages) {
        if (end < totalPages - 1) parts.push(`<span aria-hidden="true">…</span>`);
        parts.push(`<a href="#" data-page-go="${totalPages - 1}">${totalPages}</a>`);
    }
    if (current < totalPages - 1) parts.push(`<a href="#" data-page-go="${current + 1}" aria-label="다음 페이지">›</a>`);

    pagination.innerHTML = parts.join("");
    pagination.querySelectorAll("[data-page-go]").forEach((el) => {
        el.addEventListener("click", (ev) => {
            ev.preventDefault();
            loadPages(Number(el.dataset.pageGo));
        });
    });
};

const renderPageTable = (pageData) => {
    const tbody = document.querySelector("[data-page-tbody]");
    const pagination = document.querySelector("[data-page-pagination]");
    if (!tbody) return;

    const items = pageData?.content ?? [];
    if (!items.length) {
        tbody.innerHTML = `<tr><td colspan="4" class="analytics-state-cell">선택한 날짜에 데이터가 없습니다.</td></tr>`;
        if (pagination) pagination.innerHTML = "";
        return;
    }

    const current = pageData.page ?? 0;
    const offset = current * PAGE_SIZE;
    const maxPv = Math.max(...items.map((i) => i.pageViewCount ?? 0), 1);

    tbody.innerHTML = items
        .map((item, idx) => {
            const ratio = Math.round(((item.pageViewCount ?? 0) / maxPv) * 100);
            return `
            <tr>
                <td class="analytics-rank-cell">${offset + idx + 1}</td>
                <td class="analytics-page-cell" title="${escapeHtml(item.pageKey)}">${escapeHtml(item.pageKey)}</td>
                <td class="analytics-bar-cell">
                    <span class="analytics-bar">
                        <span class="analytics-bar-track" aria-hidden="true"><span class="analytics-bar-fill" style="width:${ratio}%"></span></span>
                        <span class="analytics-bar-value">${formatNumber(item.pageViewCount)}</span>
                    </span>
                </td>
                <td class="analytics-num">${formatNumber(item.uniqueVisitorCount)}</td>
            </tr>
        `;
        })
        .join("");

    if (pagination) renderPagination(pagination, pageData.totalPages ?? 0, current);
};

/* ------------------------------------------------------------------- 로딩 흐름 */

const showTableState = (selector, colspan, message, isError = false) => {
    const tbody = document.querySelector(selector);
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="${colspan}" class="analytics-state-cell${isError ? " is-error" : ""}">${escapeHtml(message)}</td></tr>`;
};

const renderRangeLabel = () => {
    const el = document.querySelector("[data-range-label]");
    if (!el) return;
    const days = diffDays(state.from, state.to);
    el.textContent = `${state.from} ~ ${state.to} · ${days}일`;
};

const loadDaily = async () => {
    setBusy(".analytics-table-wrapper", true);
    renderRangeLabel();
    try {
        const data = await fetchDaily(state.from, state.to);
        const items = data?.items ?? [];
        renderDailyTable(items);
        chart.items = [...items].sort((a, b) => (a.date < b.date ? -1 : 1));
        renderChart();
    } catch (e) {
        console.error(e);
        showTableState("[data-daily-tbody]", 3, `조회 실패: ${e.message}`, true);
        const tfoot = document.querySelector("[data-daily-tfoot]");
        if (tfoot) tfoot.hidden = true;
        chart.items = [];
        renderChart();
        const empty = document.querySelector("[data-chart-empty]");
        if (empty) empty.textContent = "데이터를 불러오지 못했습니다.";
    } finally {
        setBusy(".analytics-table-wrapper", false);
    }
};

const loadPages = async (page = state.pageIndex) => {
    state.pageIndex = page;
    try {
        const data = await fetchPages(state.pageDate, page, PAGE_SIZE);
        renderPageTable(data);
    } catch (e) {
        console.error(e);
        showTableState("[data-page-tbody]", 4, `조회 실패: ${e.message}`, true);
    }
};

const updateRefreshedAt = () => {
    const el = document.querySelector("[data-dash-updated]");
    if (el) el.textContent = `기준 ${new Date().toLocaleTimeString("ko-KR", {hour: "2-digit", minute: "2-digit"})}`;
};

/* ---------------------------------------------------------------------- 초기화 */

const syncPresetButtons = () => {
    const days = diffDays(state.from, state.to);
    const isToday = state.to === toIsoDate(new Date());
    document.querySelectorAll("[data-range-preset]").forEach((btn) => {
        const match = isToday && Number(btn.dataset.rangePreset) === days;
        btn.setAttribute("aria-pressed", match ? "true" : "false");
    });
};

const withBusyButton = async (form, action) => {
    const button = form?.querySelector("button[type='submit']");
    if (button) button.disabled = true;
    try {
        await action();
    } finally {
        if (button) button.disabled = false;
    }
};

export const initAnalyticsVisitors = () => {
    const today = toIsoDate(new Date());
    state.from = toIsoDate(addDays(new Date(), -29));
    state.to = today;
    state.pageDate = today;

    const rangeForm = document.querySelector("[data-range-form]");
    const fromInput = document.querySelector("[data-range-from]");
    const toInput = document.querySelector("[data-range-to]");
    const rangeError = document.querySelector("[data-range-error]");
    const pageForm = document.querySelector("[data-page-form]");
    const pageDateInput = document.querySelector("[data-page-date]");

    if (fromInput) {
        fromInput.value = state.from;
        fromInput.max = today;
    }
    if (toInput) {
        toInput.value = state.to;
        toInput.max = today;
    }
    if (pageDateInput) {
        pageDateInput.value = state.pageDate;
        pageDateInput.max = today;
    }

    initChart();

    rangeForm?.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const from = fromInput.value;
        const to = toInput.value;
        if (!from || !to) {
            if (rangeError) rangeError.textContent = "시작일과 종료일을 모두 입력해 주세요.";
            return;
        }
        if (from > to) {
            if (rangeError) rangeError.textContent = "시작일이 종료일보다 늦습니다.";
            return;
        }
        if (diffDays(from, to) > 366) {
            if (rangeError) rangeError.textContent = "조회 기간은 최대 366일까지 지정할 수 있습니다.";
            return;
        }
        if (rangeError) rangeError.textContent = "";
        state.from = from;
        state.to = to;
        syncPresetButtons();
        withBusyButton(rangeForm, loadDaily);
    });

    document.querySelectorAll("[data-range-preset]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const days = Number(btn.dataset.rangePreset);
            state.to = toIsoDate(new Date());
            state.from = toIsoDate(addDays(new Date(), -(days - 1)));
            if (fromInput) fromInput.value = state.from;
            if (toInput) toInput.value = state.to;
            if (rangeError) rangeError.textContent = "";
            syncPresetButtons();
            loadDaily();
        });
    });

    pageForm?.addEventListener("submit", (ev) => {
        ev.preventDefault();
        if (!pageDateInput.value) return;
        state.pageDate = pageDateInput.value;
        withBusyButton(pageForm, () => loadPages(0));
    });

    const refreshButton = document.querySelector("[data-dash-refresh]");
    refreshButton?.addEventListener("click", async () => {
        refreshButton.disabled = true;
        refreshButton.classList.add("is-busy");
        showTableState("[data-daily-tbody]", 3, "불러오는 중…");
        showTableState("[data-page-tbody]", 4, "불러오는 중…");
        try {
            await Promise.all([loadKpis(), loadDaily(), loadPages(state.pageIndex)]);
            updateRefreshedAt();
            announce("대시보드 지표를 갱신했습니다.");
        } finally {
            refreshButton.disabled = false;
            refreshButton.classList.remove("is-busy");
        }
    });

    syncPresetButtons();
    updateRefreshedAt();
    loadKpis();
    loadDaily();
    loadPages(0);
};
