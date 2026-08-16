/**
 * 공동체성경읽기(PRS) - 드라마바이블 영상 목록
 *
 * 책 검색어는 ?keyword= 로 URL 에 남긴다. 상단 공유 버튼이 쿼리를 그대로 실어 보내므로
 * 받는 사람이 같은 목록을 보게 된다. 설계 문서: docs/common/url-share.md
 */

import {readDeepLinkParams, syncDeepLinkParams} from "/js/deep-link-util.js?v=1.0";

const PRS_VIDEOS = [
    // ── 구약 (39권) ──
    {bookOrder: 1, bookName: "창세기", youtubeUrl: "https://youtu.be/DaR5sH-036g?si=OLSn3Tya9WWA13Wu"},
    {bookOrder: 2, bookName: "출애굽기", youtubeUrl: "https://youtu.be/ynUSXcluVAo?si=bTKBLHTXYSpAbhTF"},
    {bookOrder: 3, bookName: "레위기", youtubeUrl: "https://youtu.be/T1Z4eTqGmVQ?si=bLfmqqFpedQ9DQLP"},
    {bookOrder: 4, bookName: "민수기", youtubeUrl: "https://youtu.be/qtnNwCNCJRU?si=J2iJ02mXE5js8Uw1"},
    {bookOrder: 5, bookName: "신명기", youtubeUrl: "https://youtu.be/wh1NX3XNqnQ?si=Pqdh8xeVgAsNbquo"},
    {bookOrder: 6, bookName: "여호수아", youtubeUrl: "https://youtu.be/yVtvT5RG8J4?si=TznhYc-Cu9uAy3zL"},
    {bookOrder: 7, bookName: "사사기", youtubeUrl: "https://youtu.be/Zpp6AJ60Y-k?si=Hpy5QeYvTJEDswFC"},
    {bookOrder: 8, bookName: "룻기", youtubeUrl: "https://youtu.be/trV-U1bbVRk?si=BMoGE6ivwvnA9P9l"},
    {bookOrder: 9, bookName: "사무엘상", youtubeUrl: "https://youtu.be/i0dn2e6A5MY?si=3y-pu0_xbswagTEN"},
    {bookOrder: 10, bookName: "사무엘하", youtubeUrl: "https://youtu.be/o92ZqyPVCbo?si=iJYpmEo9a7XySApm"},
    {bookOrder: 11, bookName: "열왕기상", youtubeUrl: "https://youtu.be/EafFiI-mBvw?si=ehsWbrO1xw-3BlJh"},
    {bookOrder: 12, bookName: "열왕기하", youtubeUrl: "https://youtu.be/zJlhrABqfFs?si=65w8XMMAoRkFeMPC"},
    {bookOrder: 13, bookName: "역대상", youtubeUrl: "https://youtu.be/D-5eUJj3BRY?si=_MoSVnUF4izfW18B"},
    {bookOrder: 14, bookName: "역대하", youtubeUrl: "https://youtu.be/b9es4tKiIeA?si=-uuyqoSqlx5FZrEE"},
    {bookOrder: 15, bookName: "에스라", youtubeUrl: "https://youtu.be/NwCG2t8tqBE?si=oymBcUyHJZZE5ta-"},
    {bookOrder: 16, bookName: "느헤미야", youtubeUrl: "https://youtu.be/k45UVgehRuQ?si=BDvaBgqcQByvL9kR"},
    {bookOrder: 17, bookName: "에스더", youtubeUrl: "https://youtu.be/Qj2pDvmvISA?si=nL4ews0SjeexAPj1"},
    {bookOrder: 18, bookName: "욥기", youtubeUrl: "https://youtu.be/VRafPcNOh1o?si=Qyt5WtskKP7Pg_7K"},
    {bookOrder: 19, bookName: "시편", youtubeUrl: "https://youtu.be/qZgejaNWe-w?si=TbjsrE2WK5AYhegY"},
    {bookOrder: 20, bookName: "잠언", youtubeUrl: "https://youtu.be/vjXtoi_hRNU?si=pukA_9HWShpU1Xgb"},
    {bookOrder: 21, bookName: "전도서", youtubeUrl: "https://youtu.be/1lH_YUAlgJY?si=RyujZhxsT4y8ot6U"},
    {bookOrder: 22, bookName: "아가", youtubeUrl: "https://youtu.be/RssSfKX5deQ?si=dg4Zgzue_yuq3kFz"},
    {bookOrder: 23, bookName: "이사야", youtubeUrl: "https://youtu.be/PrDrpjxHWFk?si=nwDIyeQovVBq3Vo-"},
    {bookOrder: 24, bookName: "예레미야", youtubeUrl: "https://youtu.be/tFFDjFIBn28?si=xsGk4huJNwtETzIl"},
    {bookOrder: 25, bookName: "예레미야애가", youtubeUrl: "https://youtu.be/MFFdjWzISgs?si=kR5tHG1D6r6ffm2h"},
    {bookOrder: 26, bookName: "에스겔", youtubeUrl: "https://youtu.be/E2MnuODJOfE?si=BenmTZ3kISsIgbrt"},
    {bookOrder: 27, bookName: "다니엘", youtubeUrl: "https://youtu.be/Kcs6FNfMYvY?si=ZqOeXXOvL6rWhm-c"},
    {bookOrder: 28, bookName: "호세아", youtubeUrl: "https://youtu.be/4zyMY1DH1LM?si=hHtyB0iQDKGgVUZK"},
    {bookOrder: 29, bookName: "요엘", youtubeUrl: "https://youtu.be/I1ZLDufpnPI?si=H-_InXlFYKuXNnMa"},
    {bookOrder: 30, bookName: "아모스", youtubeUrl: "https://youtu.be/-0Ha51yyNIc?si=oyu2yr07h2br-jEX"},
    {bookOrder: 31, bookName: "오바댜", youtubeUrl: "https://youtu.be/9OZxEC6PuyE?si=5YXSHX9yOPGpERpF"},
    {bookOrder: 32, bookName: "요나", youtubeUrl: "https://youtu.be/a8UTxG5wRfw?si=L1opg7GBm8lgORdZ"},
    {bookOrder: 33, bookName: "미가", youtubeUrl: "https://youtu.be/XWhMLn003ss?si=hifj5CJtlIFQsS27"},
    {bookOrder: 34, bookName: "나훔", youtubeUrl: "https://youtu.be/JfnTf8lI-xc?si=TokoVHxkIatvs00B"},
    {bookOrder: 35, bookName: "하박국", youtubeUrl: "https://youtu.be/yUmcNBjHjAM?si=72kB6U9X77pvyA3E"},
    {bookOrder: 36, bookName: "스바냐", youtubeUrl: "https://youtu.be/9NIQvuOuORE?si=vDQ_i_9NxxcxvYAQ"},
    {bookOrder: 37, bookName: "학개", youtubeUrl: "https://youtu.be/SXgLWOrPPoY?si=SVgjSZ5NRMyCJDwq"},
    {bookOrder: 38, bookName: "스가랴", youtubeUrl: "https://youtu.be/7nmICiGfGTM?si=gzjngrDJq1juafGl"},
    {bookOrder: 39, bookName: "말라기", youtubeUrl: "https://youtu.be/niU_fW1auu4?si=ZZuQEkvyHmLHaUPx"},
    // ── 신약 (27권) ──
    {bookOrder: 40, bookName: "마태복음", youtubeUrl: "https://youtu.be/BA61xFXBwCo?si=hzDpQcX3A9ZtR5Kb"},
    {bookOrder: 41, bookName: "마가복음", youtubeUrl: "https://youtu.be/6odQgUVVFLU?si=lllouyEIi8rN_wHw"},
    {bookOrder: 42, bookName: "누가복음", youtubeUrl: "https://youtu.be/c_y1TrISUXs?si=fOYAsG-wWB9phDRo"},
    {bookOrder: 43, bookName: "요한복음", youtubeUrl: "https://youtu.be/2UD9qiRp6B0?si=mVDrZKdCR2-trHbG"},
    {bookOrder: 44, bookName: "사도행전", youtubeUrl: "https://youtu.be/jVO5lOOS37w?si=G_oQmAyZ461MbP1K"},
    {bookOrder: 45, bookName: "로마서", youtubeUrl: "https://youtu.be/zDVkOQYmI0o?si=mMHJVwn7wjOiVK_k"},
    {bookOrder: 46, bookName: "고린도전서", youtubeUrl: "https://youtu.be/EKoXIgVMv6Y?si=LmiXDLs0Z7t7Hnzt"},
    {bookOrder: 47, bookName: "고린도후서", youtubeUrl: "https://youtu.be/pecL1Uk1fLE?si=pgn9n_ImCJ_SA_70"},
    {bookOrder: 48, bookName: "갈라디아서", youtubeUrl: "https://youtu.be/fj0rAyMYeow?si=aCK6Rj5gMDj6YQTF"},
    {bookOrder: 49, bookName: "에베소서", youtubeUrl: "https://youtu.be/LbquANbw0T0?si=yyXfhNAuzbolCWL0"},
    {bookOrder: 50, bookName: "빌립보서", youtubeUrl: "https://youtu.be/4teyRYSKFGk?si=lkMfPq8CIRpv2zx6"},
    {bookOrder: 51, bookName: "골로새서", youtubeUrl: "https://youtu.be/-ug5pvxvnUA?si=Gzuti1gVZhEIqx-X"},
    {bookOrder: 52, bookName: "데살로니가전서", youtubeUrl: "https://youtu.be/kW1KDmsR4Hg?si=vaZAjik_xlsVlOFP"},
    {bookOrder: 53, bookName: "데살로니가후서", youtubeUrl: "https://youtu.be/lafvlswau-Q?si=ptJapkNdaxJbUcmg"},
    {bookOrder: 54, bookName: "디모데전서", youtubeUrl: "https://youtu.be/bZBDM2lTPYg?si=bA5IYRY718yDtQmu"},
    {bookOrder: 55, bookName: "디모데후서", youtubeUrl: "https://youtu.be/Wmp4mjDioCs?si=RAYic8lpE98WOaBC"},
    {bookOrder: 56, bookName: "디도서", youtubeUrl: "https://youtu.be/XDhX2VJl0D4?si=dJW0plknjnCoMqXa"},
    {bookOrder: 57, bookName: "빌레몬서", youtubeUrl: "https://youtu.be/JW8aOeWaiWU?si=L3QtLZNzSbBWbt26"},
    {bookOrder: 58, bookName: "히브리서", youtubeUrl: "https://youtu.be/ouVU9S6r7Qw?si=TRnpSqABRKwoRTbU"},
    {bookOrder: 59, bookName: "야고보서", youtubeUrl: "https://youtu.be/KB4oyzTsKjQ?si=XJtg74Phgm7U4ek5"},
    {bookOrder: 60, bookName: "베드로전서", youtubeUrl: "https://youtu.be/v-yh2bDVHY8?si=b4W2j-9aBr8LjejV"},
    {bookOrder: 61, bookName: "베드로후서", youtubeUrl: "https://youtu.be/1e4pjWtYgUI?si=gZraC5p-MMeczA5N"},
    {bookOrder: 62, bookName: "요한1서", youtubeUrl: "https://youtu.be/hpX4oQdmV78?si=Zw1qgfyz2r3WSOWx"},
    {bookOrder: 63, bookName: "요한2서", youtubeUrl: "https://youtu.be/TBgQSyXViU0?si=TiGod4k4j-6Je3C-"},
    {bookOrder: 64, bookName: "요한3서", youtubeUrl: "https://youtu.be/1vAdhS1KctY?si=HZozdfx3jzjUcr0K"},
    {bookOrder: 65, bookName: "유다서", youtubeUrl: "https://youtu.be/QTrzN5zdZMA?si=gMG116WcVGAST-m0"},
    {bookOrder: 66, bookName: "요한계시록", youtubeUrl: "https://youtu.be/sPFEROfY2AY?si=N1pLIApE9tfD1Dxi"},
];

