/**
 * 성경 개요 영상 - 66권 유튜브 영상 목록
 */

const BIBLE_VIDEOS = [
    {bookOrder: 1, bookName: "창세기", youtubeUrl: "https://youtu.be/dLv2ndgXrbo?si=sJmYqcu0vhoJdBKB"},
    {bookOrder: 2, bookName: "출애굽기", youtubeUrl: "https://youtu.be/PrTbYx6KbtY?si=Xo6fG7ECW1_ozIek"},
    {bookOrder: 3, bookName: "레위기", youtubeUrl: "https://youtu.be/OUPcm3QGt7Y?si=eVht_QCA11EVStth"},
    {bookOrder: 4, bookName: "민수기", youtubeUrl: "https://youtu.be/Q0Lac54urBU?si=CgpRmPOwBzQebdun"},
    {bookOrder: 5, bookName: "신명기", youtubeUrl: "https://youtu.be/HOA8818FdYc?si=EIKshhqyR1HbZQy3"},
    {bookOrder: 6, bookName: "여호수아", youtubeUrl: "https://youtu.be/9MmKvOItPds?si=CIUk6-yeQQGXh0CS"},
    {bookOrder: 7, bookName: "사사기", youtubeUrl: "https://youtu.be/2rnPxn2aeN0?si=UFWrgTdLtMJrjEMh"},
    {bookOrder: 8, bookName: "룻기", youtubeUrl: "https://youtu.be/jB2au0FGgjo?si=DtsVq0Pl7i7Osroq"},
    {bookOrder: 9, bookName: "사무엘상", youtubeUrl: "https://youtu.be/gZ9Jf2FeZJQ?si=yVkIRcbA9Sk1SDNp"},
    {bookOrder: 10, bookName: "사무엘하", youtubeUrl: "https://youtu.be/QYuSYPIfFPA?si=j2NX-_j20s75TCYu"},
    {bookOrder: 11, bookName: "열왕기상", youtubeUrl: "https://youtu.be/jIcsdztsKBE?si=mO2SmJDugqr5Kjfv"},
    {bookOrder: 12, bookName: "열왕기하", youtubeUrl: "https://youtu.be/jIcsdztsKBE?si=mO2SmJDugqr5Kjfv"},
    {bookOrder: 13, bookName: "역대상", youtubeUrl: "https://youtu.be/AgRvk1qOAgg?si=DbkCoJM56gGJ6ICk"},
    {bookOrder: 14, bookName: "역대하", youtubeUrl: "https://youtu.be/AgRvk1qOAgg?si=DbkCoJM56gGJ6ICk"},
    {bookOrder: 15, bookName: "에스라", youtubeUrl: "https://youtu.be/IxHJN4cOl-c?si=F-fnWC8aEmmgy1Rk"},
    {bookOrder: 16, bookName: "느헤미야", youtubeUrl: "https://youtu.be/IxHJN4cOl-c?si=F-fnWC8aEmmgy1Rk"},
    {bookOrder: 17, bookName: "에스더", youtubeUrl: "https://youtu.be/e4rGAPgtBbc?si=WvGLMaWidBbLIT7T"},
    {bookOrder: 18, bookName: "욥기", youtubeUrl: "https://youtu.be/SoOSMWGuDxk?si=4Nx9oF4P8n_hiE3Y"},
    {bookOrder: 19, bookName: "시편", youtubeUrl: "https://youtu.be/amAZ8ewil7g?si=RWDtLgCS666-3M9S"},
    {bookOrder: 20, bookName: "잠언", youtubeUrl: "https://youtu.be/WPAs3uHoPDI?si=6csGm0l6UBXRt591"},
    {bookOrder: 21, bookName: "전도서", youtubeUrl: "https://youtu.be/8bnFXIKuq3U?si=XhEw0dhi0m1n5rFU"},
    {bookOrder: 22, bookName: "아가", youtubeUrl: "https://youtu.be/jLA7P-L9NgU?si=kDFVgbIysy81Us3C"},
    {bookOrder: 23, bookName: "이사야", youtubeUrl: "https://youtu.be/b0-A9qEu5ug?si=hrNPdF_Uc-3jQfrU"},
    {bookOrder: 24, bookName: "예레미야", youtubeUrl: "https://youtu.be/ErL1bUKQIIY?si=yQrrNkRb0qYAWuoG"},
    {bookOrder: 25, bookName: "예레미야애가", youtubeUrl: "https://youtu.be/twumxE5HxYU?si=auzxl_m-vb6W0ffu"},
    {bookOrder: 26, bookName: "에스겔", youtubeUrl: "https://youtu.be/IO9XplZBcvk?si=Q5bfioLqzLdZBMqN"},
    {bookOrder: 27, bookName: "다니엘", youtubeUrl: "https://youtu.be/clI5OYY4lVo?si=w8GpMUEYIlZf_333"},
    {bookOrder: 28, bookName: "호세아", youtubeUrl: "https://youtu.be/M669lzWgN5k?si=1Y-GIRxAYjI0TyiI"},
    {bookOrder: 29, bookName: "요엘", youtubeUrl: "https://youtu.be/4ucQjbVb4oE?si=ny8qt0IoNuhPShYG"},
    {bookOrder: 30, bookName: "아모스", youtubeUrl: "https://youtu.be/FOH4qvNr9O8?si=hWIcBPMGe1dVDmgN"},
    {bookOrder: 31, bookName: "오바댜", youtubeUrl: "https://youtu.be/znmT4B8j4xA?si=ThMplhyNo4z0GKDn"},
    {bookOrder: 32, bookName: "요나", youtubeUrl: "https://youtu.be/P6bSRsI4rY0?si=8ZGXs7gSk_IUDp2o"},
    {bookOrder: 33, bookName: "미가", youtubeUrl: "https://youtu.be/cES-IDPeU4E?si=6Sab8VuetOXHUhg1"},
    {bookOrder: 34, bookName: "나훔", youtubeUrl: "https://youtu.be/qhJQqrm2pUw?si=K5HHEPi1mr5bDwWO"},
    {bookOrder: 35, bookName: "하박국", youtubeUrl: "https://youtu.be/BRbdfL0u4hQ?si=OWredLuwEiy-_HUl"},
    {bookOrder: 36, bookName: "스바냐", youtubeUrl: "https://youtu.be/WWIQaLlsCjo?si=U1dEH8tZj4FmViwp"},
    {bookOrder: 37, bookName: "학개", youtubeUrl: "https://youtu.be/j-S26FNz_XY?si=-DCXCs-zmeEhglqu"},
    {bookOrder: 38, bookName: "스가랴", youtubeUrl: "https://youtu.be/l8CdmoLKq3E?si=SpdQ-zUg0GGwlCh2"},
    {bookOrder: 39, bookName: "말라기", youtubeUrl: "https://youtu.be/KxJb21AxVqI?si=eg9aaKRDjzMM-WKl"},
    {bookOrder: 40, bookName: "마태복음", youtubeUrl: "https://youtu.be/cbabreYd34Q?si=EphYGrZe4NpiTPAZ"},
    {bookOrder: 41, bookName: "마가복음", youtubeUrl: "https://youtu.be/hKtkrVwvFoo?si=hLWtNwMV3bRjGchs"},
    {bookOrder: 42, bookName: "누가복음", youtubeUrl: "https://youtu.be/szex2l67GwQ?si=LAm_zPfs0NGpQkWI"},
    {bookOrder: 43, bookName: "요한복음", youtubeUrl: "https://youtu.be/FV55I_rX4Kg?si=iVtQVscV-w9culCm"},
    {bookOrder: 44, bookName: "사도행전", youtubeUrl: "https://youtu.be/kOCqsPst9Ag?si=3Cvcnh021APNElhs"},
    {bookOrder: 45, bookName: "로마서", youtubeUrl: "https://youtu.be/PT4C0ley074?si=53vTkQrIngpYIwnk"},
    {bookOrder: 46, bookName: "고린도전서", youtubeUrl: "https://youtu.be/SoxLSx5DOjg?si=k0EgqKkHRg5a5SM7"},
    {bookOrder: 47, bookName: "고린도후서", youtubeUrl: "https://youtu.be/xZFXdP7CCcc?si=VAnxhV0fJ8wbY0bl"},
    {bookOrder: 48, bookName: "갈라디아서", youtubeUrl: "https://youtu.be/IRaMP5i4ROc?si=iAcgoMxfjAhagzRk"},
    {bookOrder: 49, bookName: "에베소서", youtubeUrl: "https://youtu.be/1Cvb3mjw7WQ?si=hE4cVlGtU1gdgSGd"},
    {bookOrder: 50, bookName: "빌립보서", youtubeUrl: "https://youtu.be/P2stOv4EuD8?si=alrr0SBbo-7Et_nx"},
    {bookOrder: 51, bookName: "골로새서", youtubeUrl: "https://youtu.be/PToo8H3ESmI?si=OlgLQIjZRxGA10LQ"},
    {bookOrder: 52, bookName: "데살로니가전서", youtubeUrl: "https://youtu.be/78mjPkm3gNU?si=hpBcGWkde1pr1xh4"},
    {bookOrder: 53, bookName: "데살로니가후서", youtubeUrl: "https://youtu.be/aSvUcBhd4hQ?si=5Jxi0LlA09vZZurI"},
    {bookOrder: 54, bookName: "디모데전서", youtubeUrl: "https://youtu.be/TPaaXttsgzY?si=BcHNsmJzwcjQYEz3"},
    {bookOrder: 55, bookName: "디모데후서", youtubeUrl: "https://youtu.be/2rbLGN90JyE?si=fVapJBla3MbLQj0f"},
    {bookOrder: 56, bookName: "디도서", youtubeUrl: "https://youtu.be/tdTrkbn8plI?si=iQgG7r9Gek6k06ig"},
    {bookOrder: 57, bookName: "빌레몬서", youtubeUrl: "https://youtu.be/FF52ylLRH3g?si=ZbTkr34dzX_T0npL"},
    {bookOrder: 58, bookName: "히브리서", youtubeUrl: "https://youtu.be/_y4X0Y1nu5E?si=SYd1VjlQHZtU-CFc"},
    {bookOrder: 59, bookName: "야고보서", youtubeUrl: "https://youtu.be/PKic-DpY3O4?si=d248N_38IUJUKBO2"},
    {bookOrder: 60, bookName: "베드로전서", youtubeUrl: "https://youtu.be/5te24c_61aI?si=MV_X3Kd4qYRa2Che"},
    {bookOrder: 61, bookName: "베드로후서", youtubeUrl: "https://youtu.be/Ii-v2hGv-zk?si=C93Z5HtM8xpAe5Ux"},
    {bookOrder: 62, bookName: "요한1서", youtubeUrl: "https://youtu.be/cMKPbDZhToo?si=I-SO7O8SGtdhLWGJ"},
    {bookOrder: 63, bookName: "요한2서", youtubeUrl: "https://youtu.be/cMKPbDZhToo?si=I-SO7O8SGtdhLWGJ"},
    {bookOrder: 64, bookName: "요한3서", youtubeUrl: "https://youtu.be/cMKPbDZhToo?si=I-SO7O8SGtdhLWGJ"},
    {bookOrder: 65, bookName: "유다서", youtubeUrl: "https://youtu.be/ggYH-spyKHY?si=ku7cTUbVsFJBO67D"},
    {bookOrder: 66, bookName: "요한계시록", youtubeUrl: "https://youtu.be/ue4ZFykrMJ8?si=b1XSktafOvar288A"},
];

