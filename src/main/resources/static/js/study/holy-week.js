/**
 * 성주간 타임라인 (Holy Week Timeline)
 * 예수님의 십자가 → 죽음 → 부활 → 승천
 */

const HOLY_WEEK_OVERVIEW = [
    {
        title: "1. 성주간이란?",
        body: "성주간(Holy Week, 고난주간)은 예수님이 예루살렘에 입성하신 종려주일부터 부활절까지의 한 주간을 말합니다. 기독교 역사에서 가장 중요한 기간으로, 예수님의 수난과 죽음, 그리고 부활의 사건이 집중되어 있습니다. 유대력으로는 니산월(3~4월경)에 해당하며, 유월절 기간과 겹칩니다."
    },
    {
        title: "2. 시간 표기",
        body: "성경의 시간 표기는 유대식 시간법을 따릅니다. 유대인의 하루는 해질 무렵(오후 6시경)에 시작되며, '제3시'는 오전 9시, '제6시'는 정오 12시, '제9시'는 오후 3시에 해당합니다. 이 타임라인에서는 유대식 시간과 현대식 시간을 함께 표기합니다."
    },
    {
        title: "3. 날짜 배경",
        body: "학자들은 예수님의 십자가 사건을 서기 30년 또는 33년 니산월 14일(금요일)로 추정합니다. 이 타임라인은 유월절 어린 양이 잡히던 니산월 14일에 예수님이 십자가에서 죽으셨다는 요한복음의 기록(요한복음 19:14, 고린도전서 5:7)을 기준으로 날짜를 정리했습니다. 이 기준을 따르면 예루살렘 입성은 '유월절 엿새 전'(요한복음 12:1)이라는 기록에 근거해 니산월 9일이 됩니다. 한편 마태·마가·누가복음은 최후의 만찬을 유월절 식사로 기록하여 하루 차이가 나는데, 이는 유대 절기 계산의 오랜 논점입니다. 참고로 니산월 10일은 유월절 어린 양을 택하여 준비하던 날이었습니다(출애굽기 12:3)."
    },
    {
        title: "4. '사흘 만에'의 계산",
        body: "금요일에 죽으시고 일요일에 다시 살아나신 것을 '사흘 만에'라 하는 것은 유대식 날짜 계산 때문입니다. 유대인은 하루의 일부만 걸쳐도 하루로 세었기에, 금요일(제1일)·토요일(제2일)·일요일(제3일)이 사흘이 됩니다. 예수님도 요나의 표적을 들어 '밤낮 사흘'(마태복음 12:40) 땅 속에 있으리라고 미리 말씀하셨습니다."
    }
];

