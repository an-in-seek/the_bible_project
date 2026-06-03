/**
 * 통합 검색 — 홈(index.html) 드롭다운 컨트롤러.
 *
 * docs/common/unified-search.md §4 / §7 / §11 참조.
 *
 * 동작:
 *  - 입력 → debounce 200ms → 4개 소스 병렬 호출 (Promise.allSettled + AbortController)
 *  - 결과 → 카테고리 그룹화 드롭다운 (성경/사전/메뉴, parser 는 성경 그룹 상단에 합류)
 *  - IME(한글) 안전: compositionstart~compositionend 사이 검색 일시 중단
 *  - 키보드 네비: ArrowUp/Down, Enter, Escape
 *  - Stale guard: 응답 도착 시점 키워드가 다르면 렌더 스킵
 */

import {searchBibleBooks, searchBibleVerses, searchDictionary, searchMenus,} from "./search-sources.js";
import {parseBibleReference} from "./bible-reference-parser.js";

const DEBOUNCE_MS = 200;
const KEYWORD_MAX_LENGTH = 100;
// 모바일(Bootstrap md 미만): 자동완성 드롭다운 UX 저하 → 비활성화하고 결과 페이지 이동만 유지
const MOBILE_QUERY = "(max-width: 767.98px)";

class UnifiedSearch {
    constructor(rootEl) {
        this.root = rootEl;
        this.wrap = rootEl.querySelector(".us-search-wrap");
        this.input = rootEl.querySelector("#usInput");
        this.dropdown = rootEl.querySelector("#usDropdown");
        this.clearBtn = rootEl.querySelector("#usClear");
        this.liveRegion = rootEl.querySelector("#usLiveRegion");

        this.state = {
            keyword: "",
            composing: false,
            abortController: null,
        };
        this.items = []; // 평탄화된 결과 항목 (키보드 네비용)
        this.activeIndex = -1;
        this._debounceTimer = null;
        // 라이브 판정 — 화면 회전/리사이즈에도 즉시 반영
        this.mobileMql = window.matchMedia(MOBILE_QUERY);

        this.bind();
    }

    /** 모바일 여부 (자동완성 비활성 기준). */
    isMobile() {
        return this.mobileMql.matches;
    }

    bind() {
        this.input.addEventListener("input", () => this.onInput());
        this.input.addEventListener("compositionstart", () => {
            this.state.composing = true;
        });
        this.input.addEventListener("compositionend", () => {
            this.state.composing = false;
            this.onInput();
        });
        this.input.addEventListener("keydown", e => this.onKeydown(e));
        this.input.addEventListener("focus", () => {
            if (this.isMobile()) return;
            if (this.state.keyword.length > 0 && this.items.length > 0) {
                this.openDropdown();
            }
        });

        this.clearBtn.addEventListener("click", () => this.clear());

        document.addEventListener("click", e => {
            if (!this.root.contains(e.target)) {
                this.closeDropdown();
            }
        });

        // 데스크톱 → 모바일 전환 시 열려있던 자동완성 즉시 정리
        this.mobileMql.addEventListener("change", e => {
            if (e.matches) {
                clearTimeout(this._debounceTimer);
                this.items = [];
                this.activeIndex = -1;
                this.closeDropdown();
            }
        });
    }

    onInput() {
        if (this.state.composing) return;
        let kw = this.input.value;
        if (kw.length > KEYWORD_MAX_LENGTH) {
            kw = kw.slice(0, KEYWORD_MAX_LENGTH);
            this.input.value = kw;
        }
        kw = kw.trim();
        this.state.keyword = kw;
        this.clearBtn.classList.toggle("d-none", kw.length === 0);

        // 모바일: 자동완성 미사용 — 소스 호출/드롭다운 없이 Enter 시 결과 페이지로 이동
        if (this.isMobile()) {
            clearTimeout(this._debounceTimer);
            this.items = [];
            this.activeIndex = -1;
            this.closeDropdown();
            return;
        }

        if (kw.length === 0) {
            this.items = [];
            this.activeIndex = -1;
            this.renderEmpty(false);
            this.closeDropdown();
            return;
        }

        clearTimeout(this._debounceTimer);
        this._debounceTimer = setTimeout(() => this.run(), DEBOUNCE_MS);
    }

    onKeydown(e) {
        const key = e.key;
        if (key === "Escape") {
            e.preventDefault();
            this.closeDropdown();
            return;
        }
        if (key === "Enter") {
            e.preventDefault();
            if (this.activeIndex >= 0 && this.items[this.activeIndex]) {
                this.navigate(this.items[this.activeIndex]);
            } else if (this.state.keyword.length > 0) {
                this.navigateToResults();
            }
            return;
        }
        if (key === "ArrowDown") {
            if (this.items.length === 0) return;
            e.preventDefault();
            this.activeIndex = (this.activeIndex + 1) % this.items.length;
            this.updateActiveDescendant();
            return;
        }
        if (key === "ArrowUp") {
            if (this.items.length === 0) return;
            e.preventDefault();
            this.activeIndex =
                this.activeIndex <= 0 ? this.items.length - 1 : this.activeIndex - 1;
            this.updateActiveDescendant();
            return;
        }
        if (key === "Tab") {
            this.closeDropdown();
        }
    }

