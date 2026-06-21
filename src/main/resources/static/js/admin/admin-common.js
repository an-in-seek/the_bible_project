import {fetchWithAuthRetry} from "/js/common-util.js";
import {showConfirm} from "/js/confirm-dialog.js?v=1.0";

export const fetchAdmin = async (url, options = {}) => {
    const defaults = {
        headers: {"Content-Type": "application/json"},
    };
    const merged = {...defaults, ...options, headers: {...defaults.headers, ...options.headers}};
    const response = await fetchWithAuthRetry(url, merged);
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || `요청 실패 (${response.status})`);
    }
    if (response.status === 204) return null;
    const text = await response.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch (error) {
        return null;
    }
};

export const confirmDelete = (name) => showConfirm(`"${name}" 항목을 삭제하시겠습니까?`, {title:"삭제", confirmText:"삭제", danger:true});

export const handleDelete = async (url, displayName, onSuccess) => {
    if (!await confirmDelete(displayName)) return;
    try {
        await fetchAdmin(url, {method: "DELETE"});
        if (onSuccess) onSuccess();
        else location.reload();
    } catch (e) {
        alert(e.message);
    }
};

export const initAdminSidebarToggle = () => {
    const toggleButtons = document.querySelectorAll("[data-admin-sidebar-toggle]");
    const closeTargets = document.querySelectorAll("[data-admin-sidebar-close]");
    const closeSidebar = () => document.body.classList.remove("admin-sidebar-open");
    const toggleSidebar = () => document.body.classList.toggle("admin-sidebar-open");

    toggleButtons.forEach((btn) => btn.addEventListener("click", toggleSidebar));
    closeTargets.forEach((target) => target.addEventListener("click", closeSidebar));
    window.addEventListener("resize", () => {
        if (window.innerWidth > 992) closeSidebar();
    });

    initAdminSidebarGroups();
};

export const initAdminSidebarGroups = () => {
    const groups = document.querySelectorAll(".admin-sidebar-group[data-sidebar-group]");
    if (!groups.length) return;
    const STORAGE_KEY = "admin-sidebar-groups";
    const readState = () => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
        } catch {
            return {};
        }
    };
    const writeState = (state) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch { /* ignore */ }
    };

    const stored = readState();

    groups.forEach((group) => {
        const key = group.dataset.sidebarGroup;
        const toggle = group.querySelector(".admin-sidebar-group-toggle");
        if (!toggle) return;

        const isActive = group.classList.contains("is-active");
        const storedOpen = Object.prototype.hasOwnProperty.call(stored, key) ? stored[key] : null;
        const shouldOpen = isActive || storedOpen === true;

        group.classList.toggle("is-open", shouldOpen);
        toggle.setAttribute("aria-expanded", shouldOpen ? "true" : "false");

        toggle.addEventListener("click", () => {
            const open = !group.classList.contains("is-open");
            group.classList.toggle("is-open", open);
            toggle.setAttribute("aria-expanded", open ? "true" : "false");
            const next = readState();
            next[key] = open;
            writeState(next);
        });
    });
};
