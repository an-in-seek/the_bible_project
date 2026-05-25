// 성경 주석 사이트 큐레이션 — 정적 데이터 + 렌더링
// 사이트 추가/제거 시 본 배열만 수정 (SSOT)

const BIBLE_COMMENTARY_SITES = [
    {
        id: "freebiblecommentary-ko",
        siteName: "FreeBibleCommentary 한국어",
        lang: "ko",
        url: "https://www.freebiblecommentary.org/korean_bible_study.htm",
        favicon: "/images/icon/commentary/freebiblecommentary.png",
        description: "Bob Utley 박사의 학술적 성경 주석을 한국어로 무료 제공",
        tags: ["학술 주석", "한국어 번역", "무료"]
    },
    {
        id: "gotquestions-ko",
        siteName: "GotQuestions 한국어",
        lang: "ko",
        url: "https://www.gotquestions.org/Korean/",
        favicon: "/images/icon/commentary/gotquestions.png",
        description: "절별 학술 주석보다는 신학 Q&A 형식. 성경 관련 8,000+ 질문을 주제·구절별로 검색하여 한국어 해설을 읽을 수 있다",
        tags: ["Q&A 형식", "주제별 해설", "신학 질문"]
    },
    {
        id: "biblehub-commentaries",
        siteName: "Bible Hub Commentaries",
        lang: "en",
        url: "https://biblehub.com/commentaries",
        favicon: "/images/icon/commentary/biblehub.png",
        description: "다양한 영어 주석(매튜 헨리·반즈 등)을 절별로 통합 제공",
        tags: ["주석 모음", "절별 비교"]
    },
    {
        id: "blueletterbible-comms",
        siteName: "Blue Letter Bible Commentaries",
        lang: "en",
        url: "https://www.blueletterbible.org/niv/gen/1/1/t_comms_1001",
        favicon: "/images/icon/commentary/blueletterbible.png",
        description: "스트롱 코드·원어 분석과 함께 주석을 절별로 제공 (창세기 1:1 진입)",
        tags: ["스트롱", "원어", "주석"]
    },
    {
        id: "biblegateway",
        siteName: "Bible Gateway",
        lang: "en",
        url: "https://www.biblegateway.com/",
        favicon: "/images/icon/commentary/biblegateway.png",
        description: "200+ 번역본 비교, 오디오 성경, 묵상 도구를 통합 제공",
        tags: ["다중 번역", "오디오", "묵상"]
    },
    {
        id: "studylight",
        siteName: "StudyLight",
        lang: "en",
        url: "https://www.studylight.org/",
        favicon: "/images/icon/commentary/studylight.png",
        description: "고전 주석(매튜 헨리·John Gill 등)과 사전을 무료로 제공",
        tags: ["고전 주석", "사전"]
    },
    {
        id: "sacred-texts-bib-cmt",
        siteName: "Internet Sacred Text Archive — Bible Commentaries",
        lang: "en",
        url: "https://sacred-texts.com/bib/cmt/index.htm",
        favicon: "/images/icon/commentary/sacred-texts.png",
        description: "여러 고전 성경 주석을 한 곳에서 무료로 열람할 수 있는 디지털 아카이브",
        tags: ["고전 주석", "디지털 아카이브", "무료"]
    },
    {
        id: "ccel-calvin-commentaries",
        siteName: "CCEL — Calvin's Commentaries",
        lang: "en",
        url: "https://ccel.org/c/calvin/comment2/home.html",
        favicon: "/images/icon/commentary/ccel.png",
        description: "장 칼빈의 성경 주석 전집을 무료로 열람할 수 있는 CCEL 디지털 아카이브",
        tags: ["칼빈", "고전 주석", "종교개혁"]
    },
    {
        id: "netbible",
        siteName: "NET Bible (Bible.org)",
        lang: "en",
        url: "https://netbible.org/",
        favicon: "/images/icon/commentary/netbible.png",
        description: "각주 6만 개 이상이 본문에 직접 연결된 학술적 영어 번역·주석",
        tags: ["학술 각주", "번역 노트"]
    }
];

class BibleCommentary {
    constructor() {
        this.state = { keyword: "" };
        this.searchTimer = null;
        this.composing = false;
        this.initElements();
        this.init();
    }

    initElements() {
        this.loadingEl = document.getElementById("bcLoading");
        this.contentEl = document.getElementById("bcContent");
        this.gridEl = document.getElementById("bcGrid");
        this.emptyEl = document.getElementById("bcEmpty");
        this.searchEl = document.getElementById("bcSearchInput");
        this.clearBtn = document.getElementById("bcSearchClear");
        this.backButton = document.getElementById("topNavBackButton");
    }

    init() {
        this.initNav();
        this.bindSearch();
        this.render();
        this.injectStructuredData();
        this.loadingEl.classList.add("d-none");
        this.contentEl.classList.remove("d-none");
    }

    initNav() {
        if (this.backButton) {
            this.backButton.addEventListener("click", () => {
                window.location.href = "/web/study";
            });
        }
    }