    clear() {
        this.input.value = "";
        this.input.focus();
        this.state.keyword = "";
        this.items = [];
        this.activeIndex = -1;
        this.clearBtn.classList.add("d-none");
        this.closeDropdown();
    }

    async run() {
        if (this.isMobile()) return; // 모바일: 자동완성 소스 호출 차단
        if (this.state.abortController) {
            try {
                this.state.abortController.abort();
            } catch (_) { /* noop */
            }
        }
        const controller = new AbortController();
        this.state.abortController = controller;
        const kw = this.state.keyword;
        const signal = controller.signal;

        const results = await Promise.allSettled([
            searchBibleVerses(kw, {signal, size: 3, track: false}),
            searchDictionary(kw, {signal, size: 5, track: false}),
            Promise.resolve(searchBibleBooks(kw, {size: 3})),
            Promise.resolve(searchMenus(kw, {size: 5})),
            Promise.resolve(parseBibleReference(kw)),
        ]);

        // Stale guard
        if (this.state.keyword !== kw) return;

        this.renderResults(results);
    }

    renderResults(results) {
        const [versesR, dictR, booksR, menusR, parserR] = results;
        const verses = versesR.status === "fulfilled" ? versesR.value.items : [];
        const dicts = dictR.status === "fulfilled" ? dictR.value.items : [];
        const books = booksR.status === "fulfilled" ? booksR.value.items : [];
        const menus = menusR.status === "fulfilled" ? menusR.value.items : [];
        const parser = parserR.status === "fulfilled" ? parserR.value : null;

        // 평탄화 (키보드 네비용)
        this.items = [];
        this.dropdown.replaceChildren();

        // 1. 성경 그룹: parser 결과 + 책 + 구절
        const bibleEntries = [];
        if (parser) bibleEntries.push({kind: "parser", data: parser});
        for (const b of books) bibleEntries.push({kind: "book", data: b});
        for (const v of verses) bibleEntries.push({kind: "verse", data: v});

        if (bibleEntries.length > 0) {
            this.dropdown.appendChild(
                this.makeGroup({
                    title: "📖 성경 (구절·책·장)",
                    seeAllHref: this.searchHref({tab: "bible"}),
                    entries: bibleEntries,
                    renderItem: e => this.renderBibleEntry(e),
                }),
            );
        }

        // 2. 사전 그룹
        if (dicts.length > 0) {
            this.dropdown.appendChild(
                this.makeGroup({
                    title: "📚 성경 사전",
                    seeAllHref: this.searchHref({tab: "dictionary"}),
                    entries: dicts.map(d => ({kind: "dict", data: d})),
                    renderItem: e => this.renderDictEntry(e),
                }),
            );
        }

        // 3. 메뉴 그룹
        if (menus.length > 0) {
            this.dropdown.appendChild(
                this.makeGroup({
                    title: "🧭 메뉴",
                    seeAllHref: this.searchHref({tab: "menu"}),
                    entries: menus.map(m => ({kind: "menu", data: m})),
                    renderItem: e => this.renderMenuEntry(e),
                }),
            );
        }

        if (this.items.length === 0) {
            this.renderEmpty(true);
        }

        // 기본 선택 없음 (첫 항목 자동 focus 비활성화)
        this.activeIndex = -1;
        this.updateActiveDescendant();
        this.announceCount();
        this.openDropdown();
    }

    makeGroup({title, seeAllHref, entries, renderItem}) {
        const groupEl = document.createElement("div");
        groupEl.className = "us-group";
        groupEl.setAttribute("role", "group");

        const header = document.createElement("div");
        header.className = "us-group-header";

        const titleEl = document.createElement("span");
        titleEl.className = "us-group-title";
        titleEl.textContent = title;
        header.appendChild(titleEl);

        const seeAll = document.createElement("a");
        seeAll.className = "us-group-see-all";
        seeAll.href = seeAllHref;
        seeAll.textContent = "전체 결과 ▸";
        header.appendChild(seeAll);

        groupEl.appendChild(header);

        const list = document.createElement("ul");
        list.className = "us-group-list";
        for (const e of entries) {
            const li = renderItem(e);
            list.appendChild(li);
        }
        groupEl.appendChild(list);
        return groupEl;
    }

