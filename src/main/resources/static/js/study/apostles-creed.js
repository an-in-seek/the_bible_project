/**
 * 사도신경 (Apostles' Creed)
 * 12조항별 묵상
 * 인용 성경은 앱 표준 번역(개역한글, KRV) 본문을 따른다.
 */

const APOSTLES_CREED_ARTICLES = [
    {
        article: "제1조",
        text: "나는 전능하신 아버지 하나님, 천지의 창조주를 믿습니다.",
        meaning: "사도신경은 하나님을 '전능하신 아버지'로 고백하며 시작합니다. '전능하신'(Pantokrator)은 모든 것을 다스리시는 절대 주권자이심을, '아버지'는 우리를 사랑으로 돌보시는 인격적 존재이심을 나타냅니다. '천지의 창조주'라는 고백은 하나님이 보이는 것과 보이지 않는 모든 것의 근원이시며, 만물이 그분의 뜻과 말씀으로 존재하게 되었음을 선언합니다. 이 고백은 창세기 1:1 '태초에 하나님이 천지를 창조하시니라'의 신앙적 응답입니다.",
        theme: "창조주 하나님",
        relatedVerse: "창세기 1:1",
        relatedVerseText: "태초에 하나님이 천지를 창조하시니라"
    },
    {
        article: "제2조",
        text: "나는 그의 유일하신 아들, 우리 주 예수 그리스도를 믿습니다.",
        meaning: "'유일하신 아들'(Unigenitus)은 예수님이 하나님과 본질적으로 같은 유일하신 아들이심을 고백합니다. 새번역에서 '외아들'을 '유일하신 아들'로 번역한 것은 그 유일무이한 관계를 더욱 분명히 드러냅니다. '그리스도'는 히브리어 '메시아'의 헬라어 번역으로 '기름 부음 받은 자', 곧 왕과 제사장과 선지자의 직분을 가지신 분을 뜻합니다. '우리 주'라는 고백은 예수님이 단순히 역사적 인물이 아니라 지금 이 순간에도 우리의 삶을 다스리시는 살아계신 주님이심을 인정하는 것입니다.",
        theme: "하나님의 아들",
        relatedVerse: "요한복음 3:16",
        relatedVerseText: "하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 저를 믿는 자마다 멸망치 않고 영생을 얻게 하려 하심이니라"
    },
    {
        article: "제3조",
        text: "그는 성령으로 잉태되어 동정녀 마리아에게서 나시고,",
        meaning: "예수님의 탄생은 인간의 방식이 아닌 성령의 초자연적 역사로 이루어졌습니다. '성령으로 잉태되어'는 예수님이 참 하나님이심을, '동정녀 마리아에게서 나시고'는 참 사람이심을 동시에 고백합니다. 이 성육신(Incarnation)의 신비는 하나님이 인간의 조건 속으로 들어오셔서 우리와 함께하시겠다는 놀라운 사랑의 표현입니다. 이사야 선지자가 예언한 '처녀가 잉태하여 아들을 낳을 것이요'(이사야 7:14)의 성취이기도 합니다.",
        theme: "성육신",
        relatedVerse: "마태복음 1:20-21",
        relatedVerseText: "이 일을 생각할 때에 주의 사자가 현몽하여 가로되 다윗의 자손 요셉아 네 아내 마리아 데려오기를 무서워 말라 저에게 잉태된 자는 성령으로 된 것이라 아들을 낳으리니 이름을 예수라 하라 이는 그가 자기 백성을 저희 죄에서 구원할 자이심이라 하니라"
    },
    {
        article: "제4조",
        text: "본디오 빌라도에게 고난을 받아 십자가에 못 박혀 죽으시고,",
        meaning: "'본디오 빌라도'라는 역사적 인물의 이름은 예수님의 고난과 죽음이 신화가 아닌 실제 역사적 사건임을 증거합니다. 십자가 처형은 당시 가장 잔인하고 수치스러운 형벌이었습니다. 하나님의 아들이 이 극한의 고통을 자발적으로 받으신 것은 인류의 죄를 대신 짊어지시기 위함이었습니다.",
        theme: "대속의 고난",
        relatedVerse: "이사야 53:5",
        relatedVerseText: "그가 찔림은 우리의 허물을 인함이요 그가 상함은 우리의 죄악을 인함이라 그가 징계를 받음으로 우리가 평화를 누리고 그가 채찍에 맞음으로 우리가 나음을 입었도다"
    },
    {
        article: "제5조",
        text: "장사된 지 사흘 만에 죽은 자 가운데서 다시 살아나셨으며,",
        meaning: "'장사된 지 사흘 만에'라는 고백은 예수님의 죽음이 실제였고, 그 부활 또한 역사적 사건이었음을 선포합니다. 부활은 기독교 신앙의 핵심입니다. 바울은 '그리스도께서 만일 다시 살지 못하셨으면 우리의 전파하는 것도 헛것이요 또 너희 믿음도 헛것이며'(고린도전서 15:14)라고 선언했습니다. '사흘 만에'는 예수님이 미리 말씀하신 부활 약속의 성취이며, 부활은 죽음에 대한 승리이자 예수님이 참 하나님이심을 확증하는 사건입니다.",
        theme: "부활",
        relatedVerse: "고린도전서 15:3-4",
        relatedVerseText: "내가 받은 것을 먼저 너희에게 전하였노니 이는 성경대로 그리스도께서 우리 죄를 위하여 죽으시고 장사 지낸 바 되었다가 성경대로 사흘 만에 다시 살아나사"
    },
    {
        article: "제6조",
        text: "하늘에 오르시어 전능하신 아버지 하나님 우편에 앉아 계시다가,",
        meaning: "예수님의 승천은 지상 사역의 완성과 하늘 사역의 시작을 의미합니다. '하나님 우편'은 최고의 권위와 영광의 자리를 뜻합니다. 예수님은 지금 이 순간에도 하나님 우편에서 우리를 위해 중보 기도하고 계십니다(로마서 8:34). 승천은 또한 성령 강림의 전제 조건이었습니다. 예수님은 '내가 떠나가는 것이 너희에게 유익이라 내가 떠나가지 아니하면 보혜사가 너희에게로 오시지 아니할 것이요'(요한복음 16:7)라고 말씀하셨습니다.",
        theme: "승천과 중보",
        relatedVerse: "히브리서 1:3",
        relatedVerseText: "이는 하나님의 영광의 광채시요 그 본체의 형상이시라 그의 능력의 말씀으로 만물을 붙드시며 죄를 정결케 하는 일을 하시고 높은 곳에 계신 위엄의 우편에 앉으셨느니라"
    },
    {
        article: "제7조",
        text: "거기로부터 살아 있는 자와 죽은 자를 심판하러 오십니다.",
        meaning: "예수님은 다시 오실 것입니다. 이 재림의 약속은 초대교회의 가장 큰 소망이었습니다. '살아 있는 자와 죽은 자'를 심판하신다는 것은 모든 사람이 예외 없이 그리스도 앞에 서게 됨을 의미합니다. 이 심판은 두려움의 대상이 아니라, 모든 불의가 바로잡히고 하나님의 정의가 최종적으로 실현되는 사건입니다. 그리스도인에게 재림은 구원의 완성이며, 주님과 영원히 함께하는 삶의 시작입니다.",
        theme: "재림과 심판",
        relatedVerse: "사도행전 1:11",
        relatedVerseText: "가로되 갈릴리 사람들아 어찌하여 서서 하늘을 쳐다보느냐 너희 가운데서 하늘로 올리우신 이 예수는 하늘로 가심을 본 그대로 오시리라 하였느니라"
    },
    {
        article: "제8조",
        text: "나는 성령을 믿으며",
        meaning: "성령은 삼위일체의 제삼위로서, 하나님 아버지와 아들과 동등한 하나님이십니다. 성령은 오순절에 강림하시어 교회를 세우시고, 믿는 자에게 내주하시며, 우리를 진리로 인도하시고 그리스도를 닮아가도록 변화시키십니다. 성령의 역사는 눈에 보이지 않지만, 바람이 나무를 움직이듯 우리 삶 속에서 실제적이고 능력 있게 일하십니다. 예수님은 성령을 '보혜사'(파라클레토스), 곧 위로자이자 돕는 분이라 부르셨습니다.",
        theme: "성령",
        relatedVerse: "요한복음 14:26",
        relatedVerseText: "보혜사 곧 아버지께서 내 이름으로 보내실 성령 그가 너희에게 모든 것을 가르치시고 내가 너희에게 말한 모든 것을 생각나게 하시리라"
    },
    {
        article: "제9조",
        text: "거룩한 공교회와 성도의 교제와",
        meaning: "'거룩한 공교회'(Sanctam Ecclesiam Catholicam)는 특정 교파가 아니라, 시대와 장소를 초월하여 그리스도를 믿는 모든 성도의 보편적 공동체를 가리킵니다. 새번역에서 '공회'를 '공교회'로 번역하여 보편 교회로서의 의미를 더욱 분명히 했습니다. '성도의 교제'(Communio Sanctorum)는 성도들이 그리스도 안에서 하나의 몸으로 연결되어 서로의 기쁨과 아픔을 나누며, 믿음을 함께 세워가는 교제를 의미합니다. 교회는 건물이 아니라 사람이며, 그리스도의 몸된 공동체로서 세상 속에서 하나님 나라를 증거하는 사명을 가지고 있습니다.",
        theme: "교회와 교제",
        relatedVerse: "에베소서 4:4-6",
        relatedVerseText: "몸이 하나이요 성령이 하나이니 이와 같이 너희가 부르심의 한 소망 안에서 부르심을 입었느니라 주도 하나이요 믿음도 하나이요 세례도 하나이요 하나님도 하나이시니 곧 만유의 아버지시라 만유 위에 계시고 만유를 통일하시고 만유 가운데 계시도다"
    },
    {
        article: "제10조",
        text: "죄를 용서받는 것과",
        meaning: "죄의 용서는 복음의 핵심 메시지입니다. 인간은 스스로의 노력으로 죄의 문제를 해결할 수 없으며, 오직 예수 그리스도의 십자가 대속을 통해서만 용서받을 수 있습니다. 새번역에서 '죄를 사하여 주시는 것'을 '죄를 용서받는 것'으로 번역하여, 하나님의 은혜로 용서를 '받는' 수동적 은혜의 측면을 강조합니다. 이 용서는 과거의 죄뿐 아니라 현재와 미래의 죄까지 포함하는 완전한 용서이며, 한 번 받으면 취소되지 않는 확실한 용서입니다. '동이 서에서 먼 것 같이 우리 죄과를 우리에게서 멀리 옮기셨으며'(시편 103:12)라는 말씀처럼, 하나님의 용서는 완전하고 철저합니다.",
        theme: "죄의 용서",
        relatedVerse: "에베소서 1:7",
        relatedVerseText: "우리가 그리스도 안에서 그의 은혜의 풍성함을 따라 그의 피로 말미암아 구속 곧 죄 사함을 받았으니"
    },
    {
        article: "제11조",
        text: "몸의 부활과",
        meaning: "'몸의 부활'은 영혼만의 구원이 아니라, 몸의 부활을 통한 전인적 구원을 고백합니다. 새번역에서 '몸이 다시 사는 것'을 '몸의 부활'로 간결하게 번역하여 부활 신앙의 핵심을 더욱 명확히 했습니다. 기독교는 영혼과 육체를 분리하여 영혼만 중시하는 이원론을 거부합니다. 그리스도의 부활이 몸의 부활이었듯이, 우리도 마지막 날에 썩지 않는 영광스러운 부활체를 입게 될 것입니다. 바울은 '썩을 것으로 심고 썩지 아니할 것으로 다시 살며... 육의 몸으로 심고 신령한 몸으로 다시 사나니'(고린도전서 15:42-44)라고 설명합니다.",
        theme: "부활의 소망",
        relatedVerse: "고린도전서 15:42-43",
        relatedVerseText: "죽은 자의 부활도 이와 같으니 썩을 것으로 심고 썩지 아니할 것으로 다시 살며 욕된 것으로 심고 영광스러운 것으로 다시 살며 약한 것으로 심고 강한 것으로 다시 살며"
    },
    {
        article: "제12조",
        text: "영생을 믿습니다. 아멘.",
        meaning: "사도신경의 마지막 고백은 영생의 소망으로 마무리됩니다. 영생은 단순히 끝없이 오래 사는 시간이 아니라, 하나님과의 온전한 관계 속에서 누리는 충만한 생명입니다. 예수님은 '영생은 곧 유일하신 참 하나님과 그의 보내신 자 예수 그리스도를 아는 것'(요한복음 17:3)이라고 말씀하셨습니다. '아멘'은 '참으로 그러합니다'라는 뜻으로, 사도신경 전체에 대한 확신과 동의의 표현이며, 이 모든 고백이 우리의 진실한 믿음임을 선언하는 것입니다.",
        theme: "영생",
        relatedVerse: "요한복음 11:25-26",
        relatedVerseText: "예수께서 가라사대 나는 부활이요 생명이니 나를 믿는 자는 죽어도 살겠고 무릇 살아서 나를 믿는 자는 영원히 죽지 아니하리니 이것을 네가 믿느냐"
    }
];

