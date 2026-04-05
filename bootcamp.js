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

  // --- Shared UI ---

  COLORS: ['green', 'yellow', 'gray'],
  HEX: { green: '#6aaa64', yellow: '#c9b458', gray: '#787c7e', empty: '#ddd', highlight: '#333' },

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
    wrap.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-top: 12px;';
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
      cursor: pointer; transition: background 0.15s, transform 0.1s, width 0.4s, height 0.4s;
      border: 2px solid rgba(0,0,0,0.1); flex-shrink: 0;
    `;
    tile.addEventListener('mouseenter', () => { tile.style.transform = 'scale(1.05)'; });
    tile.addEventListener('mouseleave', () => { tile.style.transform = 'scale(1)'; });
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

  makeDot(size, color) {
    const dot = document.createElement('div');
    dot.style.cssText = `
      width: ${size}px; height: ${size}px; border-radius: 50%;
      background: ${this.HEX[color] || this.HEX.empty};
      border: 2px solid ${color === 'empty' ? '#bbb' : 'rgba(0,0,0,0.15)'};
      transition: all 0.25s; flex-shrink: 0;
    `;
    dot.dataset.color = color || 'empty';
    return dot;
  },

  colorDot(dot, color) {
    dot.dataset.color = color;
    dot.style.background = this.HEX[color] || this.HEX.empty;
    dot.style.borderColor = color === 'empty' ? '#bbb' : 'rgba(0,0,0,0.15)';
  },

  highlightDot(dot, on) {
    dot.style.borderColor = on ? '#333' : (dot.dataset.color === 'empty' ? '#bbb' : 'rgba(0,0,0,0.15)');
    dot.style.borderWidth = on ? '3px' : '2px';
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

    // Dots row (hidden initially)
    const dotRow = document.createElement('div');
    dotRow.style.cssText = 'display: flex; gap: 10px; opacity: 0; transition: opacity 0.4s;';
    const dots = [bc.makeDot(22, 'empty'), bc.makeDot(22, 'empty'), bc.makeDot(22, 'empty')];
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
        if (clicks === 3) {
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
      LESSONS['two-squares'].start(container, bc);
    }));
    main.appendChild(ansWrap);
  }
};

// --- Lesson 2: Two squares ---
LESSONS['two-squares'] = {
  start(container, bc) {
    container.innerHTML = '';
    const dialogue = bc.makeDialogueBar('Carol B',
      '"OK, great. You got the warm-up. Big whoop. Now, how many different ways are there to color two Wordle squares, Mr. Smarty Pants?"', '#e090d0');
    container.appendChild(dialogue);

    const main = document.createElement('div');
    main.style.cssText = `
      flex: 1; display: flex; flex-direction: column; align-items: center;
      gap: 14px; padding: 20px; overflow-y: auto;
    `;
    container.appendChild(main);

    // Two tiles at top
    const tileRow = document.createElement('div');
    tileRow.style.cssText = 'display: flex; gap: 6px; align-items: center;';

    // Build tree data: 3 branches × 3 leaves = 9 paths
    const C = bc.COLORS;
    const treeDots = []; // [branch][leaf] dot elements
    const branchParents = []; // parent dots

    // Tree container
    const tree = document.createElement('div');
    tree.style.cssText = 'display: flex; gap: 24px; justify-content: center; margin: 8px 0;';

    for (let i = 0; i < 3; i++) {
      const col = document.createElement('div');
      col.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 6px;';
      const parent = bc.makeDot(18, 'empty');
      branchParents.push(parent);
      col.appendChild(parent);
      const line = document.createElement('div');
      line.style.cssText = 'width: 1px; height: 10px; background: #ccc;';
      col.appendChild(line);
      const kids = document.createElement('div');
      kids.style.cssText = 'display: flex; gap: 5px;';
      const row = [];
      for (let j = 0; j < 3; j++) {
        const d = bc.makeDot(12, 'empty');
        row.push(d);
        kids.appendChild(d);
      }
      treeDots.push(row);
      col.appendChild(kids);
      tree.appendChild(col);
    }

    // Track which combos have been visited
    const visited = new Set();
    let totalVisited = 0;

    function getComboKey(c1, c2) { return c1 + ',' + c2; }

    function updateTree(color1, color2) {
      const i1 = C.indexOf(color1);
      const i2 = C.indexOf(color2);
      const key = getComboKey(color1, color2);

      // Color the visited combo
      if (!visited.has(key)) {
        visited.add(key);
        totalVisited++;
        bc.colorDot(branchParents[i1], color1);
        bc.colorDot(treeDots[i1][i2], color2);
      }

      // Highlight current path
      for (let b = 0; b < 3; b++) {
        bc.highlightDot(branchParents[b], b === i1);
        for (let l = 0; l < 3; l++) {
          bc.highlightDot(treeDots[b][l], b === i1 && l === i2);
        }
      }

      countLabel.textContent = `${totalVisited} of 9 combinations found`;
      if (totalVisited >= 9 && ansWrap.style.display === 'none') {
        ansWrap.style.display = 'flex';
      }
    }

    let cur1 = 'green', cur2 = 'green';
    const tile1 = bc.makeTile(44, 'green', (next, prev) => {
      cur1 = next;
      updateTree(cur1, cur2);
    });
    const tile2 = bc.makeTile(44, 'green', (next, prev) => {
      cur2 = next;
      updateTree(cur1, cur2);
    });
    tileRow.appendChild(tile1);
    tileRow.appendChild(tile2);
    main.appendChild(tileRow);
    main.appendChild(tree);

    const countLabel = document.createElement('div');
    countLabel.textContent = '0 of 9 combinations found';
    countLabel.style.cssText = 'font-size: 12px; color: #888;';
    main.appendChild(countLabel);

    // Initialize highlight
    updateTree('green', 'green');

    const hint = document.createElement('div');
    hint.textContent = 'Click the tiles to cycle colors. Find all 9 combinations.';
    hint.style.cssText = 'font-size: 12px; color: #aaa;';
    main.appendChild(hint);

    const ansWrap = document.createElement('div');
    ansWrap.style.display = 'none';
    ansWrap.appendChild(bc.makeAnswerBox(9, () => {
      LESSONS['three-squares'].start(container, bc);
    }));
    main.appendChild(ansWrap);
  }
};

// --- Lesson 3: Three squares ---
LESSONS['three-squares'] = {
  start(container, bc) {
    container.innerHTML = '';
    const dialogue = bc.makeDialogueBar('Carol B',
      '"Now we\'re cooking. How many ways to color THREE squares? Think about it."', '#e090d0');
    container.appendChild(dialogue);

    const main = document.createElement('div');
    main.style.cssText = `
      flex: 1; display: flex; flex-direction: column; align-items: center;
      gap: 12px; padding: 16px; overflow-y: auto;
    `;
    container.appendChild(main);

    // Three tiles
    const tileRow = document.createElement('div');
    tileRow.style.cssText = 'display: flex; gap: 6px;';

    const C = bc.COLORS;
    // Tree: 3 × 3 × 3 = 27
    // Level 1: 3 dots, Level 2: 9 dots (3 per L1), Level 3: 27 dots (3 per L2)
    const tree = document.createElement('div');
    tree.style.cssText = 'display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin: 6px 0;';

    const L1dots = [];
    const L2dots = []; // [i][j]
    const L3dots = []; // [i][j][k]

    for (let i = 0; i < 3; i++) {
      const branch = document.createElement('div');
      branch.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 4px;';
      const d1 = bc.makeDot(14, 'empty');
      L1dots.push(d1);
      branch.appendChild(d1);

      const line1 = document.createElement('div');
      line1.style.cssText = 'width: 1px; height: 6px; background: #ccc;';
      branch.appendChild(line1);

      const mid = document.createElement('div');
      mid.style.cssText = 'display: flex; gap: 10px;';
      L2dots.push([]);
      L3dots.push([]);

      for (let j = 0; j < 3; j++) {
        const sub = document.createElement('div');
        sub.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 3px;';
        const d2 = bc.makeDot(10, 'empty');
        L2dots[i].push(d2);
        sub.appendChild(d2);

        const line2 = document.createElement('div');
        line2.style.cssText = 'width: 1px; height: 4px; background: #ddd;';
        sub.appendChild(line2);

        const leaves = document.createElement('div');
        leaves.style.cssText = 'display: flex; gap: 3px;';
        L3dots[i].push([]);
        for (let k = 0; k < 3; k++) {
          const d3 = bc.makeDot(7, 'empty');
          L3dots[i][j].push(d3);
          leaves.appendChild(d3);
        }
        sub.appendChild(leaves);
        mid.appendChild(sub);
      }
      branch.appendChild(mid);
      tree.appendChild(branch);
    }

    const visited = new Set();
    let totalVisited = 0;

    function updateTree(c1, c2, c3) {
      const i = C.indexOf(c1), j = C.indexOf(c2), k = C.indexOf(c3);
      const key = `${c1},${c2},${c3}`;
      if (!visited.has(key)) {
        visited.add(key);
        totalVisited++;
        bc.colorDot(L1dots[i], c1);
        bc.colorDot(L2dots[i][j], c2);
        bc.colorDot(L3dots[i][j][k], c3);
      }
      // Highlight current path
      for (let a = 0; a < 3; a++) {
        bc.highlightDot(L1dots[a], a === i);
        for (let b = 0; b < 3; b++) {
          bc.highlightDot(L2dots[a][b], a === i && b === j);
          for (let c = 0; c < 3; c++) {
            bc.highlightDot(L3dots[a][b][c], a === i && b === j && c === k);
          }
        }
      }
      countLabel.textContent = `${totalVisited} of 27 combinations found`;
      if (totalVisited >= 27 && ansWrap.style.display === 'none') {
        ansWrap.style.display = 'flex';
      }
    }

    let cur = ['green', 'green', 'green'];
    const tiles = [];
    for (let t = 0; t < 3; t++) {
      const idx = t;
      const tile = bc.makeTile(40, 'green', (next) => {
        cur[idx] = next;
        updateTree(cur[0], cur[1], cur[2]);
      });
      tiles.push(tile);
      tileRow.appendChild(tile);
    }
    main.appendChild(tileRow);
    main.appendChild(tree);

    const countLabel = document.createElement('div');
    countLabel.textContent = '0 of 27 combinations found';
    countLabel.style.cssText = 'font-size: 12px; color: #888;';
    main.appendChild(countLabel);

    const hint = document.createElement('div');
    hint.textContent = 'Click tiles to cycle. Find all 27 combinations — or just figure out the pattern!';
    hint.style.cssText = 'font-size: 12px; color: #aaa;';
    main.appendChild(hint);

    const ansWrap = document.createElement('div');
    ansWrap.style.display = 'none';
    // Allow answer even before finding all 27
    ansWrap.style.display = 'flex';
    ansWrap.appendChild(bc.makeAnswerBox(27, () => {
      bc.setDialogue(dialogue, 'Carol B',
        '"3 × 3 × 3 = 27. See the pattern? Every square you add multiplies by 3. Now you\'re thinking like a Wordle player."',
        '#e090d0');
      setTimeout(() => bc.hide(), 3000);
    }));
    main.appendChild(ansWrap);

    updateTree('green', 'green', 'green');
  }
};
