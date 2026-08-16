/**
 * 성경 족보 — 하나님 → 예수 그리스도
 * 마태복음 족보 (마태복음 1장) / 누가복음 족보 (누가복음 3장)
 *
 * 선택한 탭은 ?tab= 으로 URL 에 남긴다. 상단 공유 버튼이 쿼리를 그대로 실어 보내므로
 * 받는 사람이 같은 족보를 보게 된다. 설계 문서: docs/common/url-share.md
 */

import {readDeepLinkParams, syncDeepLinkParams} from "/js/deep-link-util.js?v=1.0";

const MATTHEW_GENEALOGY_SECTIONS = [
    {
        id: "mt-creation-to-flood",
        title: "창조에서 대홍수까지",
        subtitle: "마태복음 1:1-2 / 창세기 5장 / 역대상 1:1-4",
        people: [
            {id: 1, name: "하나님", parentId: null, generation: 0, highlight: true, note: "창조주"},
            {id: 2, name: "아담", parentId: 1, generation: 1, highlight: true, note: "첫 번째 사람"},
            {id: 3, name: "셋", parentId: 2, generation: 2, highlight: false, note: "하나님이 아담에게 죽은 아벨을 대신해 주신 아들"},
            {id: 4, name: "에노스", parentId: 3, generation: 3, highlight: false, note: ""},
            {id: 5, name: "게난", parentId: 4, generation: 4, highlight: false, note: ""},
            {id: 6, name: "마할랄렐", parentId: 5, generation: 5, highlight: false, note: ""},
            {id: 7, name: "야렛", parentId: 6, generation: 6, highlight: false, note: ""},
            {id: 8, name: "에녹", parentId: 7, generation: 7, highlight: false, note: "하나님과 동행하다 옮겨짐"},
            {id: 9, name: "므두셀라", parentId: 8, generation: 8, highlight: false, note: "성경에서 가장 오래 산 사람 (969세)"},
            {id: 10, name: "라멕", parentId: 9, generation: 9, highlight: false, note: ""},
            {id: 11, name: "노아", parentId: 10, generation: 10, highlight: true, note: "방주를 지어 대홍수에서 살아남음"},
        ]
    },
    {
        id: "mt-flood-to-abraham",
        title: "대홍수에서 아브라함까지",
        subtitle: "마태복음 1:2 / 창세기 11:10-26 / 역대상 1:24-27",
        people: [
            {id: 12, name: "셈", parentId: 11, generation: 11, highlight: false, note: "노아의 아들"},
            {id: 13, name: "아르박삿", parentId: 12, generation: 12, highlight: false, note: ""},
            {id: 14, name: "셀라", parentId: 13, generation: 13, highlight: false, note: ""},
            {id: 15, name: "에벨", parentId: 14, generation: 14, highlight: false, note: "'히브리'의 어원"},
            {id: 16, name: "벨렉", parentId: 15, generation: 15, highlight: false, note: ""},
            {id: 17, name: "르우", parentId: 16, generation: 16, highlight: false, note: ""},
            {id: 18, name: "스룩", parentId: 17, generation: 17, highlight: false, note: ""},
            {id: 19, name: "나홀", parentId: 18, generation: 18, highlight: false, note: ""},
            {id: 20, name: "데라", parentId: 19, generation: 19, highlight: false, note: ""},
            {id: 21, name: "아브라함", parentId: 20, generation: 20, highlight: true, note: "믿음의 조상, 하나님의 언약"},
        ]
    },
    {
        id: "mt-patriarchs",
        title: "족장 시대",
        subtitle: "마태복음 1:2-5 / 창세기 29-38장 / 역대상 2:1-12",
        people: [
            {id: 22, name: "이삭", parentId: 21, generation: 21, highlight: true, note: "약속의 아들"},
            {id: 23, name: "야곱(이스라엘)", parentId: 22, generation: 22, highlight: true, note: "이스라엘 12지파의 아버지"},
            {id: 24, name: "유다", parentId: 23, generation: 23, highlight: true, note: "왕의 지파"},
            {id: 25, name: "베레스", parentId: 24, generation: 24, highlight: false, note: "유다와 다말의 아들"},
            {id: 26, name: "헤스론", parentId: 25, generation: 25, highlight: false, note: ""},
            {id: 27, name: "람", parentId: 26, generation: 26, highlight: false, note: "누가복음에서는 '아르니'로 기록"},
            {id: 28, name: "암미나답", parentId: 27, generation: 27, highlight: false, note: ""},
            {id: 29, name: "나손", parentId: 28, generation: 28, highlight: false, note: ""},
            {id: 30, name: "살몬", parentId: 29, generation: 29, highlight: false, note: ""},
            {id: 31, name: "보아스", parentId: 30, generation: 30, highlight: false, note: "룻의 남편"},
            {id: 32, name: "오벳", parentId: 31, generation: 31, highlight: false, note: ""},
            {id: 33, name: "이새", parentId: 32, generation: 32, highlight: false, note: ""},
        ]
    },
    {
        id: "mt-kingdom",
        title: "왕국 시대",
        subtitle: "마태복음 1:6-11 / 역대상 3:10-16",
        people: [
            {id: 34, name: "다윗", parentId: 33, generation: 33, highlight: true, note: "이스라엘의 왕, 하나님의 마음에 합한 자"},
            {id: 35, name: "솔로몬", parentId: 34, generation: 34, highlight: true, note: "지혜의 왕, 성전 건축 (누가복음에서는 나단 계열)"},
            {id: 36, name: "르호보암", parentId: 35, generation: 35, highlight: false, note: "남유다 초대 왕"},
            {id: 37, name: "아비야", parentId: 36, generation: 36, highlight: false, note: ""},
            {id: 38, name: "아사", parentId: 37, generation: 37, highlight: false, note: ""},
            {id: 39, name: "여호사밧", parentId: 38, generation: 38, highlight: false, note: ""},
            {id: 40, name: "요람", parentId: 39, generation: 39, highlight: false, note: ""},
            {id: 41, name: "웃시야", parentId: 40, generation: 40, highlight: false, note: ""},
            {id: 42, name: "요담", parentId: 41, generation: 41, highlight: false, note: ""},
            {id: 43, name: "아하스", parentId: 42, generation: 42, highlight: false, note: ""},
            {id: 44, name: "히스기야", parentId: 43, generation: 43, highlight: false, note: "개혁 왕"},
            {id: 45, name: "므낫세", parentId: 44, generation: 44, highlight: false, note: ""},
            {id: 46, name: "아몬", parentId: 45, generation: 45, highlight: false, note: ""},
            {id: 47, name: "요시야", parentId: 46, generation: 46, highlight: false, note: "율법서 발견, 개혁"},
        ]
    },
    {
        id: "mt-exile-to-christ",
        title: "포로기에서 예수 그리스도까지",
        subtitle: "마태복음 1:12-16 / 역대상 3:17-19",
        people: [
            {id: 48, name: "여고냐", parentId: 47, generation: 47, highlight: false, note: "바벨론 포로기"},
            {id: 49, name: "스알디엘", parentId: 48, generation: 48, highlight: false, note: ""},
            {id: 50, name: "스룹바벨", parentId: 49, generation: 49, highlight: false, note: "성전 재건 지도자"},
            {id: 51, name: "아비훗", parentId: 50, generation: 50, highlight: false, note: ""},
            {id: 52, name: "엘리아김", parentId: 51, generation: 51, highlight: false, note: ""},
            {id: 53, name: "아소르", parentId: 52, generation: 52, highlight: false, note: ""},
            {id: 54, name: "사독", parentId: 53, generation: 53, highlight: false, note: ""},
            {id: 55, name: "아킴", parentId: 54, generation: 54, highlight: false, note: ""},
            {id: 56, name: "엘리웃", parentId: 55, generation: 55, highlight: false, note: ""},
            {id: 57, name: "엘르아살", parentId: 56, generation: 56, highlight: false, note: ""},
            {id: 58, name: "맛단", parentId: 57, generation: 57, highlight: false, note: ""},
            {id: 59, name: "야곱", parentId: 58, generation: 58, highlight: false, note: "누가복음에서는 '헬리'로 기록"},
            {id: 60, name: "요셉", parentId: 59, generation: 59, highlight: false, note: "마리아의 남편"},
            {id: 61, name: "예수 그리스도", parentId: 60, generation: 60, highlight: true, note: "하나님의 아들, 구세주"},
        ]
    }
];

