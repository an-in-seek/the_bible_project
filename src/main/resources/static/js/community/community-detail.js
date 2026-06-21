import {fetchWithAuthRetry, formatNumberWithComma, setupDialogScrollLock} from "/js/common-util.js?v=2.3";
import {showConfirm} from "/js/confirm-dialog.js?v=1.0";
import {buildLoginRedirectUrl, checkAuthStatus} from "/js/auth/auth-check.js";
import { createRestoreStore, restoreScroll } from "/js/nav-restore.js?v=1.0";

const API = {
    POSTS: "/api/v1/community/posts",
    POST_DETAIL: "/api/v1/community/posts",
    COMMENTS: "/api/v1/community/posts",
    TOP_POSTS: "/api/v1/community/posts/top",
};

const COMMENT_PAGE_SIZE = 20;
const REPLY_PAGE_SIZE = 20;
const NOTICE_PAGE_SIZE = 1;
const NOTICE_TYPE = "NOTICE";
const NOTICE_CATEGORY = "공지";
const POPULAR_CATEGORY = "인기";
const COMMUNITY_LIST_URL = "/web/community";

/** 댓글 더보기 깊이·스크롤 위치 복원(뒤로가기/새로고침)용 sessionStorage 키. */
const COMMENT_RESTORE_KEY = "communityDetailRestore";

