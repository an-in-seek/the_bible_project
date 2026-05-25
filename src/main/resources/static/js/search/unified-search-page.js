/**
 * 통합 검색 결과 페이지 — /web/search?q=...&tab=...
 *
 * docs/common/unified-search.md §9 참조.
 *
 * 동작:
 *  - 서버에서 query / activeTab 모델 속성을 받아 초기 상태 설정
 *  - 입력 변경 시 URL 갱신 (history.replaceState) + Promise.allSettled 호출
 *  - 모든 호출은 track=false (백그라운드 카테고리 조회 성격, docs §5-1)
 *  - 탭 전환: 같은 결과 셋에서 카테고리별 필터링만 변경
 *  - 페이지네이션: 구절 탭만 적용 ("더보기" append)
 */

import {
    searchBibleVerses,
    searchDictionary,
    searchBibleBooks,
    searchMenus,
} from "./search-sources.js";
import { parseBibleReference } from "./bible-reference-parser.js";

const KEYWORD_MAX_LENGTH = 100;
const DEBOUNCE_MS = 200;

class UnifiedSearchPage {
    constructor() {
        this.input = document.getElementById("usPageInput");
        this.clearBtn = document.getElementById("usPageClear");
        this.loadingEl = document.getElementById("usPageLoading");
        this.emptyEl = document.getElementById("usPageEmpty");
        this.resultsEl = document.getElementById("usResults");
        this.tabs = Array.from(document.querySelectorAll(".us-tab"));
        this.liveRegion = document.getElementById("usPageLiveRegion");

        this.state = {
            keyword: this.resultsEl.dataset.initialQuery || "",
            tab: this.resultsEl.dataset.initialTab || "all",
            abortController: null,
            biblePage: 0,
            bibleHasNext: false,
            counts: { all: 0, bible: 0, dictionary: 0, menu: 0 },
            cached: { verses: [], dicts: [], books: [], menus: [], parser: null },
        };

        this._debounceTimer = null;

        this.bind();
        this.setActiveTab(this.state.tab, { skipRender: true });
        if (this.state.keyword.length > 0) {
            this.input.value = this.state.keyword;
            this.clearBtn.classList.remove("d-none");
            this.run();
        } else {
            this.emptyEl.classList.remove("d-none");
        }
    }

    bind() {
        this.input.addEventListener("input", () => this.onInput());
        this.input.addEventListener("keydown", e => {
            if (e.key === "Enter") {
                e.preventDefault();
                clearTimeout(this._debounceTimer);
                this.commitKeyword();
                this.run();
            }
        });
        this.clearBtn.addEventListener("click", () => this.clear());

        for (const tab of this.tabs) {
            tab.addEventListener("click", () => {
                this.setActiveTab(tab.dataset.tab);
            });
        }
    }

    onInput() {
        let kw = this.input.value;
        if (kw.length > KEYWORD_MAX_LENGTH) {
            kw = kw.slice(0, KEYWORD_MAX_LENGTH);
            this.input.value = kw;
        }
        const trimmed = kw.trim();
        this.clearBtn.classList.toggle("d-none", trimmed.length === 0);
        this.state.keyword = trimmed;

        clearTimeout(this._debounceTimer);
        if (trimmed.length === 0) {
            this.clear();
            return;
        }
        this._debounceTimer = setTimeout(() => {
            this.commitKeyword();
            this.run();
        }, DEBOUNCE_MS);
    }

    commitKeyword() {
        const url = new URL(window.location.href);
        if (this.state.keyword.length > 0) {
            url.searchParams.set("q", this.state.keyword);
        } else {
            url.searchParams.delete("q");
        }
        url.searchParams.set("tab", this.state.tab);
        window.history.replaceState({}, "", url.pathname + url.search);
    }

    clear() {
        this.input.value = "";
        this.input.focus();
        this.state.keyword = "";
        this.clearBtn.classList.add("d-none");
        this.resultsEl.replaceChildren();
        this.emptyEl.classList.remove("d-none");
        this.updateCounts({ all: 0, bible: 0, dictionary: 0, menu: 0 });
        this.commitKeyword();
    }

    setActiveTab(tab, opts = {}) {
        const validTabs = ["all", "bible", "dictionary", "menu"];
        const next = validTabs.includes(tab) ? tab : "all";
        this.state.tab = next;
        for (const t of this.tabs) {
            const active = t.dataset.tab === next;
            t.setAttribute("aria-selected", active ? "true" : "false");
            t.classList.toggle("us-tab-active", active);
        }
        if (!opts.skipRender && this.state.keyword.length > 0) {
            this.render();
            this.commitKeyword();
        }
    }