const LUKE_GENEALOGY_SECTIONS = [
    {
        id: "lk-creation-to-flood",
        title: "창조에서 대홍수까지",
        subtitle: "누가복음 3:36-38 / 창세기 5장 / 역대상 1:1-4",
        people: [
            {id: 1, name: "하나님", parentId: null, generation: 0, highlight: true, note: "창조주"},
            {id: 2, name: "아담", parentId: 1, generation: 1, highlight: true, note: "첫 번째 사람"},
            {id: 3, name: "셋", parentId: 2, generation: 2, highlight: false, note: "하나님이 아담에게 죽은 아벨을 대신해 주신 아들"},
            {id: 4, name: "에노스", parentId: 3, generation: 3, highlight: false, note: ""},
            {id: 5, name: "게난", parentId: 4, generation: 4, highlight: false, note: ""},
            {id: 6, name: "마할랄렐", parentId: 5, generation: 5, highlight: false, note: ""},
            {id: 7, name: "야렛", parentId: 6, generation: 6, highlight: false, note: ""},
            {id: 8, name: "에녹", parentId: 7, generation: 7, highlight: false, note: "하나님과 동행하다 옮겨짐"},
            {id: 9, name: "므두셀라", parentId: 8, generation: 8, highlight: false, note: ""},
            {id: 10, name: "라멕", parentId: 9, generation: 9, highlight: false, note: ""},
            {id: 11, name: "노아", parentId: 10, generation: 10, highlight: true, note: "방주를 지어 대홍수에서 살아남음"},
        ]
    },
    {
        id: "lk-flood-to-abraham",
        title: "대홍수에서 아브라함까지",
        subtitle: "누가복음 3:34-36 / 창세기 11:10-26 / 역대상 1:24-27",
        people: [
            {id: 12, name: "셈", parentId: 11, generation: 11, highlight: false, note: "노아의 아들"},
            {id: 13, name: "아르박삿", parentId: 12, generation: 12, highlight: false, note: ""},
            {id: 14, name: "가이난", parentId: 13, generation: 13, highlight: false, note: "마태복음에는 없음 (누가복음에만 등장)"},
            {id: 15, name: "셀라", parentId: 14, generation: 14, highlight: false, note: ""},
            {id: 16, name: "에벨", parentId: 15, generation: 15, highlight: false, note: "'히브리'의 어원"},
            {id: 17, name: "벨렉", parentId: 16, generation: 16, highlight: false, note: ""},
            {id: 18, name: "르우", parentId: 17, generation: 17, highlight: false, note: ""},
            {id: 19, name: "스룩", parentId: 18, generation: 18, highlight: false, note: ""},
            {id: 20, name: "나홀", parentId: 19, generation: 19, highlight: false, note: ""},
            {id: 21, name: "데라", parentId: 20, generation: 20, highlight: false, note: ""},
            {id: 22, name: "아브라함", parentId: 21, generation: 21, highlight: true, note: "믿음의 조상, 하나님의 언약"},
        ]
    },
    {
        id: "lk-patriarchs",
        title: "족장 시대",
        subtitle: "누가복음 3:31-34 / 창세기 29-38장 / 역대상 2:1-12",
        people: [
            {id: 23, name: "이삭", parentId: 22, generation: 22, highlight: true, note: "약속의 아들"},
            {id: 24, name: "야곱(이스라엘)", parentId: 23, generation: 23, highlight: true, note: "이스라엘 12지파의 아버지"},
            {id: 25, name: "유다", parentId: 24, generation: 24, highlight: true, note: "왕의 지파"},
            {id: 26, name: "베레스", parentId: 25, generation: 25, highlight: false, note: "유다와 다말의 아들"},
            {id: 27, name: "헤스론", parentId: 26, generation: 26, highlight: false, note: ""},
            {id: 28, name: "아르니", parentId: 27, generation: 27, highlight: false, note: "마태복음에서는 '람'으로 기록"},
            {id: 29, name: "아드민", parentId: 28, generation: 28, highlight: false, note: "마태복음에는 없음 (누가복음에만 등장)"},
            {id: 30, name: "암미나답", parentId: 29, generation: 29, highlight: false, note: ""},
            {id: 31, name: "나손", parentId: 30, generation: 30, highlight: false, note: ""},
            {id: 32, name: "살라", parentId: 31, generation: 31, highlight: false, note: "마태복음에서는 '살몬'으로 기록"},
            {id: 33, name: "보아스", parentId: 32, generation: 32, highlight: false, note: "룻의 남편"},
            {id: 34, name: "오벳", parentId: 33, generation: 33, highlight: false, note: ""},
            {id: 35, name: "이새", parentId: 34, generation: 34, highlight: false, note: ""},
        ]
    },
    {
        id: "lk-david-to-zerubbabel",
        title: "다윗에서 스룹바벨까지",
        subtitle: "누가복음 3:27-31 / 역대상 3:1-19",
        people: [
            {id: 36, name: "다윗", parentId: 35, generation: 35, highlight: true, note: "이스라엘의 왕"},
            {id: 37, name: "나단", parentId: 36, generation: 36, highlight: false, note: "마태복음에서는 솔로몬 계열 (누가복음은 나단 계열)"},
            {id: 38, name: "맛다다", parentId: 37, generation: 37, highlight: false, note: ""},
            {id: 39, name: "메난", parentId: 38, generation: 38, highlight: false, note: ""},
            {id: 40, name: "멜레아", parentId: 39, generation: 39, highlight: false, note: ""},
            {id: 41, name: "엘리아김", parentId: 40, generation: 40, highlight: false, note: ""},
            {id: 42, name: "요남", parentId: 41, generation: 41, highlight: false, note: ""},
            {id: 43, name: "요셉", parentId: 42, generation: 42, highlight: false, note: ""},
            {id: 44, name: "유다", parentId: 43, generation: 43, highlight: false, note: ""},
            {id: 45, name: "시므온", parentId: 44, generation: 44, highlight: false, note: ""},
            {id: 46, name: "레위", parentId: 45, generation: 45, highlight: false, note: ""},
            {id: 47, name: "맛닷", parentId: 46, generation: 46, highlight: false, note: ""},
            {id: 48, name: "요림", parentId: 47, generation: 47, highlight: false, note: ""},
            {id: 49, name: "엘리에셀", parentId: 48, generation: 48, highlight: false, note: ""},
            {id: 50, name: "예수", parentId: 49, generation: 49, highlight: false, note: "예수 그리스도와 동명이인"},
            {id: 51, name: "엘", parentId: 50, generation: 50, highlight: false, note: ""},
            {id: 52, name: "엘마담", parentId: 51, generation: 51, highlight: false, note: ""},
            {id: 53, name: "고삼", parentId: 52, generation: 52, highlight: false, note: ""},
            {id: 54, name: "앗디", parentId: 53, generation: 53, highlight: false, note: ""},
            {id: 55, name: "멜기", parentId: 54, generation: 54, highlight: false, note: ""},
            {id: 56, name: "네리", parentId: 55, generation: 55, highlight: false, note: ""},
            {id: 57, name: "스알디엘", parentId: 56, generation: 56, highlight: false, note: ""},
            {id: 58, name: "스룹바벨", parentId: 57, generation: 57, highlight: false, note: "성전 재건 지도자"},
        ]
    },
    {
        id: "lk-zerubbabel-to-christ",
        title: "스룹바벨에서 예수 그리스도까지",
        subtitle: "누가복음 3:23-27",
        people: [
            {id: 59, name: "레사", parentId: 58, generation: 58, highlight: false, note: ""},
            {id: 60, name: "요아난", parentId: 59, generation: 59, highlight: false, note: ""},
            {id: 61, name: "요다", parentId: 60, generation: 60, highlight: false, note: ""},
            {id: 62, name: "요섹", parentId: 61, generation: 61, highlight: false, note: ""},
            {id: 63, name: "세메인", parentId: 62, generation: 62, highlight: false, note: ""},
            {id: 64, name: "맛다디아", parentId: 63, generation: 63, highlight: false, note: ""},
            {id: 65, name: "마앗", parentId: 64, generation: 64, highlight: false, note: ""},
            {id: 66, name: "낙개", parentId: 65, generation: 65, highlight: false, note: ""},
            {id: 67, name: "에슬리", parentId: 66, generation: 66, highlight: false, note: ""},
            {id: 68, name: "나훔", parentId: 67, generation: 67, highlight: false, note: ""},
            {id: 69, name: "아모스", parentId: 68, generation: 68, highlight: false, note: ""},
            {id: 70, name: "맛다디아", parentId: 69, generation: 69, highlight: false, note: ""},
            {id: 71, name: "요셉", parentId: 70, generation: 70, highlight: false, note: ""},
            {id: 72, name: "얀나", parentId: 71, generation: 71, highlight: false, note: ""},
            {id: 73, name: "멜기", parentId: 72, generation: 72, highlight: false, note: ""},
            {id: 74, name: "레위", parentId: 73, generation: 73, highlight: false, note: ""},
            {id: 75, name: "맛닷", parentId: 74, generation: 74, highlight: false, note: ""},
            {id: 76, name: "헬리", parentId: 75, generation: 75, highlight: false, note: "마태복음에서는 '야곱'으로 기록"},
            {id: 77, name: "요셉", parentId: 76, generation: 76, highlight: false, note: "마리아의 남편"},
            {id: 78, name: "예수 그리스도", parentId: 77, generation: 77, highlight: true, note: "하나님의 아들, 구세주"},
        ]
    }
];

