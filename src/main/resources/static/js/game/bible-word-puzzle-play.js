import {fetchWithAuthRetry} from '/js/common-util.js';
import {showConfirm} from '/js/confirm-dialog.js?v=1.0';

const API_BASE = '/api/v1/game/word-puzzles';

// ── 상태 ──
const state = {
  puzzleId: null,
  attemptId: null,
  board: null,
  entries: [],
  cellMap: {},          // "행,열" → 셀 데이터
  selectedRow: null,
  selectedCol: null,
  direction: 'ACROSS',
  elapsedSeconds: 0,
  timerInterval: null,
  // 변경된 셀 목록 (자동 저장용)
  dirtyCells: [],
  saveTimeout: null
};

// 한글 IME 조합 상태 추적 (셀 단위)
let composingCellKey = null;
let compositionEndCellKey = null;  // 조합 종료 직후 input/blur 이벤트가 값을 덮어쓰지 않도록 방지
let pendingMove = null;  // 조합 중 Enter/Space 입력 시 조합 완료 후 실행할 이동 함수

// ── DOM 참조 ──
const $ = (id) => document.getElementById(id);

const playSection = $('wpPlaySection');
const resultSection = $('wpResultSection');
const playLoading = $('wpPlayLoading');

const boardEl = $('wpBoard');
const clueNumber = $('wpClueNumber');
const clueText = $('wpClueText');
const timerEl = $('wpTimer');
const titleEl = $('wpPlayTitle');
const submitBtn = $('wpSubmitBtn');
const saveBanner = $('wpSaveBanner');
const errorEl = $('wpError');

const KEYBOARD_OPEN_THRESHOLD = 150;
const KEYBOARD_VIEWPORT_GAP = 120;
let keyboardLayoutFrame = null;

// 상단 내비게이션
const backButton = $('topNavBackButton');
const pageTitleLabel = $('pageTitleLabel');

// ── 초기화 ──
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  setupPlayListeners();
  setupMobileKeyboardHandling();
  initPuzzle();
});

function setupMobileKeyboardHandling() {
  if (!window.visualViewport) {
    return;
  }

  window.visualViewport.addEventListener('resize', scheduleMobileKeyboardLayout);
  window.visualViewport.addEventListener('scroll', scheduleMobileKeyboardLayout);
}

function scheduleMobileKeyboardLayout() {
  if (!window.visualViewport) {
    return;
  }
  if (keyboardLayoutFrame != null) {
    cancelAnimationFrame(keyboardLayoutFrame);
  }

  keyboardLayoutFrame = requestAnimationFrame(() => {
    keyboardLayoutFrame = null;
    updateMobileKeyboardLayout();
  });
}

function updateMobileKeyboardLayout() {
  const viewport = window.visualViewport;
  if (!viewport || playSection.classList.contains('d-none')) {
    clearMobileKeyboardInset();
    return;
  }

  const keyboardInset = Math.max(
      0,
      window.innerHeight - (viewport.height + viewport.offsetTop)
  );
  const editableCellFocused = document.activeElement?.classList.contains('wp-cell-input');
  const nearDefaultScale = Math.abs((viewport.scale ?? 1) - 1) < 0.05;
  const keyboardOpen = editableCellFocused
      && nearDefaultScale
      && keyboardInset > KEYBOARD_OPEN_THRESHOLD;

  playSection.style.paddingBottom = keyboardOpen
      ? `${keyboardInset + KEYBOARD_VIEWPORT_GAP}px`
      : '';

  if (keyboardOpen) {
    keepSelectedCellVisible();
  }
}

function keepSelectedCellVisible() {
  const viewport = window.visualViewport;
  if (!viewport || state.selectedRow == null || state.selectedCol == null) {
    return;
  } //[cite: 2]

  const selectedCell = getCellElement(state.selectedRow, state.selectedCol); //[cite: 2]
  if (!selectedCell) {
    return;
  } //[cite: 2]

  // 뷰포트 중앙과 셀 중앙의 위치를 계산하여 화면 중앙으로 부드럽게 스크롤
  const rect = selectedCell.getBoundingClientRect();
  const viewportCenter = viewport.offsetTop + (viewport.height / 2);
  const cellCenter = rect.top + (rect.height / 2);

  window.scrollBy({
    top: cellCenter - viewportCenter,
    behavior: 'smooth'
  });
}