    async run() {
        if (this.state.keyword.length === 0) return;
        if (this.state.abortController) {
            try { this.state.abortController.abort(); } catch (_) { /* noop */ }
        }
        const controller = new AbortController();
        this.state.abortController = controller;
        const kw = this.state.keyword;
        const signal = controller.signal;

        this.emptyEl.classList.add("d-none");
        this.loadingEl.classList.remove("d-none");
        this.state.biblePage = 0;

        const settled = await Promise.allSettled([
            searchBibleVerses(kw, { signal, size: 20, page: 0, track: false }),
            searchDictionary(kw, { signal, size: 20, page: 0, track: false }),
            Promise.resolve(searchBibleBooks(kw, { size: 50 })),
            Promise.resolve(searchMenus(kw, { size: 50 })),
            Promise.resolve(parseBibleReference(kw)),
        ]);

        // Stale guard
        if (this.state.keyword !== kw) return;

        const [versesR, dictR, booksR, menusR, parserR] = settled;
        this.state.cached.verses = versesR.status === "fulfilled" ? versesR.value.items : [];
        this.state.bibleHasNext = versesR.status === "fulfilled" ? versesR.value.hasNext : false;
        this.state.cached.dicts = dictR.status === "fulfilled" ? dictR.value.items : [];
        this.state.cached.books = booksR.status === "fulfilled" ? booksR.value.items : [];
        this.state.cached.menus = menusR.status === "fulfilled" ? menusR.value.items : [];
        this.state.cached.parser = parserR.status === "fulfilled" ? parserR.value : null;

        const bibleCount =
            this.state.cached.verses.length +
            this.state.cached.books.length +
            (this.state.cached.parser ? 1 : 0);
        const dictCount = this.state.cached.dicts.length;
        const menuCount = this.state.cached.menus.length;

        this.updateCounts({
            all: bibleCount + dictCount + menuCount,
            bible: bibleCount,
            dictionary: dictCount,
            menu: menuCount,
        });

        this.loadingEl.classList.add("d-none");
        this.render();
    }

    updateCounts(counts) {
        this.state.counts = counts;
        for (const tab of this.tabs) {
            const k = tab.dataset.tab;
            const el = tab.querySelector(".us-tab-count");
            if (el) el.textContent = String(counts[k] ?? 0);
        }
        if (this.liveRegion) {
            this.liveRegion.textContent = `총 ${counts.all}건의 결과가 있습니다.`;
        }
    }

    render() {
        this.resultsEl.replaceChildren();
        const tab = this.state.tab;
        const { verses, dicts, books, menus, parser } = this.state.cached;

        const showBible = tab === "all" || tab === "bible";
        const showDict = tab === "all" || tab === "dictionary";
        const showMenu = tab === "all" || tab === "menu";

        if (showBible && (parser || books.length > 0 || verses.length > 0)) {
            const section = this.makeSection("📖 성경 (구절·책·장)");
            if (parser) {
                section.list.appendChild(this.renderParserItem(parser));
            }
            for (const b of books) {
                section.list.appendChild(this.renderBookItem(b));
            }
            for (const v of verses) {
                section.list.appendChild(this.renderVerseItem(v));
            }
            if (this.state.bibleHasNext) {
                const more = document.createElement("button");
                more.type = "button";
                more.className = "us-more-btn";
                more.textContent = "구절 더보기";
                more.addEventListener("click", () => this.loadMoreVerses(more));
                section.root.appendChild(more);
            }
            this.resultsEl.appendChild(section.root);
        }

        if (showDict && dicts.length > 0) {
            const section = this.makeSection("📚 성경 사전");
            for (const d of dicts) {
                section.list.appendChild(this.renderDictItem(d));
            }
            this.resultsEl.appendChild(section.root);
        }

        if (showMenu && menus.length > 0) {
            const section = this.makeSection("🧭 메뉴");
            for (const m of menus) {
                section.list.appendChild(this.renderMenuItem(m));
            }
            this.resultsEl.appendChild(section.root);
        }

        if (this.resultsEl.children.length === 0) {
            this.emptyEl.classList.remove("d-none");
            this.emptyEl.textContent = "검색 결과가 없어요. 다른 키워드로 다시 시도해 보세요.";
        } else {
            this.emptyEl.classList.add("d-none");
        }
    }

