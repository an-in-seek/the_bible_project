/**
 * 화면 키보드(soft keyboard)가 가리는 영역을 CSS 에 노출한다.
 *
 * ## 왜 필요한가
 *
 * 키보드가 떴을 때 브라우저가 뷰포트를 어떻게 줄이는지는 두 갈래다.
 *
 * - **레이아웃 뷰포트까지 줄이는 쪽**(`resizes-content`). `window.innerHeight` 가 함께
 *   줄어서 `position: fixed; bottom: 0` 은 저절로 키보드 위에 얹히고, 문서에도 스크롤
 *   여지가 생긴다.
 * - **시각 뷰포트만 줄이는 쪽**(`resizes-visual`, iOS Safari 와 최근 안드로이드 브라우저).
 *   `window.innerHeight` 가 그대로여서 `bottom: 0` 은 키보드 **뒤** 가 되고, 문서도
 *   짧아지지 않으니 스크롤로 끌어올릴 수도 없다.
 *
 * 어느 쪽이든 뿌리는 하나다 — **CSS 가 "지금 실제로 보이는 띠" 를 모른다.** `dvh` 로는
 * 대신할 수 없다. 동적 뷰포트 단위는 주소창 같은 브라우저 UI 만 반영하고 화면 키보드는
 * 반영하지 않는다(viewport meta 의 `interactive-widget` 을 바꾸지 않는 한).
 *
 * 그래서 `visualViewport` 를 읽어 `<html>` 에 CSS 변수를 심는다.
 *
 * | 변수 | 뜻 |
 * |---|---|
 * | `--visual-viewport-height` | 지금 실제로 보이는 높이 |
 * | `--visual-viewport-offset-top` | 레이아웃 뷰포트 위쪽에서 잘려 나간 높이 |
 * | `--keyboard-inset` | 레이아웃 뷰포트 바닥에서 키보드에 가려진 높이 |
 *
 * 앞의 두 값이 곧 "보이는 띠" 다. `top: var(--visual-viewport-offset-top)` +
 * `height: var(--visual-viewport-height)` 인 `position: fixed` 상자는 두 방식 어디서나
 * 정확히 보이는 영역을 덮는다. 뷰포트를 어떻게 줄이는 브라우저인지 알 필요가 없다.
 *
 * ## 갱신이 한 번이라도 어긋나면 조용히 전부 무너진다
 *
 * 2026-08-24 의 첫 시도가 실기기에서 그대로 실패한 이유가 이것이다. 값이 낡으면
 * `bottom: var(--keyboard-inset)` 은 `bottom: 0` 이 되어 액션 바가 키보드 뒤로 들어가고,
 * 스크롤 여지를 만들어 주던 padding 도 0 이 되어 끌어올릴 수도 없다. 아무 오류도 나지
 * 않고 화면만 잘린다. 실제로 재현하면 액션 바가 화면 밖 859~915px 에 놓이고 본문
 * 입력칸이 196px 잘린 채 문서 스크롤 여지는 0 이었다.
 *
 * 그래서 읽기를 세 겹으로 두껍게 깔았다.
 *
 * - `visualViewport` 의 resize/scroll 뿐 아니라 **`window` 의 resize 도 듣는다.**
 *   레이아웃 뷰포트까지 줄이는 브라우저에서는 그쪽이 실제 신호다.
 * - 포커스가 들어오면 잠시 동안 여러 번 다시 잰다. 키보드는 애니메이션으로 올라오므로
 *   첫 이벤트의 높이는 아직 키보드가 다 올라오기 전 값일 수 있다.
 * - **0 이하는 버린다.** 레이아웃 전에 읽으면 0 이 나오는 브라우저가 있는데, 0 을 한 번
 *   심으면 `calc(var(--visual-viewport-height) - 10rem)` 이 통째로 음수가 되어 입력칸이
 *   min-height 로 주저앉는다.
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

/**
 * 이만큼 줄어들어야 화면 키보드로 본다.
 *
 * 주소창이 접히고 펴질 때도 뷰포트 높이는 변한다(안드로이드 크롬 기준 56px 안팎).
 * 그보다 넉넉히 위에 선을 그어야 스크롤만으로 레이아웃이 튀지 않는다.
 */
const MIN_KEYBOARD_HEIGHT = 150;

/** 포커스 후 다시 재는 시점(ms). 키보드가 다 올라올 때까지 걸리는 시간을 덮는다. */
const SETTLE_DELAYS = [0, 60, 160, 320, 560, 900];

const isEditable = (el) => !!el && typeof el.matches === "function" && el.matches(EDITABLE_SELECTOR);

/**
 * 보이는 띠를 CSS 변수로, 키보드 표시 여부를 `body.keyboard-open` 으로 유지한다.
 *
 * 키보드가 떴는지 알려 주는 API 는 없다. 포커스로 판단할 수도 있지만 그러면 **누르는
 * 순간 레이아웃이 바뀐다** — 입력칸에서 손을 떼기도 전에 focusout 이 먼저 오므로,
 * 화면 아래 고정된 등록 버튼을 누르면 버튼이 먼저 움직여 탭이 엉뚱한 곳에 떨어진다.
 * 높이로 판단하면 키보드가 실제로 내려가는 시점에 맞춰 바뀌므로 그 문제가 없고,
 * 하드웨어 키보드를 붙인 태블릿에서 헛되이 켜지지도 않는다.
 *
 * @returns {() => void} 구독 해제 함수
 */
