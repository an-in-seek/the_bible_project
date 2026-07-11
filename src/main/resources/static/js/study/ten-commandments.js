/**
 * 십계명 (Ten Commandments)
 * 출애굽기 20:1-17 기반 계명별 설명
 * 인용 성경은 앱 표준 번역(개역한글, KRV) 본문을 따른다.
 */

const TEN_COMMANDMENTS = [
    {
        category: "하나님과의 관계",
        text: "나는 너를 애굽 땅 종 되었던 집에서 인도하여 낸 너의 하나님 여호와로라 너는 나 외에는 다른 신들을 네게 있게 말지니라",
        summary: "나 외에는 다른 신들을 네게 두지 말라",
        meaning: "제1계명은 십계명 전체의 토대입니다. 하나님은 먼저 '내가 너를 인도하여 낸 네 하나님'이라고 자신을 소개하시며, 계명에 앞서 구원의 은혜를 선언하십니다. 이는 십계명이 구원의 조건이 아니라 구원받은 백성의 응답임을 보여줍니다. '다른 신들을 두지 말라'는 하나님만이 유일한 예배와 신뢰의 대상이심을 선포합니다. 이것은 단순히 우상 숭배 금지를 넘어, 하나님보다 앞세우는 모든 것—돈, 명예, 권력, 쾌락—을 경계하라는 뜻입니다.",
        verse: "출애굽기 20:2-3",
        relatedVerse: "마태복음 4:10",
        relatedVerseText: "이에 예수께서 말씀하시되 사단아 물러가라 기록되었으되 주 너의 하나님께 경배하고 다만 그를 섬기라 하였느니라"
    },
    {
        category: "하나님과의 관계",
        text: "너를 위하여 새긴 우상을 만들지 말고 또 위로 하늘에 있는 것이나 아래로 땅에 있는 것이나 땅 아래 물 속에 있는 것의 아무 형상이든지 만들지 말며 그것들에게 절하지 말며 그것들을 섬기지 말라",
        summary: "너를 위하여 새긴 우상을 만들지 말라",
        meaning: "제2계명은 하나님을 어떻게 예배할 것인가에 관한 것입니다. 하나님은 형상으로 표현될 수 없는 영적 존재이시므로, 어떤 물질적 형태로든 하나님을 묘사하거나 대체하려는 시도를 금하십니다. 고대 근동의 모든 민족이 신상을 만들어 섬기던 시대에 이 계명은 혁명적이었습니다. 보이는 것에 의지하려는 인간의 본성을 넘어, 보이지 않는 하나님을 믿음으로 신뢰하라는 부르심입니다.",
        verse: "출애굽기 20:4-6",
        relatedVerse: "요한일서 5:21",
        relatedVerseText: "자녀들아 너희 자신을 지켜 우상에서 멀리 하라"
    },
    {
        category: "하나님과의 관계",
        text: "너는 너의 하나님 여호와의 이름을 망령되이 일컫지 말라 나 여호와의 이름을 망령되이 일컫는 자를 죄없다 하지 아니하리라",
        summary: "여호와의 이름을 망령되이 일컫지 말라",
        meaning: "제3계명에서 '이름'은 히브리 문화에서 그 존재의 본질과 성품 전체를 대표합니다. '망령되이'(라쇼)는 '헛되이, 공허하게'라는 뜻으로, 하나님의 이름을 가볍게 여기거나 거짓 맹세에 사용하거나 자기 이익을 위해 남용하는 행위를 금합니다. 이 계명은 단순히 '하나님' 이름을 욕설처럼 쓰지 말라는 것을 넘어, 하나님의 이름으로 거짓을 말하거나 하나님의 뜻이라 주장하며 사람들을 속이는 모든 행위를 포함합니다.",
        verse: "출애굽기 20:7",
        relatedVerse: "마태복음 5:33-37",
        relatedVerseText: "또 옛 사람에게 말한 바 헛 맹세를 하지 말고 네 맹세한 것을 주께 지키라 하였다는 것을 너희가 들었으나 나는 너희에게 이르노니 도무지 맹세하지 말찌니 하늘로도 말라 이는 하나님의 보좌임이요"
    },
    {
        category: "하나님과의 관계",
        text: "안식일을 기억하여 거룩히 지키라 엿새 동안은 힘써 네 모든 일을 행할 것이나 제칠일은 너의 하나님 여호와의 안식일인즉 너나 네 아들이나 네 딸이나 네 남종이나 네 여종이나 네 육축이나 네 문안에 유하는 객이라도 아무 일도 하지 말라",
        summary: "안식일을 기억하여 거룩히 지키라",
        meaning: "제4계명은 시간의 거룩함에 관한 것입니다. 출애굽기에서는 창조의 안식(창세기 2:2-3)을, 신명기에서는 이집트 해방(신명기 5:15)을 안식일의 근거로 제시합니다. 안식일은 단순한 휴식이 아니라, 하나님이 창조주이시며 해방자이심을 기억하고 그분께 시간을 구별하여 드리는 날입니다. 주목할 점은 종과 객, 가축까지 쉬게 하라는 사회적 배려가 포함된 것입니다. 안식은 인간의 존엄과 평등을 실현하는 제도이기도 합니다.",
        verse: "출애굽기 20:8-11",
        relatedVerse: "마가복음 2:27-28",
        relatedVerseText: "또 가라사대 안식일은 사람을 위하여 있는 것이요 사람이 안식일을 위하여 있는 것이 아니니 이러므로 인자는 안식일에도 주인이니라"
    },
    {
        category: "사람과의 관계",
        text: "네 부모를 공경하라 그리하면 너의 하나님 나 여호와가 네게 준 땅에서 네 생명이 길리라",
        summary: "네 부모를 공경하라",
        meaning: "제5계명은 두 번째 돌판(사람과의 관계)의 시작이며, 약속이 따르는 유일한 계명입니다. '공경하라'(카베드)의 원뜻은 '무겁게 여기다'로, 부모를 가벼이 여기지 말고 존중하라는 의미입니다. 이 계명은 어린 자녀만을 대상으로 하지 않으며, 성인이 된 후에도 노부모를 돌보고 존경하라는 뜻을 포함합니다. 부모 공경은 가정이라는 사회의 기본 단위를 세우는 토대이며, 모든 권위 관계에 대한 원리를 제시합니다.",
        verse: "출애굽기 20:12",
        relatedVerse: "에베소서 6:1-3",
        relatedVerseText: "자녀들아 너희 부모를 주 안에서 순종하라 이것이 옳으니라 네 아버지와 어머니를 공경하라 이것이 약속 있는 첫 계명이니 이는 네가 잘 되고 땅에서 장수하리라"
    },
    {
        category: "사람과의 관계",
        text: "살인하지 말지니라",
        summary: "살인하지 말라",
        meaning: "제6계명의 '살인'(라차흐)은 불법적이고 의도적인 인명 살해를 가리킵니다. 이 계명은 인간 생명의 절대적 존엄성을 선포합니다. 인간은 하나님의 형상(이마고 데이)으로 창조되었기에 어떤 사람의 생명도 함부로 빼앗을 수 없습니다. 예수님은 산상수훈에서 이 계명을 더 깊이 해석하셔서, 형제를 향한 분노와 모욕까지도 살인의 뿌리로 지적하셨습니다(마태복음 5:21-22). 생명을 해치는 마음의 상태까지 경계하라는 가르침입니다.",
        verse: "출애굽기 20:13",
        relatedVerse: "마태복음 5:21-22",
        relatedVerseText: "옛 사람에게 말한 바 살인치 말라 누구든지 살인하면 심판을 받게 되리라 하였다는 것을 너희가 들었으나 나는 너희에게 이르노니 형제에게 노하는 자마다 심판을 받게 되고"
    },
    {
        category: "사람과의 관계",
        text: "간음하지 말지니라",
        summary: "간음하지 말라",
        meaning: "제7계명은 결혼의 거룩함과 부부 사이의 신실함을 보호합니다. 간음 금지는 단순히 성적 순결의 문제를 넘어, 언약적 관계에 대한 충실함의 원리를 담고 있습니다. 성경에서 결혼은 하나님과 그 백성의 관계를 반영하는 언약이므로, 간음은 인간 관계의 가장 깊은 신뢰를 배반하는 행위입니다. 예수님은 이 계명을 마음의 차원으로 확장하셔서, 음욕을 품는 것 자체가 마음으로 간음하는 것이라 가르치셨습니다(마태복음 5:27-28).",
        verse: "출애굽기 20:14",
        relatedVerse: "마태복음 5:27-28",
        relatedVerseText: "또 간음치 말라 하였다는 것을 너희가 들었으나 나는 너희에게 이르노니 여자를 보고 음욕을 품는 자마다 마음에 이미 간음하였느니라"
    },
    {
        category: "사람과의 관계",
        text: "도적질하지말지니라",
        summary: "도적질하지 말라",
        meaning: "제8계명은 타인의 소유권과 재산을 보호합니다. 도둑질 금지는 개인의 노동 결과와 소유물에 대한 정당한 권리를 인정하는 것이며, 동시에 정직과 공정의 원리를 세우는 것입니다. 이 계명은 물질적 절도뿐 아니라, 부당한 이득, 속임수를 통한 이익, 타인의 시간이나 노력을 착취하는 행위까지 포괄합니다. 바울은 이 계명을 적극적으로 해석하여 도둑질하던 자에게 이제는 손으로 수고하여 도리어 가난한 자를 구제하라고 가르칩니다(에베소서 4:28).",
        verse: "출애굽기 20:15",
        relatedVerse: "에베소서 4:28",
        relatedVerseText: "도적질하는 자는 다시 도적질 하지 말고 돌이켜 빈궁한 자에게 구제할 것이 있기 위하여 제 손으로 수고하여 선한 일을 하라"
    },
    {
        category: "사람과의 관계",
        text: "네 이웃에 대하여 거짓 증거하지 말지니라",
        summary: "네 이웃에 대하여 거짓 증거하지 말라",
        meaning: "제9계명은 진실성과 정직의 원리를 세웁니다. 원래 법정에서의 위증을 금하는 맥락이지만, 모든 형태의 거짓말, 중상모략, 험담, 왜곡된 소문 퍼뜨리기를 포괄합니다. 거짓 증거는 개인의 명예를 훼손하고 공동체의 신뢰를 파괴하며 정의를 무너뜨립니다. 히브리어 '에드 샤케르'(거짓 증인)는 의도적이고 악의적인 거짓을 가리킵니다. 진실은 하나님의 성품이며(요한복음 14:6), 그리스도인은 진리 안에서 살도록 부르심을 받았습니다.",
        verse: "출애굽기 20:16",
        relatedVerse: "에베소서 4:25",
        relatedVerseText: "그런즉 거짓을 버리고 각각 그 이웃으로 더불어 참된 것을 말하라 이는 우리가 서로 지체가 됨이니라"
    },
    {
        category: "사람과의 관계",
        text: "네 이웃의 집을 탐내지 말지니라 네 이웃의 아내나 그의 남종이나 그의 여종이나 그의 소나 그의 나귀나 무릇 네 이웃의 소유를 탐내지 말지니라",
        summary: "네 이웃의 소유를 탐내지 말라",
        meaning: "제10계명은 외적 행위가 아닌 내면의 욕심을 다루는 유일한 계명입니다. '탐내다'(하마드)는 단순한 부러움이 아니라 소유하려는 강렬한 욕망을 뜻합니다. 이 계명은 모든 죄의 뿌리가 마음속 탐욕에 있음을 가르칩니다. 탐심은 다른 모든 계명 위반의 동기가 됩니다: 탐심이 도둑질을, 탐심이 간음을, 탐심이 살인을, 탐심이 거짓 증거를 낳습니다. 바울은 '탐심은 우상 숭배니라'(골로새서 3:5)고 선언하며, 탐심이 제1계명 위반으로 귀결됨을 보여줍니다.",
        verse: "출애굽기 20:17",
        relatedVerse: "히브리서 13:5",
        relatedVerseText: "돈을 사랑치 말고 있는 바를 족한 줄로 알라 그가 친히 말씀하시기를 내가 과연 너희를 버리지 아니하고 과연 너희를 떠나지 아니하리라 하셨느니라"
    }
];