const commentRestoreStore = createRestoreStore(COMMENT_RESTORE_KEY);

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
        _pendingRestoreCount: 0,
        _pendingRestoreScroll: null,
        commentInputAuthChecked: false,
        likeActive: false,
        likeLoading: false,
        reportedPost: false,
        reportedComments: new Set(),
        // 부모(최상위)별 대댓글 페이지네이션 상태.
        // { [parentId]: { total, serverLoaded, cursor: {createdAt, id} | null } }
        replyState: {},
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
        App.relocatePostMenu();
        App.bindReportPost();
        App.bindPostOwnerActions();
        App.loadPost();
        App.bindCommentMore();
        window.addEventListener("pagehide", () => App.saveCommentRestoreState());
        App.loadCommentsInitial();
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

    async loadCommentsInitial() {
        // 뒤로가기/새로고침으로 같은 게시글에 복귀한 경우: 댓글 더보기 깊이와 스크롤 위치를 복원.
        const saved = commentRestoreStore.load();
        if (saved && Number(saved.postId) === Number(App.state.postId)) {
            App.state._pendingRestoreCount = Number(saved.loadedCount) || 0;
            App.state._pendingRestoreScroll = Number.isFinite(saved.scrollY) ? saved.scrollY : null;
        }

        await App.loadComments(); // 첫 페이지(page 0)

        // 저장된 페이지 수만큼 추가 로드(끝에 도달하면 중단). 일반 진입 시 target<=1 이라 루프 미실행.
        const target = App.state._pendingRestoreCount;
        App.state._pendingRestoreCount = 0;
        let loaded = 1;
        while (loaded < target && App.state.commentHasNext) {
            await App.loadComments();
            loaded += 1;
        }

        // 결과 렌더 후 스크롤 1회 복원. 단, 앵커 해시(#comment-...)가 있으면 브라우저 앵커 이동에 양보.
        if (App.state._pendingRestoreScroll != null) {
            const y = App.state._pendingRestoreScroll;
            App.state._pendingRestoreScroll = null;
            if (!window.location.hash) {
                restoreScroll(y);
            }
        }
    },

    saveCommentRestoreState() {
        if (!App.state.postId) return;
        // commentPage 는 '다음에 가져올 페이지' 포인터라 끝 도달(hasNext=false) 시 증가하지 않으므로 +1 보정.
        const loadedCount = App.state.commentHasNext
            ? App.state.commentPage
            : App.state.commentPage + 1;
        commentRestoreStore.save({
            postId: App.state.postId,
            loadedCount,
            scrollY: window.scrollY || window.pageYOffset || 0,
        });
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

    createCommentItem(comment, isReply = false) {
        const item = document.createElement("div");
        item.className = isReply ? "comment-item comment-reply-item" : "comment-item";
        item.dataset.commentId = String(comment.id || "");
        item.dataset.isAuthor = String(!!comment.isAuthor);
        if (comment.parentId != null) {
            item.dataset.parentId = String(comment.parentId);
        }

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
        meta.appendChild(App.createCommentActions(comment, isReply));

        const content = document.createElement("div");
        content.className = "comment-content";
        content.textContent = comment.content || "";

        body.appendChild(meta);
        body.appendChild(content);

        // 최상위 댓글에만 대댓글 영역(컨테이너 + "더 보기")을 둔다 (2단계 고정).
        if (!isReply) {
            const parentId = comment.id;
            const repliesWrap = document.createElement("div");
            repliesWrap.className = "comment-replies";
            repliesWrap.dataset.parentId = String(parentId || "");

            const preview = Array.isArray(comment.replies) ? comment.replies : [];
            preview.forEach(reply => repliesWrap.appendChild(App.createCommentItem(reply, true)));
            body.appendChild(repliesWrap);

            const total = Number(comment.replyCount) || 0;
            const moreBtn = document.createElement("button");
            moreBtn.type = "button";
            moreBtn.className = "comment-replies-more";
            moreBtn.dataset.action = "load-replies";
            moreBtn.dataset.parentId = String(parentId || "");
            body.appendChild(moreBtn);

            // 부모별 페이지네이션 상태 초기화: 미리보기 = 서버에서 연속 로드된 첫 구간.
            const last = preview.length ? preview[preview.length - 1] : null;
            App.state.replyState[parentId] = {
                total,
                serverLoaded: preview.length,
                localCount: 0,
                cursor: last ? {createdAt: last.createdAt, id: last.id} : null,
                loading: false,
            };
            App.updateRepliesMoreButton(parentId);
        }

        item.appendChild(body);
        return item;
    },

    createCommentActions(comment, isReply = false) {
        const actions = document.createElement("div");
        actions.className = "comment-actions";

        // 답글 버튼: 최상위·대댓글 모두 노출. 대댓글에 단 답글은 같은 부모(최상위)로 평탄화된다(2단계 고정).
        actions.appendChild(App.createCommentAction("reply", "답글"));

        const editBtn = App.createCommentAction("edit", "수정");
        editBtn.classList.add("comment-action-owner");
        actions.appendChild(editBtn);

        const deleteBtn = App.createCommentAction("delete", "삭제");
        deleteBtn.classList.add("comment-action-owner");
        actions.appendChild(deleteBtn);

        // 신고: 본인 댓글에는 노출하지 않는다(자기 댓글 신고 불가)
        if (!comment.isAuthor) {
            actions.appendChild(App.createCommentAction("report", "신고"));
        }

        App.applyOwnerActionVisibility(actions, comment);
        return actions;
    },

    /** 부모별 "답글 N개 더 보기" 버튼 노출/문구 갱신 (serverLoaded < total 일 때만 노출). */
    updateRepliesMoreButton(parentId) {
        const moreBtn = document.querySelector(`.comment-replies-more[data-parent-id="${parentId}"]`);
        if (!moreBtn) return;
        const st = App.state.replyState[parentId];
        if (!st) {
            moreBtn.hidden = true;
            return;
        }
        const remaining = Math.max(st.total - st.serverLoaded - (st.localCount || 0), 0);
        if (remaining <= 0) {
            moreBtn.hidden = true;
        } else {
            moreBtn.hidden = false;
            moreBtn.textContent = `답글 ${formatNumberWithComma(remaining)}개 더 보기`;
        }
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

    // 데스크탑(>992px): 카드 안(.detail-badges)에 유지 / 모바일(≤992px): 상단 앱바 슬롯으로 이동.
    // 단일 엘리먼트를 옮기므로 ID 중복 없이 기존 핸들러가 그대로 동작한다.
    relocatePostMenu() {
        const menu = document.getElementById("postMenu");
        const slot = document.getElementById("topNavPostMenuSlot");
        const cardHome = document.querySelector(".detail-badges");
        if (!menu || !slot || !cardHome) return;

        const mq = window.matchMedia("(max-width: 992px)");
        const apply = () => {
            const target = mq.matches ? slot : cardHome;
            if (menu.parentElement !== target) target.appendChild(menu);
        };
        apply();
        mq.addEventListener("change", apply);
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
        // 더보기 메뉴의 공유 항목(.js-share) 연결
        const buttons = document.querySelectorAll(".js-share");
        if (!buttons.length) return;

        buttons.forEach((button) => button.addEventListener("click", App.sharePost));
    },

    async sharePost() {
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
        if (!await showConfirm("게시글을 삭제하시겠습니까?", {title: "게시글 삭제", confirmText: "삭제", danger: true})) return;

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
                return;
            }
            if (action === "reply") {
                App.toggleReplyForm(item);
                return;
            }
            if (action === "load-replies") {
                App.loadMoreReplies(actionButton.dataset.parentId);
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
            const newContent = updated.comment?.content || trimmed;
            // 인라인 편집기는 .comment-content 자리에서 바뀐 것이므로, 답글 편집기와 구분해
            // 편집 중인 item 직속 편집기를 찾는다.
            const editor = item.querySelector(".comment-editor:not(.comment-reply-form)");
            if (!editor) return;
            const contentEl = document.createElement("div");
            contentEl.className = "comment-content";
            contentEl.textContent = newContent;
            editor.replaceWith(contentEl);
            item.classList.remove("is-editing");
            item.dataset.originalContent = newContent;
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

            const payload = await response.json().catch(() => null);
            const isReply = item.classList.contains("comment-reply-item");
            const parentId = item.dataset.parentId;
            const wasLocal = item.dataset.local === "true";
            const topLevelId = item.dataset.commentId;
            item.remove();

            if (payload) App.applyPostCommentCount(payload.postCommentCount);

            if (isReply && parentId) {
                const st = App.state.replyState[parentId];
                if (st) {
                    if (wasLocal) st.localCount = Math.max((st.localCount || 0) - 1, 0);
                    else st.serverLoaded = Math.max(st.serverLoaded - 1, 0);
                }
                if (payload && payload.parentReplyCount != null) {
                    App.setParentReplyTotal(parentId, payload.parentReplyCount);
                } else {
                    App.updateRepliesMoreButton(parentId);
                }
            } else {
                // 최상위 삭제: 서버가 자식까지 cascade 처리 → 상태 정리
                delete App.state.replyState[topLevelId];
                const list = document.getElementById("commentList");
                if (list && list.children.length === 0) {
                    App.toggleCommentEmpty(true, "등록된 댓글이 없습니다.");
                }
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
                const payload = await response.json().catch(() => null);
                alert("신고가 접수되었습니다.");
                App.state.reportedComments.add(commentId);
                App.setCommentReportButtonState(item, true);
                if (payload) {
                    App.applyPostCommentCount(payload.postCommentCount);
                    const parentId = item.dataset.parentId;
                    if (parentId && payload.parentReplyCount != null) {
                        App.setParentReplyTotal(parentId, payload.parentReplyCount);
                    }
                }
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

    /** 최상위 댓글 아래 인라인 답글 입력창 토글. */
    toggleReplyForm(item) {
        const body = item.querySelector(".comment-body");
        if (!body) return;
        const existing = body.querySelector(".comment-reply-form");
        if (existing) {
            existing.remove();
            return;
        }
        // 답글 대상 부모 = 최상위 댓글 id. 대댓글이면 그 부모(최상위), 최상위면 자기 자신 → 2단계 평탄화.
        const isReply = item.classList.contains("comment-reply-item");
        const parentId = isReply ? item.dataset.parentId : item.dataset.commentId;
        const repliesWrap = body.querySelector(".comment-replies");

        const form = document.createElement("div");
        form.className = "comment-editor comment-reply-form";

        const textarea = document.createElement("textarea");
        textarea.placeholder = "답글을 입력해주세요...";
        // 대댓글에 답글: 평탄화되므로 누구에게 답하는지 @닉네임 멘션으로 표시
        if (isReply) {
            const nick = item.querySelector(".comment-author")?.textContent?.trim();
            if (nick) textarea.value = `@${nick} `;
        }
        form.appendChild(textarea);

        const actions = document.createElement("div");
        actions.className = "comment-editor-actions";

        const saveBtn = document.createElement("button");
        saveBtn.type = "button";
        saveBtn.className = "primary";
        saveBtn.textContent = "등록";
        saveBtn.addEventListener("click", () => App.submitReply(parentId, textarea.value, form));

        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.textContent = "취소";
        cancelBtn.addEventListener("click", () => form.remove());

        actions.appendChild(saveBtn);
        actions.appendChild(cancelBtn);
        form.appendChild(actions);

        // 대댓글 컨테이너 바로 앞에 입력창 배치
        if (repliesWrap) {
            body.insertBefore(form, repliesWrap);
        } else {
            body.appendChild(form);
        }
        textarea.focus();
        // 멘션 프리픽스 뒤로 커서 이동
        const len = textarea.value.length;
        textarea.setSelectionRange(len, len);
    },

    async submitReply(parentId, rawContent, formEl) {
        const content = (rawContent || "").trim();
        if (!content) {
            alert("답글 내용을 입력해주세요.");
            return;
        }
        const allowed = await App.ensureNickname();
        if (!allowed) return;

        try {
            const response = await fetchWithAuthRetry(
                `${API.COMMENTS}/${App.state.postId}/comments/${parentId}/replies`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({content}),
                }
            );

            if (response.status === 401) {
                App.redirectToLogin();
                return;
            }
            if (!response.ok) {
                throw new Error(`답글 작성 실패 (${response.status})`);
            }

            const saved = await response.json();
            // 2단계 평탄화: 서버가 실제 부모(최상위) id를 반환한다.
            const realParentId = saved.parentId != null ? String(saved.parentId) : String(parentId);
            App.appendAuthoredReply(realParentId, saved.comment);
            App.applyPostCommentCount(saved.postCommentCount);
            if (saved.parentReplyCount != null) {
                App.setParentReplyTotal(realParentId, saved.parentReplyCount);
            }
            if (formEl) formEl.remove();
        } catch (error) {
            console.error(error);
            alert("답글 작성에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
    },

    /** 새로 작성한 대댓글을 해당 부모의 로컬 tail로 추가(서버 커서는 건드리지 않음). */
    appendAuthoredReply(parentId, replyComment) {
        const wrap = document.querySelector(`.comment-replies[data-parent-id="${parentId}"]`);
        if (!wrap) return;
        const node = App.createCommentItem(replyComment, true);
        node.dataset.local = "true";
        wrap.appendChild(node);
        const st = App.state.replyState[parentId];
        if (st) st.localCount = (st.localCount || 0) + 1;
    },

    /** 부모의 서버 권위 총 대댓글 수 갱신 + "더 보기" 버튼 재계산. */
    setParentReplyTotal(parentId, total) {
        const st = App.state.replyState[parentId];
        if (!st) {
            App.state.replyState[parentId] = {total: Number(total) || 0, serverLoaded: 0, localCount: 0, cursor: null, loading: false};
        } else {
            st.total = Number(total) || 0;
        }
        App.updateRepliesMoreButton(parentId);
    },

    /** "답글 N개 더 보기" — keyset 커서(nextReplyCursor) 이후를 불러와 로컬 tail 앞에 dedupe 삽입. */
    async loadMoreReplies(parentId) {
        const st = App.state.replyState[parentId];
        if (!st || st.loading) return;
        st.loading = true;

        const wrap = document.querySelector(`.comment-replies[data-parent-id="${parentId}"]`);
        if (!wrap) {
            st.loading = false;
            return;
        }

        const params = new URLSearchParams();
        params.set("size", String(REPLY_PAGE_SIZE));
        if (st.cursor) {
            params.set("afterCreatedAt", st.cursor.createdAt);
            params.set("afterId", String(st.cursor.id));
        }

        try {
            const response = await fetch(
                `${API.COMMENTS}/${App.state.postId}/comments/${parentId}/replies?${params.toString()}`,
                {credentials: "include", headers: {Accept: "application/json"}},
            );
            if (!response.ok) throw new Error(`대댓글 조회 실패 (${response.status})`);
            const payload = await response.json();
            const replies = payload?.content || [];

            if (replies.length === 0) {
                // 빈 응답: 서버에 남은 게 없음 → 더 보기 버튼이 영구 잔존하지 않도록 보정
                st.serverLoaded = st.total;
                App.updateRepliesMoreButton(parentId);
                return;
            }

            const firstLocal = wrap.querySelector('.comment-item[data-local="true"]');
            replies.forEach(reply => {
                st.cursor = {createdAt: reply.createdAt, id: reply.id};
                const existing = wrap.querySelector(`.comment-item[data-comment-id="${reply.id}"]`);
                if (existing) {
                    // 로컬로 먼저 추가했던 항목이 서버 시퀀스로 확정된 경우에만 serverLoaded 증가.
                    // 순수 중복(이미 서버 로드분)은 이중 카운트 방지 위해 건너뜀.
                    // (strict keyset `>` 라 순수 중복은 정상 흐름에선 발생하지 않으며, 만약 발생해
                    //  remaining이 남아도 다음 빈 응답에서 serverLoaded=total 보정으로 자가 치유됨)
                    if (existing.dataset.local === "true") {
                        existing.dataset.local = "";
                        st.localCount = Math.max((st.localCount || 0) - 1, 0);
                        st.serverLoaded += 1;
                    }
                    return;
                }
                const node = App.createCommentItem(reply, true);
                if (firstLocal) {
                    wrap.insertBefore(node, firstLocal);
                } else {
                    wrap.appendChild(node);
                }
                st.serverLoaded += 1;
            });
            App.updateRepliesMoreButton(parentId);
        } catch (error) {
            console.warn(error.message);
        } finally {
            st.loading = false;
        }
    },

    /** 서버 권위 Post.commentCount 로 댓글 수 라벨 동기화 (로컬 증감 폐기). */
    applyPostCommentCount(count) {
        if (count == null) return;
        const value = formatNumberWithComma(Number(count) || 0);
        ["postCommentCount", "commentCountLabel"].forEach(id => App.setText(id, value));
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
            App.appendNewComment(saved.comment);
            App.applyPostCommentCount(saved.postCommentCount);
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
