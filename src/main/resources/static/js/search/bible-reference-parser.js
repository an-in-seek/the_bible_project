/**
 * Bible Reference Parser — "창3:16", "Genesis 3", "예레미야 애가 1:1" 같은
 * 자유 입력을 파싱하여 성경 책/장/절 deep link 로 변환한다.
 *
 * docs/common/unified-search.md §3-3 참조.
 *
 * 전략: 정규식이 아닌 책 이름 prefix-match (longest-first lookup table).
 *  - KRV "예레미야 애가"(공백 포함), KJV "1 Samuel"/"Song of Solomon"(공백+숫자 prefix) 자연 처리
 *  - 책 매칭 후 잔여 문자열만 장·절 정규식 적용
 *  - 절 번호 sanity range 1–200 만 검사 (verseCountByChapter 미인덱싱, best-effort)
 */

import { matchBookPrefix } from "./bible-book-index.js";
import { TranslationStore } from "../storage-util.js";

const TRANSLATION_ID_KRV_FALLBACK = 1;

/**
 * 현재 사용자가 선택한 번역본 ID. localStorage(currentTranslation) 가 없으면 KRV(1) fallback.
 * 모든 deep link URL 은 이 값을 사용하여 사용자의 번역본 선택을 일관되게 따른다.
 */
function getActiveTranslationId() {
    return TranslationStore.getCurrentTranslationId() ?? TRANSLATION_ID_KRV_FALLBACK;
}

/**
 * 잔여 토큰(장·절) 파싱 정규식.
 *
 * 인식 패턴:
 *   ""                — 책 단독
 *   " 2"              — 장 (chapter=2)
 *   " 2장"            — 장 + 한국어 suffix (chapter=2)
 *   " 2:16"           — 장+절
 *   " 2장16"          — 장+절 (장이 separator)
 *   " 2장16절"        — 장+절 + 절 suffix
 *   " 2:16절"         — 장+절 + 절 suffix
 *
 * `장?` 는 chapter 뒤의 한국어 suffix 와 verse separator 의 `[:장]` 가
 * 동일 문자를 공유하므로 정규식 백트래킹에 위임 (e.g. "2장16" 에서는
 * suffix `장?` 가 양보하고 verse separator `[:장]` 가 매칭).
 */
const RESIDUAL_REGEX = /^\s*(\d+)?\s*장?\s*(?:[:장]\s*(\d+))?(?:절)?\s*$/;

/** 절 sanity range — 성경 최장 시편 119편이 176절. 여유 두고 200. */
const VERSE_SANITY_MAX = 200;

/**
 * 입력을 파싱하여 결과 객체 또는 null 반환.
 *
 * @param {string} rawInput 사용자 원본 입력
 * @returns {{ kind: "book"|"chapter"|"verse", book: object, chapter?: number, verse?: number, url: string, label: string } | null}
 */
export function parseBibleReference(rawInput) {
    if (!rawInput || typeof rawInput !== "string") return null;

    // 1. 정규화: 트림 + 다중 공백 축소 + NFC + 소문자화
    const normalized = rawInput
        .normalize("NFC")
        .trim()
        .replace(/\s+/g, " ");
    if (normalized.length === 0) return null;
    const inputLower = normalized.toLowerCase();

    // 2. 책 prefix 매칭 (longest-first)
    const match = matchBookPrefix(inputLower);
    if (!match) return null;
    const { book, matchedLength } = match;

    // 3. 잔여 토큰 파싱
    const residual = normalized.slice(matchedLength);
    const residualMatch = residual.match(RESIDUAL_REGEX);
    if (!residualMatch) return null;

    const chapterRaw = residualMatch[1];
    const verseRaw = residualMatch[2];

    // 4-A. 책만 매칭된 경우 parser 는 결과를 만들지 않는다.
    //   책 단독 진입은 searchBibleBooks(=책 카드) 가 이미 동일 라벨·URL 로 제공하므로 중복 방지.
    //   parser 의 가치는 장·절이 명시된 deep link 에 있다 (4-C, 4-D).
    if (!chapterRaw) {
        return null;
    }

    const chapter = Number.parseInt(chapterRaw, 10);

    // 4-B. 장 번호 유효성
    if (!Number.isFinite(chapter) || chapter < 1 || chapter > book.chapters) {
        return null;
    }

    // 결과 URL 은 사용자가 현재 선택한 번역본 기준
    const translationId = getActiveTranslationId();

    // 4-C. 책+장 (절 없음)
    if (!verseRaw) {
        return {
            kind: "chapter",
            book,
            chapter,
            url: `/web/bible/verse?translationId=${translationId}&bookOrder=${book.bookOrder}&chapterNumber=${chapter}`,
            label: `${book.name} ${chapter}장 보기`,
        };
    }

    // 4-D. 책+장+절 — 절 sanity range 검사
    const verse = Number.parseInt(verseRaw, 10);
    if (!Number.isFinite(verse) || verse < 1 || verse > VERSE_SANITY_MAX) {
        // sanity 실패: 절 제거 후 책+장으로 처리
        return {
            kind: "chapter",
            book,
            chapter,
            url: `/web/bible/verse?translationId=${translationId}&bookOrder=${book.bookOrder}&chapterNumber=${chapter}`,
            label: `${book.name} ${chapter}장 보기`,
        };
    }

    return {
        kind: "verse",
        book,
        chapter,
        verse,
        url: `/web/bible/verse?translationId=${translationId}&bookOrder=${book.bookOrder}&chapterNumber=${chapter}&verseNumber=${verse}`,
        label: `${book.name} ${chapter}:${verse} 절로 이동`,
    };
}