function clearMobileKeyboardInset() {
  if (keyboardLayoutFrame != null) {
    cancelAnimationFrame(keyboardLayoutFrame);
    keyboardLayoutFrame = null;
  }
  playSection.style.paddingBottom = '';
}

function initNav() {
  if (backButton) {
    backButton.classList.remove('d-none');
    backButton.onclick = () => {
      stopTimer();
      flushDirtyCells();
      window.location.href = '/web/game/bible-word-puzzle';
    };
  }
  if (pageTitleLabel) {
    pageTitleLabel.textContent = '성경 단어 퍼즐';
    pageTitleLabel.classList.remove('d-none');
  }
}

async function initPuzzle() {
  const puzzleId = new URLSearchParams(window.location.search).get('puzzleId');
  const parsed = parseInt(puzzleId, 10);
  if (!puzzleId || isNaN(parsed)) {
    window.location.replace('/web/game/bible-word-puzzle');
    return;
  }
  state.puzzleId = parsed;

  try {
    // 서버에 풀이 시작 요청 — 기존 진행 중인 풀이가 있으면 이어하기
    const res = await fetchWithAuthRetry(`${API_BASE}/${state.puzzleId}/attempts`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'}
    });
    if (!res.ok) {
      throw new Error('퍼즐을 시작할 수 없습니다.');
    }
    const data = await res.json();
    startPlay(data, data.title);
  } catch (e) {
    playLoading.classList.add('d-none');
    showError(e.message || '퍼즐을 시작할 수 없습니다.');
  }
}

// ══════════════════════════════════════════
// 셀 입력 처리
// ══════════════════════════════════════════

function syncCellFromInput(row, col) {
  const key = `${row},${col}`;
  const cellData = state.cellMap[key];
  if (!cellData || cellData.isRevealed) {
    return;
  }

  const cellEl = getCellElement(row, col);
  if (!cellEl) {
    return;
  }
  const input = cellEl.querySelector('.wp-cell-input');
  if (!input) {
    return;
  }

  const value = input.value || null;
  cellData.inputLetter = value;
  const existingIdx = state.dirtyCells.findIndex(c => c.row === row && c.col === col);
  if (existingIdx !== -1) {
    state.dirtyCells[existingIdx].letter = value;
  } else {
    state.dirtyCells.push({row, col, letter: value});
  }
  scheduleSave();
  updateSubmitButton();
}

// ══════════════════════════════════════════
// 퍼즐 플레이
// ══════════════════════════════════════════

function setupPlayListeners() {
  $('wpRevealBtn').addEventListener('click', onRevealLetter);
  $('wpCheckWordBtn').addEventListener('click', onCheckWord);
  submitBtn.addEventListener('click', onSubmit);
  $('wpBackToListBtn').addEventListener('click', () => {
    window.location.href = '/web/game/bible-word-puzzle';
  });

  // 셀 클릭 시 blur 방지 — focus 전환 없이 셀 선택만 처리
  boardEl.addEventListener('pointerdown', (e) => {
    const cell = e.target.closest('.wp-cell');
    if (cell && !cell.classList.contains('wp-cell-black')) {
      e.preventDefault();
    }
  });

  // 보드 바깥 클릭 시 선택 해제
  document.addEventListener('click', (e) => {
    if (state.selectedRow == null) {
      return;
    }
    if (!playSection || playSection.classList.contains('d-none')) {
      return;
    }
    const clickedCell = e.target.closest('.wp-cell');
    if (clickedCell && !clickedCell.classList.contains('wp-cell-black')) {
      return;
    }
    if (!clickedCell && boardEl.contains(e.target)) {
      return;
    }
    if (e.target.closest('.wp-action-bar')) {
      return;
    }

    // 현재 셀 입력 포커스 해제
    const currentCellEl = getCellElement(state.selectedRow, state.selectedCol);
    if (currentCellEl) {
      const input = currentCellEl.querySelector('.wp-cell-input');
      if (input) {
        input.blur();
      }
    }

    state.selectedRow = null;
    state.selectedCol = null;
    highlightCells();
    clueNumber.textContent = '';
    clueText.textContent = '칸을 선택하세요';
  });

  // 페이지 이탈 시 (뒤로가기, 탭 닫기) 변경된 셀 저장
  window.addEventListener('beforeunload', (e) => {
    stopTimer();
    if (state.dirtyCells.length > 0) {
      const cellsToSave = [...state.dirtyCells];
      state.dirtyCells = [];
      const url = `${API_BASE}/${state.puzzleId}/attempts/${state.attemptId}/cells`;
      const payload = JSON.stringify({cells: cellsToSave, elapsedSeconds: state.elapsedSeconds});
      // 페이지가 닫혀도 요청이 완료되도록 keepalive 옵션 사용
      fetch(url, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: payload,
        keepalive: true
      }).catch(() => {
      });
      e.preventDefault();
    }
  });
}