class PublicReadingOfScripture {
    constructor() {
        this.initElements();
        this.init();
    }

    initElements() {
        this.loadingEl = document.getElementById("videoLoading");
        this.contentEl = document.getElementById("videoContent");
        this.oldTestamentGrid = document.getElementById("oldTestamentGrid");
        this.newTestamentGrid = document.getElementById("newTestamentGrid");
        this.oldTestamentSection = document.getElementById("oldTestamentSection");
        this.newTestamentSection = document.getElementById("newTestamentSection");
        this.backButton = document.getElementById("topNavBackButton");
        this.bookSearchInput = document.getElementById("bookSearchInput");
        this.bookSearchClear = document.getElementById("bookSearchClear");
        this.bookSearchEmpty = document.getElementById("bookSearchEmpty");
    }

    init() {
        this.initNav();
        this.render();
        this.initBookSearch();
        this.restoreBookSearch();
        this.scrollToTargetBook();
    }

    initNav() {
        if (!this.backButton) return;

        const pageTitleLabel = document.getElementById("pageTitleLabel");
        if (pageTitleLabel) {
            pageTitleLabel.textContent = "공동체성경읽기";
            pageTitleLabel.classList.remove("d-none");
        }
        this.backButton.classList.remove("d-none");

        const urlParams = new URLSearchParams(window.location.search);
        this.from = urlParams.get("from");

        this.backButton.addEventListener("click", () => {
            if (this.from === "chapter-list") {
                history.back();
                return;
            }
            window.location.href = "/web/study";
        });
    }

