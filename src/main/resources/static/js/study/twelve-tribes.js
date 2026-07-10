/**
 * 이스라엘 12지파
 * 야곱의 열두 아들로부터 시작된 이스라엘의 12지파
 */

const MOTHERS = {
    leah: {label: "레아"},
    rachel: {label: "라헬"},
    bilhah: {label: "빌하"},
    zilpah: {label: "실바"}
};

const TWELVE_TRIBES = [
    {
        name: "르우벤",
        ancestor: "르우벤",
        mother: "레아",
        motherKey: "leah",
        meaning: "보라, 아들이다",
        symbol: "끓는 물 (불안정)",
        territory: "요단 동편 남부 (헤스본 일대)",
        blessing: "야곱의 장자였으나 아버지의 침상을 더럽힌 죄로 장자권을 잃었다.",
        verse: "창세기 49:3-4",
        verseText: "르우벤아 너는 내 장자요 나의 능력이요 나의 기력의 시작이라 위풍이 월등하고 권능이 탁월하도다마는 물의 끓음 같았은즉 너는 탁월하지 못하리니 네가 아버지의 침상에 올라 더럽혔음이로다"
    },
    {
        name: "시므온",
        ancestor: "시므온",
        mother: "레아",
        motherKey: "leah",
        meaning: "들으심",
        symbol: "칼",
        territory: "유다 남부에 흡수 (브엘세바 일대)",
        blessing: "레위와 함께 세겜 사건에서 분노하여 학살을 행했고, 야곱에게 저주를 받았다.",
        verse: "창세기 49:5-7",
        verseText: "시므온과 레위는 형제요 그들의 칼은 폭력의 도구로다 내 혼아 그들의 모의에 상관하지 말지어다"
    },
    {
        name: "레위",
        ancestor: "레위",
        mother: "레아",
        motherKey: "leah",
        meaning: "결합",
        symbol: "제사장직 (우림과 둠밈)",
        territory: "기업 없음 · 전국 48 레위 성읍",
        blessing: "제사장 지파로 선택되어 성막과 성전에서 하나님을 섬겼다. 땅의 기업 대신 하나님이 기업이 되셨다.",
        verse: "신명기 33:8-10",
        verseText: "레위에 대하여는 일렀으되 주의 둠밈과 우림이 주의 경건한 자에게 있도다 ... 주의 법도를 야곱에게, 주의 율법을 이스라엘에게 가르치며"
    },
    {
        name: "유다",
        ancestor: "유다",
        mother: "레아",
        motherKey: "leah",
        meaning: "찬양",
        symbol: "사자",
        territory: "가나안 남부 산지 (헤브론·베들레헴 일대)",
        blessing: "왕의 지파로, 다윗 왕과 예수 그리스도가 이 지파에서 나셨다. 홀이 유다를 떠나지 않을 것이라 예언되었다.",
        verse: "창세기 49:8-10",
        verseText: "유다야 너는 네 형제의 찬송이 될지라 ... 홀이 유다를 떠나지 아니하며 통치자의 지팡이가 그 발 사이에서 떠나지 아니하시기를 실로가 오시기까지 미치리니"
    },
    {
        name: "단",
        ancestor: "단",
        mother: "빌하 (라헬의 여종)",
        motherKey: "bilhah",
        meaning: "심판",
        symbol: "뱀",
        territory: "중서부 해안 → 후에 북단(라이스)으로 이주",
        blessing: "백성을 심판하는 지파로 예언되었다. 삼손이 이 지파에서 나왔다.",
        verse: "창세기 49:16-17",
        verseText: "단은 이스라엘의 한 지파 같이 그의 백성을 심판하리로다 단은 길의 뱀이요 첩경의 독사리로다"
    },
    {
        name: "납달리",
        ancestor: "납달리",
        mother: "빌하 (라헬의 여종)",
        motherKey: "bilhah",
        meaning: "나의 씨름",
        symbol: "암사슴",
        territory: "북부 갈릴리 (갈릴리 호수 서북)",
        blessing: "놓인 암사슴 같이 아름다운 말을 하는 지파로 축복받았다.",
        verse: "창세기 49:21",
        verseText: "납달리는 놓인 암사슴이라 아름다운 소리를 발하는도다"
    },
    {
        name: "갓",
        ancestor: "갓",
        mother: "실바 (레아의 여종)",
        motherKey: "zilpah",
        meaning: "행운",
        symbol: "군대",
        territory: "요단 동편 중부 (길르앗)",
        blessing: "군대의 침략을 받으나 도리어 그 뒤를 추격하는 용맹한 지파로 예언되었다.",
        verse: "창세기 49:19",
        verseText: "갓은 군대의 추격을 받으나 도리어 그 뒤를 추격하리로다"
    },
    {
        name: "아셀",
        ancestor: "아셀",
        mother: "실바 (레아의 여종)",
        motherKey: "zilpah",
        meaning: "행복",
        symbol: "기름진 음식",
        territory: "서북 해안 (갈멜산 북쪽~시돈 방면)",
        blessing: "기름진 음식을 산출하여 왕의 진수를 공급하는 풍요로운 지파로 축복받았다.",
        verse: "창세기 49:20",
        verseText: "아셀에게서 나는 먹을 것은 기름진 것이라 그가 왕의 진수를 공급하리로다"
    },
    {
        name: "잇사갈",
        ancestor: "잇사갈",
        mother: "레아",
        motherKey: "leah",
        meaning: "삯, 보상",
        symbol: "나귀",
        territory: "이스르엘 평야",
        blessing: "힘센 나귀 같이 인내하며 노동하는 지파로 묘사되었다.",
        verse: "창세기 49:14-15",
        verseText: "잇사갈은 양 우리 사이에 꿇어앉은 건장한 나귀로다 그는 쉴 곳을 보고 좋게 여기며 토지를 보고 아름답게 여기고 어깨를 내려 짐을 메고 압제 아래에서 섬기리로다"
    },
    {
        name: "스불론",
        ancestor: "스불론",
        mother: "레아",
        motherKey: "leah",
        meaning: "거처",
        symbol: "배 (해변)",
        territory: "하부 갈릴리 내륙 (나사렛 일대)",
        blessing: "해변에 거하며 배가 대는 해안에 사는 지파로 예언되었다.",
        verse: "창세기 49:13",
        verseText: "스불론은 해변에 거하리니 그 곳은 배 매는 해변이라 그의 경계가 시돈까지리로다"
    },
    {
        name: "요셉 (에브라임/므낫세)",
        ancestor: "요셉",
        mother: "라헬",
        motherKey: "rachel",
        meaning: "더하심",
        symbol: "무성한 가지",
        territory: "중앙 산지 (에브라임·므낫세) + 요단 동편 북부",
        blessing: "야곱의 가장 큰 축복을 받았다. 두 아들 에브라임과 므낫세가 각각 한 지파가 되었다. 전능자의 축복으로 풍성함을 누리리라 예언되었다.",
        verse: "창세기 49:22-26",
        verseText: "요셉은 무성한 가지 곧 샘 곁의 무성한 가지라 그 가지가 담을 넘었도다 ... 네 아버지의 축복이 내 선조의 축복보다 나아서 영원한 산이 한 없음 같이 이것이 요셉의 머리에 있으며"
    },
    {
        name: "베냐민",
        ancestor: "베냐민",
        mother: "라헬",
        motherKey: "rachel",
        meaning: "오른손의 아들",
        symbol: "이리",
        territory: "유다와 에브라임 사이 (예루살렘·여리고 일대)",
        blessing: "이리 같이 물어뜯는 용맹한 지파로 예언되었다. 사울 왕과 사도 바울이 이 지파 출신이다.",
        verse: "창세기 49:27",
        verseText: "베냐민은 물어뜯는 이리라 아침에는 빼앗은 것을 먹고 저녁에는 움킨 것을 나누리로다"
    }
];

