import {setupDialogScrollLock} from "/js/common-util.js?v=2.3";

const TIMEOUT_MS = 5000;
const HOME_INITIAL_LIMIT = 5;
const DEFAULT_DIALOG_LIMIT = 50;

const HOME_TRIGGERS = {
    bible: {
        title: "성경 구절 인기 검색어",
        endpoint: "/api/v1/bibles/search-keywords/ranking",
        linkTemplate: "/web/bible/search?keyword={kw}",
        ariaTemplate: "순위 {rank}위, {keyword} 구절 검색",
    },
    dictionary: {
        title: "성경 사전 인기 검색어",
        endpoint: "/api/v1/study/dictionaries/search-keywords/ranking",
        linkTemplate: "/web/study/dictionary?keyword={kw}&from=home",
        ariaTemplate: "순위 {rank}위, {keyword} 사전 검색",
    },
};

const fetchRanking = async (endpoint, limit) => {
    const url = new URL(endpoint, window.location.origin);
    url.searchParams.set("limit", String(limit));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const res = await fetch(url, {signal: controller.signal, credentials: "omit"});
        if (!res.ok) return null;
        const data = await res.json();
        return Array.isArray(data?.items) ? data.items : [];
    } catch (_) {
        return null;
    } finally {
        clearTimeout(timer);
    }
};

const buildItem = (item, config) => {
    const li = document.createElement("li");
    li.className = "popular-search-item";

    const el = config.onItemClick
        ? document.createElement("button")
        : document.createElement("a");
    el.className = "popular-search-link";

    if (config.onItemClick) {
        el.type = "button";
        el.addEventListener("click", () => config.onItemClick(item));
    } else if (config.linkTemplate) {
        el.href = config.linkTemplate.replace("{kw}", encodeURIComponent(item.keyword));
    }

    if (config.ariaTemplate) {
        el.setAttribute(
            "aria-label",
            config.ariaTemplate.replace("{rank}", item.rank).replace("{keyword}", item.keyword),
        );
    }
    if (item.rank <= 3) {
        el.classList.add(`top-rank-${item.rank}`);
    }

    const rank = document.createElement("span");
    rank.className = "popular-search-rank";
    rank.textContent = String(item.rank);

    const keyword = document.createElement("span");
    keyword.className = "popular-search-keyword";
    keyword.textContent = item.keyword;

    el.append(rank, keyword);
    li.appendChild(el);
    return li;
};

const paintList = (listEl, items, config) => {
    if (!listEl) return;
    listEl.replaceChildren(...items.map(item => buildItem(item, config)));
};

export const initPopularSearchDialog = ({
    triggers,
    dialogId = "popularSearchDialog",
    limit = DEFAULT_DIALOG_LIMIT,
}) => {
    const dialog = document.getElementById(dialogId);
    if (!dialog || typeof dialog.showModal !== "function") return;

    setupDialogScrollLock(dialog);

    const titleEl = dialog.querySelector(".popular-search-dialog-title");
    const listEl = dialog.querySelector("[data-dialog-keyword-list]");
    const closeBtn = dialog.querySelector("[data-dialog-close]");

    const close = () => dialog.close();

    const openFor = async (type) => {
        const cfg = triggers[type];
        if (!cfg || !titleEl || !listEl) return;
        titleEl.textContent = cfg.title;
        listEl.replaceChildren();
        dialog.showModal();

        const items = await fetchRanking(cfg.endpoint, limit);
        if (!items || items.length === 0) {
            const li = document.createElement("li");
            li.className = "popular-search-item text-muted small";
            li.textContent = "표시할 검색어가 없습니다.";
            listEl.appendChild(li);
            return;
        }

        paintList(listEl, items, {
            linkTemplate: cfg.linkTemplate,
            ariaTemplate: cfg.ariaTemplate,
            onItemClick: cfg.onItemClick
                ? (item) => { cfg.onItemClick(item); close(); }
                : null,
        });
    };

    document.querySelectorAll("[data-ranking-more]").forEach(btn => {
        btn.addEventListener("click", () => openFor(btn.dataset.rankingMore));
    });

    if (closeBtn) {
        closeBtn.addEventListener("click", close);
    }
    dialog.addEventListener("click", (e) => {
        if (e.target === dialog) close();
    });
};

const renderHomeCard = async (card) => {
    const type = card.dataset.keywordRanking;
    const cfg = HOME_TRIGGERS[type];
    if (!cfg) return;
    const items = await fetchRanking(cfg.endpoint, HOME_INITIAL_LIMIT);
    if (!items || items.length === 0) return;
    paintList(
        card.querySelector("[data-keyword-list]"),
        items,
        {linkTemplate: cfg.linkTemplate, ariaTemplate: cfg.ariaTemplate},
    );
    card.hidden = false;
};

export const initPopularSearch = () => {
    document.querySelectorAll("[data-keyword-ranking]").forEach(renderHomeCard);
    initPopularSearchDialog({triggers: HOME_TRIGGERS});
};
