import {TranslationStore} from "/js/storage-util.js?v=2.7";
import {bindFromBackButton} from "/js/nav-restore.js?v=1.1";

const UI_CLASSES = {
    HIDDEN: "d-none"
};

const ROUTES = {
    VERSE: "/web/bible/verse",
    TRANSLATION_LIST: "/web/bible/translation"
};

const DomHelper = {
    getElements: () => {
        const get = id => document.getElementById(id);
        return {
            backButton: get("topNavBackButton"),
            referencesContainer: get("referencesContainer"),
            referencesEmpty: get("referencesEmpty")
        };
    }
};

const App = {
    elements: null,
    // 표제어는 구절 화면으로 넘길 강조 대상이다. 화면에 보이는 <h1> 을 되읽지 않고
    // 서버가 body 에 실어 준 값을 쓴다 — 제목 마크업이 바뀌어도 조용히 비지 않는다.
    // 설계 문서: docs/bible/bible-verse-word-focus-design.md §3.4
    term: "",
    init: () => {
        App.elements = DomHelper.getElements();
        App.term = (document.body.dataset.dictionaryTerm ?? "").trim();
        App.initNav();
        App.loadReferences();
    },

    initNav: () => {
        const {backButton} = App.elements;
        if (backButton) {
            backButton.classList.remove(UI_CLASSES.HIDDEN);
            bindFromBackButton(backButton, {
                backOn: ["search"],
                fallback: () => { window.location.href = document.body.dataset.backLink || "/web/study"; },
            });
        }
    },

    loadReferences: async () => {
        const dictionaryId = document.body.dataset.dictionaryId;
        if (!dictionaryId) return;

        const {referencesContainer, referencesEmpty} = App.elements;
        if (!referencesContainer) return;

        try {
            const response = await fetch(`/api/v1/study/dictionaries/${dictionaryId}/references`);
            if (!response.ok) {
                App.showEmpty();
                return;
            }
            const refs = await response.json();
            if (!Array.isArray(refs) || refs.length === 0) {
                App.showEmpty();
                return;
            }
            App.renderReferences(refs);
        } catch {
            App.showEmpty();
        }
    },

    showEmpty: () => {
        const {referencesContainer, referencesEmpty} = App.elements;
        if (referencesContainer) referencesContainer.classList.add(UI_CLASSES.HIDDEN);
        if (referencesEmpty) referencesEmpty.classList.remove(UI_CLASSES.HIDDEN);
    },

    buildVerseUrl: (ref) => {
        const translationId = TranslationStore.getCurrentTranslationId();
        // word 는 verseNumber 에 종속된 파라미터다 (설계 문서 §3)
        const focusWord = App.term ? `&word=${encodeURIComponent(App.term)}` : "";
        const verseUrl = `${ROUTES.VERSE}?translationId=${translationId ?? ""}&bookOrder=${ref.bookOrder}`
            + `&chapterNumber=${ref.chapterNumber}&verseNumber=${ref.verseNumber}${focusWord}&from=dictionary`;
        if (!translationId) {
            // 번역본을 고르고 나면 이 절로 돌아온다. 절 정보를 버리면 사전부터 다시 눌러야 한다.
            // translation-list.js 가 고른 id 로 translationId 를 덮어쓰므로 여기서는 비워 둔다.
            TranslationStore.saveTranslationReturnPath(verseUrl);
            return ROUTES.TRANSLATION_LIST;
        }
        return verseUrl;
    },

    renderReferences: (refs) => {
        const {referencesContainer, referencesEmpty} = App.elements;
        if (referencesEmpty) referencesEmpty.classList.add(UI_CLASSES.HIDDEN);
        referencesContainer.classList.remove(UI_CLASSES.HIDDEN);
        referencesContainer.innerHTML = "";

        refs.forEach(ref => {
            const tag = document.createElement("a");
            tag.className = "related-verse-tag related-verse-link";
            tag.textContent = ref.verseLabel;
            tag.title = `${ref.verseLabel} 구절로 이동`;
            tag.href = App.buildVerseUrl(ref);
            referencesContainer.appendChild(tag);
        });
    }
};

document.addEventListener("DOMContentLoaded", App.init);