const TEN_COMMANDMENTS_HISTORY = [
    {
        title: "1. 성경적 출처",
        body: "십계명은 출애굽기 20:1-17과 신명기 5:6-21에 두 번 기록되어 있다. 출애굽기는 시내산 언약 체결 시점의 원본이며, 신명기는 모세가 40년 광야 생활 이후 새 세대에게 다시 선포한 것이다. 두 본문은 대부분 동일하나, 안식일 계명(제4계명)의 근거가 다르다: 출애굽기는 창조(하나님의 안식)를, 신명기는 구원(이집트에서의 해방)을 근거로 제시한다."
    },
    {
        title: "2. 시내산 언약",
        body: "이스라엘 백성이 이집트를 탈출한 지 약 3개월 후, 시내산(호렙산)에서 하나님이 모세를 통해 십계명을 주셨다(출애굽기 19-20장). 이는 하나님이 이스라엘과 맺은 언약의 핵심 조항으로, 하나님의 구원 행위('내가 너를 이집트에서 인도하여 낸')가 계명에 앞서 선언된다. 즉, 십계명은 구원받기 위한 조건이 아니라 구원받은 백성의 응답이다."
    },
    {
        title: "3. 두 돌판의 구분",
        body: "십계명은 두 돌판에 새겨졌다(출애굽기 31:18). 전통적으로 제1~4계명은 하나님과 사람의 관계(수직적 관계)를, 제5~10계명은 사람과 사람의 관계(수평적 관계)를 다루는 것으로 구분한다. 이 구분은 예수님의 이중 사랑 계명(마태복음 22:37-40)과 정확히 대응한다."
    },
    {
        title: "4. 계명을 나누는 전통의 차이",
        body: "십계명을 열로 나누는 방식은 교파마다 다르다. 개신교(개혁·성공회 전통)와 유대교는 우상 금지를 독립된 제2계명으로 세지만, 로마 가톨릭과 루터교는 제1·2계명을 하나로 묶고 대신 탐심 계명(이웃의 아내 / 이웃의 재물)을 제9·10으로 나눈다. 본문과 순서는 같고 번호만 다르며, 이 페이지는 개신교 전통의 구분을 따른다."
    },
    {
        title: "5. 예수님의 요약",
        body: "예수님은 마태복음 22:37-40에서 '네 마음을 다하고 목숨을 다하고 뜻을 다하여 주 너의 하나님을 사랑하라'(제1~4계명 요약)와 '네 이웃을 네 자신 같이 사랑하라'(제5~10계명 요약)로 온 율법과 선지자의 강령을 두 마디로 요약하셨다."
    },
    {
        title: "6. 신약에서의 의미",
        body: "예수님은 '내가 율법이나 선지자나 폐하러 온 줄로 생각지 말라 폐하러 온 것이 아니요 완전케 하려 함이로다'(마태복음 5:17)고 말씀하셨다. 바울은 '사랑은 율법의 완성이니라'(로마서 13:10)고 선언한다. 그리스도인에게 십계명은 정죄의 도구가 아니라, 하나님의 성품을 반영하는 사랑의 원리이며 성화의 지침이다."
    }
];