export function observeSoftKeyboard() {
    const vv = window.visualViewport;
    if (!vv) return () => {};

    const root = document.documentElement;
    /** 키보드가 없을 때의 높이. 주소창이 접히면 커지므로 본 것 중 가장 큰 값을 쓴다. */
    let restHeight = 0;
    let timers = [];

    const setVar = (name, value) => {
        if (root.style.getPropertyValue(name) !== value) root.style.setProperty(name, value);
    };

    const update = () => {
        const height = vv.height;
        if (!(height > 0)) return;

        const offsetTop = Math.max(0, vv.offsetTop);
        // innerHeight 도 후보에 넣는다. 시각 뷰포트만 줄이는 브라우저에서는 키보드가
        // 이미 올라온 채로 처음 재더라도 이 값이 키보드 없는 높이를 알려 준다.
        restHeight = Math.max(restHeight, height, window.innerHeight);

        setVar("--visual-viewport-height", `${Math.round(height)}px`);
        setVar("--visual-viewport-offset-top", `${Math.round(offsetTop)}px`);
        setVar("--keyboard-inset", `${Math.round(Math.max(0, window.innerHeight - height - offsetTop))}px`);

        // 켜고 끄는 조건이 다르다.
        //
        // 켤 때는 입력 중인지까지 본다. 높이만 보면 데스크톱에서 창을 줄이는 것도
        // 키보드로 오인한다.
        //
        // 끌 때는 높이만 본다. 포커스가 빠졌다고 바로 끄면, 화면 아래 등록 버튼을
        // 누르는 순간 — 손을 떼기도 전에 focusout 이 먼저 온다 — 레이아웃이 접히면서
        // 버튼이 손가락 밑에서 사라져 탭이 엉뚱한 곳에 떨어진다. 키보드가 실제로
        // 내려갈 때까지 유지하면 클릭이 먼저 끝난다.
        const keyboardVisible = restHeight - height >= MIN_KEYBOARD_HEIGHT;
        if (!keyboardVisible) {
            document.body.classList.remove("keyboard-open");
        } else if (isEditable(document.activeElement)) {
            document.body.classList.add("keyboard-open");
        }
    };

    // 키보드는 애니메이션으로 올라온다. 첫 이벤트의 높이는 아직 중간값일 수 있다.
    const settle = () => {
        clearTimers();
        timers = SETTLE_DELAYS.map((delay) => setTimeout(update, delay));
    };

    const clearTimers = () => {
        timers.forEach(clearTimeout);
        timers = [];
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    // 레이아웃 뷰포트까지 줄이는 브라우저에서는 이쪽이 실제 신호다.
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", settle);
    window.addEventListener("load", settle);
    document.addEventListener("focusin", settle);
    document.addEventListener("focusout", settle);

    return () => {
        clearTimers();
        vv.removeEventListener("resize", update);
        vv.removeEventListener("scroll", update);
        window.removeEventListener("resize", update);
        window.removeEventListener("orientationchange", settle);
        window.removeEventListener("load", settle);
        document.removeEventListener("focusin", settle);
        document.removeEventListener("focusout", settle);
        document.body.classList.remove("keyboard-open");
    };
}

/**
 * 포커스된 입력칸이 키보드·고정 바에 가리지 않도록 필요한 만큼만 페이지를 스크롤한다.
 *
 * 보이는 띠에 폼을 통째로 맞추는 화면(→ `community-write.css` 의 패널 모드)에는 필요
 * 없다. 그쪽은 애초에 입력칸이 띠 밖으로 나가지 않는다. 이 함수는 문서가 평범하게
 * 흐르는 화면 — 데스크톱 폭이나 패널 모드를 켜지 않는 기기 — 를 위한 것이다.
 *
 * 어긋났을 때만 움직이므로 타이핑 중에 화면이 계속 흔들리지 않는다.
 *
 * @param {HTMLElement} field 감시할 입력칸
 * @param {{reservedBottom?: () => number, enabled?: () => boolean}} [options]
 *        `reservedBottom` 은 화면 아래쪽을 덮는 고정 요소의 높이(px). 기본 0.
 *        `enabled` 가 false 를 돌려주면 그 순간에는 스크롤하지 않는다.
 * @returns {() => void} 구독 해제 함수
 */
export function keepFieldVisible(field, options = {}) {
    const vv = window.visualViewport;
    if (!vv || !field) return () => {};

    const reservedBottom = options.reservedBottom || (() => 0);
    const enabled = options.enabled || (() => true);
    let queued = false;

    const run = () => {
        queued = false;
        if (document.activeElement !== field || !enabled()) return;

        const rect = field.getBoundingClientRect();
        // getBoundingClientRect 는 레이아웃 뷰포트 기준이다. 시각 뷰포트만 움직이는
        // 브라우저에서는 offsetTop 을 더해 같은 좌표계로 맞춘다.
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
