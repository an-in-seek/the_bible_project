import { fetchWithAuthRetry } from "/js/common-util.js";
import { buildLoginRedirectUrl, checkAuthStatus } from "/js/auth/auth-check.js";
import { keepFieldVisible, observeSoftKeyboard } from "/js/mobile-keyboard.js?v=2.1";

const API_POSTS = "/api/v1/community/posts";

const App = {
    state: {
        submitting: false,
        editPostId: null,
    },

    init() {
        App.state.editPostId = App.getEditPostId();
        App.setPageTitle();
        App.bindBackButton();
        App.bindForm();
        App.bindCancel();
        App.bindKeyboardHandling();

        if (App.state.editPostId) {
            App.loadPostForEdit(App.state.editPostId);
        }
    },

    /**
     * 화면 키보드가 본문 입력칸과 등록 버튼을 가리지 않게 한다.
     *
     * 실제 배치는 CSS 가 한다(`community-write.css` 의 화면 키보드 대응 블록).
     * 여기서는 그 CSS 가 쓸 값을 심고, 패널 모드가 아닌 화면에서만 입력칸이 보이는
     * 영역 밖으로 밀려나지 않게 지킨다.
     */
    bindKeyboardHandling() {
        observeSoftKeyboard();

        const layout = document.querySelector(".write-layout");
        const actions = document.querySelector(".form-actions");
        // 패널 모드에서는 폼이 이미 보이는 띠 안에 있다. 거기서 문서를 스크롤하면
        // 고정된 패널은 그대로인 채 뒤 문서만 움직여 아무 소용이 없다.
        const isPanelMode = () =>
            !!layout && window.getComputedStyle(layout).position === "fixed";
        // 액션 바는 좁은 화면에서만 고정이다. 흐름에 있을 때는 아무것도 덮지 않으므로 0.
        const reservedBottom = () =>
            actions && window.getComputedStyle(actions).position === "fixed"
                ? actions.offsetHeight
                : 0;

        ["postTitle", "postContent"].forEach((id) => {
            const field = document.getElementById(id);
            if (field) {
                keepFieldVisible(field, { reservedBottom, enabled: () => !isPanelMode() });
            }
        });
    },

    getEditPostId() {
        const params = new URLSearchParams(window.location.search);
        const raw = params.get("postId");
        if (!raw) return null;
        const parsed = Number(raw);
        return Number.isNaN(parsed) ? null : parsed;
    },

    isEditMode() {
        return App.state.editPostId !== null;
    },

    bindBackButton() {
        const backButton = document.getElementById("topNavBackButton");
        if (backButton) {
            backButton.classList.remove("d-none");
            backButton.addEventListener("click", () => {
                const backLink = document.body.dataset.backLink || "/web/community";
                window.location.href = backLink;
            });
        }
    },

    setPageTitle() {
        const pageTitleLabel = document.getElementById("pageTitleLabel");
        if (pageTitleLabel) {
            pageTitleLabel.textContent = App.isEditMode() ? "글 수정" : "글쓰기";
            pageTitleLabel.classList.remove("d-none");
        }

        const submitBtn = document.getElementById("btnSubmit");
        if (submitBtn && App.isEditMode()) {
            submitBtn.textContent = "수정하기";
        }
    },

    async loadPostForEdit(postId) {
        try {
            const response = await fetchWithAuthRetry(`${API_POSTS}/${postId}`, {
                credentials: "include",
                headers: { Accept: "application/json" },
            });

            if (response.status === 401) {
                alert("로그인이 필요합니다.");
                window.location.href = buildLoginRedirectUrl("/web/community");
                return;
            }

            if (!response.ok) {
                throw new Error("게시글을 불러오지 못했습니다.");
            }

            const post = await response.json();
            App.fillForm(post);
        } catch (error) {
            alert(error.message || "게시글을 불러오지 못했습니다.");
            window.location.href = "/web/community";
        }
    },

    fillForm(post) {
        const typeSelect = document.getElementById("postType");
        const titleInput = document.getElementById("postTitle");
        const contentInput = document.getElementById("postContent");
        const titleCount = document.getElementById("titleCount");

        if (typeSelect) {
            typeSelect.value = post.type || "";
            typeSelect.disabled = true;
        }
        if (titleInput) {
            titleInput.value = post.title || "";
            if (titleCount) {
                titleCount.textContent = `${titleInput.value.length} / 200`;
            }
        }
        if (contentInput) {
            contentInput.value = post.content || "";
        }
    },

    bindForm() {
        const form = document.getElementById("writeForm");
        if (!form) return;

        form.addEventListener("submit", (e) => {
            e.preventDefault();
            App.handleSubmit();
        });
    },

    bindCancel() {
        const btn = document.getElementById("btnCancel");
        if (!btn) return;

        btn.addEventListener("click", () => {
            if (App.isEditMode()) {
                window.location.href = `/web/community/${App.state.editPostId}`;
            } else {
                window.location.href = "/web/community";
            }
        });
    },

    validate() {
        let valid = true;

        const type = document.getElementById("postType");
        const typeError = document.getElementById("postTypeError");
        if (!type.value) {
            type.classList.add("is-invalid");
            typeError.textContent = "카테고리를 선택하세요.";
            valid = false;
        } else {
            type.classList.remove("is-invalid");
            typeError.textContent = "";
        }

        const title = document.getElementById("postTitle");
        const titleError = document.getElementById("postTitleError");
        if (!title.value.trim()) {
            title.classList.add("is-invalid");
            titleError.textContent = "제목을 입력하세요.";
            valid = false;
        } else if (title.value.trim().length > 200) {
            title.classList.add("is-invalid");
            titleError.textContent = "제목은 200자 이내로 입력해 주세요.";
            valid = false;
        } else {
            title.classList.remove("is-invalid");
            titleError.textContent = "";
        }

        const content = document.getElementById("postContent");
        const contentError = document.getElementById("postContentError");
        if (!content.value.trim()) {
            content.classList.add("is-invalid");
            contentError.textContent = "내용을 입력하세요.";
            valid = false;
        } else {
            content.classList.remove("is-invalid");
            contentError.textContent = "";
        }

        return valid;
    },

    async handleSubmit() {
        if (App.state.submitting) return;
        if (!App.validate()) return;
        const allowedNickname = await App.ensureNickname();
        if (!allowedNickname) return;

        const submitBtn = document.getElementById("btnSubmit");
        App.state.submitting = true;
        submitBtn.disabled = true;
        submitBtn.textContent = App.isEditMode() ? "수정 중..." : "등록 중...";

        const title = document.getElementById("postTitle").value.trim();
        const content = document.getElementById("postContent").value.trim();

        try {
            let response;

            if (App.isEditMode()) {
                response = await fetchWithAuthRetry(`${API_POSTS}/${App.state.editPostId}`, {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({ title, content }),
                });
            } else {
                response = await fetchWithAuthRetry(API_POSTS, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        type: document.getElementById("postType").value,
                        language: "ko",
                        country: "KR",
                        title,
                        content,
                    }),
                });
            }

            if (response.status === 401) {
                alert("로그인이 필요합니다.");
                window.location.href = buildLoginRedirectUrl("/web/community");
                return;
            }

            if (!response.ok) {
                const error = await response.json().catch(() => null);
                const action = App.isEditMode() ? "수정" : "등록";
                throw new Error(error?.message || `게시글 ${action}에 실패했습니다.`);
            }

            await response.json().catch(() => null);
            window.location.href = "/web/community";
        } catch (error) {
            alert(error.message || "요청에 실패했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            App.state.submitting = false;
            submitBtn.disabled = false;
            submitBtn.textContent = App.isEditMode() ? "수정하기" : "등록하기";
        }
    },

    async ensureNickname() {
        const authResult = await new Promise((resolve) => {
            checkAuthStatus({
                onAuthenticated: (data) => resolve({ allowed: true, data }),
                onUnauthenticated: () => resolve({ allowed: false }),
                onError: () => resolve({ allowed: false }),
            });
        });

        if (!authResult.allowed) {
            alert("로그인이 필요합니다.");
            window.location.href = buildLoginRedirectUrl("/web/community/write");
            return false;
        }

        const nickname = (authResult.data?.nickname || "").trim();
        if (!nickname) {
            alert("닉네임을 먼저 입력해 주세요.");
            const returnUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
            const params = new URLSearchParams({focus: "nickname", returnUrl});
            window.location.href = `/web/member/mypage?${params.toString()}`;
            return false;
        }

        return true;
    },
};

document.addEventListener("DOMContentLoaded", App.init);