const HOLY_WEEK_EVENTS = [
    {
        order: 1,
        phase: "passion",
        day: "일요일 (니산월 9일)",
        time: "",
        title: "예루살렘 입성 (종려주일)",
        emoji: "\uD83C\uDF3F",
        description: "예수님이 감람산에서 나귀 새끼를 타시고 예루살렘에 입성하셨습니다. 무리가 종려나무 가지를 흔들며 '호산나 다윗의 자손이여!'라고 외쳤습니다. 이는 스가랴 9:9의 메시아 예언의 성취이며, 겸손한 왕으로서의 입성을 상징합니다. 이 날이 '종려주일'(Palm Sunday)로 불리게 되었습니다.",
        verse: "마태복음 21:1-11",
        verseText: "이는 선지자로 하신 말씀을 이루려 하심이라 일렀으되 시온 딸에게 이르기를 네 왕이 네게 임하나니 그는 겸손하여 나귀 곧 멍에 메는 짐승의 새끼를 탔도다 하라 하였느니라"
    },
    {
        order: 2,
        phase: "passion",
        day: "월요일 (니산월 10일)",
        time: "",
        title: "성전 정화",
        emoji: "\uD83C\uDFDB\uFE0F",
        description: "예수님이 예루살렘 성전에 들어가 매매하는 자들을 내쫓으시고 돈 바꾸는 자들의 상을 뒤엎으셨습니다. '내 집은 기도하는 집이라 일컬음을 받으리라 하였거늘 너희는 강도의 굴혈을 만드는도다'라고 말씀하셨습니다. 이는 성전이 본래의 목적인 하나님과의 교제의 장소로 회복되어야 함을 선포하신 것입니다. 성으로 오시던 길에는 잎만 무성하고 열매 없는 무화과나무를 저주하셨는데(마가복음 11:12-14), 이는 겉모습뿐인 신앙에 대한 경고였습니다.",
        verse: "마태복음 21:12-17",
        verseText: "예수께서 성전에 들어가사 성전 안에서 매매하는 모든 자를 내어 쫓으시며 돈 바꾸는 자들의 상과 비둘기 파는 자들의 의자를 둘러 엎으시고"
    },
    {
        order: 3,
        phase: "passion",
        day: "화요일 (니산월 11일)",
        time: "",
        title: "감람산 강론",
        emoji: "\uD83D\uDCDC",
        description: "이른 아침 제자들은 전날 저주받으신 무화과나무가 뿌리째 마른 것을 보며 믿음과 기도의 교훈을 들었습니다(마가복음 11:20-24). 예수님이 성전에서 바리새인, 사두개인들과 논쟁하신 후, 감람산에서 제자들에게 종말과 재림에 관한 교훈을 주셨습니다. 이 강론에는 열 처녀 비유, 달란트 비유, 양과 염소의 심판 비유가 포함되어 있습니다. '그 날과 그 때는 아무도 모르나니 하늘의 천사들도, 아들도 모르고 오직 아버지만 아시느니라'고 말씀하시며 깨어 준비할 것을 가르치셨습니다.",
        verse: "마태복음 24:1-25:46",
        verseText: "예수께서 성전에서 나와서 가실 때에 제자들이 성전 건물들을 가리켜 보이려고 나아오니 대답하여 가라사대 너희가 이 모든 것을 보지 못하느냐 내가 진실로 너희에게 이르노니 돌 하나도 돌 위에 남지 않고 다 무너뜨리우리라"
    },
    {
        order: 4,
        phase: "passion",
        day: "수요일 (니산월 12일)",
        time: "",
        title: "배신의 모의와 베다니 향유 부음",
        emoji: "\uD83C\uDFFA",
        description: "대제사장들과 장로들이 예수를 잡아 죽이려는 모의를 하는 동안, 베다니에서 한 여인이 값비싼 나드 향유를 예수님의 머리에 부었습니다. 제자들이 낭비라고 비난하자 예수님은 '내 장사를 위하여 한 일'이라고 말씀하셨습니다. 같은 시기에 가룟 유다가 대제사장들에게 가서 은 삼십에 예수를 넘기기로 약속했습니다.",
        verse: "마태복음 26:1-16",
        verseText: "그 때에 대제사장들과 백성의 장로들이 가야바라 하는 대제사장의 아문에 모여 예수를 궤계로 잡아 죽이려고 의논하되"
    },
    {
        order: 5,
        phase: "passion",
        day: "목요일 저녁 (니산월 14일 시작)",
        time: "저녁 (해질 무렵)",
        title: "최후의 만찬",
        emoji: "\uD83C\uDF5E",
        description: "예수님이 제자들과 유월절 식사를 나누셨습니다. 이 자리에서 떡과 포도주로 새 언약을 세우시며 '이것은 너희를 위하여 주는 내 몸이라' 하셨습니다. 또한 제자들의 발을 씻기시며 섬김의 본을 보이셨고, 유다의 배신을 예고하셨습니다. 이 만찬은 오늘날 성찬(Holy Communion)의 기원이 되었습니다.",
        verse: "마태복음 26:17-30",
        verseText: "저희가 먹을 때에 예수께서 떡을 가지사 축복하시고 떼어 제자들을 주시며 가라사대 받아 먹으라 이것이 내 몸이니라 하시고"
    },
    {
        order: 6,
        phase: "passion",
        day: "목요일 밤 (니산월 14일)",
        time: "밤",
        title: "겟세마네 기도",
        emoji: "\uD83C\uDF19",
        description: "최후의 만찬 후 예수님은 겟세마네 동산으로 가셔서 간절히 기도하셨습니다. '내 아버지여 만일 할만하시거든 이 잔을 내게서 지나가게 하옵소서 그러나 나의 원대로 마옵시고 아버지의 원대로 하옵소서'라고 세 번 기도하셨습니다. 땀이 핏방울 같이 떨어졌다고 누가복음은 기록합니다. 이는 예수님의 완전한 인성과 완전한 순종을 보여주는 장면입니다.",
        verse: "마태복음 26:36-46",
        verseText: "조금 나아가사 얼굴을 땅에 대시고 엎드려 기도하여 가라사대 내 아버지여 만일 할만하시거든 이 잔을 내게서 지나가게 하옵소서 그러나 나의 원대로 마옵시고 아버지의 원대로 하옵소서 하시고"
    },
    {
        order: 7,
        phase: "passion",
        day: "목요일 밤 ~ 금요일 아침",
        time: "밤 ~ 이른 아침",
        title: "체포와 재판",
        emoji: "\u2696\uFE0F",
        description: "유다의 입맞춤으로 예수님이 체포되신 후, 밤새 여러 차례 재판을 받으셨습니다. 먼저 대제사장 가야바 앞에서 유대 산헤드린 공회의 종교 재판을 받으셨고, 새벽에 로마 총독 빌라도 앞에 서셨습니다. 빌라도는 예수님에게서 죄를 찾지 못했으나, 무리의 압력에 의해 십자가형을 선고했습니다. 그 사이 베드로는 세 번 예수님을 부인했습니다.",
        verse: "마태복음 26:47-27:26",
        verseText: "말씀하실 때에 열둘 중에 하나인 유다가 왔는데 대제사장들과 백성의 장로들에게서 파송된 큰 무리가 검과 몽치를 가지고 그와 함께 하였더라"
    },
    {
        order: 8,
        phase: "passion",
        day: "금요일 (니산월 14일)",
        time: "오전 9시경 (제3시)",
        title: "십자가 처형",
        emoji: "\u271D\uFE0F",
        description: "예수님이 골고다(해골의 장소)에서 십자가에 못 박히셨습니다. 마가복음은 제3시(오전 9시경)에 십자가에 달리셨다고 기록합니다. 두 강도 사이에서 십자가에 달리신 예수님은 '아버지여 저희를 사하여 주옵소서 자기의 하는 것을 알지 못함이니이다'라고 기도하셨습니다. 머리 위에는 '유대인의 왕 나사렛 예수'라는 죄패가 걸렸습니다.",
        verse: "마가복음 15:25-32",
        verseText: "때가 제삼시가 되어 십자가에 못 박으니라 그 위에 있는 죄패에 유대인의 왕이라 썼고"
    },
    {
        order: 9,
        phase: "passion",
        day: "금요일 (니산월 14일)",
        time: "오후 3시경 (제9시)",
        title: "예수님의 죽음",
        emoji: "\uD83D\uDD4A\uFE0F",
        description: "제6시(정오)부터 제9시(오후 3시)까지 온 땅에 어둠이 임했습니다. 제9시에 예수님이 '엘리 엘리 라마 사박다니'(나의 하나님 나의 하나님 어찌하여 나를 버리셨나이까)라고 크게 소리치셨고, '다 이루었다'(요한복음 19:30)고 말씀하신 후 숨을 거두셨습니다. 개역한글은 마태복음 27:46과 마가복음 15:34을 모두 '엘리 엘리'로 옮겼으나, 헬라어 원문은 마가복음에서 '엘로이 엘로이'(Ἐλωΐ)로 조금 다르게 기록되어 있습니다. 이때 성전 휘장이 위에서 아래로 둘로 찢어지고, 땅이 진동하며 바위가 터졌습니다.",
        verse: "마가복음 15:33-39",
        verseText: "제육시가 되매 온 땅에 어두움이 임하여 제구시까지 계속하더니 제구시에 예수께서 크게 소리지르시되 엘리 엘리 라마 사박다니 하시니 이를 번역하면 나의 하나님 나의 하나님 어찌하여 나를 버리셨나이까 하는 뜻이라"
    },
    {
        order: 10,
        phase: "passion",
        day: "금요일 저녁 (니산월 14일)",
        time: "해지기 전",
        title: "장사 (무덤에 묻히심)",
        emoji: "\uD83E\uDEA8",
        description: "아리마대 요셉이 빌라도에게 예수님의 시신을 요청하여 세마포로 싸서 바위를 파낸 새 무덤에 안치했습니다. 유대 규정에 따라 안식일(해질 무렵) 전에 장사를 마쳐야 했기에 서둘러 진행되었습니다. 무덤 입구에 큰 돌을 굴려 막았고, 막달라 마리아와 다른 마리아가 무덤을 마주 대하여 앉아 지켜보았습니다. 토요일(안식일)에는 침묵 속에서 제자들은 두려움과 슬픔에 잠겼습니다.",
        verse: "마태복음 27:57-61",
        verseText: "저물었을 때에 아리마대 부자 요셉이라 하는 사람이 왔으니 그도 예수의 제자라 빌라도에게 가서 예수의 시체를 달라 하니 이에 빌라도가 내어 주라 분부하거늘"
    },
    {
        order: 11,
        phase: "glory",
        day: "일요일 이른 아침 (니산월 16일)",
        time: "새벽",
        title: "부활",
        emoji: "\u2728",
        description: "안식일이 지난 첫날 새벽, 여인들이 향료를 가지고 무덤을 찾았을 때 돌이 이미 굴려져 있었고, 천사가 '그가 여기 계시지 않고 그의 말씀하시던 대로 살아나셨느니라'고 전했습니다. 부활은 기독교 신앙의 핵심이며, 예수님이 죄와 죽음을 이기신 결정적 사건입니다. 바울은 '그리스도께서 다시 사신 것이 없으면 너희의 믿음도 헛되고'(고린도전서 15:17)라고 선언합니다. 유대 절기로는 첫 이삭을 흔들어 드리는 초실절(레위기 23:10-11)에 해당하여, 바울은 예수님을 '잠자는 자들의 첫 열매'(고린도전서 15:20)라 부릅니다.",
        verse: "마태복음 28:1-6",
        verseText: "안식일이 다하여 가고 안식 후 첫날이 되려는 미명에 막달라 마리아와 다른 마리아가 무덤을 보려고 왔더니 큰 지진이 나며 주의 천사가 하늘로서 내려와 돌을 굴려 내고 그 위에 앉았는데"
    },
    {
        order: 12,
        phase: "glory",
        day: "부활 후 40일간",
        time: "",
        title: "부활 후 현현",
        emoji: "\uD83D\uDC65",
        description: "예수님은 부활 후 40일 동안 여러 차례 제자들에게 나타나셨습니다. 막달라 마리아에게 처음 나타나셨고, 엠마오로 가는 두 제자에게, 다락방의 열한 제자에게, 디베랴 바닷가에서 일곱 제자에게 나타나셨습니다. 의심하던 도마에게도 나타나 못 자국을 보여 주셨습니다. 바울은 한 번에 오백여 형제에게 나타나셨다고 기록합니다. 이 현현들은 부활의 역사적 사실성을 증거합니다.",
        verse: "사도행전 1:3",
        verseText: "해 받으신 후에 또한 저희에게 확실한 많은 증거로 친히 사심을 나타내사 사십 일 동안 저희에게 보이시며 하나님 나라의 일을 말씀하시니라"
    },
    {
        order: 13,
        phase: "glory",
        day: "부활 후 40일째",
        time: "",
        title: "승천",
        emoji: "\u2601\uFE0F",
        description: "예수님은 감람산에서 제자들이 보는 앞에서 하늘로 올라가셨습니다. '예루살렘과 온 유대와 사마리아와 땅 끝까지 이르러 내 증인이 되리라'는 마지막 명령을 남기셨습니다. 구름이 예수님을 가려 보이지 않게 되었을 때, 흰옷 입은 두 사람이 나타나 '이 예수는 하늘로 가심을 본 그대로 오시리라'고 재림을 약속했습니다. 승천은 예수님의 지상 사역의 완성이며, 보혜사 성령 강림의 전제가 됩니다.",
        verse: "사도행전 1:9-11",
        verseText: "이 말씀을 마치시고 저희 보는 데서 올리워 가시니 구름이 저를 가리워 보이지 않게 하더라"
    }
];

