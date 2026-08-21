import {buildLoginRedirectUrl, checkAuthStatus} from "/js/auth/auth-check.js";
import {fetchWithAuthRetry, setupDialogScrollLock} from "/js/common-util.js?v=2.4";

const roleLabels = {
    ADMIN: "관리자",
    USER: "회원",
};

const providerLabels = {
    google: "Google",
    naver: "Naver",
    kakao: "Kakao",
};

const updateText = (element, value) => {
    if (!element) {
        return;
    }
    element.textContent = value;
};

document.addEventListener("DOMContentLoaded", () => {
    const pageTitleLabel = document.getElementById("pageTitleLabel");
    if (pageTitleLabel) {
        pageTitleLabel.textContent = "마이페이지";
        pageTitleLabel.classList.remove("d-none");
    }

    const backButton = document.getElementById("topNavBackButton");
    if (backButton) {
        backButton.classList.remove("d-none");
        backButton.addEventListener("click", () => history.back());
    }

    // Top nav auto-hide on scroll
    const title = document.getElementById("mypageTitle");
    const email = document.getElementById("mypageEmail");
    const oauthAccountsList = document.getElementById("mypageOAuthAccountsList");
    const roleBadge = document.getElementById("mypageRole");
    const providerBadge = document.getElementById("mypageProvider");
    const joinDateBadge = document.getElementById("mypageJoinDate");
    const avatar = document.getElementById("mypageAvatar");
    const editForm = document.getElementById("mypageEditForm");
    const nicknameInput = document.getElementById("mypageNicknameInput");
    const nicknameCount = document.getElementById("mypageNicknameCount");
    const saveButton = document.getElementById("mypageSaveButton");
    const saveToast = document.getElementById("mypageToast");
    const saveToastIcon = document.getElementById("mypageToastIcon");
    const saveToastBody = document.getElementById("mypageToastMessage");
    const saveToastClose = document.getElementById("mypageToastClose");
    const oauthActionButtons = document.querySelectorAll(".mypage-oauth-action");
    const confirmModal = document.getElementById("mypageOAuthConfirmModal");
    const confirmCancel = document.getElementById("mypageOAuthConfirmCancel");
    const confirmSubmit = document.getElementById("mypageOAuthConfirmSubmit");
    const confirmMessage = document.getElementById("mypageOAuthConfirmMessage");
    const mypageSkeleton = document.getElementById("mypageSkeleton");
    const mypageProfile = document.getElementById("mypageProfile");
    const urlParams = new URLSearchParams(window.location.search);
    const focusNickname = urlParams.get("focus") === "nickname";
    const returnUrl = urlParams.get("returnUrl");
    const safeReturnUrl =
        returnUrl && returnUrl.startsWith("/") && !returnUrl.startsWith("//") ? returnUrl : null;

    let memberUid = null;
    let memberEmail = "";
    let initialNickname = "";
    let pendingOAuthUnlink = null;
    let saveToastTimer = null;

    const redirectToLogin = () => {
        window.location.replace(buildLoginRedirectUrl());
    };

    const showProfile = () => {
        mypageSkeleton?.classList.add("d-none");
        mypageProfile?.classList.remove("d-none");
    };

    const showOAuthErrorFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        const errorCode = params.get("oauthError");
        if (!errorCode) {
            return;
        }
        const messages = {
            OAUTH_ACCOUNT_ALREADY_LINKED: "이미 다른 계정에 연결된 소셜 계정입니다. 다른 계정으로 시도해 주세요.",
            OAUTH_EMAIL_MISSING: "소셜 계정 이메일 정보를 가져오지 못했습니다.",
            OAUTH_PROVIDER_USER_ID_MISSING: "소셜 계정 식별 정보를 가져오지 못했습니다.",
            OAUTH_LINK_REQUIRED: "연동 전용 요청입니다. 마이페이지의 연동하기 버튼으로 다시 시도해 주세요.",
            UNKNOWN: "소셜 계정 연동에 실패했습니다. 다시 시도해 주세요.",
        };
        showSaveToast(messages[errorCode] || messages.UNKNOWN, "error");
        params.delete("oauthError");
        const newQuery = params.toString();
        const newUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ""}${window.location.hash}`;
        window.history.replaceState({}, "", newUrl);
    };

    const setFormEnabled = (enabled) => {
        if (!nicknameInput || !saveButton) {
            return;
        }
        nicknameInput.disabled = !enabled;
        saveButton.disabled = !enabled;
    };

    const hideSaveToast = () => {
        if (!saveToast) {
            return;
        }
        saveToast.classList.remove("show");
        saveToast.setAttribute("aria-hidden", "true");
        if (saveToastTimer) {
            clearTimeout(saveToastTimer);
            saveToastTimer = null;
        }
    };

    const setToastVariant = (variant) => {
        if (!saveToast || !saveToastIcon) {
            return;
        }
        saveToast.classList.remove("is-error", "is-info", "is-success");
        saveToastIcon.classList.remove("success", "error", "info");
        switch (variant) {
            case "error":
                saveToast.classList.add("is-error");
                saveToastIcon.classList.add("error");
                break;
            case "info":
                saveToast.classList.add("is-info");
                saveToastIcon.classList.add("info");
                break;
            default:
                saveToast.classList.add("is-success");
                saveToastIcon.classList.add("success");
                break;
        }
    };

    const showSaveToast = (message, variant = "success") => {
        if (!saveToast) {
            return;
        }
        setToastVariant(variant);
        if (saveToastBody) {
            saveToastBody.textContent = message;
        }
        saveToast.classList.add("show");
        saveToast.removeAttribute("aria-hidden");
        if (saveToastTimer) {
            clearTimeout(saveToastTimer);
        }
        saveToastTimer = setTimeout(() => {
            hideSaveToast();
        }, 4000);
    };

    const formatConnectedAt = (value) => {
        if (!value) {
            return "연동됨";
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return "연동됨";
        }
        return date.toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    };

    const maskEmail = (value) => {
        if (!value) {
            return "이메일 없음";
        }
        const [local, domain] = value.split("@");
        if (!domain) {
            return "이메일 없음";
        }
        if (local.length <= 2) {
            return `${local.charAt(0)}***@${domain}`;
        }
        return `${local.slice(0, 2)}***@${domain}`;
    };

    const renderOAuthAccounts = (accounts) => {
        if (!oauthAccountsList) {
            return;
        }
        const providerMap = new Map();
        if (Array.isArray(accounts)) {
            accounts.forEach((account) => {
                const providerKey = (account.provider || "").toLowerCase();
                if (providerKey) {
                    providerMap.set(providerKey, account);
                }
            });
        }
        updateOAuthCards(providerMap);
        updateText(providerBadge, `연동 계정 ${providerMap.size}개`);
    };

    let modalTriggerElement = null;

    // Native <dialog>는 focus trap / ESC / inert를 자체 제공.
    const openConfirmModal = (providerLabel) => {
        if (!confirmModal) {
            return;
        }
        modalTriggerElement = document.activeElement;
        if (confirmMessage) {
            confirmMessage.textContent = `${providerLabel} 계정을 연동 해제하시겠습니까?`;
        }
        confirmModal.showModal();
        if (confirmSubmit) {
            confirmSubmit.focus();
        }
    };

    const closeConfirmModal = () => {
        if (!confirmModal) {
            return;
        }
        confirmModal.close();
        const triggerToRestore = modalTriggerElement;
        pendingOAuthUnlink = null;
        modalTriggerElement = null;
        if (triggerToRestore && typeof triggerToRestore.focus === "function") {
            triggerToRestore.focus();
        }
    };

    const updateOAuthCards = (providerMap) => {
        if (!oauthAccountsList) {
            return;
        }
        const returnUrl = `${window.location.pathname}${window.location.search}`;
        const cards = oauthAccountsList.querySelectorAll(".mypage-oauth-card");
        cards.forEach((card) => {
            const provider = card.dataset.provider;
            const providerLabel = providerLabels[provider] || provider;
            const status = card.querySelector(".mypage-oauth-status, .mypage-oauth-status-badge");
            const emailField = card.querySelector(".mypage-oauth-email");
            const nicknameField = card.querySelector(".mypage-oauth-nickname");
            const connectedField = card.querySelector(".mypage-oauth-connected");
            const actionButton = card.querySelector(".mypage-oauth-action");
            const notice = card.querySelector(".mypage-oauth-notice");
            const emptyMessage = card.querySelector(".mypage-oauth-empty-message");

            const linkedAccount = providerMap.get(provider);

            card.setAttribute("aria-label",
                linkedAccount
                    ? `${providerLabel} 계정 연동됨`
                    : `${providerLabel} 계정 미연동`
            );

            if (linkedAccount) {
                card.classList.remove("is-empty");
                if (emptyMessage) {
                    emptyMessage.classList.add("d-none");
                }
                if (status) {
                    status.className = "mypage-oauth-status-badge is-linked";
                    status.textContent = "연동됨";
                }
                updateText(emailField, maskEmail(linkedAccount.email));
                updateText(nicknameField, linkedAccount.nickname || "닉네임 없음");
                updateText(connectedField, formatConnectedAt(linkedAccount.createdAt));
                if (actionButton) {
                    actionButton.textContent = `${providerLabel} 연동 해제`;
                    actionButton.classList.remove("btn-outline-secondary");
                    actionButton.classList.add("btn-outline-danger");
                    actionButton.dataset.action = "unlink";
                    actionButton.dataset.providerUserId = linkedAccount.providerUserId;
                    actionButton.setAttribute("href", "#");
                    actionButton.removeAttribute("aria-disabled");
                    actionButton.classList.remove("disabled");
                }
                const isPrimary = memberEmail
                    && linkedAccount.email
                    && memberEmail.toLowerCase() === linkedAccount.email.toLowerCase();
                if (isPrimary) {
                    if (notice) {
                        notice.textContent = "최초 가입 계정은 해제할 수 없습니다. 해제하려면 회원 탈퇴를 진행해 주세요.";
                        notice.classList.remove("d-none");
                    }
                    if (actionButton) {
                        actionButton.classList.add("disabled");
                        actionButton.classList.add("mypage-oauth-action-disabled");
                        actionButton.setAttribute("aria-disabled", "true");
                        actionButton.dataset.action = "disabled";
                    }
                } else if (notice) {
                    notice.textContent = "";
                    notice.classList.add("d-none");
                    if (actionButton) {
                        actionButton.classList.remove("mypage-oauth-action-disabled");
                    }
                }
            } else {
                card.classList.add("is-empty");
                if (status) {
                    status.className = "mypage-oauth-status-badge is-unlinked";
                    status.textContent = "미연동";
                }
                updateText(emailField, "-");
                updateText(nicknameField, "-");
                updateText(connectedField, "-");
                if (emptyMessage) {
                    emptyMessage.classList.remove("d-none");
                }
                if (notice) {
                    notice.textContent = "";
                    notice.classList.add("d-none");
                }
                if (actionButton) {
                    actionButton.textContent = `${providerLabel} 연동하기`;
                    actionButton.classList.add("btn-outline-secondary");
                    actionButton.classList.remove("btn-outline-danger");
                    actionButton.classList.remove("mypage-oauth-action-disabled");
                    actionButton.dataset.action = "link";
                    actionButton.dataset.providerUserId = "";
                    actionButton.setAttribute(
                        "href",
                        `/oauth2/authorization/${provider}?returnUrl=${encodeURIComponent(returnUrl)}&link=true`
                    );
                    actionButton.removeAttribute("aria-disabled");
                    actionButton.classList.remove("disabled");
                }
            }
        });
    };

    const handleOAuthAction = async (event) => {
        const target = event.currentTarget;
        if (!target || target.dataset.action !== "unlink") {
            return;
        }
        event.preventDefault();
        hideSaveToast();
        if (!memberUid) {
            showSaveToast("회원 정보를 확인할 수 없습니다. 다시 로그인해 주세요.", "error");
            return;
        }
        const provider = target.dataset.provider;
        const providerUserId = target.dataset.providerUserId;
        if (!provider || !providerUserId) {
            showSaveToast("연동 정보를 확인할 수 없습니다.", "error");
            return;
        }
        const providerLabel = providerLabels[provider] || provider;
        pendingOAuthUnlink = {provider, providerUserId, button: target, providerLabel};
        openConfirmModal(providerLabel);
    };

    const confirmOAuthUnlink = async () => {
        if (!pendingOAuthUnlink) {
            closeConfirmModal();
            return;
        }
        const {provider, providerUserId, button} = pendingOAuthUnlink;
        button.setAttribute("aria-disabled", "true");
        button.classList.add("disabled");
        try {
            const response = await fetchWithAuthRetry(`/api/v1/members/${memberUid}/oauth-accounts?provider=${provider}&providerUserId=${providerUserId}`, {
                method: "DELETE",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                },
            });
            if (response.status === 401) {
                redirectToLogin();
                return;
            }
            if (!response.ok) {
                showSaveToast("연동 해제에 실패했습니다. 다시 시도해 주세요.", "error");
                return;
            }
            showSaveToast("연동 계정이 해제되었습니다.");
            loadOAuthAccounts();
        } catch (error) {
            showSaveToast("연동 해제 중 오류가 발생했습니다. 다시 시도해 주세요.", "error");
        } finally {
            button.classList.remove("disabled");
            button.removeAttribute("aria-disabled");
            closeConfirmModal();
        }
    };
    const loadOAuthAccounts = async () => {
        if (!memberUid) {
            return;
        }
        try {
            const response = await fetchWithAuthRetry(`/api/v1/members/${memberUid}/oauth-accounts`, {
                credentials: "include",
                headers: {
                    Accept: "application/json",
                },
            });
            if (response.status === 401) {
                redirectToLogin();
                return;
            }
            if (response.status === 403) {
                showSaveToast("연동 계정 정보를 불러올 수 없습니다.", "error");
                return;
            }
            if (!response.ok) {
                showSaveToast("연동 계정 정보를 불러오지 못했습니다. 다시 시도해 주세요.", "error");
                return;
            }
            const data = await response.json().catch(() => []);
            renderOAuthAccounts(Array.isArray(data) ? data : []);
        } catch (error) {
            showSaveToast("연동 계정 정보를 불러오지 못했습니다. 다시 시도해 주세요.", "error");
        }
    };

    setFormEnabled(false);

    if (nicknameInput) {
        nicknameInput.addEventListener("input", () => {
            const len = nicknameInput.value.trim().length;
            if (nicknameCount) {
                nicknameCount.textContent = len;
            }
            saveButton.disabled = (nicknameInput.value.trim() === initialNickname);
        });
    }

    if (oauthActionButtons && oauthActionButtons.length > 0) {
        oauthActionButtons.forEach((button) => {
            button.addEventListener("click", handleOAuthAction);
        });
    }
    if (confirmCancel) {
        confirmCancel.addEventListener("click", closeConfirmModal);
    }
    if (confirmSubmit) {
        confirmSubmit.addEventListener("click", confirmOAuthUnlink);
    }
    if (saveToastClose) {
        saveToastClose.addEventListener("click", hideSaveToast);
    }
    if (confirmModal) {
        setupDialogScrollLock(confirmModal);
        // backdrop click — native <dialog>에서는 e.target===dialog일 때
        confirmModal.addEventListener("click", (event) => {
            if (event.target === confirmModal) {
                closeConfirmModal();
            }
        });
        // ESC는 native dialog가 자동 처리하지만 부수 정리(state/focus 복원) 위해 close 이벤트 활용
        confirmModal.addEventListener("close", () => {
            const triggerToRestore = modalTriggerElement;
            pendingOAuthUnlink = null;
            modalTriggerElement = null;
            if (triggerToRestore && typeof triggerToRestore.focus === "function") {
                triggerToRestore.focus();
            }
        });
    }

    checkAuthStatus({
        onAuthenticated: (data) => {
            if (!data) {
                showSaveToast("회원 정보를 불러오지 못했습니다. 다시 시도해 주세요.", "error");
                return;
            }

            memberUid = data.memberUid || null;
            memberEmail = data.email || "";
            const nicknameValue = (data.nickname || "").trim();
            const displayName = nicknameValue || (memberEmail ? memberEmail.split("@")[0] : "회원");
            const roleLabel = roleLabels[data.role] || data.role || "회원";

            updateText(title, displayName);
            updateText(email, memberEmail || "이메일 정보 없음");
            updateText(roleBadge, roleLabel);
            updateText(providerBadge, "연동 계정 확인 중");

            if (data.createdAt) {
                const joinDate = new Date(data.createdAt);
                if (!Number.isNaN(joinDate.getTime())) {
                    const formatted = joinDate.toLocaleDateString("ko-KR", {
                        year: "numeric", month: "long"
                    });
                    updateText(joinDateBadge, `가입 ${formatted}`);
                }
            }

            if (avatar && data.profileImageUrl) {
                avatar.src = data.profileImageUrl;
                avatar.alt = `${displayName} 프로필 이미지`;
            }

            initialNickname = nicknameValue;
            if (nicknameInput) {
                nicknameInput.value = initialNickname;
            }
            if (nicknameCount) {
                nicknameCount.textContent = initialNickname.length;
            }
            setFormEnabled(true);
            saveButton.disabled = true;

            showProfile();

            if (focusNickname && nicknameInput) {
                nicknameInput.focus();
                nicknameInput.select();
                nicknameInput.scrollIntoView({behavior: "smooth", block: "center"});
            }
            loadOAuthAccounts();
        },
        onUnauthenticated: redirectToLogin,
        onError: () => showSaveToast("인증 정보를 확인할 수 없습니다. 다시 로그인해 주세요.", "error"),
    });

    showOAuthErrorFromUrl();

    if (editForm) {
        editForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            hideSaveToast();

            if (!memberUid) {
                showSaveToast("회원 정보를 확인할 수 없습니다. 다시 로그인해 주세요.", "error");
                return;
            }

            const nicknameValue = nicknameInput ? nicknameInput.value.trim() : "";

            if (!nicknameValue) {
                showSaveToast("닉네임을 입력해 주세요.", "error");
                return;
            }

            setFormEnabled(false);

            try {
                const response = await fetchWithAuthRetry(`/api/v1/members/${memberUid}`, {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        nickname: nicknameValue,
                    }),
                });

                if (response.status === 401) {
                    redirectToLogin();
                    return;
                }

                if (response.status === 403) {
                    showSaveToast("회원 정보에 접근할 수 없습니다.", "error");
                    return;
                }

                if (!response.ok) {
                    const error = await response.json().catch(() => null);
                    showSaveToast(error?.message || "회원 정보 수정에 실패했습니다. 다시 시도해 주세요.", "error");
                    return;
                }

                const data = await response.json().catch(() => null);
                const updatedNickname = (data?.nickname || nicknameValue).trim();
                const updatedEmail = data?.email || "";
                const updatedRole = roleLabels[data?.role] || data?.role || "회원";
                const displayName = updatedNickname || (updatedEmail ? updatedEmail.split("@")[0] : "회원");

                updateText(title, displayName);
                updateText(email, updatedEmail || "이메일 정보 없음");
                updateText(roleBadge, updatedRole);

                initialNickname = updatedNickname;
                if (nicknameCount) {
                    nicknameCount.textContent = updatedNickname.length;
                }

                showSaveToast("회원 정보가 저장되었습니다.");
                if (focusNickname && safeReturnUrl) {
                    setTimeout(() => {
                        window.location.href = safeReturnUrl;
                    }, 300);
                }
            } catch (error) {
                showSaveToast("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.", "error");
            } finally {
                setFormEnabled(true);
                saveButton.disabled = true;
            }
        });
    }

});
