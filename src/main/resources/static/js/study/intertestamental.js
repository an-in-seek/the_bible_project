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
    if (this.buttons.length === 0) {
      return;
    }
    this.buttons.forEach((button) => {
      button.addEventListener('click', () => this.toggle(button));
    });
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