    renderBibleEntry(entry) {
        const li = document.createElement("li");
        li.className = "us-item";
        li.setAttribute("role", "option");

        const a = document.createElement("a");
        a.className = "us-item-link";
        a.href = entry.data.url;

        if (entry.kind === "parser") {
            const icon = document.createElement("span");
            icon.className = "us-item-icon";
            icon.textContent = "📍";
            icon.setAttribute("aria-hidden", "true");
            a.appendChild(icon);

            const text = document.createElement("span");
            text.className = "us-item-text";
            text.textContent = entry.data.label;
            a.appendChild(text);
        } else if (entry.kind === "book") {
            const icon = document.createElement("span");
            icon.className = "us-item-icon";
            icon.textContent = "📕";
            icon.setAttribute("aria-hidden", "true");
            a.appendChild(icon);

            const text = document.createElement("span");
            text.className = "us-item-text";
            text.textContent = entry.data.label;
            a.appendChild(text);
        } else {
            // verse
            const v = entry.data;
            const ref = document.createElement("span");
            ref.className = "us-item-ref";
            ref.textContent = `${v.bookName} ${v.chapterNumber}:${v.verseNumber}`;
            a.appendChild(ref);

            const sep = document.createElement("span");
            sep.className = "us-item-sep";
            sep.textContent = " ";
            sep.setAttribute("aria-hidden", "true");
            a.appendChild(sep);

            const text = document.createElement("span");
            text.className = "us-item-text";
            text.textContent = v.text;
            a.appendChild(text);
        }

        return this.registerItem(li, a);
    }

    renderDictEntry(entry) {
        const d = entry.data;
        const li = document.createElement("li");
        li.className = "us-item";
        li.setAttribute("role", "option");

        const a = document.createElement("a");
        a.className = "us-item-link";
        a.href = d.url;

        const term = document.createElement("span");
        term.className = "us-item-term";
        term.textContent = d.term;
        a.appendChild(term);

        if (d.description) {
            const desc = document.createElement("span");
            desc.className = "us-item-desc";
            desc.textContent = ` ${d.description}`;
            a.appendChild(desc);
        }

        return this.registerItem(li, a);
    }

    renderMenuEntry(entry) {
        const m = entry.data;
        const li = document.createElement("li");
        li.className = "us-item";
        li.setAttribute("role", "option");

        const a = document.createElement("a");
        a.className = "us-item-link";
        a.href = m.url;

        const icon = document.createElement("span");
        icon.className = "us-item-icon";
        icon.textContent = m.icon || "•";
        icon.setAttribute("aria-hidden", "true");
        a.appendChild(icon);

        const text = document.createElement("span");
        text.className = "us-item-text";
        text.textContent = m.title;
        a.appendChild(text);

        if (m.requiresAuth) {
            const badge = document.createElement("span");
            badge.className = "us-item-badge us-item-badge-auth";
            badge.textContent = "로그인 필요";
            a.appendChild(badge);
        }

        return this.registerItem(li, a);
    }

    registerItem(li, a) {
        const idx = this.items.length;
        const id = `us-item-${idx}`;
        li.id = id;
        li.setAttribute("aria-selected", "false");
        li.dataset.index = String(idx);
        li.appendChild(a);

        li.addEventListener("mouseenter", () => {
            this.activeIndex = idx;
            this.updateActiveDescendant();
        });

        this.items.push({id, url: a.href});
        return li;
    }

    renderEmpty(show) {
        const existing = this.dropdown.querySelector(".us-empty");
        if (existing) existing.remove();
        if (!show) return;

        const empty = document.createElement("div");
        empty.className = "us-empty";
        empty.textContent = "검색 결과가 없어요. 다른 키워드로 다시 시도해 보세요.";
        this.dropdown.appendChild(empty);
    }

    updateActiveDescendant() {
        for (const li of this.dropdown.querySelectorAll("[role=option]")) {
            const idx = Number(li.dataset.index);
            const active = idx === this.activeIndex;
            li.setAttribute("aria-selected", active ? "true" : "false");
            li.classList.toggle("us-item-active", active);
        }
        if (this.activeIndex >= 0 && this.items[this.activeIndex]) {
            this.input.setAttribute("aria-activedescendant", this.items[this.activeIndex].id);
        } else {
            this.input.removeAttribute("aria-activedescendant");
        }
    }

    announceCount() {
        if (!this.liveRegion) return;
        const n = this.items.length;
        this.liveRegion.textContent = n === 0
            ? "검색 결과가 없습니다."
            : `총 ${n}건이 검색되었습니다.`;
    }

    openDropdown() {
        this.dropdown.classList.remove("d-none");
        this.wrap.setAttribute("aria-expanded", "true");
    }

    closeDropdown() {
        this.dropdown.classList.add("d-none");
        this.wrap.setAttribute("aria-expanded", "false");
        this.input.removeAttribute("aria-activedescendant");
    }

    navigate(item) {
        if (item && item.url) {
            window.location.href = item.url;
        }
    }

    navigateToResults() {
        window.location.href = this.searchHref({});
    }

    searchHref({tab}) {
        const url = new URL("/web/search", window.location.origin);
        url.searchParams.set("q", this.state.keyword);
        if (tab) url.searchParams.set("tab", tab);
        return url.pathname + url.search;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("homeUnifiedSearch");
    if (!root) return;
    new UnifiedSearch(root);
});