const FULL_CREED_TEXT = `나는 전능하신 아버지 하나님,
천지의 창조주를 믿습니다.
나는 그의 유일하신 아들,
우리 주 예수 그리스도를 믿습니다.
그는 성령으로 잉태되어
동정녀 마리아에게서 나시고,
본디오 빌라도에게 고난을 받아
십자가에 못 박혀 죽으시고,
장사된 지 사흘 만에
죽은 자 가운데서 다시 살아나셨으며,
하늘에 오르시어
전능하신 아버지 하나님 우편에 앉아 계시다가,
거기로부터 살아 있는 자와
죽은 자를 심판하러 오십니다.
나는 성령을 믿으며
거룩한 공교회와 성도의 교제와
죄를 용서받는 것과
몸의 부활과
영생을 믿습니다.
아멘.`;

const CREED_HISTORY = [
    {
        title: "1. 기원",
        body: "사도신경(Symbolum Apostolorum)은 성경 정경이 아니라 초대교회의 신앙고백문이다. 그 기원은 2세기경 로마 교회에서 세례 받는 이들이 고백한 '로마 신조'(Symbolum Romanum)로 거슬러 올라간다. 이 초기 형태는 삼위일체 구조의 질문-응답 방식으로, 세례 지원자가 '믿습니다'(Credo)라고 응답하며 신앙을 고백하는 데 사용되었다."
    },
    {
        title: "2. 이단 대응과 발전",
        body: "2~4세기에 걸쳐 영지주의(물질 세계의 악을 주장), 마르키온주의(구약의 하나님을 부정), 사벨리우스주의(삼위일체를 부정) 등 이단에 대응하는 과정에서 고백 문구가 점차 구체화되었다. 특히 '전능하신', '창조주', '십자가에 못 박혀', '장사된 지 사흘 만에' 같은 표현이 추가되어 정통 신앙의 경계를 분명히 했다."
    },
    {
        title: "3. 현재 본문의 확정",
        body: "현재 전해지는 형태는 7~8세기 서방교회, 특히 갈리아(현 프랑스) 지역에서 확정된 것이다. 피르미니우스(Pirminius) 주교의 저술(약 750년)에 현재와 동일한 완전한 본문이 처음 등장한다. 이후 카롤링거 왕조 시대에 서방교회 전역으로 확산되어 예배와 교리 교육의 표준 고백문으로 자리잡았다."
    },
    {
        title: "4. 사도 저작설",
        body: "'열두 사도가 각각 한 조항씩 작성했다'는 전승은 루피누스(Rufinus, 약 404년)의 《사도신경 주석》에 처음 등장한다. 그러나 이 전승을 뒷받침하는 역사적 근거는 없으며, 로렌초 발라(15세기) 이후 학자들에 의해 비판적으로 검토되었다. 현대 교회사 학계에서는 사도신경이 사도들의 직접 저작이 아니라 초대교회 공동체의 신앙이 수 세기에 걸쳐 집약된 것으로 본다."
    },
    {
        title: "5. '음부에 내려가심' 조항",
        body: "라틴어 원문과 서방교회 전통본에는 십자가에서 죽으신 뒤 '음부에 내려가셨으며'(descendit ad inferna)라는 조항이 이어진다. 그러나 한국 개신교가 사용하는 사도신경에는 이 구절이 생략되어 있다. 이 조항의 의미(죽음의 실재, 옛 성도들에게의 승리 선포 등)를 두고 교회마다 이해가 달랐기 때문이며, 개신교 전통은 대체로 이를 그리스도께서 죽음의 가장 깊은 자리까지 낮아지셨음을 나타내는 표현으로 이해한다."
    },
    {
        title: "6. 한국 교회의 두 번역본",
        body: "한국 교회에는 오랫동안 '~을 믿사오며'로 이어지는 전통 번역이 사용되어 왔고, 이후 뜻을 더 쉽고 분명하게 다듬은 새 번역('~을 믿습니다')이 널리 보급되었다. 새 번역은 '외아들→유일하신 아들', '공회→공교회', '죄를 사하여 주시는 것→죄를 용서받는 것', '몸이 다시 사는 것→몸의 부활'처럼 표현을 정교하게 가다듬었다. 이 페이지의 본문과 해설은 새 번역을 따른다."
    }
];