    makeSection(title) {
        const root = document.createElement("section");
        root.className = "us-result-section";

        const h = document.createElement("h2");
        h.className = "us-result-section-title";
        h.textContent = title;
        root.appendChild(h);

        const list = document.createElement("ul");
        list.className = "us-result-list";
        root.appendChild(list);

        return { root, list };
    }

    async loadMoreVerses(btn) {
        const kw = this.state.keyword;
        const nextPage = this.state.biblePage + 1;
        btn.disabled = true;
        try {
            const result = await searchBibleVerses(kw, {
                page: nextPage,
                size: 20,
                track: false,
            });
            if (this.state.keyword !== kw) return;
            this.state.biblePage = nextPage;
            this.state.bibleHasNext = result.hasNext;
            this.state.cached.verses.push(...result.items);

            const list = btn.previousElementSibling;
            for (const v of result.items) {
                list.appendChild(this.renderVerseItem(v));
            }
            if (!result.hasNext) {
                btn.remove();
            } else {
                btn.disabled = false;
            }
        } catch (e) {
            btn.disabled = false;
        }
    }

    renderParserItem(p) {
        const li = document.createElement("li");
        li.className = "us-result-item us-result-item-parser";
        const a = document.createElement("a");
        a.className = "us-result-link";
        a.href = p.url;
        const icon = document.createElement("span");
        icon.className = "us-result-icon";
        icon.textContent = "📍";
        icon.setAttribute("aria-hidden", "true");
        const text = document.createElement("span");
        text.className = "us-result-text";
        text.textContent = p.label;
        a.appendChild(icon);
        a.appendChild(text);
        li.appendChild(a);
        return li;
    }

    renderBookItem(b) {
        const li = document.createElement("li");
        li.className = "us-result-item";
        const a = document.createElement("a");
        a.className = "us-result-link";
        a.href = b.url;
        const icon = document.createElement("span");
        icon.className = "us-result-icon";
        icon.textContent = "📕";
        icon.setAttribute("aria-hidden", "true");
        const text = document.createElement("span");
        text.className = "us-result-text";
        text.textContent = b.label;
        a.appendChild(icon);
        a.appendChild(text);
        li.appendChild(a);
        return li;
    }

    renderVerseItem(v) {
        const li = document.createElement("li");
        li.className = "us-result-item";
        const a = document.createElement("a");
        a.className = "us-result-link";
        a.href = v.url;
        const ref = document.createElement("span");
        ref.className = "us-result-ref";
        ref.textContent = `${v.bookName} ${v.chapterNumber}:${v.verseNumber}`;
        const text = document.createElement("span");
        text.className = "us-result-text";
        text.textContent = ` — ${v.text}`;
        a.appendChild(ref);
        a.appendChild(text);
        li.appendChild(a);
        return li;
    }

    renderDictItem(d) {
        const li = document.createElement("li");
        li.className = "us-result-item";
        const a = document.createElement("a");
        a.className = "us-result-link us-result-link-block";
        a.href = d.url;

        const head = document.createElement("div");
        head.className = "us-result-head";
        const term = document.createElement("span");
        term.className = "us-result-ref";
        term.textContent = d.term;
        head.appendChild(term);
        a.appendChild(head);

        if (d.description) {
            const desc = document.createElement("p");
            desc.className = "us-result-desc";
            desc.textContent = d.description;
            a.appendChild(desc);
        }

        li.appendChild(a);
        return li;
    }

    renderMenuItem(m) {
        const li = document.createElement("li");
        li.className = "us-result-item";
        const a = document.createElement("a");
        a.className = "us-result-link" + (m.description ? " us-result-link-block" : "");
        a.href = m.url;

        const head = document.createElement("div");
        head.className = "us-result-head";

        const icon = document.createElement("span");
        icon.className = "us-result-icon";
        icon.textContent = m.icon || "•";
        icon.setAttribute("aria-hidden", "true");
        head.appendChild(icon);

        const text = document.createElement("span");
        text.className = "us-result-text";
        text.textContent = m.title;
        head.appendChild(text);

        if (m.requiresAuth) {
            const badge = document.createElement("span");
            badge.className = "us-result-badge us-result-badge-auth";
            badge.textContent = "로그인 필요";
            head.appendChild(badge);
        }

        a.appendChild(head);

        if (m.description) {
            const desc = document.createElement("p");
            desc.className = "us-result-desc";
            desc.textContent = m.description;
            a.appendChild(desc);
        }

        li.appendChild(a);
        return li;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (!document.querySelector(".unified-search-page")) return;
    new UnifiedSearchPage();
});
