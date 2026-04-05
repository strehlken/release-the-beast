// Wordle Bootcamp — DOM overlay teaching module

const Bootcamp = {
  overlay: null,
  active: false,
  onComplete: null,
  currentLesson: null,

  init() {
    if (this.overlay) return;
    const el = document.createElement('div');
    el.id = 'bootcamp-overlay';
    el.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: #f5f5f0; color: #1a1a2a; font-family: 'Segoe UI', system-ui, sans-serif;
      display: none; flex-direction: column; z-index: 10000; overflow-y: auto;
    `;
    document.body.appendChild(el);
    this.overlay = el;
  },

  show(lessonId) {
    this.init();
    this.overlay.style.display = 'flex';
    this.overlay.innerHTML = '';
    this.active = true;
    this.currentLesson = lessonId;
    const lesson = LESSONS[lessonId];
    if (lesson) lesson.start(this.overlay, this);
  },

  hide() {
    if (this.overlay) this.overlay.style.display = 'none';
    this.active = false;
    if (this.onComplete) this.onComplete(this.currentLesson);
  },

  COLORS: ['green', 'yellow', 'gray'],
  HEX: { green: '#6aaa64', yellow: '#c9b458', gray: '#787c7e', empty: '#ddd' },

  makeDialogueBar(speaker, text, speakerColor) {
    const bar = document.createElement('div');
    bar.style.cssText = `
      background: #2a2a3a; color: #eee; padding: 10px 16px;
      font-size: 13px; line-height: 1.5; display: flex; align-items: flex-start; gap: 10px;
      border-bottom: 2px solid #3a3a4a; flex-shrink: 0;
    `;
    const nameEl = document.createElement('span');
    nameEl.textContent = speaker;
    nameEl.style.cssText = `font-weight: bold; color: ${speakerColor || '#e090d0'}; white-space: nowrap;`;
    const textEl = document.createElement('span');
    textEl.textContent = text;
    textEl.style.cssText = 'flex: 1;';
    bar.appendChild(nameEl);
    bar.appendChild(textEl);
    bar._textEl = textEl;
    bar._nameEl = nameEl;
    return bar;
  },

  setDialogue(bar, speaker, text, color) {
    bar._nameEl.textContent = speaker;
    if (color) bar._nameEl.style.color = color;
    bar._textEl.textContent = text;
  },

  makeAnswerBox(correctAnswer, onCorrect) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display: flex; align-items: center; gap: 8px;';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '?';
    input.style.cssText = `
      width: 60px; padding: 6px 10px; font-size: 16px; text-align: center;
      border: 2px solid #ccc; border-radius: 5px; outline: none;
      font-family: 'Segoe UI', system-ui, sans-serif;
    `;
    input.addEventListener('focus', () => { input.style.borderColor = '#6aaa64'; });
    input.addEventListener('blur', () => { input.style.borderColor = '#ccc'; });
    const btn = document.createElement('button');
    btn.textContent = 'Go';
    btn.style.cssText = `
      padding: 6px 14px; font-size: 13px; cursor: pointer;
      background: #6aaa64; color: white; border: none; border-radius: 5px;
    `;
    const fb = document.createElement('span');
    fb.style.cssText = 'font-size: 13px;';
    function submit() {
      if (input.value.trim() === String(correctAnswer)) {
        fb.textContent = 'Correct!'; fb.style.color = '#6aaa64';
        input.disabled = true; btn.disabled = true;
        if (onCorrect) setTimeout(onCorrect, 600);
      } else {
        fb.textContent = 'Try again.'; fb.style.color = '#c0392b';
        input.value = ''; input.focus();
      }
    }
    btn.addEventListener('click', submit);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    wrap.appendChild(input); wrap.appendChild(btn); wrap.appendChild(fb);
    return wrap;
  },

  makeTile(size, color, onClick) {
    const tile = document.createElement('div');
    tile.dataset.color = color || 'green';
    tile.style.cssText = `
      width: ${size}px; height: ${size}px; border-radius: 4px;
      background: ${this.HEX[tile.dataset.color]};
      cursor: pointer; transition: background 0.15s;
      border: 2px solid rgba(0,0,0,0.1); flex-shrink: 0;
    `;
    tile.addEventListener('click', () => {
      const order = this.COLORS;
      const cur = tile.dataset.color;
      const next = order[(order.indexOf(cur) + 1) % 3];
      tile.dataset.color = next;
      tile.style.background = this.HEX[next];
      if (onClick) onClick(next, cur, tile);
    });
    return tile;
  },

  // Dot with FIXED size — highlight uses outline, not border, so no layout shift
  makeDot(size, color) {
    const dot = document.createElement('div');
    const c = color || 'empty';
    dot.style.cssText = `
      width: ${size}px; height: ${size}px; border-radius: 50%;
      background: ${this.HEX[c] || this.HEX.empty};
      border: 1px solid ${c === 'empty' ? '#bbb' : 'rgba(0,0,0,0.15)'};
      outline: 2px solid transparent; outline-offset: 2px;
      transition: background 0.25s, outline-color 0.15s;
      flex-shrink: 0; box-sizing: content-box;
    `;
    dot.dataset.color = c;
    return dot;
  },

  colorDot(dot, color) {
    dot.dataset.color = color;
    dot.style.background = this.HEX[color] || this.HEX.empty;
    dot.style.borderColor = color === 'empty' ? '#bbb' : 'rgba(0,0,0,0.15)';
  },

  // Highlight uses outline — NO layout shift
  highlightDot(dot, on) {
    dot.style.outlineColor = on ? '#e67e22' : 'transparent';
  },
};

// ========== LESSONS ==========
const LESSONS = {};

// --- Lesson 1: Single square ---
LESSONS['single-square'] = {
  start(container, bc) {
    container.innerHTML = '';
    const dialogue = bc.makeDialogueBar('Carol B',
      '"Your first assignment: How many ways are there to color a single square in a Wordle pattern?"', '#e090d0');
    container.appendChild(dialogue);

    const main = document.createElement('div');
    main.style.cssText = `
      flex: 1; display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 16px; padding: 20px;
    `;
    container.appendChild(main);

    const hint = document.createElement('div');
    hint.textContent = 'Click the square to cycle its color';
    hint.style.cssText = 'font-size: 13px; color: #888;';
    main.appendChild(hint);

    const dotRow = document.createElement('div');
    dotRow.style.cssText = 'display: flex; gap: 14px; opacity: 0; transition: opacity 0.4s;';
    const dots = [bc.makeDot(24, 'empty'), bc.makeDot(24, 'empty'), bc.makeDot(24, 'empty')];
    dots.forEach(d => dotRow.appendChild(d));

    let clicks = 0;
    const tile = bc.makeTile(90, 'green', (nextColor, prevColor) => {
      clicks++;
      if (clicks <= 3) {
        if (clicks === 1) {
          dotRow.style.opacity = '1';
          tile.style.width = '50px'; tile.style.height = '50px';
        }
        bc.colorDot(dots[clicks - 1], prevColor);
        if (clicks < 3) bc.highlightDot(dots[clicks], true);
        if (clicks > 1) bc.highlightDot(dots[clicks - 2], false);
        if (clicks === 3) {
          bc.highlightDot(dots[2], false);
          hint.textContent = 'How many possible colors?';
          ansWrap.style.display = 'flex';
        }
      }
    });
    main.appendChild(tile);
    main.appendChild(dotRow);

    const ansWrap = document.createElement('div');
    ansWrap.style.display = 'none';
    ansWrap.appendChild(bc.makeAnswerBox(3, () => {
      startNTileLesson(container, bc, 2);
    }));
    main.appendChild(ansWrap);
  }
};

// --- Generic N-tile lesson ---
function startNTileLesson(container, bc, N) {
  container.innerHTML = '';

  const prompts = {
    2: '"OK, great. You got the warm-up. Big whoop. Now, how many different ways are there to color TWO Wordle squares, Mr. Smarty Pants?"',
    3: '"Now we\'re cooking. How many ways to color THREE squares? Think about it."',
    4: '"Four squares now. You seeing the pattern yet?"',
    5: '"Five squares. That\'s a full Wordle row. How many possible patterns?"',
  };

  const dialogue = bc.makeDialogueBar('Carol B', prompts[N] || `"How many ways to color ${N} squares?"`, '#e090d0');
  container.appendChild(dialogue);

  const main = document.createElement('div');
  main.style.cssText = `
    flex: 1; display: flex; flex-direction: column; align-items: center;
    gap: 10px; padding: 16px; overflow-y: auto;
  `;
  container.appendChild(main);

  // Tiles row — fixed position/size
  const tileRow = document.createElement('div');
  tileRow.style.cssText = 'display: flex; gap: 6px; flex-shrink: 0;';
  const curColors = [];
  const tiles = [];
  for (let t = 0; t < N; t++) {
    curColors.push('green');
    const idx = t;
    const tile = bc.makeTile(40, 'green', (next) => {
      curColors[idx] = next;
      updateTree();
    });
    tiles.push(tile);
    tileRow.appendChild(tile);
  }
  main.appendChild(tileRow);

  // Build tree
  const C = bc.COLORS;
  const total = Math.pow(3, N);

  // Tree layout: each level adds branching
  // We render as a grid of dots at each level, horizontally distributed
  const treeWrap = document.createElement('div');
  treeWrap.style.cssText = `
    display: flex; flex-direction: column; align-items: center;
    gap: 8px; flex-shrink: 0; margin: 8px 0;
  `;

  // Dot sizes decrease with depth, spacing decreases with N
  const dotSizes = {
    1: [20],
    2: [16, 12],
    3: [14, 10, 7],
    4: [12, 9, 6, 5],
    5: [10, 8, 6, 5, 4],
  };
  const sizes = dotSizes[N] || new Array(N).fill(5);

  // Gaps between dots at each level
  const gapSizes = {
    1: [30],
    2: [40, 8],
    3: [24, 6, 3],
    4: [16, 4, 2, 1],
    5: [10, 3, 1, 1, 0],
  };
  const gaps = gapSizes[N] || new Array(N).fill(2);

  // Group gaps (space between groups at each level)
  const groupGaps = {
    1: [0],
    2: [30, 0],
    3: [20, 8, 0],
    4: [14, 6, 3, 0],
    5: [8, 4, 2, 1, 0],
  };
  const gGaps = groupGaps[N] || new Array(N).fill(0);

  // Create all dots organized by level
  // allDots[level] = array of dots, length = 3^(level+1)
  const allDots = [];
  for (let level = 0; level < N; level++) {
    const count = Math.pow(3, level + 1);
    const row = document.createElement('div');
    row.style.cssText = `display: flex; align-items: center; justify-content: center; flex-shrink: 0;`;
    const dotsAtLevel = [];
    for (let i = 0; i < count; i++) {
      const dot = bc.makeDot(sizes[level], 'empty');
      dotsAtLevel.push(dot);
      row.appendChild(dot);

      // Add gap after each dot
      if (i < count - 1) {
        // Determine spacing: within group vs between groups
        const groupSize = Math.pow(3, level + 1 - (level)); // not used; simpler approach below
        // Every 3^(level) dots we need a bigger gap for grouping at parent level
        let gapPx = gaps[level];
        // Check all parent group boundaries
        for (let g = level; g >= 0; g--) {
          const groupLen = Math.pow(3, level + 1 - g);
          if ((i + 1) % groupLen === 0) {
            gapPx = Math.max(gapPx, gGaps[g] + gaps[level]);
            break;
          }
        }
        const spacer = document.createElement('div');
        spacer.style.cssText = `width: ${gapPx}px; flex-shrink: 0;`;
        row.appendChild(spacer);
      }
    }
    allDots.push(dotsAtLevel);
    treeWrap.appendChild(row);
  }
  main.appendChild(treeWrap);

  // Tracking
  const visited = new Set();
  let totalVisited = 0;

  const countLabel = document.createElement('div');
  countLabel.textContent = '0 combinations found';
  countLabel.style.cssText = 'font-size: 12px; color: #888; flex-shrink: 0;';
  main.appendChild(countLabel);

  const hint = document.createElement('div');
  hint.textContent = 'Click tiles to cycle. Find all combinations \u2014 or just figure out the pattern!';
  hint.style.cssText = 'font-size: 11px; color: #aaa; flex-shrink: 0;';
  main.appendChild(hint);

  // Answer box — always visible
  const ansWrap = document.createElement('div');
  ansWrap.style.cssText = 'flex-shrink: 0; margin-top: 4px;';
  ansWrap.appendChild(bc.makeAnswerBox(total, () => {
    if (N < 5) {
      startNTileLesson(container, bc, N + 1);
    } else {
      bc.setDialogue(dialogue, 'Carol B',
        '"3 \u00d7 3 \u00d7 3 \u00d7 3 \u00d7 3 = 243. A five-letter Wordle has 243 possible patterns. Now you\'re thinking like a Wordle player."',
        '#e090d0');
      setTimeout(() => bc.hide(), 4000);
    }
  }));
  main.appendChild(ansWrap);

  function getPathIndex(colors) {
    // Convert array of color names to flat index in the tree
    // colors[0] picks branch (0-2), colors[1] picks sub-branch, etc.
    // At level L, the dot index = sum of colors[0..L] * 3^(L-i)
    const indices = [];
    for (let level = 0; level < N; level++) {
      let idx = 0;
      for (let i = 0; i <= level; i++) {
        idx += C.indexOf(colors[i]) * Math.pow(3, level - i);
      }
      indices.push(idx);
    }
    return indices;
  }

  function updateTree() {
    const key = curColors.join(',');
    const pathIndices = getPathIndex(curColors);

    if (!visited.has(key)) {
      visited.add(key);
      totalVisited++;
      // Fill dots along this path
      for (let level = 0; level < N; level++) {
        bc.colorDot(allDots[level][pathIndices[level]], curColors[level]);
      }
      countLabel.textContent = `${totalVisited} combination${totalVisited !== 1 ? 's' : ''} found`;
    }

    // Highlight current path
    for (let level = 0; level < N; level++) {
      const count = allDots[level].length;
      for (let i = 0; i < count; i++) {
        bc.highlightDot(allDots[level][i], i === pathIndices[level]);
      }
    }
  }

  // Initial state
  updateTree();
}
