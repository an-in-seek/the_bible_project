import {TranslationStore} from "/js/storage-util.js?v=2.3";

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
    init: () => {
        App.elements = DomHelper.getElements();
        App.initNav();
        App.loadReferences();
    },

    initNav: () => {
        const {backButton} = App.elements;
        if (backButton) {
            backButton.classList.remove(UI_CLASSES.HIDDEN);
            backButton.addEventListener("click", () => {
                const backLink = document.body.dataset.backLink || "/web/study";
                window.location.href = backLink;
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
        if (!translationId) return ROUTES.TRANSLATION_LIST;
        return `${ROUTES.VERSE}?translationId=${translationId}&bookOrder=${ref.bookOrder}&chapterNumber=${ref.chapterNumber}&verseNumber=${ref.verseNumber}&from=dictionary`;
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