class HolyWeek {
    constructor() {
        this.initElements();
        this.init();
    }

    initElements() {
        this.loadingEl = document.getElementById("holyWeekLoading");
        this.contentEl = document.getElementById("holyWeekContent");
        this.overviewEl = document.getElementById("holyWeekOverview");
        this.gridEl = document.getElementById("holyWeekGrid");
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
            pageTitleLabel.textContent = "성주간 타임라인";
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
        this.renderOverview();
        this.renderCards();
        this.loadingEl.classList.add("d-none");
        this.contentEl.classList.remove("d-none");
    }

    renderOverview() {
        const items = HOLY_WEEK_OVERVIEW.map((s, idx) => {
            const title = s.title.replace(/^\d+\.\s*/, "");
            return `
            <div class="holy-week-overview-item">
                <span class="holy-week-overview-num" aria-hidden="true">${idx + 1}</span>
                <div>
                    <p class="holy-week-overview-item-title">${title}</p>
                    <p class="holy-week-overview-item-body">${s.body}</p>
                </div>
            </div>
        `;
        }).join("");

        const isMobile = window.innerWidth <= 576;

        this.overviewEl.innerHTML = `
            <details class="holy-week-overview-inner"${isMobile ? "" : " open"}>
                <summary>
                    <h2 class="holy-week-overview-title">성주간의 의미와 배경</h2>
                    <span class="holy-week-overview-toggle" aria-hidden="true">▾</span>
                </summary>
                <div class="holy-week-overview-body">${items}</div>
            </details>
        `;
    }

