import {fetchWithAuthRetry, formatNumberWithComma, setupDialogScrollLock} from "/js/common-util.js?v=2.3";
import {buildLoginRedirectUrl, checkAuthStatus} from "/js/auth/auth-check.js";

const API = {
    POSTS: "/api/v1/community/posts",
    POST_DETAIL: "/api/v1/community/posts",
    COMMENTS: "/api/v1/community/posts",
    TOP_POSTS: "/api/v1/community/posts/top",
};

const COMMENT_PAGE_SIZE = 20;
const NOTICE_PAGE_SIZE = 1;
const NOTICE_TYPE = "NOTICE";
const NOTICE_CATEGORY = "공지";
const POPULAR_CATEGORY = "인기";
const COMMUNITY_LIST_URL = "/web/community";

const TYPE_LABELS = {
    FREE: "자유",
    QUESTION: "Q&A",
    NOTICE: "공지",
    PRAY: "기도",
};

const UI_CLASSES = {
    HIDDEN: "d-none",
};

const App = {
    state: {
        postId: null,
        commentPage: 0,
        commentHasNext: true,
        commentLoading: false,
        commentInputAuthChecked: false,
        likeActive: false,
        likeLoading: false,
        reportedPost: false,
        reportedComments: new Set(),
        auth: {
            checked: false,
            allowed: false,
            checking: false,
            user: null,
        },
    },

    init() {
        App.initAuth();
        App.initNav();
        App.initSidebarSticky();
        App.initWidgetLinks();
        App.bindLikeButton();
        App.bindShareButton();
        App.loadTopPosts();
        App.loadNoticePosts();

        App.state.postId = App.getPostId();
        if (!App.state.postId) {
            App.showContentError("유효하지 않은 게시글입니다.");
            return;
        }

        App.bindCommentForm();
        App.bindCommentActions();
        App.bindPostMenu();
        App.bindReportPost();
        App.bindPostOwnerActions();
        App.loadPost();
        App.loadComments();
        App.bindCommentMore();
    },

    getPostId() {
        const body = document.body;
        const raw = body?.dataset?.postId;
        if (!raw) return null;
        const parsed = Number(raw);
        return Number.isNaN(parsed) ? null : parsed;
    },

    initAuth() {
        if (App.state.auth.checked || App.state.auth.checking) return;
        App.resolveAuth();
    },

    resolveAuth() {
        if (App.state.auth.checked) {
            return Promise.resolve(App.state.auth.allowed);
        }
        if (App.state.auth.checking) {
            return new Promise(resolve => {
                const timer = setInterval(() => {
                    if (!App.state.auth.checking) {
                        clearInterval(timer);
                        resolve(App.state.auth.allowed);
                    }
                }, 50);
            });
        }
        App.state.auth.checking = true;
        return new Promise(resolve => {
            checkAuthStatus({
                onAuthenticated: (data) => {
                    App.setAuthState(true, data);
                    resolve(true);
                },
                onUnauthenticated: () => {
                    App.setAuthState(false, null);
                    resolve(false);
                },
                onError: () => {
                    App.setAuthState(false, null);
                    resolve(false);
                },
            });
        });
    },

    setAuthState(allowed, user) {
        App.state.auth.checked = true;
        App.state.auth.allowed = allowed;
        App.state.auth.user = user;
        App.state.auth.checking = false;
    },

    async ensureAuth() {
        const allowed = await App.resolveAuth();
        if (!allowed) {
            App.redirectToLogin();
            return false;
        }
        return true;
    },

    redirectToNickname() {
        alert("닉네임을 먼저 입력해 주세요.");
        const returnUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        const params = new URLSearchParams({focus: "nickname", returnUrl});
        window.location.href = `/web/member/mypage?${params.toString()}`;
    },

    async ensureNickname() {
        const allowed = await App.resolveAuth();
        if (!allowed) {
            App.redirectToLogin();
            return false;
        }
        const nickname = (App.state.auth.user?.nickname || "").trim();
        if (!nickname) {
            App.redirectToNickname();
            return false;
        }
        return true;
    },

    redirectToLogin() {
        alert("로그인이 필요합니다.");
        window.location.href = buildLoginRedirectUrl();
    },

    async loadPost() {
        try {
            const response = await fetch(`${API.POST_DETAIL}/${App.state.postId}`, {
                credentials: "include",
                headers: {
                    Accept: "application/json",
                },
            });
            if (!response.ok) {
                throw new Error(`게시글 조회 실패 (${response.status})`);
            }
            const post = await response.json();
            App.renderPost(post);
        } catch (error) {
            App.showContentError("게시글을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
        }
    },

    renderPost(post) {
        App.setText("postTitle", post.title || "");
        App.setText("postAuthor", post.authorNickname || "익명");
        App.setText("postTime", App.formatRelativeTime(post.createdAt));

        // 더보기 메뉴: owner는 수정/삭제, 비-owner는 신고 항목 노출
        const isAuthor = Boolean(post.isAuthor);
        document.querySelectorAll("[data-owner-only]").forEach(el => {
            el.hidden = !isAuthor;
        });
        document.querySelectorAll("[data-non-owner-only]").forEach(el => {
            el.hidden = isAuthor;
        });
        App.setText("postViewCount", formatNumberWithComma(post.viewCount || 0));
        App.setText("postReactionCount", formatNumberWithComma(post.reactionCount || 0));
        App.setText("postCommentCount", formatNumberWithComma(post.commentCount || 0));
        App.setText("commentCountLabel", formatNumberWithComma(post.commentCount || 0));
        App.setText("likeCountLabel", formatNumberWithComma(post.reactionCount || 0));

        const liked = Boolean(post.isLiked ?? post.hasReacted ?? post.isReacted ?? false);
        App.setLikeState(liked);

        const typeLabel = TYPE_LABELS[post.type] || post.type || "기타";
        App.setText("postTypeBadge", typeLabel);

        const popularBadge = document.getElementById("postPopularBadge");
        if (popularBadge) {
            popularBadge.hidden = !post.isPopular;
        }

        const content = document.getElementById("postContent");
        if (content) {
            if (post.isHtml) {
                content.innerHTML = post.content || "";
            } else {
                content.textContent = post.content || "";
            }
        }
    },

    showContentError(message) {
        App.setText("postContent", message);
    },

    /**
     * Sidebar sticky top 을 main 본문 자연 위치(viewport Y at scrollY=0)에 맞춤.
     * 효과: 스크롤 시작 시 sidebar 가 자연 위치에서 즉시 sticky 되어 "올라가는" 시각 변화 0.
     * 측정 시점: 초기 로드 + 윈도우 리사이즈 + 위젯 비동기 로딩 후.
     */
    initSidebarSticky() {
        const main = document.querySelector(".community-main");
        const sidebar = document.querySelector(".community-sidebar");
        if (!main || !sidebar) return;

        const align = () => {
            // viewport 상단으로부터 main 의 top 거리(스크롤 보정 포함) = main 의 document Y
            // sticky top 으로 사용하면 main 의 자연 위치에서 정확히 sticky 발동
            const mainTopInDoc = main.getBoundingClientRect().top + window.scrollY;
            document.documentElement.style.setProperty("--sidebar-sticky-top", `${mainTopInDoc}px`);
        };

        align();
        window.addEventListener("resize", align);
        // 위젯이 비동기로 로딩되어 main 의 높이/위치가 변경될 수 있으므로 약간 지연 후 재정렬
        setTimeout(align, 200);
        setTimeout(align, 800);
    },

    initNav() {
        const backButton = document.getElementById("topNavBackButton");
        // 상세 페이지에서는 page-title("커뮤니티") 미노출 — 본문 <h1 class="detail-title"> 가
        // 페이지 타이틀 역할 100% 담당. Thymeleaf 기본 동작(pageTitle 미지정 → d-none) 그대로 둠.
        if (backButton) {
            backButton.classList.remove(UI_CLASSES.HIDDEN);
            backButton.addEventListener("click", () => {
                const backLink = document.body.dataset.backLink || "/web/community";
                window.location.href = backLink;
            });
        }
    },

    initWidgetLinks() {
        const noticeLinks = document.querySelectorAll(".notice-widget .notice-more");
        noticeLinks.forEach(link => {
            const href = App.buildCommunityListUrl(NOTICE_CATEGORY);
            link.setAttribute("href", href);
            link.addEventListener("click", event => {
                event.preventDefault();
                window.location.href = href;
            });
        });

        const top3Links = document.querySelectorAll(".top3-widget .widget-more");
        top3Links.forEach(link => {
            const href = App.buildCommunityListUrl(POPULAR_CATEGORY);
            link.setAttribute("href", href);
            link.addEventListener("click", event => {
                event.preventDefault();
                window.location.href = href;
            });
        });
    },

    async loadComments() {
        if (App.state.commentLoading || !App.state.commentHasNext) return;

        App.state.commentLoading = true;
        const params = new URLSearchParams();
        params.set("page", String(App.state.commentPage));
        params.set("size", String(COMMENT_PAGE_SIZE));

        try {
            const response = await fetch(`${API.COMMENTS}/${App.state.postId}/comments?${params.toString()}`, {
                credentials: "include",
                headers: {
                    Accept: "application/json",
                },
            });
            if (!response.ok) {
                throw new Error(`댓글 조회 실패 (${response.status})`);
            }
            const payload = await response.json();
            App.state.commentHasNext = Boolean(payload?.hasNext);
            if (App.state.commentHasNext) {
                App.state.commentPage += 1;
            }
            App.renderComments(payload?.content || []);
        } catch (error) {
            App.toggleCommentEmpty(true, "댓글을 불러오지 못했습니다.");
            App.state.commentHasNext = false;
        } finally {
            App.state.commentLoading = false;
            App.toggleCommentMore(App.state.commentHasNext);
        }
    },

    renderComments(comments) {
        const list = document.getElementById("commentList");
        if (!list) return;

        if (!comments || comments.length === 0) {
            if (App.state.commentPage === 0) {
                App.toggleCommentEmpty(true, "등록된 댓글이 없습니다.");
            }
            return;
        }

        const fragment = document.createDocumentFragment();
        comments.forEach(comment => {
            fragment.appendChild(App.createCommentItem(comment));
        });

        list.appendChild(fragment);
        App.toggleCommentEmpty(false);
    },

    createCommentItem(comment) {
        const item = document.createElement("div");
        item.className = "comment-item";
        item.dataset.commentId = String(comment.id || "");
        item.dataset.isAuthor = String(!!comment.isAuthor);

        // Avatar
        const avatar = document.createElement("div");
        avatar.className = "comment-avatar";
        avatar.textContent = (comment.authorNickname || "익").charAt(0);
        item.appendChild(avatar);

        // Body (Meta + Content)
        const body = document.createElement("div");
        body.className = "comment-body";

        const meta = document.createElement("div");
        meta.className = "comment-meta";

        const author = document.createElement("span");
        author.className = "comment-author";
        author.textContent = comment.authorNickname || "익명";

        const time = document.createElement("span");
        time.className = "comment-time";
        time.textContent = App.formatRelativeTime(comment.createdAt);

        meta.appendChild(author);
        meta.appendChild(time);
        meta.appendChild(App.createCommentActions(comment));

        const content = document.createElement("div");
        content.className = "comment-content";
        content.textContent = comment.content || "";

        body.appendChild(meta);
        body.appendChild(content);

        item.appendChild(body);
        return item;
    },

    createCommentActions(comment) {
        const actions = document.createElement("div");
        actions.className = "comment-actions";

        const editBtn = App.createCommentAction("edit", "수정");
        editBtn.classList.add("comment-action-owner");
        actions.appendChild(editBtn);

        const deleteBtn = App.createCommentAction("delete", "삭제");
        deleteBtn.classList.add("comment-action-owner");
        actions.appendChild(deleteBtn);

        const reportBtn = App.createCommentAction("report", "신고");
        actions.appendChild(reportBtn);

        App.applyOwnerActionVisibility(actions, comment);
        return actions;
    },

    createCommentAction(action, label) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "comment-action";
        button.dataset.action = action;
        button.textContent = label;
        return button;
    },

    applyOwnerActionVisibility(container, comment) {
        container.querySelectorAll(".comment-action-owner").forEach(button => {
            button.hidden = !comment.isAuthor;
        });
    },

    bindPostOwnerActions() {
        const editBtn = document.getElementById("btnEditPost");
        const deleteBtn = document.getElementById("btnDeletePost");

        if (editBtn) {
            editBtn.addEventListener("click", () => {
                App.handleEditPost();
            });
        }
        if (deleteBtn) {
            deleteBtn.addEventListener("click", () => {
                App.handleDeletePost();
            });
        }
    },

    bindPostMenu() {
        const toggle = document.getElementById("postMenuToggle");
        const dropdown = document.getElementById("postMenuDropdown");
        if (!toggle || !dropdown) return;

        const close = () => {
            dropdown.hidden = true;
            toggle.setAttribute("aria-expanded", "false");
        };
        const open = () => {
            dropdown.hidden = false;
            toggle.setAttribute("aria-expanded", "true");
        };

        toggle.addEventListener("click", (e) => {
            e.stopPropagation();
            if (dropdown.hidden) open();
            else close();
        });

        // 메뉴 항목 클릭 시 메뉴 닫기 (실제 동작은 각 항목의 별도 핸들러가 수행)
        dropdown.addEventListener("click", (e) => {
            const item = e.target.closest(".post-menu-item");
            if (item && !item.disabled) {
                close();
            }
        });

        // 외부 클릭 시 닫기
        document.addEventListener("click", (e) => {
            if (!dropdown.hidden && !toggle.contains(e.target) && !dropdown.contains(e.target)) {
                close();
            }
        });

        // ESC 닫기
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && !dropdown.hidden) {
                close();
                toggle.focus();
            }
        });
    },

    bindReportPost() {
        const reportBtn = document.getElementById("btnReportPost");
        if (!reportBtn) return;

        reportBtn.addEventListener("click", async () => {
            if (App.state.reportedPost) {
                return;
            }
            const allowed = await App.ensureAuth();
            if (!allowed) return;

            const reason = await App.openReportModal();
            if (!reason) return;

            const result = await App.reportPost(reason);
            if (result === "reported" || result === "exists") {
                App.state.reportedPost = true;
                App.setReportButtonState(reportBtn, true);
            }
        });
    },

    bindLikeButton() {
        const button = document.getElementById("btnLike");
        if (!button) return;

        button.addEventListener("click", async () => {
            if (App.state.likeLoading) return;
            const allowed = await App.ensureAuth();
            if (!allowed) return;

            App.state.likeLoading = true;
            button.disabled = true;

            try {
                if (App.state.likeActive) {
                    const removed = await App.removeLike();
                    if (removed) {
                        App.setLikeState(false);
                        App.updateReactionCountBy(-1);
                    }
                } else {
                    const result = await App.addLike();
                    if (result === "added") {
                        App.setLikeState(true);
                        App.updateReactionCountBy(1);
                    } else if (result === "exists") {
                        App.setLikeState(true);
                    }
                }
            } finally {
                App.state.likeLoading = false;
                button.disabled = false;
            }
        });
    },

    bindShareButton() {
        const button = document.getElementById("btnShare");
        if (!button) return;

        button.addEventListener("click", async () => {
            const url = window.location.href;
            const title = document.getElementById("postTitle")?.textContent?.trim() || "게시글 공유";
            const text = `| 커뮤니티 | ElSeeker`;

            if (navigator.share) {
                try {
                    await navigator.share({title, text, url});
                    return;
                } catch (error) {
                    // fallback to clipboard
                }
            }

            const copied = await App.copyToClipboard(url);
            alert(copied ? "링크가 복사되었습니다." : "링크 복사에 실패했습니다.");
        });
    },

    setLikeState(active) {
        App.state.likeActive = Boolean(active);
        const button = document.getElementById("btnLike");
        if (button) {
            button.classList.toggle("active", App.state.likeActive);
        }
    },

    async copyToClipboard(text) {
        if (!text) return false;
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }
        } catch (error) {
            // fallback below
        }
        return App.fallbackCopy(text);
    },

    fallbackCopy(text) {
        try {
            const textarea = document.createElement("textarea");
            textarea.value = text;
            textarea.style.position = "fixed";
            textarea.style.left = "-9999px";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            return true;
        } catch (error) {
            return false;
        }
    },

    async reportPost(reason) {
        try {
            const response = await fetchWithAuthRetry(
                `${API.POST_DETAIL}/${App.state.postId}/reports`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({reason}),
                }
            );

            if (response.status === 401) {
                App.redirectToLogin();
                return "unauthorized";
            }

            if (response.ok) {
                alert("신고가 접수되었습니다.");
                return "reported";
            }

            if (response.status === 400) {
                const errorMessage = await App.readErrorMessage(response);
                alert(errorMessage);
                return "exists";
            }

            throw new Error(`게시글 신고 실패 (${response.status})`);
        } catch (error) {
            alert("게시글 신고에 실패했습니다. 잠시 후 다시 시도해주세요.");
            return "error";
        }
    },

    handleEditPost() {
        window.location.href = `/web/community/write?postId=${App.state.postId}`;
    },

    async handleDeletePost() {
        if (!window.confirm("게시글을 삭제하시겠습니까?")) return;

        const allowed = await App.ensureAuth();
        if (!allowed) return;

        try {
            const response = await fetchWithAuthRetry(
                `${API.POST_DETAIL}/${App.state.postId}`,
                {
                    method: "DELETE",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                    },
                }
            );

            if (response.status === 401) {
                App.redirectToLogin();
                return;
            }

            if (!response.ok) {
                throw new Error(`게시글 삭제 실패 (${response.status})`);
            }

            window.location.href = "/web/community";
        } catch (error) {
            alert("게시글 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
    },

    bindCommentActions() {
        const list = document.getElementById("commentList");
        if (!list) return;

        list.addEventListener("click", (event) => {
            const actionButton = event.target.closest("button[data-action]");
            if (!actionButton) return;
            const item = actionButton.closest(".comment-item");
            if (!item) return;

            const action = actionButton.dataset.action;
            if (action === "edit") {
                App.startEditComment(item);
                return;
            }
            if (action === "delete") {
                App.deleteComment(item);
                return;
            }
            if (action === "report") {
                App.reportComment(item);
            }
        });
    },

    startEditComment(item) {
        if (item.classList.contains("is-editing")) return;
        const contentEl = item.querySelector(".comment-content");
        if (!contentEl) return;

        const original = contentEl.textContent || "";
        item.dataset.originalContent = original;
        item.classList.add("is-editing");

        const editor = App.createCommentEditor(original, item);
        contentEl.replaceWith(editor);
    },

    createCommentEditor(original, item) {
        const editor = document.createElement("div");
        editor.className = "comment-editor";

        const textarea = document.createElement("textarea");
        textarea.value = original;
        editor.appendChild(textarea);

        const actions = document.createElement("div");
        actions.className = "comment-editor-actions";

        const saveBtn = document.createElement("button");
        saveBtn.type = "button";
        saveBtn.className = "primary";
        saveBtn.textContent = "저장";
        saveBtn.addEventListener("click", () => {
            App.saveCommentEdit(item, textarea.value);
        });

        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.textContent = "취소";
        cancelBtn.addEventListener("click", () => {
            App.cancelEditComment(item);
        });

        actions.appendChild(saveBtn);
        actions.appendChild(cancelBtn);
        editor.appendChild(actions);
        return editor;
    },

    cancelEditComment(item) {
        const original = item.dataset.originalContent || "";
        const editor = item.querySelector(".comment-editor");
        if (!editor) return;

        const content = document.createElement("div");
        content.className = "comment-content";
        content.textContent = original;
        editor.replaceWith(content);
        item.classList.remove("is-editing");
    },

    async saveCommentEdit(item, content) {
        const commentId = item.dataset.commentId;
        if (!commentId) return;
        const trimmed = (content || "").trim();
        if (!trimmed) {
            alert("댓글 내용을 입력해주세요.");
            return;
        }

        const allowed = await App.ensureAuth();
        if (!allowed) return;

        try {
            const response = await fetchWithAuthRetry(
                `${API.COMMENTS}/${App.state.postId}/comments/${commentId}`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({content: trimmed}),
                }
            );

            if (response.status === 401) {
                App.redirectToLogin();
                return;
            }

            if (!response.ok) {
                throw new Error(`댓글 수정 실패 (${response.status})`);
            }

            const updated = await response.json();
            const editor = item.querySelector(".comment-editor");
            if (!editor) return;
            const contentEl = document.createElement("div");
            contentEl.className = "comment-content";
            contentEl.textContent = updated.content || trimmed;
            editor.replaceWith(contentEl);
            item.classList.remove("is-editing");
            item.dataset.originalContent = updated.content || trimmed;
        } catch (error) {
            alert("댓글 수정에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
    },

    async deleteComment(item) {
        const commentId = item.dataset.commentId;
        if (!commentId) return;

        const confirmed = window.confirm("댓글을 삭제하시겠습니까?");
        if (!confirmed) return;

        const allowed = await App.ensureAuth();
        if (!allowed) return;

        try {
            const response = await fetchWithAuthRetry(
                `${API.COMMENTS}/${App.state.postId}/comments/${commentId}`,
                {
                    method: "DELETE",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                    },
                }
            );

            if (response.status === 401) {
                App.redirectToLogin();
                return;
            }

            if (!response.ok) {
                throw new Error(`댓글 삭제 실패 (${response.status})`);
            }

            item.remove();
            App.updateCommentCountBy(-1);
            const list = document.getElementById("commentList");
            if (list && list.children.length === 0) {
                App.toggleCommentEmpty(true, "등록된 댓글이 없습니다.");
            }
        } catch (error) {
            alert("댓글 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
    },

    async reportComment(item) {
        const commentId = item.dataset.commentId;
        if (!commentId) return;
        if (App.state.reportedComments.has(commentId)) {
            return;
        }

        const allowed = await App.ensureAuth();
        if (!allowed) return;

        const reason = await App.openReportModal();
        if (!reason) return;

        try {
            const response = await fetchWithAuthRetry(
                `${API.COMMENTS}/${App.state.postId}/comments/${commentId}/reports`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({reason}),
                }
            );

            if (response.status === 401) {
                App.redirectToLogin();
                return;
            }

            if (response.ok) {
                alert("신고가 접수되었습니다.");
                App.state.reportedComments.add(commentId);
                App.setCommentReportButtonState(item, true);
                return;
            }

            if (response.status === 400) {
                const errorMessage = await App.readErrorMessage(response);
                alert(errorMessage);
                App.state.reportedComments.add(commentId);
                App.setCommentReportButtonState(item, true);
                return;
            }

            throw new Error(`댓글 신고 실패 (${response.status})`);
        } catch (error) {
            console.warn(error.message);
        }
    },

    setReportButtonState(button, reported) {
        if (!button) return;
        button.disabled = reported;
        button.setAttribute("aria-disabled", reported ? "true" : "false");
        const label = button.querySelector(".post-menu-item-label, .btn-action-label");
        if (label) {
            label.textContent = reported ? "신고됨" : "신고";
        }
    },

    setCommentReportButtonState(item, reported) {
        const reportBtn = item.querySelector("button[data-action='report']");
        if (!reportBtn) return;
        reportBtn.disabled = reported;
        reportBtn.textContent = reported ? "신고됨" : "신고";
    },

    openReportModal() {
        const modal = document.getElementById("reportModal");
        if (!modal || typeof modal.showModal !== "function") {
            return Promise.resolve(null);
        }

        setupDialogScrollLock(modal);

        const form = modal.querySelector("form");
        const cancelBtn = document.getElementById("btnCancelReport");

        return new Promise(resolve => {
            let resolved = false;

            const finish = (value) => {
                if (resolved) return;
                resolved = true;
                cleanup();
                resolve(value);
            };

            const onSubmit = (event) => {
                event.preventDefault();
                const selected = modal.querySelector("input[name='reason']:checked");
                const reason = selected ? selected.value : null;
                modal.close();
                finish(reason);
            };

            const onCancel = (event) => {
                if (event) event.preventDefault();
                modal.close();
                finish(null);
            };

            const onBackdropClick = (event) => {
                if (event.target === modal) {
                    modal.close();
                    finish(null);
                }
            };

            const cleanup = () => {
                if (form) form.removeEventListener("submit", onSubmit);
                if (cancelBtn) cancelBtn.removeEventListener("click", onCancel);
                modal.removeEventListener("cancel", onCancel);
                modal.removeEventListener("click", onBackdropClick);
            };

            if (form) form.addEventListener("submit", onSubmit);
            if (cancelBtn) cancelBtn.addEventListener("click", onCancel);
            modal.addEventListener("cancel", onCancel);
            modal.addEventListener("click", onBackdropClick);

            modal.showModal();
        });
    },

    parseNumber(value) {
        if (!value) return 0;
        const numeric = Number(String(value).replace(/,/g, ""));
        return Number.isNaN(numeric) ? 0 : numeric;
    },

    bindCommentMore() {
        const button = document.getElementById("commentMoreBtn");
        if (!button) return;

        button.addEventListener("click", () => {
            App.loadComments();
        });
    },

    bindCommentForm() {
        const form = document.getElementById("commentForm");
        const input = document.getElementById("commentInput");
        if (!form || !input) return;

        input.addEventListener("beforeinput", async (event) => {
            if (App.state.auth.allowed && App.state.auth.user?.nickname) {
                return;
            }
            if (App.state.commentInputAuthChecked) {
                return;
            }
            App.state.commentInputAuthChecked = true;
            event.preventDefault();
            await App.ensureNickname();
        });

        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            const content = input.value.trim();
            if (!content) return;
            const allowed = await App.ensureNickname();
            if (!allowed) return;
            App.submitComment(content);
        });
    },

    async submitComment(content) {
        const url = `${API.COMMENTS}/${App.state.postId}/comments`;
        try {
            const response = await fetchWithAuthRetry(url, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({content}),
            });

            if (response.status === 401) {
                App.redirectToLogin();
                return;
            }

            if (!response.ok) {
                throw new Error(`댓글 작성 실패 (${response.status})`);
            }

            const saved = await response.json();
            App.appendNewComment(saved);
            App.updateCommentCountBy(1);
            const input = document.getElementById("commentInput");
            if (input) input.value = "";
        } catch (error) {
            console.error(error)
            alert("댓글 작성에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
    },

    async addLike() {
        try {
            const response = await fetchWithAuthRetry(
                `${API.POST_DETAIL}/${App.state.postId}/reactions`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({type: "LIKE"}),
                }
            );

            if (response.status === 401) {
                App.redirectToLogin();
                return "unauthorized";
            }

            if (response.ok) {
                return "added";
            }

            if (response.status === 400) {
                const errorMessage = await App.readErrorMessage(response);
                if (errorMessage && errorMessage.includes("이미 반응한")) {
                    return "exists";
                }
            }
        } catch (error) {
            console.warn(error.message);
        }
        return "error";
    },

    async removeLike() {
        try {
            const response = await fetchWithAuthRetry(
                `${API.POST_DETAIL}/${App.state.postId}/reactions/LIKE`,
                {
                    method: "DELETE",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                    },
                }
            );

            if (response.status === 401) {
                App.redirectToLogin();
                return false;
            }

            if (response.ok) {
                return true;
            }

            if (response.status === 404) {
                App.setLikeState(false);
                return false;
            }
        } catch (error) {
            console.warn(error.message);
        }
        return false;
    },

    async readErrorMessage(response) {
        try {
            const data = await response.json();
            return data?.message || "";
        } catch (error) {
            return "";
        }
    },

    appendNewComment(comment) {
        const list = document.getElementById("commentList");
        if (!list) return;
        const item = App.createCommentItem(comment);
        list.appendChild(item);
        App.toggleCommentEmpty(false);
    },

    toggleCommentMore(visible) {
        const button = document.getElementById("commentMoreBtn");
        if (!button) return;
        button.hidden = !visible;
    },

    toggleCommentEmpty(show, message) {
        const empty = document.getElementById("commentEmpty");
        if (!empty) return;
        if (message) {
            empty.textContent = message;
        }
        empty.hidden = !show;
    },

    setText(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    },

    updateReactionCountBy(delta) {
        const targets = ["postReactionCount", "likeCountLabel"];
        targets.forEach(id => {
            const element = document.getElementById(id);
            if (!element) return;
            const current = App.parseNumber(element.textContent);
            const next = Math.max(current + delta, 0);
            element.textContent = formatNumberWithComma(next);
        });
    },

    updateCommentCountBy(delta) {
        const targets = ["postCommentCount", "commentCountLabel"];
        targets.forEach(id => {
            const element = document.getElementById(id);
            if (!element) return;
            const current = App.parseNumber(element.textContent);
            const next = Math.max(current + delta, 0);
            element.textContent = formatNumberWithComma(next);
        });
    },

    async loadTopPosts() {
        try {
            const response = await fetch(API.TOP_POSTS, {
                credentials: "include",
                headers: {
                    Accept: "application/json",
                },
            });
            if (!response.ok) {
                throw new Error(`인기글 조회 실패 (${response.status})`);
            }
            const posts = await response.json();
            App.renderTopPosts(posts || []);
        } catch (error) {
            // Fail silently; keep empty state text in the widget.
        }
    },

    renderTopPosts(posts) {
        const lists = document.querySelectorAll(".top3-list");
        if (lists.length === 0) return;

        const visiblePosts = (posts || []).filter(post => post?.type !== NOTICE_TYPE);

        lists.forEach(list => {
            const cardClass = list.dataset.cardClass || "";
            list.innerHTML = "";

            if (!visiblePosts || visiblePosts.length === 0) {
                const empty = document.createElement("div");
                empty.className = "top3-empty";
                empty.textContent = "인기글이 아직 없습니다.";
                list.appendChild(empty);
                return;
            }

            const fragment = document.createDocumentFragment();
            visiblePosts.slice(0, 3).forEach((post, index) => {
                fragment.appendChild(App.createTopPostCard(post, index + 1, cardClass));
            });

            list.appendChild(fragment);
        });
    },

    createTopPostCard(post, rank, cardClass) {
        const card = document.createElement("a");
        card.className = ["feed-card", cardClass].filter(Boolean).join(" ");
        card.dataset.rank = String(rank);
        card.href = App.buildPostUrl(post.id);

        const topRow = document.createElement("div");
        topRow.className = "feed-top-row";

        const badges = document.createElement("div");
        badges.className = "feed-badges";

        const categoryBadge = document.createElement("span");
        categoryBadge.className = "feed-category-badge";
        categoryBadge.textContent = App.getTypeLabel(post.type);
        badges.appendChild(categoryBadge);

        const title = document.createElement("h4");
        title.className = "feed-title";
        title.textContent = post.title || "";

        topRow.appendChild(badges);
        topRow.appendChild(title);
        card.appendChild(topRow);

        const footer = document.createElement("div");
        footer.className = "feed-footer";

        const actions = document.createElement("div");
        actions.className = "feed-actions";
        actions.appendChild(App.createActionPill("👀", post.viewCount));
        actions.appendChild(App.createActionPill("❤️", post.reactionCount));
        actions.appendChild(App.createActionPill("💬", post.commentCount));

        footer.appendChild(actions);
        card.appendChild(footer);

        return card;
    },

    createActionPill(icon, value) {
        const pill = document.createElement("span");
        pill.className = "action-pill";

        const iconSpan = document.createElement("i");
        iconSpan.className = "icon";
        iconSpan.textContent = icon;

        const text = document.createTextNode(` ${formatNumberWithComma(value || 0)}`);

        pill.appendChild(iconSpan);
        pill.appendChild(text);
        return pill;
    },

    getTypeLabel(type) {
        return TYPE_LABELS[type] || type || "기타";
    },

    async loadNoticePosts() {
        const lists = document.querySelectorAll(".notice-list");
        if (lists.length === 0) return;

        const params = new URLSearchParams();
        params.set("page", "0");
        params.set("size", String(NOTICE_PAGE_SIZE));
        params.set("order", "latest");
        params.set("type", NOTICE_TYPE);

        try {
            const response = await fetch(`${API.POSTS}?${params.toString()}`, {
                credentials: "include",
                headers: {
                    Accept: "application/json",
                },
            });
            if (!response.ok) {
                throw new Error(`공지사항 조회 실패 (${response.status})`);
            }
            const payload = await response.json();
            App.renderNoticePosts(payload?.content || []);
        } catch (error) {
            App.renderNoticePosts([]);
        }
    },

    renderNoticePosts(posts) {
        const lists = document.querySelectorAll(".notice-list");
        if (lists.length === 0) return;

        const visiblePosts = (posts || []).slice(0, 1);

        lists.forEach(list => {
            list.innerHTML = "";

            if (!visiblePosts || visiblePosts.length === 0) {
                const empty = document.createElement("div");
                empty.className = "notice-empty";
                empty.textContent = "공지사항이 없습니다.";
                list.appendChild(empty);
                return;
            }

            const fragment = document.createDocumentFragment();
            visiblePosts.forEach(post => {
                fragment.appendChild(App.createNoticeItem(post));
            });
            list.appendChild(fragment);
        });
    },

    createNoticeItem(post) {
        const item = document.createElement("a");
        item.className = "pinned-notice-item";
        item.href = App.buildPostUrl(post.id);

        const title = document.createElement("span");
        title.className = "pinned-title";
        title.textContent = post.title || "공지사항";

        const date = document.createElement("span");
        date.className = "pinned-date";
        date.textContent = App.formatDate(post.createdAt);

        item.appendChild(title);
        item.appendChild(date);
        return item;
    },

    formatDate(isoString) {
        if (!isoString) return "";
        const date = new Date(isoString);
        if (Number.isNaN(date.getTime())) return "";
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}.${month}.${day}`;
    },

    buildCommunityListUrl(category) {
        const url = new URL(COMMUNITY_LIST_URL, window.location.origin);
        if (category) {
            url.searchParams.set("category", category);
        }
        return `${url.pathname}${url.search}`;
    },

    buildPostUrl(id) {
        if (!id) return "#";
        return `/web/community/${id}`;
    },

    formatRelativeTime(isoString) {
        if (!isoString) return "";
        const target = new Date(isoString);
        if (Number.isNaN(target.getTime())) return "";

        const diffMs = Date.now() - target.getTime();
        const diffSeconds = Math.floor(diffMs / 1000);
        if (diffSeconds < 60) return `${Math.max(diffSeconds, 0)}초 전`;

        const diffMinutes = Math.floor(diffSeconds / 60);
        if (diffMinutes < 60) return `${diffMinutes}분 전`;

        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours}시간 전`;

        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays}일 전`;

        const diffWeeks = Math.floor(diffDays / 7);
        if (diffWeeks < 4) return `${diffWeeks}주 전`;

        const diffMonths = Math.floor(diffDays / 30);
        if (diffMonths < 12) return `${diffMonths}개월 전`;

        const diffYears = Math.floor(diffDays / 365);
        return `${diffYears}년 전`;
    },

};

document.addEventListener("DOMContentLoaded", App.init);