class BibleOverviewVideo {
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
        this.scrollToTargetBook();
    }

    initNav() {
        if (!this.backButton) return;

        const pageTitleLabel = document.getElementById("pageTitleLabel");
        if (pageTitleLabel) {
            pageTitleLabel.textContent = "성경 개요 영상";
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
        const oldTestament = BIBLE_VIDEOS.filter(b => b.bookOrder <= 39);
        const newTestament = BIBLE_VIDEOS.filter(b => b.bookOrder >= 40);

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
            link.className = "bible-overview-video-card";
            link.dataset.bookOrder = book.bookOrder;
            link.href = book.youtubeUrl;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.setAttribute("aria-label", `${book.bookName} 영상 보기`);
            link.innerHTML = `
                <div class="bible-overview-video-thumb">
                    <img src="${thumbnailUrl}" alt="" loading="lazy"
                         onerror="this.parentElement.classList.add('is-fallback');this.remove();">
                    <span class="bible-overview-video-play" aria-hidden="true">▶</span>
                </div>
                <span class="bible-overview-video-book-name">${book.bookName}</span>
            `;
            return link;
        }

        const div = document.createElement("div");
        div.className = "bible-overview-video-card is-disabled";
        div.dataset.bookOrder = book.bookOrder;
        div.innerHTML = `
            <div class="bible-overview-video-thumb is-fallback">
                <span class="bible-overview-video-play" aria-hidden="true"></span>
            </div>
            <span class="bible-overview-video-book-name">${book.bookName}</span>
            <span class="bible-overview-video-badge">준비중</span>
        `;
        return div;
    }

    initBookSearch() {
        if (!this.bookSearchInput) return;

        this.bookSearchInput.addEventListener("input", () => {
            const keyword = this.bookSearchInput.value.trim();
            this.bookSearchClear.classList.toggle("d-none", keyword.length === 0);
            this.filterBooks(keyword);
        });

        this.bookSearchClear.addEventListener("click", () => {
            this.bookSearchInput.value = "";
            this.bookSearchClear.classList.add("d-none");
            this.filterBooks("");
            this.bookSearchInput.focus();
        });
    }

    filterBooks(keyword) {
        const filtered = keyword
            ? BIBLE_VIDEOS.filter(book => book.bookName.includes(keyword))
            : BIBLE_VIDEOS;

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

        const targetCard = document.querySelector(`.bible-overview-video-card[data-book-order="${bookOrder}"]`);
        if (!targetCard) return;

        const searchWrapper = document.querySelector(".book-search-wrapper");

        setTimeout(() => {
            const overlay = document.createElement("div");
            overlay.className = "video-spotlight-overlay";
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
    new BibleOverviewVideo();
});