const GENEALOGY_DATA = {
    matthew: MATTHEW_GENEALOGY_SECTIONS,
    luke: LUKE_GENEALOGY_SECTIONS,
};

const DEFAULT_TAB = "matthew";

/** 공유 링크로 들어왔으면 ?tab= 이 가리키는 족보를 연다. 없거나 모르는 값이면 기본 탭. */
function readInitialTab() {
    const tab = readDeepLinkParams().get("tab") ?? "";
    return Object.hasOwn(GENEALOGY_DATA, tab) ? tab : DEFAULT_TAB;
}

class BibleGenealogy {
    constructor() {
        this.activeTab = readInitialTab();
        this.initElements();
        this.init();
    }

    initElements() {
        this.loadingEl = document.getElementById("genealogyLoading");
        this.contentEl = document.getElementById("genealogyContent");
        this.sectionsEl = document.getElementById("genealogySections");
        this.backButton = document.getElementById("topNavBackButton");
        this.tabs = document.querySelectorAll(".genealogy-tab");
        this.scrollToTopBtn = document.getElementById("scrollToTopBtn");
    }

    init() {
        this.initNav();
        this.initTabs();
        this.initScrollToTop();
        this.render();
    }

    initScrollToTop() {
        if (!this.scrollToTopBtn) return;
        this.scrollToTopBtn.addEventListener("click", () => {
            window.scrollTo({top: 0, behavior: "smooth"});
        });
        window.addEventListener("scroll", () => {
            this.scrollToTopBtn.classList.toggle("is-visible", window.scrollY >= 300);
        }, {passive: true});
    }

