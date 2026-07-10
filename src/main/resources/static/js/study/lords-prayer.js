/**
 * 주기도문 (Lord's Prayer)
 * 마태복음 6:9-13 기반 구절별 묵상
 */

const LORDS_PRAYER_VERSES = [
  {
    verse: "마태복음 6:9",
    text: "하늘에 계신 우리 아버지여",
    meaning: "예수님은 하나님을 '아버지'(아람어 '아바')로 부르라고 가르치셨습니다. 구약에서 하나님은 주로 '여호와', '엘로힘' 등 위엄 있는 호칭으로 불렸지만, 예수님은 하나님과 우리 사이의 친밀한 부자 관계를 선언하셨습니다. '우리'라는 표현은 이 기도가 개인의 기도이면서 동시에 공동체의 기도임을 보여줍니다. '하늘에 계신'은 하나님이 모든 피조물 위에 계신 초월적 존재이심을, '아버지'는 그분이 우리를 사랑으로 돌보시는 인격적 존재이심을 함께 나타냅니다.",
    theme: "친밀한 관계",
    relatedVerse: "로마서 8:15",
    relatedVerseText: "너희는 다시 무서워하는 종의 영을 받지 아니하였고 양자의 영을 받았으므로 아바 아버지라 부르짖느니라"
  },
  {
    verse: "마태복음 6:9",
    text: "이름이 거룩히 여김을 받으시오며",
    meaning: "기도는 나의 필요를 구하기 전에 하나님을 높이는 것으로 시작됩니다. 히브리 문화에서 '이름'은 그 존재의 본질과 성품 전체를 의미합니다. 하나님의 이름이 거룩히 여김을 받는다는 것은 그분의 성품—사랑, 공의, 신실함, 거룩함—이 온 세상에 알려지고 존귀히 여김을 받는 것입니다. 이는 단순한 찬양의 선언이 아니라, 우리의 말과 행동과 삶 전체를 통해 하나님의 거룩하심이 드러나기를 헌신하는 기도입니다.",
    theme: "경배와 찬양",
    relatedVerse: "시편 99:3",
    relatedVerseText: "주의 크고 두려운 이름을 찬송할지어다 그는 거룩하시도다"
  },
  {
    verse: "마태복음 6:10",
    text: "나라가 임하시오며",
    meaning: "하나님의 나라(바실레이아)는 하나님이 왕으로서 다스리시는 통치 영역을 뜻합니다. 예수님의 공생애 첫 선포가 '천국이 가까이 왔으니 회개하라'(마태복음 4:17)였듯이, 하나님 나라의 도래는 복음의 핵심 주제입니다. 이 기도는 하나님의 공의와 평화와 기쁨이 우리의 삶과 관계와 사회 속에 실현되기를 구하는 것이며, 동시에 예수님의 재림으로 완성될 하나님 나라의 최종적 성취를 소망하는 종말론적 기도이기도 합니다.",
    theme: "하나님의 나라",
    relatedVerse: "로마서 14:17",
    relatedVerseText: "하나님의 나라는 먹는 것과 마시는 것이 아니요 오직 성령 안에서 의와 평강과 희락이라"
  },
  {
    verse: "마태복음 6:10",
    text: "뜻이 하늘에서 이루어진 것 같이 땅에서도 이루어지이다",
    meaning: "하늘에서는 천사들이 하나님의 뜻에 완전히 순종합니다. 이 기도는 그와 같은 온전한 순종이 이 땅에서도 이루어지기를 구하는 것입니다. 이는 먼저 나 자신이 하나님의 뜻 앞에 내 뜻을 내려놓겠다는 결단의 고백입니다. 예수님은 겟세마네 동산에서 '내 원대로 마시옵고 아버지의 원대로 하옵소서'(마태복음 26:39)라고 기도하심으로 이 구절의 완전한 모범을 보여주셨습니다. 하나님의 뜻은 때로 우리의 이해를 초월하지만, 그것이 선하시고 기뻐하시고 온전한 것임을 신뢰하는 믿음이 이 기도의 근거입니다.",
    theme: "순종",
    relatedVerse: "로마서 12:2",
    relatedVerseText: "너희는 이 세대를 본받지 말고 오직 마음을 새롭게 함으로 변화를 받아 하나님의 선하시고 기뻐하시고 온전하신 뜻이 무엇인지 분별하도록 하라"
  },
  {
    verse: "마태복음 6:11",
    text: "오늘 우리에게 일용할 양식을 주시옵고",
    meaning: "앞의 세 간구가 하나님의 영광에 관한 것이었다면, 이 구절부터는 우리의 필요를 구합니다. '일용할'(에피우시온)은 '오늘 하루에 필요한'이라는 뜻으로, 내일을 염려하지 말라는 예수님의 가르침(마태복음 6:34)과 일치합니다. 이는 이스라엘 백성이 광야에서 매일 만나를 거두었던 것처럼(출애굽기 16:4), 날마다 하나님을 신뢰하며 의지하는 삶의 자세를 보여줍니다. '양식'은 물질적 필요뿐 아니라 영적 양식인 하나님의 말씀까지 포함합니다. 예수님은 '사람이 떡으로만 살 것이 아니요 하나님의 입으로부터 나오는 모든 말씀으로 살 것이라'(마태복음 4:4)고 말씀하셨습니다.",
    theme: "신뢰와 의탁",
    relatedVerse: "빌립보서 4:19",
    relatedVerseText: "나의 하나님이 그리스도 예수 안에서 영광 가운데 그 풍성한 대로 너희 모든 쓸 것을 채우시리라"
  },
  {
    verse: "마태복음 6:12",
    text: "우리가 우리에게 죄 지은 자를 사하여 준 것 같이 우리 죄를 사하여 주시옵고",
    meaning: "이 구절에서 '죄'에 해당하는 원어 '오페일레마'는 '빚'을 의미합니다. 우리의 죄는 하나님 앞에 진 빚과 같습니다. 이 기도는 하나님의 용서를 구하면서 동시에 다른 사람을 용서하겠다는 결단을 포함합니다. 예수님은 이 기도 직후 '너희가 사람의 과실을 용서하면 너희 천부께서도 너희 과실을 용서하시려니와'(마태복음 6:14)라고 강조하셨습니다. 만 달란트 빚진 종의 비유(마태복음 18:21-35)에서도 보듯이, 하나님께 용서받은 자는 마땅히 다른 이를 용서해야 합니다. 용서는 감정이 아니라 의지의 결단이며, 하나님의 은혜에 대한 응답입니다.",
    theme: "용서",
    relatedVerse: "에베소서 4:32",
    relatedVerseText: "서로 인자하게 하며 불쌍히 여기며 서로 용서하기를 하나님이 그리스도 안에서 너희를 용서하심과 같이 하라"
  },
  {
    verse: "마태복음 6:13",
    text: "우리를 시험에 들게 하지 마시옵고 다만 악에서 구하시옵소서",
    meaning: "여기서 '시험'(페이라스모스)은 믿음을 무너뜨리려는 유혹과 시련을 모두 포함합니다. 하나님은 시험하시는 분이 아니지만(야고보서 1:13), 시험이 허락되는 상황에서 우리를 지켜주시기를 구하는 기도입니다. '악에서 구하시옵소서'의 '악'은 악 자체 또는 '악한 자'(사탄)로 해석됩니다. 이 기도는 우리 스스로의 힘으로는 유혹을 이길 수 없음을 고백하며, 오직 하나님의 능력으로 악을 이기게 해달라는 간구입니다. 바울은 '사람이 감당할 시험 밖에는 너희가 당한 것이 없나니 오직 하나님은 미쁘사 너희가 감당하지 못할 시험 당함을 허락하지 아니하시고'(고린도전서 10:13)라고 약속합니다.",
    theme: "보호",
    relatedVerse: "야고보서 1:13-14",
    relatedVerseText: "사람이 시험을 받을 때에 내가 하나님께 시험을 받는다 하지 말지니 하나님은 악에게 시험을 받지도 아니하시고 친히 아무도 시험하지 아니하시느니라 오직 각 사람이 시험을 받는 것은 자기 욕심에 끌려 미혹됨이니"
  },
  {
    verse: "마태복음 6:13",
    text: "나라와 권세와 영광이 아버지께 영원히 있사옵나이다 아멘",
    meaning: "이 송영(頌榮, Doxology)은 주기도문의 마무리로, 초대교회가 예배 중 기도를 마칠 때 함께 고백한 찬양입니다. '나라'는 모든 통치권이 하나님께 있음을, '권세'는 모든 능력의 근원이 하나님이심을, '영광'은 모든 찬양과 존귀가 하나님께 돌려져야 함을 선포합니다. 이 세 가지는 기도의 첫 세 간구—이름의 거룩, 나라의 임함, 뜻의 이루어짐—에 대응하며, 기도가 시작된 곳으로 되돌아가 하나님 중심의 원을 완성합니다. '영원히'라는 고백은 하나님의 주권이 시간을 초월하여 영구함을 확신하는 것이며, '아멘'은 '참으로 그러합니다'라는 뜻으로 기도 전체에 대한 확신과 동의의 표현입니다.",
    theme: "찬양과 고백",
    relatedVerse: "역대상 29:11",
    relatedVerseText: "여호와여 광대하심과 권능과 영광과 이김과 위엄이 다 주께 속하였사오니 천지에 있는 것이 다 주의 것이로소이다 여호와여 주권도 주께 속하였사오니 주는 높으사 만유의 머리심이니이다"
  }
];

