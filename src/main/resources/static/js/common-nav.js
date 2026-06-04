/**
 * 섹션 네비게이션 (Bottom Tab Bar / Navigation Rail)
 * - 클릭 시 Active 상태 즉시 전환 (SSR 깜빡임 대응)
 * - 중복 클릭(어뷰징) 방지
 * - 스크롤 방향 기반 auto-hide (공존 페이지 전용)
 * - 키보드 네비게이션 (화살표키)
 * - 성경 탭: 최근 읽던 위치가 있으면 해당 화면으로 바로 이동
 */

import {LastReadStore} from "/js/storage-util.js?v=2.3";

const nav = document.querySelector('.section-nav');

if (nav) {
    const navItems = nav.querySelectorAll('.section-nav-item');

    // --- 현재 페이지와 동일 섹션인지 URL 경로 비교 ---
    function isSameSection(href) {
        const currentPath = window.location.pathname;
        if (href === '/') return currentPath === '/';
        return currentPath === href || currentPath.startsWith(href + '/');
    }

    // --- Active 상태 즉시 전환 (SSR 깜빡임 대응) ---
    function activateItem(target) {
        navItems.forEach(el => {
            el.classList.remove('active');
            el.removeAttribute('aria-current');
        });
        target.classList.add('active');
        target.setAttribute('aria-current', 'page');
    }

    // --- 성경 탭: 최근 읽던 위치로 바로 이동 ---
    const bibleNavItem = nav.querySelector('a[href="/web/bible/translation"]');
    if (bibleNavItem) {
        bibleNavItem.addEventListener('click', (e) => {
            if (bibleNavItem.classList.contains('active')
                || isSameSection('/web/bible')) {
                e.preventDefault();
                return;
            }
            const lastRead = LastReadStore.get();
            if (lastRead) {
                e.preventDefault();
                activateItem(bibleNavItem);
                const verseUrl = new URL("/web/bible/verse", window.location.origin);
                verseUrl.searchParams.set("translationId", lastRead.translationId);
                verseUrl.searchParams.set("bookOrder", lastRead.bookOrder);
                verseUrl.searchParams.set("chapterNumber", lastRead.chapterNumber);
                verseUrl.searchParams.set("from", "home"); // 뒤로가기 시 홈으로 복귀
                window.location.href = `${verseUrl.pathname}${verseUrl.search}`;
            }
        });
    }

    // --- 중복 클릭 방지 + 클릭 피드백: 즉시 Active 상태 전환 (SSR 페이지 리로드 깜빡임 대응) ---
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const href = item.getAttribute('href');
            if (item.classList.contains('active') || isSameSection(href)) {
                e.preventDefault();
                return;
            }
            activateItem(item);
        });
    });

    // --- 스크롤 auto-hide (모바일 + has-dual-bottom-nav 페이지 전용) ---
    if (document.body.classList.contains('has-dual-bottom-nav')) {
        let lastScrollY = window.scrollY;
        const SCROLL_THRESHOLD = 10;

        window.addEventListener('scroll', () => {
            const delta = window.scrollY - lastScrollY;
            if (Math.abs(delta) < SCROLL_THRESHOLD) return;

            if (delta > 0 && window.scrollY > 0) {
                document.body.classList.add('bottom-tab-hidden');
                document.body.classList.add('top-nav-hidden');
            } else {
                document.body.classList.remove('bottom-tab-hidden');
                document.body.classList.remove('top-nav-hidden');
            }
            lastScrollY = window.scrollY;
        }, { passive: true });
    }

    // --- 키보드 네비게이션 (화살표키로 항목 간 이동, CSS order 기반 시각적 순서) ---
    nav.addEventListener('keydown', (e) => {
        const items = [...navItems].sort((a, b) => {
            const orderA = parseInt(getComputedStyle(a).order) || 0;
            const orderB = parseInt(getComputedStyle(b).order) || 0;
            return orderA - orderB;
        });
        const currentIndex = items.indexOf(document.activeElement);
        if (currentIndex === -1) return;

        let nextIndex;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            e.preventDefault();
            nextIndex = (currentIndex + 1) % items.length;
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            e.preventDefault();
            nextIndex = (currentIndex - 1 + items.length) % items.length;
        }

        if (nextIndex !== undefined) {
            items[nextIndex].focus();
        }
    });
}