function startPlay(data, title) {
  state.attemptId = data.attemptId;
  state.board = data.board;
  state.entries = data.entries;
  state.elapsedSeconds = data.elapsedSeconds;
  state.dirtyCells = [];
  state.selectedRow = null;
  state.selectedCol = null;
  state.direction = 'ACROSS';

  // 셀 맵 구성
  state.cellMap = {};
  data.cells.forEach(c => {
    state.cellMap[`${c.row},${c.col}`] = {...c};
  });

  titleEl.textContent = title || '퍼즐';
  hideError();
  saveBanner.classList.add('d-none');
  playLoading.classList.add('d-none');
  showSection('play');
  renderBoard();
  startTimer();
  updateSubmitButton();

  // 첫 번째 셀 선택
  if (data.cells.length > 0) {
    const firstEntry = data.entries[0];
    if (firstEntry) {
      selectCell(firstEntry.startRow, firstEntry.startCol);
    }
  }
}

function renderBoard() {
  const {width, height} = state.board;
  boardEl.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
  boardEl.innerHTML = '';

  // 단어 항목에서 힌트 번호 맵 구성
  const clueNumberMap = {};
  state.entries.forEach(e => {
    const key = `${e.startRow},${e.startCol}`;
    if (!clueNumberMap[key]) {
      clueNumberMap[key] = e.clueNumber;
    }
  });

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const key = `${r},${c}`;
      const cellEl = document.createElement('div');
      cellEl.dataset.row = r;
      cellEl.dataset.col = c;

      if (state.cellMap[key]) {
        cellEl.className = 'wp-cell';
        const cellData = state.cellMap[key];

        // 힌트 번호 표시
        if (clueNumberMap[key]) {
          const numEl = document.createElement('span');
          numEl.className = 'wp-cell-number';
          numEl.textContent = clueNumberMap[key];
          cellEl.appendChild(numEl);
        }

        if (cellData.isRevealed) {
          // 공개된 셀 — 읽기 전용
          const letterEl = document.createElement('span');
          letterEl.className = 'wp-cell-letter';
          letterEl.textContent = cellData.inputLetter || '';
          cellEl.appendChild(letterEl);
          cellEl.classList.add('wp-cell-revealed');
        } else {
          // 편집 가능한 셀 — 입력 필드
          const input = createCellInput(r, c, cellData);
          cellEl.appendChild(input);
        }

        cellEl.addEventListener('click', () => onCellClick(r, c));
      } else {
        cellEl.className = 'wp-cell wp-cell-black';
      }

      boardEl.appendChild(cellEl);
    }
  }
}

function isMoveTriggerKey(e) {
  return e.key === 'Enter' || e.key === ' ' || e.code === 'Enter' || e.code === 'Space'
      || e.keyCode === 13 || e.keyCode === 32;
}