    bindSearch() {
        const handleInput = () => {
            if (this.composing) return;
            clearTimeout(this.searchTimer);
            this.searchTimer = setTimeout(() => {
                this.state.keyword = this.searchEl.value;
                this.toggleClearButton();
                this.render();
            }, 150);
        };

        this.searchEl.addEventListener("compositionstart", () => {
            this.composing = true;
        });

        this.searchEl.addEventListener("compositionend", () => {
            this.composing = false;
            handleInput();
        });

        this.searchEl.addEventListener("input", handleInput);

        this.clearBtn.addEventListener("click", () => {
            this.searchEl.value = "";
            this.state.keyword = "";
            this.toggleClearButton();
            this.render();
            this.searchEl.focus();
        });
    }

    toggleClearButton() {
        if (this.searchEl.value.trim().length > 0) {
            this.clearBtn.classList.remove("d-none");
        } else {
            this.clearBtn.classList.add("d-none");
        }
    }

    filterSites() {
        const kw = this.state.keyword.trim().toLowerCase();
        if (!kw) return BIBLE_COMMENTARY_SITES;
        return BIBLE_COMMENTARY_SITES.filter(site =>
            site.siteName.toLowerCase().includes(kw)
            || site.description.toLowerCase().includes(kw)
            || site.tags.some(t => t.toLowerCase().includes(kw))
        );
    }

    render() {
        const sites = this.filterSites();
        this.gridEl.replaceChildren();

        if (sites.length === 0) {
            this.emptyEl.classList.remove("d-none");
            return;
        }

        this.emptyEl.classList.add("d-none");
        const fragment = document.createDocumentFragment();
        sites.forEach(site => fragment.appendChild(this.createCard(site)));
        this.gridEl.appendChild(fragment);
    }

    createCard(site) {
        // XSS 방지: 모든 사용자 표시 텍스트는 textContent로
        const card = document.createElement("a");
        card.className = "bc-card";
        card.href = site.url;
        card.target = "_blank";
        card.rel = "noopener noreferrer";
        card.setAttribute("aria-label", `${site.siteName} (새 창에서 열림)`);

        const thumb = document.createElement("div");
        thumb.className = "bc-card-thumb";
        const img = document.createElement("img");
        img.src = site.favicon;
        img.alt = "";
        img.loading = "lazy";
        img.decoding = "async";
        img.width = 64;
        img.height = 64;
        img.addEventListener("error", () => {
            // 표준 웹 패턴: 이미지 로드 실패 시 사이트명 이니셜로 대체
            thumb.classList.add("bc-card-thumb-fallback");
            thumb.textContent = site.siteName.charAt(0).toUpperCase();
        });
        thumb.appendChild(img);
        card.appendChild(thumb);

        const body = document.createElement("div");
        body.className = "bc-card-body";

        const head = document.createElement("div");
        head.className = "bc-card-head";

        const title = document.createElement("h3");
        title.className = "bc-card-title";
        title.textContent = site.siteName;
        head.appendChild(title);

        const langBadge = document.createElement("span");
        langBadge.className = `bc-card-lang bc-card-lang-${site.lang}`;
        langBadge.setAttribute("aria-hidden", "true");
        langBadge.textContent = site.lang === "ko" ? "한글" : "EN";
        head.appendChild(langBadge);

        body.appendChild(head);

        const desc = document.createElement("p");
        desc.className = "bc-card-desc";
        desc.textContent = site.description;
        body.appendChild(desc);

        if (site.tags && site.tags.length > 0) {
            const tagList = document.createElement("ul");
            tagList.className = "bc-card-tags";
            tagList.setAttribute("aria-label", "태그");
            site.tags.forEach(tag => {
                const li = document.createElement("li");
                li.className = "bc-card-tag";
                li.textContent = tag;
                tagList.appendChild(li);
            });
            body.appendChild(tagList);
        }

        card.appendChild(body);

        const external = document.createElement("span");
        external.className = "bc-card-external";
        external.setAttribute("aria-hidden", "true");
        external.textContent = "↗";
        card.appendChild(external);

        return card;
    }

    injectStructuredData() {
        // schema.org ItemList — 검색엔진이 사이트 큐레이션 페이지로 인식
        const ld = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "성경 주석 사이트 큐레이션",
            "description": "권위 있는 성경 주석·연구 사이트를 한 곳에서 비교·탐색할 수 있는 큐레이션 페이지",
            "numberOfItems": BIBLE_COMMENTARY_SITES.length,
            "itemListOrder": "https://schema.org/ItemListOrderAscending",
            "itemListElement": BIBLE_COMMENTARY_SITES.map((site, idx) => ({
                "@type": "ListItem",
                "position": idx + 1,
                "item": {
                    "@type": "WebSite",
                    "name": site.siteName,
                    "url": site.url,
                    "description": site.description,
                    "inLanguage": site.lang === "ko" ? "ko-KR" : "en-US"
                }
            }))
        };
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.textContent = JSON.stringify(ld);
        document.head.appendChild(script);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new BibleCommentary();
});