    renderCards() {
        HOLY_WEEK_EVENTS.forEach((event) => {
            if (event.order === 11) {
                const divider = document.createElement("div");
                divider.className = "holy-week-divider";
                divider.innerHTML = `
                    <span class="holy-week-divider-text">안식일의 침묵</span>
                    <span class="holy-week-divider-sub">토요일 (니산월 15일) — 무덤 속의 고요</span>
                `;
                this.gridEl.appendChild(divider);
            }

            const card = this.createCard(event);
            this.gridEl.appendChild(card);
        });
    }

    createCard(event) {
        const card = document.createElement("div");
        card.className = `holy-week-card holy-week-card--${event.phase}`;
        card.id = `event-${event.order}`;
        card.dataset.phase = event.phase;

        const phaseLabel = event.phase === "glory" ? "영광 단계" : "고난 단계";
        const timeHtml = event.time
            ? `<span class="holy-week-card-time">${event.time}</span>`
            : "";

        card.innerHTML = `
            <div class="holy-week-card-header" role="group" aria-label="${event.title}">
                <span class="visually-hidden">${phaseLabel}, ${event.order}번째 사건</span>
                <span class="holy-week-card-order">${event.order}</span>
                <span class="holy-week-card-day">${event.day}</span>
                ${timeHtml}
            </div>
            <div class="holy-week-card-body">
                <h3 class="holy-week-card-title">
                    <span class="holy-week-card-title-emoji" aria-hidden="true">${event.emoji}</span>${event.title}
                </h3>
                <p class="holy-week-card-desc">${event.description}</p>
                <div class="holy-week-card-verse">
                    <span class="holy-week-card-verse-label">함께 읽는 말씀</span>
                    <span class="holy-week-card-verse-ref">${event.verse}</span>
                    <p class="holy-week-card-verse-text">${event.verseText}</p>
                </div>
            </div>
        `;

        return card;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new HolyWeek();
});