function createCellInput(row, col, cellData) {
  const cellKey = `${row},${col}`;
  const input = document.createElement('input');
  input.type = 'text';
  input.maxLength = 1;
  input.className = 'wp-cell-input';
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('autocorrect', 'off');
  input.setAttribute('autocapitalize', 'off');
  input.setAttribute('spellcheck', 'false');
  input.setAttribute('aria-label', `${row + 1}행 ${col + 1}열`);
  input.setAttribute('enterkeyhint', 'next');
  input.value = cellData.inputLetter || '';

  // ── 한글 IME 조합 처리 ──
  input.addEventListener('compositionstart', () => {
    composingCellKey = cellKey;
  });

  input.addEventListener('compositionend', (e) => {
    if (composingCellKey === cellKey) {
      composingCellKey = null;
    }

    // blur()로 조합이 종료되면 브라우저가 input.value를 비울 수 있으므로
    // compositionend 시점에 조합된 글자를 즉시 보존한다.
    const composedChar = (e.data || input.value || '').slice(-1) || null;
    compositionEndCellKey = cellKey;

    const currentCellData = state.cellMap[`${row},${col}`];
    if (currentCellData && !currentCellData.isRevealed && composedChar) {
      input.value = composedChar;
      currentCellData.inputLetter = composedChar;
    }

    // 다음 틱에서 최종 동기화 및 보류된 이동 실행
    setTimeout(() => {
      // 브라우저가 값을 지웠다면 복원
      if (compositionEndCellKey === cellKey && composedChar && !input.value) {
        input.value = composedChar;
      }
      compositionEndCellKey = null;

      syncCellFromInput(row, col);
      if (pendingMove) {
        const action = pendingMove;
        pendingMove = null;
        if (state.selectedRow === row && state.selectedCol === col) {
          action();
        }
      }
    }, 0);

  });

  input.addEventListener('blur', () => {
    if (composingCellKey === cellKey) {
      // 한글 IME 조합 직후 blur가 먼저 오면 최종 글자가 아직 input.value에 반영되지 않을 수 있음
      setTimeout(() => {
        if (composingCellKey === cellKey) {
          composingCellKey = null;
        }
        syncCellFromInput(row, col);
      }, 0);
      // 조합 중 셀 전환을 위한 pendingMove는 유지
      return;
    }
    // compositionend가 이미 값을 저장했으면 blur에서 다시 동기화하지 않음 (브라우저가 값을 비운 경우 방지)
    if (compositionEndCellKey === cellKey) {
      return;
    }
    pendingMove = null;
    syncCellFromInput(row, col);
  });

  // ── 입력 이벤트 ──
  input.addEventListener('input', () => {
    if (composingCellKey === cellKey) {
      return;
    }
    // compositionend 직후 브라우저가 발생시키는 input 이벤트에서 빈 값으로 덮어쓰기 방지
    if (compositionEndCellKey === cellKey) {
      return;
    }
    syncCellFromInput(row, col);
  });

  // ── 키보드 입력 (셀 이동 제어) ──
  input.addEventListener('keydown', (e) => {
    const composingNow = composingCellKey === cellKey || e.isComposing || e.keyCode === 229;

    if (composingNow) {
      // IME 조합 중에도 이동 키는 보류 등록
      if (isMoveTriggerKey(e)) {
        e.preventDefault();
        pendingMove = moveToNextCell;
      }
      return;
    }

    // compositionend의 pendingMove가 이미 이동을 실행했을 수 있으므로
    // 이 셀이 여전히 선택 상태인지 확인
    pendingMove = null;
    const isStillHere = state.selectedRow === row && state.selectedCol === col;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isStillHere) {
          moveToNextCell();
        }
        break;
      case 'Tab':
        e.preventDefault();
        moveToNextEntry(e.shiftKey);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        moveInDirection(0, -1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        moveInDirection(0, 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveInDirection(-1, 0);
        break;
      case 'ArrowDown':
        e.preventDefault();
        moveInDirection(1, 0);
        break;
      case 'Backspace':
        e.preventDefault();
        if (input.value) {
          input.value = '';
          syncCellFromInput(row, col);
        } else {
          moveToPrevCell();
        }
        break;
    }
  });

  return input;
}