const FULL_PRAYER_TEXT = `하늘에 계신 우리 아버지여
이름이 거룩히 여김을 받으시오며
나라가 임하시오며
뜻이 하늘에서 이루어진 것 같이
땅에서도 이루어지이다
오늘 우리에게 일용할 양식을 주시옵고
우리가 우리에게 죄 지은 자를 사하여 준 것 같이
우리 죄를 사하여 주시옵고
우리를 시험에 들게 하지 마시옵고
다만 악에서 구하시옵소서
나라와 권세와 영광이
아버지께 영원히 있사옵나이다
아멘`;

const LORDS_PRAYER_HISTORY = [
  {
    title: "1. 성경적 출처",
    body: "주기도문은 마태복음 6:9-13과 누가복음 11:2-4에 기록되어 있다."
  },
  {
    title: "2. 기도를 가르친 맥락",
    body: "마태복음에서는 산상수훈 중 예수가 기도의 본을 자발적으로 제시하고, 누가복음에서는 제자의 요청에 응답하는 형태로 등장한다."
  },
  {
    title: "3. 마태·누가 본문의 차이",
    body: "마태 본문은 7개 간구의 긴 형태, 누가 본문은 5개 간구의 짧은 형태이다. '뜻이 하늘에서 이루어진 것 같이 땅에서도 이루어지이다'와 '악에서 구하시옵소서'는 마태에만 있다. 다수 학자들은 누가의 짧은 형태가 원형에 가깝고, 마태가 예배용으로 확장된 본문을 반영한다고 본다. 간구를 세는 방식은 전통에 따라 달라, 시험에 들지 않게 하심과 악에서 구하심을 하나로 묶어 마태를 6개 간구로 세기도 한다."
  },
  {
    title: "4. 초기 교회에서의 사용",
    body: "1세기 말~2세기 초 문헌인 디다케(Didache)는 하루 세 번 주기도문 암송을 권하고 있어, 초기 교회 예배의 핵심 기도문이었음을 보여준다."
  },
  {
    title: "5. 송영의 후대 추가",
    body: "'나라와 권세와 영광이 아버지께 영원히 있사옵나이다'는 가장 오래된 주요 사본(시내 사본, 바티칸 사본)에 없다. 다만 1세기 말~2세기 초의 디다케에는 이미 '권세와 영광'만의 짧은 송영이 나타나며, '나라와 권세와 영광'의 세 부분 형태는 그 후에 확장된 것이다. 역대상 29:11에서 유래한 이 송영은 예배 관행 속에서 본문에 편입되었고, 현대 비평 본문(NA28/UBS5)에서는 본문에서 제외된다."
  }
];