class TenCommandments {
    constructor() {
        this.initElements();
        this.init();
    }

    initElements() {
        this.loadingEl = document.getElementById("tenCommandmentsLoading");
        this.contentEl = document.getElementById("tenCommandmentsContent");
        this.fullTextEl = document.getElementById("tenCommandmentsFullText");
        this.historyEl = document.getElementById("tenCommandmentsHistory");
        this.gridEl = document.getElementById("tenCommandmentsGrid");
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
            pageTitleLabel.textContent = "십계명";
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
        this.renderFullText();
        this.renderHistory();
        this.renderCards();
        this.loadingEl.classList.add("d-none");
        this.contentEl.classList.remove("d-none");
    }

    renderFullText() {
        const rows = TEN_COMMANDMENTS.map((c, i) => ({summary: c.summary, order: i + 1}));
        const panel = (tablet, label, sub, list) => `
            <div class="ten-commandments-tablet" data-tablet="${tablet}">
                <p class="ten-commandments-tablet-label">${label}</p>
                <p class="ten-commandments-tablet-sub">${sub}</p>
                <ol class="ten-commandments-tablet-list">
                    ${list.map(c => `<li><span class="num" aria-hidden="true">${c.order}</span><span>${c.summary}</span></li>`).join("")}
                </ol>
            </div>
        `;

        this.fullTextEl.innerHTML = `
            <div class="ten-commandments-hero">
                <p class="ten-commandments-hero-eyebrow">십계명 · 출애굽기 20장</p>
                <div class="ten-commandments-hero-tablets">
                    ${panel(1, "첫째 돌판", "하나님과의 관계 · 제1~4계명", rows.filter(c => c.order <= 4))}
                    ${panel(2, "둘째 돌판", "사람과의 관계 · 제5~10계명", rows.filter(c => c.order >= 5))}
                </div>
            </div>
        `;
    }