function onCellClick(row, col) {
  if (state.selectedRow === row && state.selectedCol === col) {
    // 같은 셀 재클릭 시 방향 전환 (가로 ↔ 세로)
    state.direction = state.direction === 'ACROSS' ? 'DOWN' : 'ACROSS';
  } else {
    // 이 셀에서 시작하는 단어의 방향을 우선 선택
    const acrossStart = state.entries.find(e => e.directionCode === 'ACROSS' && e.startRow === row && e.startCol === col);
    const downStart = state.entries.find(e => e.directionCode === 'DOWN' && e.startRow === row && e.startCol === col);
    if (acrossStart && !downStart) {
      state.direction = 'ACROSS';
    } else if (downStart && !acrossStart) {
      state.direction = 'DOWN';
    }
    // 양쪽 다 시작하거나 둘 다 아닌 경우 → 현재 방향 유지
  }
  selectCell(row, col);
}

function selectCell(row, col) {
  const prevRow = state.selectedRow;
  const prevCol = state.selectedCol;

  // 조합 중에는 즉시 포커스를 옮기지 않고 조합 완료 후 이동
  if (prevRow != null && prevCol != null && (prevRow !== row || prevCol !== col)) {
    const prevKey = `${prevRow},${prevCol}`;
    if (composingCellKey === prevKey) {
      pendingMove = () => selectCell(row, col);
      const prevCellEl = getCellElement(prevRow, prevCol);
      const prevInput = prevCellEl?.querySelector('.wp-cell-input');
      if (prevInput) {
        prevInput.blur();
      }
      return;
    }
  }

  state.selectedRow = row;
  state.selectedCol = col;

  // 다른 셀로 이동 시 기존 입력을 종료해 IME 조합이 이전 셀에 남지 않게 처리
  if (prevRow != null && prevCol != null && (prevRow !== row || prevCol !== col)) {
    const prevCellEl = getCellElement(prevRow, prevCol);
    const prevInput = prevCellEl?.querySelector('.wp-cell-input');
    if (prevInput) {
      prevInput.blur();
    }
    pendingMove = null;
  }

  // 현재 셀에 해당하는 단어 항목 찾기 (힌트 바 표시용)
  const entry = findEntryForCell(row, col, state.direction)
      || findEntryForCell(row, col, state.direction === 'ACROSS' ? 'DOWN' : 'ACROSS');

  if (entry) {
    state.direction = entry.directionCode;
    clueNumber.textContent = `${entry.clueNumber}${entry.directionCode === 'ACROSS' ? '가로' : '세로'}`;
    clueText.textContent = entry.clueText;
  }

  highlightCells();
  focusCellInput(row, col);
}

function findEntryForCell(row, col, direction) {
  return state.entries.find(e => {
    if (e.directionCode !== direction) {
      return false;
    }
    for (let i = 0; i < e.length; i++) {
      const r = direction === 'ACROSS' ? e.startRow : e.startRow + i;
      const c = direction === 'ACROSS' ? e.startCol + i : e.startCol;
      if (r === row && c === col) {
        return true;
      }
    }
    return false;
  });
}

function getCurrentEntry() {
  return findEntryForCell(state.selectedRow, state.selectedCol, state.direction)
      || findEntryForCell(state.selectedRow, state.selectedCol, state.direction === 'ACROSS' ? 'DOWN' : 'ACROSS');
}

function highlightCells() {
  // 선택/단어 하이라이트만 초기화 (오답 표시는 타이머로 자동 제거됨)
  boardEl.querySelectorAll('.wp-cell').forEach(el => {
    el.classList.remove('wp-cell-selected', 'wp-cell-word-highlight');
  });

  const entry = getCurrentEntry();
  if (entry) {
    // 현재 단어의 셀들 하이라이트
    for (let i = 0; i < entry.length; i++) {
      const r = entry.directionCode === 'ACROSS' ? entry.startRow : entry.startRow + i;
      const c = entry.directionCode === 'ACROSS' ? entry.startCol + i : entry.startCol;
      const el = getCellElement(r, c);
      if (el) {
        el.classList.add('wp-cell-word-highlight');
      }
    }
  }

  // 선택된 셀 하이라이트
  const selEl = getCellElement(state.selectedRow, state.selectedCol);
  if (selEl) {
    selEl.classList.remove('wp-cell-word-highlight');
    selEl.classList.add('wp-cell-selected');
  }
}

