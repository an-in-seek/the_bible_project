/**
 * 화면 키보드(soft keyboard)가 가리는 영역을 CSS 와 스크롤 계산에 노출한다.
 *
 * ## 왜 필요한가
 *
 * 긴 글을 쓸 때 커서가 키보드에 가려지는 증상은 브라우저마다 원인이 다르다.
 *
 * - **iOS Safari** 는 키보드가 올라와도 **레이아웃 뷰포트를 줄이지 않는다.**
 *   `window.innerHeight` 가 그대로여서 `position: fixed; bottom: 0` 인 요소는 키보드 뒤로
 *   들어가 버리고, 화면 아래쪽에 있던 입력칸도 그대로 가려진다.
 * - **Android** 는 반대로 레이아웃 뷰포트까지 줄어든다. 고정 바는 키보드 위에 얹히는데,
 *   이번에는 그 바가 입력칸 아래쪽을 덮는다. 브라우저가 커서를 보이게 스크롤해도
 *   "보이는 곳" 판단에 고정 바는 안 들어가므로 커서가 바 밑으로 들어간다.
 *
 * 증상이 달라 보여도 뿌리는 하나다 — **CSS 가 "지금 실제로 보이는 높이" 를 모른다.**
 * `dvh` 로는 대신할 수 없다. 동적 뷰포트 단위는 주소창 같은 브라우저 UI 만 반영하고
 * 화면 키보드는 반영하지 않는다(viewport meta 의 `interactive-widget` 을 바꾸지 않는 한).
 *
 * 그래서 `visualViewport` 를 읽어 CSS 변수 두 개를 `<html>` 에 심는다.
 *
 * | 변수 | 뜻 |
 * |---|---|
 * | `--visual-viewport-height` | 지금 실제로 보이는 높이(키보드가 먹은 만큼 빠진 값) |
 * | `--keyboard-inset` | 레이아웃 뷰포트 바닥에서 키보드에 가려진 높이. iOS 만 0 이 아니다 |
 *
 * `visualViewport` 가 없는 환경에서는 아무것도 하지 않는다. CSS 는 `var(--x, 기본값)` 의
 * 기본값으로 떨어지므로 기존 동작 그대로다.
 */

/** 키보드를 띄우는 요소들. select 는 키보드가 아니라 선택기를 띄우므로 뺀다. */
const EDITABLE_SELECTOR = [
    'input:not([type="button"]):not([type="submit"]):not([type="reset"])',
    'input:not([type="checkbox"]):not([type="radio"]):not([type="range"])',
    "textarea",
    '[contenteditable="true"]',
].join(", ");

const isEditable = (el) => !!el && typeof el.matches === "function" && el.matches(EDITABLE_SELECTOR);

/**
 * `--visual-viewport-height` / `--keyboard-inset` 를 유지한다.
 *
 * @returns {() => void} 구독 해제 함수
 */
export function observeViewportInsets() {
    const vv = window.visualViewport;
    if (!vv) return () => {};

    const root = document.documentElement;

    const update = () => {
        root.style.setProperty("--visual-viewport-height", `${Math.round(vv.height)}px`);
        // 레이아웃 뷰포트 바닥에서 잘려 나간 높이.
        // Android 처럼 레이아웃 뷰포트까지 줄어드는 브라우저에서는 자연히 0 이 된다.
        const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
        root.style.setProperty("--keyboard-inset", `${Math.round(inset)}px`);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update);

    return () => {
        vv.removeEventListener("resize", update);
        vv.removeEventListener("scroll", update);
        window.removeEventListener("orientationchange", update);
    };
}

/**
 * 입력 중이면 `body.keyboard-open` 을 붙인다.
 *
 * 키보드가 실제로 떴는지 알려 주는 API 는 없다. 높이 변화로 추정할 수도 있지만 주소창
 * 접힘과 구분이 안 된다. 어차피 스타일을 바꾸고 싶은 상태는 "사용자가 입력 중" 이므로
 * 포커스로 판단하는 편이 정확하고 단순하다.
 *
 * @returns {() => void} 구독 해제 함수
 */
export function trackEditingState() {
    const onFocusIn = (event) => {
        if (isEditable(event.target)) document.body.classList.add("keyboard-open");
    };

    // 입력칸에서 입력칸으로 옮겨 갈 때 focusout 이 focusin 보다 먼저 온다.
    // 바로 지우면 그 사이에 고정 바가 한 번 깜빡이므로 다음 틱에 활성 요소를 보고 정한다.
    const onFocusOut = () => {
        setTimeout(() => {
            if (!isEditable(document.activeElement)) document.body.classList.remove("keyboard-open");
        }, 0);
    };

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);

    return () => {
        document.removeEventListener("focusin", onFocusIn);
        document.removeEventListener("focusout", onFocusOut);
        document.body.classList.remove("keyboard-open");
    };
}

/**
 * 포커스된 입력칸이 키보드·고정 바에 가리지 않도록 필요한 만큼만 페이지를 스크롤한다.
 *
 * 입력칸 높이를 CSS 에서 보이는 영역 안으로 묶어 두면(`max-height`), 커서를 보이게 하는
 * 일은 브라우저가 입력칸 **안에서** 알아서 한다. 이 함수는 그 전제 — *입력칸 상자 자체가
 * 보이는 영역 안에 있을 것* — 을 지키는 역할만 한다. 어긋났을 때만 움직이므로 타이핑
 * 중에 화면이 계속 흔들리지 않는다.
 *
 * @param {HTMLElement} field 감시할 입력칸
 * @param {{reservedBottom?: () => number}} [options]
 *        `reservedBottom` 은 화면 아래쪽을 덮는 고정 요소의 높이(px). 기본 0.
 * @returns {() => void} 구독 해제 함수
 */
export function keepFieldVisible(field, options = {}) {
    const vv = window.visualViewport;
    if (!vv || !field) return () => {};

    const reservedBottom = options.reservedBottom || (() => 0);
    let queued = false;

    const run = () => {
        queued = false;
        if (document.activeElement !== field) return;

        const rect = field.getBoundingClientRect();
        // getBoundingClientRect 는 레이아웃 뷰포트 기준이다. iOS 는 키보드가 뜨면 시각
        // 뷰포트만 움직이므로 offsetTop 을 더해 같은 좌표계로 맞춘다.
        const visibleTop = vv.offsetTop;
        const visibleBottom = vv.offsetTop + vv.height - reservedBottom();

        let delta = 0;
        if (rect.bottom > visibleBottom) delta = rect.bottom - visibleBottom;
        // 상자가 보이는 띠보다 작을 때만 위쪽을 맞춘다. 띠보다 크면 커서가 있는 아래쪽을
        // 살리는 편이 맞다 — 위를 맞추면 정작 입력 중인 줄이 다시 가려진다.
        if (rect.height <= visibleBottom - visibleTop && rect.top - delta < visibleTop) {
            delta = rect.top - visibleTop;
        }

        if (Math.abs(delta) > 2) window.scrollBy(0, delta);
    };

    const schedule = () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(run);
    };

    field.addEventListener("focus", schedule);
    field.addEventListener("input", schedule);
    vv.addEventListener("resize", schedule);

    return () => {
        field.removeEventListener("focus", schedule);
        field.removeEventListener("input", schedule);
        vv.removeEventListener("resize", schedule);
    };
}
