/**
 * 성경 중간사 — 통치 세력 상세 패널 토글
 *
 * 설계 문서: docs/study/biblical-intertestamental-period-study-page-design.md
 *
 * 이 페이지의 콘텐츠는 전부 Thymeleaf 정적 마크업이다(설계 §5-1).
 * JS의 책임은 상세 패널 토글 하나뿐이며, 데이터 배열도 렌더링 함수도 두지 않는다.
 */

class IntertestamentalPage {

  init() {
    this.buttons = Array.from(document.querySelectorAll('.itp-ruler-card'));
    this.buttons.forEach((button) => {
      button.addEventListener('click', () => this.toggle(button));
    });
    this.bindScrollToTop();
  }

  /**
   * 맨 위로 이동 버튼.
   *
   * 이 페이지는 콘텐츠가 길어(통치 세력 6개 + 변화 축 7개 + 분파 표 + 카드 3종)
   * 하단에서 상단으로 돌아가는 수단이 필요하다. 버튼 마크업은 템플릿에 있고
   * 노출 여부는 여기서 `is-visible` 로 토글한다.
   */
  bindScrollToTop() {
    const button = document.getElementById('scrollToTopBtn');
    if (button === null) {
      return;
    }

    button.addEventListener('click', () => {
      const query = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
      const reduce = query ? query.matches : false;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });

    window.addEventListener('scroll', () => {
      button.classList.toggle('is-visible', window.scrollY >= 300);
    }, { passive: true });
  }

  toggle(button) {
    const panel = this.panelOf(button);
    if (panel === null) {
      return;
    }

    const willOpen = panel.hidden;
    this.closeAll();

    if (willOpen) {
      panel.hidden = false;
      button.setAttribute('aria-expanded', 'true');
    }
  }

  closeAll() {
    this.buttons.forEach((button) => {
      const panel = this.panelOf(button);
      if (panel !== null) {
        panel.hidden = true;
      }
      button.setAttribute('aria-expanded', 'false');
    });
  }

  panelOf(button) {
    const panelId = button.getAttribute('aria-controls');
    return panelId ? document.getElementById(panelId) : null;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new IntertestamentalPage().init();
});