function getCellElement(row, col) {
  return boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
}

function moveToNextCell() {
  const entry = getCurrentEntry();
  if (!entry) {
    return;
  }

  // 현재 셀이 entry 내 몇 번째인지 계산
  const offsetInEntry = state.direction === 'ACROSS'
      ? state.selectedCol - entry.startCol
      : state.selectedRow - entry.startRow;
  const remaining = entry.length - offsetInEntry - 1;

  let nextR = state.selectedRow;
  let nextC = state.selectedCol;

  // 현재 방향으로 entry 내 남은 셀만 탐색
  for (let i = 0; i < remaining; i++) {
    if (state.direction === 'ACROSS') {
      nextC++;
    } else {
      nextR++;
    }
    const key = `${nextR},${nextC}`;
    const cell = state.cellMap[key];
    if (!cell) {
      break;
    }
    if (!cell.isRevealed) {
      selectCell(nextR, nextC);
      return;
    }
  }

  // 현재 단어 끝이면 다음 단어의 첫 셀로 이동
  moveToNextEntry(false);
}

function moveToPrevCell() {
  const {selectedRow: r, selectedCol: c} = state;
  let prevR = r, prevC = c;

  if (state.direction === 'ACROSS') {
    prevC = c - 1;
  } else {
    prevR = r - 1;
  }

  const key = `${prevR},${prevC}`;
  if (state.cellMap[key]) {
    selectCell(prevR, prevC);
  }
}

function moveInDirection(dr, dc) {
  const newR = state.selectedRow + dr;
  const newC = state.selectedCol + dc;
  if (state.cellMap[`${newR},${newC}`]) {
    selectCell(newR, newC);
  }
}

function moveToNextEntry(reverse) {
  const currentEntry = getCurrentEntry();
  if (!currentEntry) {
    return;
  }
  const idx = state.entries.indexOf(currentEntry);
  const nextIdx = reverse
      ? (idx - 1 + state.entries.length) % state.entries.length
      : (idx + 1) % state.entries.length;
  const next = state.entries[nextIdx];
  if (next) {
    state.direction = next.directionCode;
    selectCell(next.startRow, next.startCol);
  }
}

function focusCellInput(row, col) {
  const key = `${row},${col}`;
  const cellData = state.cellMap[key];
  if (!cellData || cellData.isRevealed) {
    return;
  }

  const cellEl = getCellElement(row, col);
  if (!cellEl) {
    return;
  }
  const input = cellEl.querySelector('.wp-cell-input');
  if (!input) {
    return;
  }

  input.focus();
  if (window.visualViewport) {
    scheduleMobileKeyboardLayout();
  }
}

// ── 타이머 ──