    renderHistory() {
        const items = TEN_COMMANDMENTS_HISTORY.map((s, idx) => {
            const title = s.title.replace(/^\d+\.\s*/, "");
            return `
            <div class="ten-commandments-history-item">
                <span class="ten-commandments-history-num" aria-hidden="true">${idx + 1}</span>
                <div>
                    <p class="ten-commandments-history-item-title">${title}</p>
                    <p class="ten-commandments-history-item-body">${s.body}</p>
                </div>
            </div>
        `;
        }).join("");

        this.historyEl.innerHTML = `
            <div class="ten-commandments-history-inner">
                <h2 class="ten-commandments-history-title">십계명의 배경</h2>
                ${items}
            </div>
        `;
    }

    renderCards() {
        TEN_COMMANDMENTS.forEach((item, idx) => {
            const card = this.createCard(item, idx + 1);
            this.gridEl.appendChild(card);
        });
    }

    createCard(item, order) {
        const card = document.createElement("article");
        card.className = "ten-commandments-card";
        card.dataset.tablet = order <= 4 ? "1" : "2";
        card.style.setProperty("--i", String(order - 1));

        card.innerHTML = `
            <div class="ten-commandments-card-header">
                <span class="ten-commandments-card-order" aria-hidden="true">${order}</span>
                <span class="ten-commandments-card-category">${item.category}</span>
            </div>
            <div class="ten-commandments-card-body">
                <blockquote class="ten-commandments-card-text">${item.text}</blockquote>
                <p class="ten-commandments-card-meaning">${item.meaning}</p>
                <span class="ten-commandments-card-ref">${item.verse}</span>
                ${item.relatedVerse ? `
                <div class="ten-commandments-card-related">
                    <span class="ten-commandments-card-related-label">함께 읽는 말씀</span>
                    <span class="ten-commandments-card-related-ref">${item.relatedVerse}</span>
                    <p class="ten-commandments-card-related-text">${item.relatedVerseText}</p>
                </div>
                ` : ""}
            </div>
        `;

        return card;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new TenCommandments();
});
