import {LastReadStore} from "/js/storage-util.js?v=2.7";
import {initUniverse} from "/js/home/universe-bg.js?v=1.4";
import {initPopularSearch} from "/js/popular-search.js?v=1.3";

const HERO_INTERVAL_MS = 5000;
const HERO_SWIPE_THRESHOLD = 50;

const initHeroCarousel = () => {
    const track = document.getElementById("heroTrack");
    if (!track) {
        return;
    }
    const slides = track.querySelectorAll(".home-hero-slide");
    const dots = track.parentElement.querySelectorAll(".home-hero-dot");
    if (slides.length < 2) {
        return;
    }

    let current = 0;
    let timer = null;
    let touchStartX = 0;

    const goTo = (index) => {
        current = (index + slides.length) % slides.length;
        track.style.transform = `translateX(-${current * 100}%)`;
        dots.forEach((dot, i) => {
            const isActive = i === current;
            dot.classList.toggle("active", isActive);
            dot.setAttribute("aria-selected", String(isActive));
        });
    };

    const resetTimer = () => {
        clearInterval(timer);
        timer = setInterval(() => goTo(current + 1), HERO_INTERVAL_MS);
    };

    dots.forEach((dot) => {
        dot.addEventListener("click", () => {
            goTo(Number(dot.dataset.slide));
            resetTimer();
        });
    });

    track.parentElement.addEventListener("touchstart", (e) => {
        touchStartX = e.touches[0].clientX;
    }, {passive: true});

    track.parentElement.addEventListener("touchend", (e) => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > HERO_SWIPE_THRESHOLD) {
            goTo(diff > 0 ? current + 1 : current - 1);
            resetTimer();
        }
    }, {passive: true});

    resetTimer();
};

document.addEventListener("DOMContentLoaded", () => {
    initHeroCarousel();
    initUniverse("universeCanvas", "universeSection");
    initPopularSearch();

    const pageTitleLabel = document.getElementById("pageTitleLabel");
    if (pageTitleLabel) {
        pageTitleLabel.textContent = "ElSeeker";
        pageTitleLabel.classList.remove("d-none");
    }

    const bibleMenuCard = document.getElementById("bibleMenuCard");
    if (bibleMenuCard) {
        bibleMenuCard.addEventListener("click", (e) => {
            const lastRead = LastReadStore.get();
            if (lastRead) {
                e.preventDefault();
                const verseUrl = new URL("/web/bible/verse", window.location.origin);
                verseUrl.searchParams.set("translationId", lastRead.translationId);
                verseUrl.searchParams.set("bookOrder", lastRead.bookOrder);
                verseUrl.searchParams.set("chapterNumber", lastRead.chapterNumber);
                verseUrl.searchParams.set("from", "home"); // 뒤로가기 시 홈으로 복귀
                window.location.href = `${verseUrl.pathname}${verseUrl.search}`;
            }
        });
    }
});
