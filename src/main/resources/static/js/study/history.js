const UI_CLASSES = {
    HIDDEN: "d-none"
};

const DomHelper = {
    getElements: () => {
        const get = id => document.getElementById(id);
        return {
            backButton: get("topNavBackButton"),
            pageTitleLabel: get("pageTitleLabel"),
            scrollToTopBtn: get("scrollToTopBtn")
        };
    }
};

const App = {
    elements: null,
    init: () => {
        App.elements = DomHelper.getElements();
        App.initNav();
        App.initScrollToTop();
        App.scrollToSelectedEra();
    },

    initScrollToTop: () => {
        const {scrollToTopBtn} = App.elements;
        if (!scrollToTopBtn) {
            return;
        }
        scrollToTopBtn.addEventListener("click", () => {
            window.scrollTo({top: 0, behavior: "smooth"});
        });
        window.addEventListener("scroll", () => {
            scrollToTopBtn.classList.toggle("is-visible", window.scrollY >= 300);
        }, {passive: true});
    },

    scrollToSelectedEra: () => {
        const selected = document.querySelector(".history-row.is-selected");
        if (selected) {
            selected.scrollIntoView({block: "center"});
        }
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
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.location.href = "/web/study";
                }
            });
        }
    }
};

document.addEventListener("DOMContentLoaded", App.init);