class LordsPrayer {
  constructor() {
    this.initElements();
    this.init();
  }

  initElements() {
    this.loadingEl = document.getElementById("lordsPrayerLoading");
    this.contentEl = document.getElementById("lordsPrayerContent");
    this.fullTextEl = document.getElementById("lordsPrayerFullText");
    this.historyEl = document.getElementById("lordsPrayerHistory");
    this.gridEl = document.getElementById("lordsPrayerGrid");
    this.backButton = document.getElementById("topNavBackButton");
    this.scrollToTopBtn = document.getElementById("scrollToTopBtn");
  }

  init() {
    this.initNav();
    this.initScrollToTop();
    this.render();
  }

  initNav() {
    if (!this.backButton) {
      return;
    }

    const pageTitleLabel = document.getElementById("pageTitleLabel");
    if (pageTitleLabel) {
      pageTitleLabel.textContent = "주기도문";
      pageTitleLabel.classList.remove("d-none");
    }
    this.backButton.classList.remove("d-none");
    this.backButton.addEventListener("click", () => {
      window.location.href = "/web/study";
    });
  }

  initScrollToTop() {
    if (!this.scrollToTopBtn) {
      return;
    }
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
    this.renderVerseCards();
    this.loadingEl.classList.add("d-none");
    this.contentEl.classList.remove("d-none");
  }

