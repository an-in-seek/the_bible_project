import {setupDialogScrollLock} from "/js/common-util.js?v=2.3";

/**
 * 네이티브 window.confirm 대체: 커스텀 <dialog> 기반 확인 모달.
 * 사용 전 페이지에 fragments/confirm-dialog.html (#confirmDialog) 가 포함되어 있어야 한다.
 *
 * @param {string} message 본문 메시지
 * @param {{title?: string, confirmText?: string, cancelText?: string, danger?: boolean}} [options]
 * @returns {Promise<boolean>} 확인 시 true, 취소/ESC/바깥클릭 시 false
 */
export function showConfirm(message, {title = "확인", confirmText = "확인", cancelText = "취소", danger = false} = {}) {
    const dialog = document.getElementById("confirmDialog");
    if (!dialog || typeof dialog.showModal !== "function") {
        return Promise.resolve(false);
    }

    setupDialogScrollLock(dialog);

    const titleEl = document.getElementById("confirmDialogTitle");
    const messageEl = document.getElementById("confirmDialogMessage");
    const confirmBtn = document.getElementById("confirmDialogConfirm");
    const cancelBtn = document.getElementById("confirmDialogCancel");

    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;
    if (confirmBtn) {
        confirmBtn.textContent = confirmText;
        confirmBtn.classList.toggle("btn-danger", danger);
        confirmBtn.classList.toggle("btn-primary", !danger);
    }
    if (cancelBtn) cancelBtn.textContent = cancelText;

    return new Promise(resolve => {
        let resolved = false;

        const finish = (value) => {
            if (resolved) return;
            resolved = true;
            cleanup();
            resolve(value);
        };

        const onConfirm = () => {
            dialog.close();
            finish(true);
        };

        const onCancel = (event) => {
            if (event) event.preventDefault();
            dialog.close();
            finish(false);
        };

        const onBackdropClick = (event) => {
            if (event.target === dialog) {
                dialog.close();
                finish(false);
            }
        };

        const cleanup = () => {
            confirmBtn?.removeEventListener("click", onConfirm);
            cancelBtn?.removeEventListener("click", onCancel);
            dialog.removeEventListener("cancel", onCancel);
            dialog.removeEventListener("click", onBackdropClick);
        };

        confirmBtn?.addEventListener("click", onConfirm);
        cancelBtn?.addEventListener("click", onCancel);
        dialog.addEventListener("cancel", onCancel); // ESC 키
        dialog.addEventListener("click", onBackdropClick);

        dialog.showModal();
        cancelBtn?.focus(); // 실수 확정 방지: 기본 포커스를 취소에
    });
}