function startTimer() {
  stopTimer();
  updateTimerDisplay();
  state.timerInterval = setInterval(() => {
    state.elapsedSeconds++;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

function updateTimerDisplay() {
  const mins = Math.floor(state.elapsedSeconds / 60);
  const secs = state.elapsedSeconds % 60;
  timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ── 자동 저장 ──

function scheduleSave() {
  if (state.saveTimeout) {
    clearTimeout(state.saveTimeout);
  }
  state.saveTimeout = setTimeout(() => flushDirtyCells(), 2000);
}

async function flushDirtyCells() {
  if (state.dirtyCells.length === 0) {
    return;
  }
  const cellsToSave = [...state.dirtyCells];
  state.dirtyCells = [];

  try {
    const res = await fetchWithAuthRetry(
        `${API_BASE}/${state.puzzleId}/attempts/${state.attemptId}/cells`,
        {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({cells: cellsToSave, elapsedSeconds: state.elapsedSeconds})
        }
    );
    if (!res.ok) {
      throw new Error();
    }
    saveBanner.classList.add('d-none');
  } catch {
    saveBanner.classList.remove('d-none');
    // 실패한 셀을 복원하되 이미 존재하는 셀은 중복 추가하지 않음
    cellsToSave.forEach(saved => {
      if (!state.dirtyCells.some(c => c.row === saved.row && c.col === saved.col)) {
        state.dirtyCells.push(saved);
      }
    });
  }
}

// ── 제출 버튼 ──

function updateSubmitButton() {
  const allFilled = Object.values(state.cellMap).every(c => c.inputLetter != null || c.isRevealed);
  submitBtn.disabled = !allFilled;
}

// ── 힌트 ──

async function onRevealLetter() {
  if (state.selectedRow == null) {
    return;
  }
  const entry = getCurrentEntry();
  if (!entry) {
    return;
  }

  const key = `${state.selectedRow},${state.selectedCol}`;
  if (state.cellMap[key]?.isRevealed) {
    showToast('이미 공개된 칸입니다.');
    return;
  }

  if (!await showConfirm('힌트를 사용하면 점수가 감점됩니다. 사용하시겠습니까?', {title: "힌트 사용", confirmText: "사용", danger: false})) {
    return;
  }

  await flushDirtyCells();

  try {
    const res = await fetchWithAuthRetry(
        `${API_BASE}/${state.puzzleId}/attempts/${state.attemptId}/hints/reveal-letter`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            entryId: entry.entryId,
            row: state.selectedRow,
            col: state.selectedCol,
            elapsedSeconds: state.elapsedSeconds
          })
        }
    );
    if (!res.ok) {
      throw new Error();
    }
    const data = await res.json();

    // 셀 상태 업데이트
    const cellData = state.cellMap[key];
    cellData.inputLetter = data.letter;
    cellData.isRevealed = true;

    const el = getCellElement(data.row, data.col);
    if (el) {
      // 입력 필드를 공개된 글자로 교체
      const input = el.querySelector('.wp-cell-input');
      if (input) {
        input.remove();
      }

      const letterEl = document.createElement('span');
      letterEl.className = 'wp-cell-letter';
      letterEl.textContent = data.letter;
      el.appendChild(letterEl);

      el.classList.add('wp-cell-revealed');
    }
    updateSubmitButton();
  } catch {
    showToast('힌트를 불러올 수 없습니다.');
  }
}

async function onCheckWord() {
  const entry = getCurrentEntry();
  if (!entry) {
    return;
  }

  if (!await showConfirm('힌트를 사용하면 점수가 감점됩니다. 사용하시겠습니까?', {title: "힌트 사용", confirmText: "사용", danger: false})) {
    return;
  }

  await flushDirtyCells();

  try {
    const res = await fetchWithAuthRetry(
        `${API_BASE}/${state.puzzleId}/attempts/${state.attemptId}/hints/check-word`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            entryId: entry.entryId,
            elapsedSeconds: state.elapsedSeconds
          })
        }
    );
    if (!res.ok) {
      throw new Error();
    }
    const data = await res.json();

    // 정답/오답 결과 표시
    data.results.forEach(r => {
      const el = getCellElement(r.row, r.col);
      if (el) {
        if (r.correct) {
          el.classList.add('wp-cell-correct-flash');
          setTimeout(() => el.classList.remove('wp-cell-correct-flash'), 600);
        } else {
          el.classList.add('wp-cell-wrong');
          setTimeout(() => el.classList.remove('wp-cell-wrong'), 600);
        }
      }
    });
  } catch {
    showToast('단어 확인에 실패했습니다.');
  }
}

// ── 제출 ──

