const UI_CLASSES = {
    HIDDEN: "d-none"
};

const DomHelper = {
    getElements: () => {
        const get = id => document.getElementById(id);
        return {
            backButton: get("topNavBackButton"),
            pageTitleLabel: get("pageTitleLabel")
        };
    }
};

const App = {
    elements: null,
    init: () => {
        App.elements = DomHelper.getElements();
        App.initNav();
    },

    initNav: () => {
        const {backButton, pageTitleLabel} = App.elements;
        if (pageTitleLabel) {
            pageTitleLabel.textContent = "성경 역사";
            pageTitleLabel.classList.remove(UI_CLASSES.HIDDEN);
        }
        if (backButton) {
            backButton.classList.remove(UI_CLASSES.HIDDEN);
            backButton.addEventListener("click", () => {
                const eraSlug = window.location.pathname.split("/").filter(Boolean).pop();
                const targetUrl = new URL("/web/study/history", window.location.origin);
                if (eraSlug && eraSlug !== "history") {
                    targetUrl.searchParams.set("selectedEra", eraSlug);
                }
                window.location.href = `${targetUrl.pathname}${targetUrl.search}`;
            });
        }
    }
};

document.addEventListener("DOMContentLoaded", App.init);