    render() {
        const oldTestament = PRS_VIDEOS.filter(b => b.bookOrder <= 39);
        const newTestament = PRS_VIDEOS.filter(b => b.bookOrder >= 40);

        oldTestament.forEach(book => this.oldTestamentGrid.appendChild(this.createCard(book)));
        newTestament.forEach(book => this.newTestamentGrid.appendChild(this.createCard(book)));

        this.loadingEl.classList.add("d-none");
        this.contentEl.classList.remove("d-none");
    }

    extractVideoId(url) {
        const match = url.match(/youtu\.be\/([^?]+)/);
        return match ? match[1] : null;
    }

    createCard(book) {
        const hasVideo = book.youtubeUrl !== "";

        if (hasVideo) {
            const videoId = this.extractVideoId(book.youtubeUrl);
            const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : "";

            const link = document.createElement("a");
            link.className = "prs-card";
            link.dataset.bookOrder = book.bookOrder;
            link.href = book.youtubeUrl;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.setAttribute("aria-label", `${book.bookName} 영상 보기`);
            link.innerHTML = `
                <div class="prs-thumb">
                    <img src="${thumbnailUrl}" alt="" loading="lazy"
                         onerror="this.parentElement.classList.add('is-fallback');this.remove();">
                    <span class="prs-play" aria-hidden="true">▶</span>
                </div>
                <span class="prs-book-name">${book.bookName}</span>
            `;
            return link;
        }

        const div = document.createElement("div");
        div.className = "prs-card is-disabled";
        div.dataset.bookOrder = book.bookOrder;
        div.innerHTML = `
            <div class="prs-thumb is-fallback">
                <span class="prs-play" aria-hidden="true"></span>
            </div>
            <span class="prs-book-name">${book.bookName}</span>
            <span class="prs-badge">준비중</span>
        `;
        return div;
    }

