/**
 * 상단 네비게이션 URL 공유 버튼
 *
 * - 노출 제어는 서버(GlobalModelAttribute#showShareButton)가 하고, 이 모듈은 동작만 담당한다.
 * - Web Share API 를 우선 사용하고, 미지원 브라우저에서는 클립보드 복사로 대체한다.
 * - 공유 URL 은 canonical 링크(운영 도메인) + 현재 쿼리스트링으로 조립한다.
 *   화면 상태(검색어, 선택한 시대 등)가 쿼리에 담기므로 받는 사람이 같은 화면을 보게 된다.
 *
 * 설계 문서: docs/common/url-share.md
 */

const SITE_NAME_SUFFIX_PATTERN = /\s*[|｜]\s*ElSeeker\s*$/;
const TOAST_VISIBLE_MS = 2000;

let toastHideTimer = null;

// --- 공유 제목: 화면이 지정한 shareTitle > og:title > document.title ---
function buildShareTitle(button) {
    const explicitTitle = button.dataset.shareTitle?.trim();
    if (explicitTitle) {
        return explicitTitle;
    }
    const ogTitle = document.querySelector('meta[property="og:title"]')?.content?.trim();
    const rawTitle = ogTitle || document.title || "";
    return rawTitle.replace(SITE_NAME_SUFFIX_PATTERN, "").trim() || "ElSeeker";
}

// --- 공유 URL: canonical 의 origin/path + 현재 쿼리스트링 ---
function buildShareUrl() {
    const canonicalHref = document.querySelector('link[rel="canonical"]')?.href;
    if (!canonicalHref) {
        return window.location.href;
    }
    try {
        const shareUrl = new URL(canonicalHref);
        shareUrl.search = window.location.search;
        return shareUrl.toString();
    } catch (error) {
        return window.location.href;
    }
}

// aria-live 영역은 내용이 바뀌기 전부터 DOM 에 있어야 스크린리더가 변경을 읽는다.
// 그래서 빈 채로 초기화 시점에 미리 붙여 둔다 (initTopNavShare 참고).
function createShareToast() {
    const toast = document.createElement("div");
    toast.id = "shareToast";
    toast.className = "share-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
    return toast;
}

function showShareToast(message, isError = false) {
    const toast = document.getElementById("shareToast") ?? createShareToast();

    toast.textContent = message;
    toast.classList.toggle("is-error", isError);
    // 방금 만든 요소는 초기 스타일이 확정되기 전에 클래스를 붙이면 transition 이 재생되지 않는다.
    void toast.offsetWidth;
    toast.classList.add("is-visible");
    // 토스트가 떠 있는 동안 다시 눌러도 표시 시간이 갱신되도록 타이머를 재설정한다.
    window.clearTimeout(toastHideTimer);
    toastHideTimer = window.setTimeout(() => toast.classList.remove("is-visible"), TOAST_VISIBLE_MS);
}

function copyByExecCommand(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "readonly");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    try {
        textarea.select();
        return document.execCommand("copy");
    } catch (error) {
        return false;
    } finally {
        // select()/execCommand 가 던져도 임시 textarea 가 DOM 에 남지 않도록 한다.
        textarea.remove();
    }
}

async function copyToClipboard(text) {
    try {
        // navigator.clipboard 는 보안 컨텍스트에서만 존재한다. 없으면 바로 execCommand 로 간다.
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch (error) {
        // 권한 거부·비보안 컨텍스트 — 아래 execCommand 로 대체
    }
    return copyByExecCommand(text);
}

async function shareCurrentPage(button) {
    const title = buildShareTitle(button);
    const url = buildShareUrl();

    if (navigator.share) {
        try {
            await navigator.share({title, url});
            return;
        } catch (error) {
            // 사용자가 공유 시트를 닫은 경우(AbortError)는 복사로 대체하지 않는다.
            if (error?.name === "AbortError") {
                return;
            }
        }
    }

    const copied = await copyToClipboard(url);
    showShareToast(copied ? "링크가 복사되었습니다." : "링크 복사에 실패했습니다.", !copied);
}

function initTopNavShare() {
    const button = document.getElementById("topNavShareButton");
    if (!button) {
        return;
    }

    // 첫 안내가 스크린리더에 읽히도록 aria-live 영역을 미리 만들어 둔다.
    createShareToast();

    // 공유 시트가 떠 있는 동안의 연타 방지.
    // button.disabled 를 쓰면 포커스가 body 로 날아가 키보드 사용자가 위치를 잃으므로 플래그로 막는다.
    let sharing = false;
    button.addEventListener("click", async () => {
        if (sharing) {
            return;
        }
        sharing = true;
        try {
            await shareCurrentPage(button);
        } finally {
            sharing = false;
        }
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTopNavShare);
} else {
    initTopNavShare();
}
