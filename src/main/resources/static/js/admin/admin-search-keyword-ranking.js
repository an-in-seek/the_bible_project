import {fetchAdmin} from "/js/admin/admin-common.js";

const SECTIONS = [
    {
        key: "bible",
        apiUrl: "/api/v1/admin/bible/search-keywords/ranking",
    },
    {
        key: "dictionary",
        apiUrl: "/api/v1/admin/dictionaries/search-keywords/ranking",
    },
];

const formatNumber = (n) => (n ?? 0).toLocaleString("ko-KR");

const escapeHtml = (s) => String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const createInitialState = () => Object.fromEntries(
    SECTIONS.map(section => [section.key, { limit: 20 }])
);

const state = createInitialState();

const fetchRanking = (apiUrl, limit) => fetchAdmin(`${apiUrl}?limit=${limit}`);

const getSectionElements = key => ({
    form: document.querySelector(`[data-keyword-form="${key}"]`),
    limitInput: document.querySelector(`[data-keyword-limit="${key}"]`),
    tbody: document.querySelector(`[data-keyword-tbody="${key}"]`),
    refreshedEl: document.querySelector(`[data-keyword-refreshed="${key}"]`),
});

const showState = (tbody, message, isError = false) => {
    tbody.innerHTML = `<tr><td colspan="3" class="analytics-state-cell${isError ? " is-error" : ""}">${escapeHtml(message)}</td></tr>`;
};

const renderTable = (key, data) => {
    const { tbody, refreshedEl } = getSectionElements(key);
    if (!tbody) return;

    const items = data?.items ?? [];
    if (!items.length) {
        showState(tbody, "집계된 검색어가 없습니다.");
        if (refreshedEl) refreshedEl.textContent = "";
        return;
    }

    // 1위 대비 비율 바를 함께 보여 주면 순위 간 격차가 숫자보다 빨리 읽힌다.
    const maxCount = Math.max(...items.map(item => item.searchCount ?? 0), 1);

    tbody.innerHTML = items
        .map((item) => {
            const ratio = Math.round(((item.searchCount ?? 0) / maxCount) * 100);
            const topAttr = item.rank <= 3 ? ` data-top="${item.rank}"` : "";
            return `
            <tr>
                <td class="analytics-rank-cell"><span class="analytics-rank-badge"${topAttr}>${escapeHtml(item.rank)}</span></td>
                <td class="analytics-keyword-cell">${escapeHtml(item.keyword)}</td>
                <td class="analytics-bar-cell">
                    <span class="analytics-bar">
                        <span class="analytics-bar-track" aria-hidden="true"><span class="analytics-bar-fill" style="width:${ratio}%"></span></span>
                        <span class="analytics-bar-value">${formatNumber(item.searchCount)}</span>
                    </span>
                </td>
            </tr>
        `;
        })
        .join("");

    if (refreshedEl && data.refreshedAt) {
        const localized = new Date(data.refreshedAt).toLocaleString("ko-KR");
        refreshedEl.textContent = `갱신 시각: ${localized}`;
    }
};

const load = async section => {
    const { key, apiUrl } = section;
    const { tbody } = getSectionElements(key);
    if (!tbody) return;

    tbody.closest(".admin-table-wrapper")?.setAttribute("aria-busy", "true");
    try {
        const data = await fetchRanking(apiUrl, state[key].limit);
        renderTable(key, data);
    } catch (e) {
        console.error(e);
        showState(tbody, `조회 실패: ${e.message}`, true);
    } finally {
        tbody.closest(".admin-table-wrapper")?.setAttribute("aria-busy", "false");
    }
};

export const initSearchKeywordRanking = () => {
    SECTIONS.forEach(section => {
        const { key } = section;
        const { form, limitInput, tbody } = getSectionElements(key);

        if (!form || !limitInput || !tbody) return;

        limitInput.value = String(state[key].limit);

        form.addEventListener("submit", async (ev) => {
            ev.preventDefault();
            const next = Number(limitInput?.value ?? state[key].limit);
            state[key].limit = Number.isFinite(next) && next > 0 ? next : state[key].limit;

            const button = form.querySelector("button[type='submit']");
            if (button) button.disabled = true;
            try {
                await load(section);
            } finally {
                if (button) button.disabled = false;
            }
        });

        load(section);
    });
};