    initBookSearch() {
        if (!this.bookSearchInput) return;

        this.bookSearchInput.addEventListener("input", () => {
            const keyword = this.bookSearchInput.value.trim();
            this.bookSearchClear.classList.toggle("d-none", keyword.length === 0);
            this.filterBooks(keyword);
            syncDeepLinkParams({keyword});
        });

        this.bookSearchClear.addEventListener("click", () => {
            this.bookSearchInput.value = "";
            this.bookSearchClear.classList.add("d-none");
            this.filterBooks("");
            syncDeepLinkParams({keyword: null});
            this.bookSearchInput.focus();
        });
    }

    /** 공유 링크로 들어온 ?keyword= 를 검색창에 되돌리고 목록에 반영한다. */
    restoreBookSearch() {
        if (!this.bookSearchInput) return;

        const keyword = (readDeepLinkParams().get("keyword") ?? "").trim();
        if (!keyword) return;

        this.bookSearchInput.value = keyword;
        this.bookSearchClear.classList.remove("d-none");
        this.filterBooks(keyword);
    }

    filterBooks(keyword) {
        const filtered = keyword
            ? PRS_VIDEOS.filter(book => book.bookName.includes(keyword))
            : PRS_VIDEOS;

        const oldTestament = filtered.filter(b => b.bookOrder <= 39);
        const newTestament = filtered.filter(b => b.bookOrder >= 40);

        this.oldTestamentGrid.innerHTML = "";
        this.newTestamentGrid.innerHTML = "";
        oldTestament.forEach(book => this.oldTestamentGrid.appendChild(this.createCard(book)));
        newTestament.forEach(book => this.newTestamentGrid.appendChild(this.createCard(book)));

        this.oldTestamentSection.classList.toggle("d-none", oldTestament.length === 0);
        this.newTestamentSection.classList.toggle("d-none", newTestament.length === 0);

        if (!keyword) {
            this.oldTestamentSection.classList.remove("d-none");
            this.newTestamentSection.classList.remove("d-none");
        }

        if (this.bookSearchEmpty) {
            this.bookSearchEmpty.classList.toggle("d-none", filtered.length > 0 || !keyword);
        }
    }

    scrollToTargetBook() {
        const bookOrder = parseInt(new URLSearchParams(window.location.search).get("bookOrder"), 10);
        if (!bookOrder) return;

        const targetCard = document.querySelector(`.prs-card[data-book-order="${bookOrder}"]`);
        if (!targetCard) return;

        const searchWrapper = document.querySelector(".book-search-wrapper");

        setTimeout(() => {
            const overlay = document.createElement("div");
            overlay.className = "prs-spotlight-overlay";
            document.body.appendChild(overlay);

            targetCard.classList.add("is-spotlight-target");
            // 스포트라이트 진행 중에는 상단 검색창을 잠시 숨겨 포커스 효과를 강조
            if (searchWrapper) {
                searchWrapper.classList.add("is-spotlight-hidden");
            }

            requestAnimationFrame(() => {
                overlay.classList.add("is-active");
                targetCard.scrollIntoView({behavior: "smooth", block: "center"});
            });

            let dismissed = false;
            const dismiss = () => {
                if (dismissed) return;
                dismissed = true;
                overlay.classList.remove("is-active");
                targetCard.classList.remove("is-spotlight-target");
                // 스포트라이트 종료 시 상단 검색창 다시 노출
                if (searchWrapper) {
                    searchWrapper.classList.remove("is-spotlight-hidden");
                }
                overlay.addEventListener("transitionend", () => overlay.remove(), {once: true});
            };

            overlay.addEventListener("click", dismiss, {once: true});
            setTimeout(dismiss, 4000);
        }, 100);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new PublicReadingOfScripture();
});