async function onSubmit() {
  if (!await showConfirm('제출하시겠습니까?', {title: "제출", confirmText: "제출", danger: false})) {
    return;
  }

  await flushDirtyCells();
  submitBtn.disabled = true;

  try {
    const res = await fetchWithAuthRetry(
        `${API_BASE}/${state.puzzleId}/attempts/${state.attemptId}/submit`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({elapsedSeconds: state.elapsedSeconds})
        }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (err.error === 'EMPTY_CELLS_EXIST') {
        showToast('아직 채워지지 않은 칸이 있습니다.');
      } else {
        showToast('제출에 실패했습니다. 다시 시도해 주세요.');
      }
      submitBtn.disabled = false;
      return;
    }

    const data = await res.json();

    if (data.result === 'WRONG') {
      // 오답 셀 표시
      data.wrongCells.forEach(wc => {
        const el = getCellElement(wc.row, wc.col);
        if (el) {
          el.classList.add('wp-cell-wrong');
          setTimeout(() => el.classList.remove('wp-cell-wrong'), 1500);
        }
      });
      showToast(`오답입니다. (오답 횟수: ${data.wrongSubmissionCount})`);
      submitBtn.disabled = false;
    } else {
      // 정답
      stopTimer();
      if (state.saveTimeout) {
        clearTimeout(state.saveTimeout);
        state.saveTimeout = null;
      }
      showResult(data);
    }
  } catch {
    showToast('제출에 실패했습니다. 다시 시도해 주세요.');
    submitBtn.disabled = false;
  }
}

// ══════════════════════════════════════════
// 결과 화면
// ══════════════════════════════════════════

function showResult(data) {
  $('wpResultScore').textContent = data.score;
  $('wpResultTime').textContent = formatTime(data.elapsedSeconds);
  $('wpResultHints').textContent = `${data.hintUsageCount}회`;
  $('wpResultWrong').textContent = `${data.wrongSubmissionCount}회`;

  // 학습 단어 목록
  const wordList = $('wpWordList');
  wordList.innerHTML = '';
  if (data.words && data.words.length > 0) {
    data.words.forEach((word) => {
      const item = document.createElement('div');
      item.className = 'wp-word-item';

      const refsHtml = word.references.map(ref => `
                <div class="wp-word-ref">
                    <span class="wp-word-ref-verse">${escapeHtml(ref.verseReference)}</span>
                    <span>${escapeHtml(ref.verseExcerpt)}</span>
                </div>
            `).join('');

      item.innerHTML = `
                <button class="wp-word-header" type="button" aria-expanded="false">
                    <span class="wp-word-surface">${escapeHtml(word.surfaceForm)}</span>
                    ${word.originalLexeme ? `<span class="wp-word-original">${escapeHtml(word.originalLexeme)} (${word.originalLanguageCode
      === 'HEBREW' ? '히브리어' : '헬라어'})</span>` : ''}
                </button>
                <div class="wp-word-body d-none">
                    <p class="wp-word-definition">${escapeHtml(word.dictionaryDefinition)}</p>
                    ${refsHtml}
                </div>
            `;

      item.querySelector('.wp-word-header').addEventListener('click', (e) => {
        const body = item.querySelector('.wp-word-body');
        const expanded = body.classList.toggle('d-none');
        e.currentTarget.setAttribute('aria-expanded', !expanded);
      });

      wordList.appendChild(item);
    });
    $('wpWordStudy').classList.remove('d-none');
  } else {
    $('wpWordStudy').classList.add('d-none');
  }

  showSection('result');
}

// ── 유틸리티 ──

function showSection(name) {
  if (name !== 'play') {
    const activeElement = document.activeElement;
    if (activeElement?.classList.contains('wp-cell-input')) {
      activeElement.blur();
    }
    clearMobileKeyboardInset();
  }

  playLoading.classList.add('d-none');
  playSection.classList.toggle('d-none', name !== 'play');
  resultSection.classList.toggle('d-none', name !== 'result');
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.remove('d-none');
}

function hideError() {
  errorEl.classList.add('d-none');
}

function showToast(msg) {
  const existing = document.querySelector('.wp-toast');
  if (existing) {
    existing.remove();
  }

  const toast = document.createElement('div');
  toast.className = 'wp-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}분 ${secs}초`;
}

function escapeHtml(str) {
  if (!str) {
    return '';
  }
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