    initTabs() {
        this.tabs.forEach(tab => {
            tab.addEventListener("click", () => {
                const tabKey = tab.dataset.tab;
                if (tabKey === this.activeTab) return;
                this.activeTab = tabKey;
                this.syncTabState();
                this.sectionsEl.innerHTML = "";
                this.renderSections();
                window.scrollTo({top: 0});
                syncDeepLinkParams({tab: tabKey === DEFAULT_TAB ? null : tabKey});
            });
        });
    }

    /** 탭 버튼과 패널의 활성 표시를 activeTab 에 맞춘다. 마크업 기본값은 마태복음이다. */
    syncTabState() {
        let activeTabEl = null;
        this.tabs.forEach(tab => {
            const isActive = tab.dataset.tab === this.activeTab;
            tab.classList.toggle("is-active", isActive);
            tab.setAttribute("aria-selected", String(isActive));
            if (isActive) {
                activeTabEl = tab;
            }
        });
        if (activeTabEl) {
            this.sectionsEl.setAttribute("aria-labelledby", activeTabEl.id);
        }
    }

    initNav() {
        if (!this.backButton) return;

        const pageTitleLabel = document.getElementById("pageTitleLabel");
        if (pageTitleLabel) {
            pageTitleLabel.textContent = "성경 족보";
            pageTitleLabel.classList.remove("d-none");
        }
        this.backButton.classList.remove("d-none");
        this.backButton.addEventListener("click", () => {
            window.location.href = "/web/study";
        });
    }

