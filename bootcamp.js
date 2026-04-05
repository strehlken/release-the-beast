// Wordle Bootcamp — DOM overlay teaching module
// Triggered from game.js via Bootcamp.show(lessonId)
// Calls Bootcamp.onComplete when done

const Bootcamp = {
  overlay: null,
  active: false,
  onComplete: null, // callback set by game.js
  currentLesson: null,

  // Create the overlay div (once)
  init() {
    if (this.overlay) return;
    const el = document.createElement('div');
    el.id = 'bootcamp-overlay';
    el.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: #f5f5f0; color: #1a1a2a; font-family: 'Segoe UI', system-ui, sans-serif;
      display: none; flex-direction: column; z-index: 10000;
      overflow-y: auto;
    `;
    document.body.appendChild(el);
    this.overlay = el;
  },

  show(lessonId) {
    this.init();
    this.overlay.style.display = 'flex';
    this.overlay.innerHTML = '';
    this.active = true;
    const lesson = LESSONS[lessonId];
    if (lesson) {
      this.currentLesson = lessonId;
      lesson.start(this.overlay, this);
    }
  },

  hide() {
    if (this.overlay) this.overlay.style.display = 'none';
    this.active = false;
    if (this.onComplete) this.onComplete(this.currentLesson);
  },

  // Shared UI helpers
  makeDialogueBar(speaker, text, speakerColor) {
    const bar = document.createElement('div');
    bar.style.cssText = `
      background: #2a2a3a; color: #eee; padding: 12px 20px;
      font-size: 14px; line-height: 1.5; min-height: 50px;
      display: flex; align-items: center; gap: 14px;
      border-bottom: 2px solid #3a3a4a;
    `;
    const nameEl = document.createElement('span');
    nameEl.textContent = speaker;
    nameEl.style.cssText = `
      font-weight: bold; color: ${speakerColor || '#e090d0'};
      white-space: nowrap; font-size: 13px;
    `;
    const textEl = document.createElement('span');
    textEl.textContent = text;
    textEl.style.cssText = 'flex: 1;';
    bar.appendChild(nameEl);
    bar.appendChild(textEl);
    return bar;
  },

  makeAnswerBox(correctAnswer, onCorrect) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-top: 16px;';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Your answer';
    input.style.cssText = `
      width: 80px; padding: 8px 12px; font-size: 18px; text-align: center;
      border: 2px solid #ccc; border-radius: 6px; outline: none;
      font-family: 'Segoe UI', system-ui, sans-serif;
    `;
    input.addEventListener('focus', () => { input.style.borderColor = '#6aaa64'; });
    input.addEventListener('blur', () => { input.style.borderColor = '#ccc'; });
    const btn = document.createElement('button');
    btn.textContent = 'Submit';
    btn.style.cssText = `
      padding: 8px 18px; font-size: 14px; cursor: pointer;
      background: #6aaa64; color: white; border: none; border-radius: 6px;
      font-family: 'Segoe UI', system-ui, sans-serif;
    `;
    const feedback = document.createElement('span');
    feedback.style.cssText = 'font-size: 14px; color: #c0392b;';

    function submit() {
      const val = input.value.trim();
      if (val === String(correctAnswer)) {
        feedback.textContent = 'Correct!';
        feedback.style.color = '#6aaa64';
        input.disabled = true;
        btn.disabled = true;
        if (onCorrect) setTimeout(onCorrect, 600);
      } else {
        feedback.textContent = 'Try again.';
        feedback.style.color = '#c0392b';
        input.value = '';
        input.focus();
      }
    }
    btn.addEventListener('click', submit);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });

    wrap.appendChild(input);
    wrap.appendChild(btn);
    wrap.appendChild(feedback);
    return wrap;
  },

  makeTile(size, color, onClick) {
    const tile = document.createElement('div');
    const colors = { green: '#6aaa64', yellow: '#c9b458', gray: '#787c7e' };
    tile.dataset.color = color || 'gray';
    tile.style.cssText = `
      width: ${size}px; height: ${size}px; border-radius: 4px;
      background: ${colors[tile.dataset.color]};
      cursor: pointer; transition: background 0.15s, transform 0.1s;
      border: 2px solid rgba(0,0,0,0.1);
    `;
    tile.addEventListener('mouseenter', () => { tile.style.transform = 'scale(1.05)'; });
    tile.addEventListener('mouseleave', () => { tile.style.transform = 'scale(1)'; });
    tile.addEventListener('click', () => {
      const order = ['green', 'yellow', 'gray'];
      const cur = tile.dataset.color;
      const next = order[(order.indexOf(cur) + 1) % 3];
      tile.dataset.color = next;
      tile.style.background = colors[next];
      if (onClick) onClick(next, tile);
    });
    return tile;
  },

  makeDot(size, color) {
    const dot = document.createElement('div');
    const colors = { green: '#6aaa64', yellow: '#c9b458', gray: '#787c7e', empty: '#ddd' };
    dot.style.cssText = `
      width: ${size}px; height: ${size}px; border-radius: 50%;
      background: ${colors[color] || colors.empty};
      border: 2px solid ${color === 'empty' ? '#bbb' : 'rgba(0,0,0,0.15)'};
      transition: background 0.3s, border-color 0.3s;
    `;
    dot.dataset.color = color || 'empty';
    return dot;
  },
};

// === LESSONS ===

const LESSONS = {};

// Lesson 1: How many ways to color a single square?
LESSONS['single-square'] = {
  start(container, bc) {
    container.innerHTML = '';

    // Top: dialogue bar
    const dialogue = bc.makeDialogueBar(
      'Carol B',
      '"Welcome to Wordle bootcamp, kid! Your first assignment: How many ways are there to color a single square in a Wordle pattern?"',
      '#e090d0'
    );
    container.appendChild(dialogue);

    // Main area
    const main = document.createElement('div');
    main.style.cssText = `
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 20px;
      padding: 30px;
    `;
    container.appendChild(main);

    // Phase 1: big tile in center
    const tileWrap = document.createElement('div');
    tileWrap.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 16px; transition: all 0.5s;';
    const hint = document.createElement('div');
    hint.textContent = 'Click the square to cycle its color';
    hint.style.cssText = 'font-size: 14px; color: #888;';
    tileWrap.appendChild(hint);

    let clickCount = 0;
    const seenColors = new Set();
    const dotRow = document.createElement('div');
    dotRow.style.cssText = 'display: flex; gap: 12px; margin-top: 12px; opacity: 0; transition: opacity 0.5s;';
    const dots = [];
    for (let i = 0; i < 3; i++) {
      const d = bc.makeDot(24, 'empty');
      dots.push(d);
      dotRow.appendChild(d);
    }

    const tile = bc.makeTile(100, 'green', (color) => {
      clickCount++;
      const prevOrder = ['green', 'yellow', 'gray'];
      // The color we just left is the PREVIOUS color
      const prevIdx = (prevOrder.indexOf(color) + 2) % 3;
      const prevColor = prevOrder[prevIdx];

      if (clickCount === 1) {
        // Show dots, shrink tile, record first color
        dotRow.style.opacity = '1';
        tile.style.width = '60px';
        tile.style.height = '60px';
        seenColors.add(prevColor);
        const colors = { green: '#6aaa64', yellow: '#c9b458', gray: '#787c7e' };
        dots[0].style.background = colors[prevColor];
        dots[0].style.borderColor = 'rgba(0,0,0,0.15)';
        dots[0].dataset.color = prevColor;
        dots[1].style.borderColor = '#333';
        dots[1].style.borderWidth = '3px';
      } else if (clickCount === 2) {
        const prevColor2 = prevOrder[(prevOrder.indexOf(color) + 2) % 3];
        seenColors.add(prevColor2);
        const colors = { green: '#6aaa64', yellow: '#c9b458', gray: '#787c7e' };
        dots[1].style.background = colors[prevColor2];
        dots[1].style.borderColor = 'rgba(0,0,0,0.15)';
        dots[1].style.borderWidth = '2px';
        dots[1].dataset.color = prevColor2;
        dots[2].style.borderColor = '#333';
        dots[2].style.borderWidth = '3px';
      } else if (clickCount === 3) {
        const prevColor3 = prevOrder[(prevOrder.indexOf(color) + 2) % 3];
        seenColors.add(prevColor3);
        const colors = { green: '#6aaa64', yellow: '#c9b458', gray: '#787c7e' };
        dots[2].style.background = colors[prevColor3];
        dots[2].style.borderColor = 'rgba(0,0,0,0.15)';
        dots[2].style.borderWidth = '2px';
        dots[2].dataset.color = prevColor3;
        // Show answer box
        hint.textContent = 'How many possible colors?';
        answerWrap.style.display = 'flex';
      }
    });
    tileWrap.appendChild(tile);
    tileWrap.appendChild(dotRow);
    main.appendChild(tileWrap);

    // Answer box (hidden initially)
    const answerWrap = document.createElement('div');
    answerWrap.style.cssText = 'display: none;';
    const ansBox = bc.makeAnswerBox(3, () => {
      // Correct! Transition to lesson 2
      dialogue.querySelector('span:last-child').textContent =
        '"OK, great. You got the warm-up. Big whoop. Now, how many different ways are there to color two different Wordle squares, Mr. Smarty Pants?"';
      dialogue.querySelector('span:first-child').textContent = 'Carol B';
      setTimeout(() => startLesson2(container, bc, main), 1200);
    });
    answerWrap.appendChild(ansBox);
    main.appendChild(answerWrap);
  }
};

function startLesson2(container, bc, main) {
  // Clear main, keep dialogue
  main.innerHTML = '';

  // Build the two-square interface
  const topRow = document.createElement('div');
  topRow.style.cssText = 'display: flex; gap: 8px; align-items: center; margin-bottom: 20px;';

  // Two clickable tiles at top
  const tile1 = bc.makeTile(50, 'green', () => {});
  const tile2 = bc.makeTile(50, 'green', () => {});
  topRow.appendChild(tile1);
  topRow.appendChild(tile2);
  main.appendChild(topRow);

  // Tree area: 3 branches from tile1, each with 3 sub-branches
  const treeWrap = document.createElement('div');
  treeWrap.style.cssText = 'display: flex; gap: 30px; justify-content: center; flex-wrap: wrap;';

  const colorNames = ['green', 'yellow', 'gray'];
  const colorHex = { green: '#6aaa64', yellow: '#c9b458', gray: '#787c7e' };

  for (const c1 of colorNames) {
    const branch = document.createElement('div');
    branch.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 8px;';

    // Parent dot
    const parent = bc.makeDot(20, c1);
    branch.appendChild(parent);

    // Line
    const line = document.createElement('div');
    line.style.cssText = 'width: 1px; height: 12px; background: #aaa;';
    branch.appendChild(line);

    // Children row
    const kids = document.createElement('div');
    kids.style.cssText = 'display: flex; gap: 6px;';
    for (const c2 of colorNames) {
      const child = bc.makeDot(14, c2);
      kids.appendChild(child);
    }
    branch.appendChild(kids);
    treeWrap.appendChild(branch);
  }
  main.appendChild(treeWrap);

  // Label
  const label = document.createElement('div');
  label.textContent = '3 colors × 3 colors = ?';
  label.style.cssText = 'font-size: 15px; color: #666; margin-top: 16px;';
  main.appendChild(label);

  // Answer box
  const ansBox = bc.makeAnswerBox(9, () => {
    // Done with lesson 2
    const dialogue = container.querySelector('#bootcamp-overlay > div:first-child span:last-child');
    if (dialogue) dialogue.textContent = '"Not bad, kid. Not bad at all. We\'ll continue this another time."';
    setTimeout(() => bc.hide(), 2000);
  });
  main.appendChild(ansBox);
}