  renderFullText() {
    this.fullTextEl.innerHTML = `
            <div class="lords-prayer-hero">
                <div class="lords-prayer-hero-body">${FULL_PRAYER_TEXT.replace(/\n/g, "<br>")}</div>
                <p class="lords-prayer-hero-ref">마태복음 6:9-13</p>
            </div>
        `;
  }

  renderHistory() {
    const items = LORDS_PRAYER_HISTORY.map((s, i) => {
      const title = s.title.replace(/^\s*\d+\.\s*/, "");
      return `
            <div class="lords-prayer-history-item">
                <span class="lords-prayer-history-num" aria-hidden="true">${i + 1}</span>
                <div class="lords-prayer-history-item-content">
                    <p class="lords-prayer-history-item-title">${title}</p>
                    <p class="lords-prayer-history-item-body">${s.body}</p>
                </div>
            </div>
            `;
    }).join("");

    this.historyEl.innerHTML = `
            <section class="lords-prayer-history-inner">
                <h2 class="lords-prayer-history-title">주기도문의 유래와 역사</h2>
                ${items}
            </section>
        `;
  }

  renderVerseCards() {
    LORDS_PRAYER_VERSES.forEach((item, idx) => {
      const card = this.createCard(item, idx + 1);
      this.gridEl.appendChild(card);
    });
  }

  createCard(item, order) {
    const card = document.createElement("article");
    card.className = "lords-prayer-card";
    card.style.setProperty("--i", String(order - 1));

    card.innerHTML = `
            <header class="lords-prayer-card-header">
                <span class="lords-prayer-card-order" aria-hidden="true">${order}</span>
                <span class="lords-prayer-card-theme">${item.theme}</span>
            </header>
            <div class="lords-prayer-card-body">
                <blockquote class="lords-prayer-card-text">${item.text}</blockquote>
                <span class="lords-prayer-card-ref">${item.verse}</span>
                <p class="lords-prayer-card-meaning">${item.meaning}</p>
                ${item.relatedVerse ? `
                <div class="lords-prayer-card-related">
                    <span class="lords-prayer-card-related-label">함께 읽는 말씀</span>
                    <span class="lords-prayer-card-related-ref">${item.relatedVerse}</span>
                    <p class="lords-prayer-card-related-text">${item.relatedVerseText}</p>
                </div>
                ` : ""}
            </div>
        `;

    return card;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new LordsPrayer();
});