class ApostlesCreed {
    constructor() {
        this.initElements();
        this.init();
    }

    initElements() {
        this.loadingEl = document.getElementById("apostlesCreedLoading");
        this.contentEl = document.getElementById("apostlesCreedContent");
        this.fullTextEl = document.getElementById("apostlesCreedFullText");
        this.historyEl = document.getElementById("apostlesCreedHistory");
        this.gridEl = document.getElementById("apostlesCreedGrid");
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
            pageTitleLabel.textContent = "사도신경";
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
        this.renderArticleCards();
        this.loadingEl.classList.add("d-none");
        this.contentEl.classList.remove("d-none");
    }

    renderFullText() {
        this.fullTextEl.innerHTML = `
            <div class="apostles-creed-hero">
                <p class="apostles-creed-hero-eyebrow">사도신경</p>
                <div class="apostles-creed-hero-body">${FULL_CREED_TEXT.replace(/\n/g, "<br>")}</div>
            </div>
        `;
    }

    renderHistory() {
        const items = CREED_HISTORY.map((s, idx) => {
            const title = s.title.replace(/^\d+\.\s*/, "");
            return `
            <div class="apostles-creed-history-item">
                <span class="apostles-creed-history-num" aria-hidden="true">${idx + 1}</span>
                <div>
                    <p class="apostles-creed-history-item-title">${title}</p>
                    <p class="apostles-creed-history-item-body">${s.body}</p>
                </div>
            </div>
        `;
        }).join("");

        this.historyEl.innerHTML = `
            <div class="apostles-creed-history-inner">
                <h2 class="apostles-creed-history-title">사도신경의 유래와 역사</h2>
                ${items}
            </div>
        `;
    }

    renderArticleCards() {
        APOSTLES_CREED_ARTICLES.forEach((item, idx) => {
            const card = this.createCard(item, idx + 1);
            this.gridEl.appendChild(card);
        });
    }

    createCard(item, order) {
        const card = document.createElement("article");
        card.className = "apostles-creed-card";
        card.style.setProperty("--i", String(order - 1));

        card.innerHTML = `
            <div class="apostles-creed-card-header">
                <span class="apostles-creed-card-order" aria-hidden="true">${order}</span>
                <span class="apostles-creed-card-theme">${item.article} — ${item.theme}</span>
            </div>
            <div class="apostles-creed-card-body">
                <blockquote class="apostles-creed-card-text">${item.text}</blockquote>
                <p class="apostles-creed-card-meaning">${item.meaning}</p>
                ${item.relatedVerse ? `
                <div class="apostles-creed-card-related">
                    <span class="apostles-creed-card-related-label">함께 읽는 말씀</span>
                    <span class="apostles-creed-card-related-ref">${item.relatedVerse}</span>
                    <p class="apostles-creed-card-related-text">${item.relatedVerseText}</p>
                </div>
                ` : ""}
            </div>
        `;

        return card;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new ApostlesCreed();
});
