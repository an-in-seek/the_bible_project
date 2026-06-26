import {ThemeStore} from "/js/storage-util.js?v=2.7";

const MENU_TOGGLE_ID = "topNavThemeMenuToggle";
const SUBMENU_ID = "topNavThemeSubmenu";
const ACCOUNT_MENU_ID = "topNavAccountMenu";
const ACCOUNT_BUTTON_ID = "topNavAccountButton";
const SUBMENU_OPEN_CLASS = "is-open";

const ICONS = {
    light: "☀️",
    dark: "🌙",
    system: "🖥️"
};

const LABELS = {
    light: "라이트 모드",
    dark: "다크 모드",
    system: "시스템 따름"
};

function getSystemTheme() {
    try {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch (e) {
        return "light";
    }
}

function applyTheme(theme) {
    const html = document.documentElement;
    html.setAttribute("data-theme", theme);
    html.setAttribute("data-bs-theme", theme);
}

function getCurrentSelection() {
    const stored = ThemeStore.get();
    return (stored === "light" || stored === "dark") ? stored : "system";
}

function refreshUi() {
    const selection = getCurrentSelection();

    // 라디오 항목들의 체크 상태 동기화
    document.querySelectorAll(".top-nav-theme-item").forEach((btn) => {
        const value = btn.dataset.themeValue;
        const checked = value === selection;
        btn.setAttribute("aria-checked", checked ? "true" : "false");
        btn.classList.toggle("is-checked", checked);
    });

    // "시스템 따름" 의 보조 텍스트 (현재 적용 모드)
    const systemCurrent = document.querySelector(".top-nav-theme-system-current");
    if (systemCurrent) {
        systemCurrent.textContent = selection === "system"
            ? `(현재 ${getSystemTheme() === "dark" ? "다크" : "라이트"})`
            : "";
    }

    // 메뉴 항목 우측 인디케이터 (현재 선택 표시)
    const menuCurrent = document.querySelector(".top-nav-theme-menu-current");
    if (menuCurrent) {
        menuCurrent.textContent = ICONS[selection];
        menuCurrent.setAttribute("aria-label", LABELS[selection]);
    }
}

function setSelection(value) {
    if (value === "system") {
        ThemeStore.clear();
        applyTheme(getSystemTheme());
    } else if (value === "light" || value === "dark") {
        ThemeStore.set(value);
        applyTheme(value);
    }
    refreshUi();
}

function setSubmenuOpen(open) {
    const toggle = document.getElementById(MENU_TOGGLE_ID);
    const submenu = document.getElementById(SUBMENU_ID);
    if (!toggle || !submenu) return;
    submenu.classList.toggle(SUBMENU_OPEN_CLASS, open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    submenu.setAttribute("aria-hidden", open ? "false" : "true");
}

function isSubmenuOpen() {
    const submenu = document.getElementById(SUBMENU_ID);
    return Boolean(submenu && submenu.classList.contains(SUBMENU_OPEN_CLASS));
}

function closeAccountMenu() {
    const menu = document.getElementById(ACCOUNT_MENU_ID);
    const button = document.getElementById(ACCOUNT_BUTTON_ID);
    if (menu) menu.classList.remove("is-open");
    if (button) button.setAttribute("aria-expanded", "false");
    const topNav = document.querySelector(".top-nav");
    if (topNav) topNav.classList.remove("top-nav--menu-open");
    document.body.classList.remove("top-nav-account-menu-open");
    setSubmenuOpen(false);
    if (button) button.focus();
}

function setupMenuToggleHandler() {
    const toggle = document.getElementById(MENU_TOGGLE_ID);
    if (!toggle) return;
    toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        setSubmenuOpen(!isSubmenuOpen());
    });
}

function setupRadioHandlers() {
    document.querySelectorAll(".top-nav-theme-item").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            setSelection(btn.dataset.themeValue);
            closeAccountMenu();
        });
    });
}

function setupAccountMenuObserver() {
    // 계정 메뉴가 닫힐 때 서브메뉴도 함께 접기
    const menu = document.getElementById(ACCOUNT_MENU_ID);
    if (!menu) return;
    const observer = new MutationObserver(() => {
        if (!menu.classList.contains("is-open")) {
            setSubmenuOpen(false);
        }
    });
    observer.observe(menu, {attributes: true, attributeFilter: ["class"]});
}

function setupMatchMediaListener() {
    try {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        mq.addEventListener("change", (e) => {
            // 명시 선택 상태에서는 OS 변경 무시
            if (ThemeStore.get() !== null) return;
            applyTheme(e.matches ? "dark" : "light");
            refreshUi();
        });
    } catch (e) {
        // matchMedia 미지원
    }
}

function releaseInitialTransitionLock() {
    const html = document.documentElement;
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            html.classList.remove("theme-transitions-disabled");
        });
    });
}

function init() {
    setupMenuToggleHandler();
    setupRadioHandlers();
    setupAccountMenuObserver();
    setupMatchMediaListener();
    refreshUi();
    releaseInitialTransitionLock();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {once: true});
} else {
    init();
}