class TwelveTribes {
    constructor() {
        this.initElements();
        this.init();
    }

    initElements() {
        this.loadingEl = document.getElementById("tribesLoading");
        this.contentEl = document.getElementById("tribesContent");
        this.gridEl = document.getElementById("tribesGrid");
        this.backButton = document.getElementById("topNavBackButton");
        this.scrollToTopBtn = document.getElementById("scrollToTopBtn");
    }

    init() {
        this.initNav();
        this.initScrollToTop();
        this.render();
    }

    initNav() {
        if (!this.backButton) return;

        const pageTitleLabel = document.getElementById("pageTitleLabel");
        if (pageTitleLabel) {
            pageTitleLabel.textContent = "이스라엘 12지파";
            pageTitleLabel.classList.remove("d-none");
        }
        this.backButton.classList.remove("d-none");
        this.backButton.addEventListener("click", () => {
            window.location.href = "/web/study";
        });
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

    render() {
        TWELVE_TRIBES.forEach((tribe, idx) => {
            const card = this.createCard(tribe, idx + 1);
            this.gridEl.appendChild(card);
        });
        this.loadingEl.classList.add("d-none");
        this.contentEl.classList.remove("d-none");
    }

    createCard(tribe, order) {
        const mother = MOTHERS[tribe.motherKey] || {label: tribe.mother};
        const card = document.createElement("article");
        card.className = "tribe-card";
        card.dataset.mother = tribe.motherKey;
        card.style.setProperty("--i", String(order - 1));

        card.innerHTML = `
            <header class="tribe-card-header">
                <span class="tribe-card-order" aria-hidden="true">${order}</span>
                <div class="tribe-card-heading">
                    <h3 class="tribe-card-name">${tribe.name}</h3>
                    <p class="tribe-card-meaning">
                        <span class="tribe-card-meaning-label">뜻</span>
                        <span>${tribe.meaning}</span>
                    </p>
                </div>
                <span class="tribe-card-mother">${mother.label}</span>
            </header>
            <div class="tribe-card-body">
                <dl class="tribe-card-facts">
                    <div class="tribe-card-fact">
                        <dt class="tribe-card-fact-label">상징</dt>
                        <dd class="tribe-card-fact-value">${tribe.symbol}</dd>
                    </div>
                    <div class="tribe-card-fact">
                        <dt class="tribe-card-fact-label">영토</dt>
                        <dd class="tribe-card-fact-value">${tribe.territory}</dd>
                    </div>
                </dl>
                <p class="tribe-card-blessing">${tribe.blessing}</p>
                <blockquote class="tribe-card-verse">
                    <cite class="tribe-card-verse-ref">${tribe.verse}</cite>
                    <p class="tribe-card-verse-text">${tribe.verseText}</p>
                </blockquote>
            </div>
        `;

        return card;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new TwelveTribes();
});