    render() {
        this.syncTabState();
        this.renderSections();
        this.loadingEl.classList.add("d-none");
        this.contentEl.classList.remove("d-none");
    }

    renderSections() {
        const sections = GENEALOGY_DATA[this.activeTab];
        sections.forEach((section, sectionIdx) => {
            const sectionEl = document.createElement("section");
            sectionEl.className = "genealogy-section";
            sectionEl.setAttribute("aria-label", section.title);

            sectionEl.innerHTML = `
                <div class="genealogy-section-header">
                    <h2 class="genealogy-section-title">${section.title}</h2>
                    <span class="genealogy-section-subtitle">${section.subtitle}</span>
                </div>
                <div class="genealogy-timeline" id="timeline-${section.id}"></div>
            `;

            this.sectionsEl.appendChild(sectionEl);

            const timeline = sectionEl.querySelector(`#timeline-${section.id}`);
            this.renderTimeline(timeline, section, sectionIdx, sections);
        });
    }

    renderTimeline(container, section, sectionIdx, sections) {
        const people = section.people;
        const threshold = 6;
        const showCollapse = people.length > threshold;
        const visibleInitial = 3;

        people.forEach((person, idx) => {
            const isFirst = idx === 0 && sectionIdx === 0;
            const isLast = idx === people.length - 1 && sectionIdx === sections.length - 1;
            const isHidden = showCollapse && idx >= visibleInitial && idx < people.length - 2;

            if (idx > 0) {
                const connector = document.createElement("div");
                connector.className = "genealogy-connector";
                connector.setAttribute("aria-hidden", "true");
                if (isHidden) connector.classList.add("genealogy-collapsed-item", "d-none");
                container.appendChild(connector);
            }

            const node = this.createNode(person, isFirst, isLast);
            if (isHidden) node.classList.add("genealogy-collapsed-item", "d-none");
            container.appendChild(node);

            if (showCollapse && idx === visibleInitial - 1) {
                const hiddenCount = people.length - visibleInitial - 2;
                const toggle = document.createElement("button");
                toggle.className = "genealogy-toggle";
                toggle.setAttribute("aria-expanded", "false");
                toggle.innerHTML = `<span class="genealogy-toggle-icon">+</span> ${hiddenCount}명 더 보기`;
                toggle.addEventListener("click", () => {
                    const expanded = toggle.getAttribute("aria-expanded") === "true";
                    const items = container.querySelectorAll(".genealogy-collapsed-item");
                    items.forEach(item => item.classList.toggle("d-none", expanded));
                    toggle.setAttribute("aria-expanded", String(!expanded));
                    toggle.innerHTML = expanded
                        ? `<span class="genealogy-toggle-icon">+</span> ${hiddenCount}명 더 보기`
                        : `<span class="genealogy-toggle-icon">−</span> 접기`;
                });
                container.appendChild(toggle);

                const connectorAfterToggle = document.createElement("div");
                connectorAfterToggle.className = "genealogy-connector genealogy-collapsed-item d-none";
                connectorAfterToggle.setAttribute("aria-hidden", "true");
                container.appendChild(connectorAfterToggle);
            }
        });
    }

    createNode(person, isFirst, isLast) {
        const node = document.createElement("div");
        node.className = "genealogy-node";
        if (person.highlight) node.classList.add("is-highlight");
        if (isFirst) node.classList.add("is-origin");
        if (isLast) node.classList.add("is-final");

        const noteHtml = person.note
            ? `<p class="genealogy-node-note">${person.note}</p>`
            : "";

        node.setAttribute("role", "listitem");
        node.setAttribute("aria-label", `${person.name}${person.note ? ', ' + person.note : ''}`);

        node.innerHTML = `
            <div class="genealogy-node-content">
                <span class="genealogy-node-name">${person.name}</span>
                ${noteHtml}
            </div>
        `;

        return node;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new BibleGenealogy();
});
