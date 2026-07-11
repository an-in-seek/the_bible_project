/**
 * 통합 검색의 4개 데이터 소스 어댑터.
 *
 * docs/common/unified-search.md §5-1 / §6 / §7 참조.
 *
 * 원격 fetch (성경/사전): 자동완성·결과 페이지 모두 track=false 로 호출하여
 *  인기 검색어 랭킹 오염 방지. 도메인 전용 페이지(/web/bible/search 등)는
 *  기존 default track=true 유지.
 *
 * 로컬 lookup (책/메뉴): 정규화된 입력으로 점수 기반 매칭.
 */

import { BIBLE_BOOKS } from "./bible-book-index.js";
import { MENU_INDEX } from "./menu-index.js?v=1.1";
import { TranslationStore } from "../storage-util.js";

const TRANSLATION_ID_KRV_FALLBACK = 1;

/**
 * 현재 사용자가 선택한 번역본 ID. localStorage 에 저장된 값이 없으면 KRV(1) fallback.
 * 사용자가 번역본 페이지에서 NKRV/KJV 등을 선택했다면 검색도 그 번역본 기준으로 수행한다.
 */
function getActiveTranslationId() {
    return TranslationStore.getCurrentTranslationId() ?? TRANSLATION_ID_KRV_FALLBACK;
}

/* ── 정규화 ─────────────────────────────────────── */

function normalize(s) {
    return (s ?? "")
        .toString()
        .normalize("NFC")
        .trim()
        .toLowerCase();
}

/* ── 원격 검색: 성경 구절 ────────────────────────── */

/**
 * @param {string} keyword
 * @param {{ signal?: AbortSignal, size?: number, page?: number, track?: boolean }} opts
 */
export async function searchBibleVerses(keyword, opts = {}) {
    const { signal, size = 3, page = 0, track = false } = opts;
    const translationId = getActiveTranslationId();
    const url = new URL(
        `/api/v1/bibles/translations/${translationId}/search`,
        window.location.origin,
    );
    url.searchParams.set("keyword", keyword);
    url.searchParams.set("page", String(page));
    url.searchParams.set("size", String(size));
    url.searchParams.set("track", String(track));

    const response = await fetch(url.pathname + url.search, {
        method: "GET",
        signal,
        headers: { Accept: "application/json" },
    });
    if (!response.ok) {
        throw new Error(`bible search failed: ${response.status}`);
    }
    const data = await response.json();
    // BibleSearchSliceResponse: { content: Verse[], hasNext, totalCount }
    return {
        items: (data.content || []).map(v => ({
            bookOrder: v.bookOrder,
            bookName: v.bookName,
            chapterNumber: v.chapterNumber,
            verseNumber: v.verseNumber,
            text: v.text,
            url: `/web/bible/verse?translationId=${translationId}&bookOrder=${v.bookOrder}&chapterNumber=${v.chapterNumber}&verseNumber=${v.verseNumber}&from=search`,
        })),
        hasNext: !!data.hasNext,
        totalCount: data.totalCount ?? null,
    };
}

/* ── 원격 검색: 사전 ─────────────────────────────── */

/**
 * @param {string} keyword
 * @param {{ signal?: AbortSignal, size?: number, page?: number, track?: boolean }} opts
 */
export async function searchDictionary(keyword, opts = {}) {
    const { signal, size = 5, page = 0, track = false } = opts;
    const url = new URL("/api/v1/study/dictionaries", window.location.origin);
    url.searchParams.set("keyword", keyword);
    url.searchParams.set("page", String(page));
    url.searchParams.set("size", String(size));
    url.searchParams.set("track", String(track));

    const response = await fetch(url.pathname + url.search, {
        method: "GET",
        signal,
        headers: { Accept: "application/json" },
    });
    if (!response.ok) {
        throw new Error(`dictionary search failed: ${response.status}`);
    }
    const data = await response.json();
    // DictionarySliceResponse: { content: DictionaryItem[], hasNext, totalCount }
    return {
        items: (data.content || []).map(d => ({
            id: d.id,
            term: d.term,
            description: d.description,
            url: `/web/study/dictionary/${d.id}?from=search`,
        })),
        hasNext: !!data.hasNext,
        totalCount: data.totalCount ?? null,
    };
}

/* ── 로컬 검색: 성경 책 ──────────────────────────── */

export function searchBibleBooks(keyword, opts = {}) {
    const { size = 3 } = opts;
    const kw = normalize(keyword);
    if (!kw) return { items: [], totalCount: 0 };

    const scored = [];
    for (const b of BIBLE_BOOKS) {
        const nameLower = b.name.toLowerCase();
        const abbrLower = b.abbr.toLowerCase();
        const nameEnLower = b.nameEn.toLowerCase();

        let score = 0;
        if (nameLower === kw || nameEnLower === kw) score += 100;
        else if (nameLower.startsWith(kw) || nameEnLower.startsWith(kw)) score += 70;
        else if (nameLower.includes(kw) || nameEnLower.includes(kw)) score += 50;

        if (abbrLower === kw) score += 60;
        else if (abbrLower.includes(kw)) score += 30;

        if (score > 0) {
            scored.push({ book: b, score });
        }
    }

    scored.sort((a, b) => b.score - a.score);
    const translationId = getActiveTranslationId();
    const top = scored.slice(0, size).map(({ book }) => ({
        bookOrder: book.bookOrder,
        name: book.name,
        nameEn: book.nameEn,
        url: `/web/bible/chapter?translationId=${translationId}&bookOrder=${book.bookOrder}&from=search`,
        label: `${book.name} 장 목록 보기`,
    }));

    return { items: top, totalCount: scored.length };
}

/* ── 로컬 검색: 메뉴 ─────────────────────────────── */

export function searchMenus(keyword, opts = {}) {
    const { size = 5 } = opts;
    const kw = normalize(keyword);
    if (!kw) return { items: [], totalCount: 0 };

    const scored = [];
    for (const m of MENU_INDEX) {
        const titleLower = m.title.toLowerCase();
        const titleEnLower = m.titleEn.toLowerCase();

        let score = 0;
        if (titleLower === kw) score += 100;
        else if (titleLower.startsWith(kw)) score += 70;
        else if (titleLower.includes(kw)) score += 50;

        if (titleEnLower === kw) score += 40;
        else if (titleEnLower.includes(kw)) score += 25;

        for (const k of m.keywords) {
            const kl = k.toLowerCase();
            if (kl === kw) { score += 60; break; }
            if (kl.includes(kw)) { score += 30; break; }
        }

        if (score > 0) {
            scored.push({ menu: m, score });
        }
    }

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, size).map(({ menu }) => ({
        id: menu.id,
        title: menu.title,
        category: menu.category,
        icon: menu.icon,
        description: menu.description,
        url: menu.url,
        requiresAuth: !!menu.requiresAuth,
    }));

    return { items: top, totalCount: scored.length };
}
