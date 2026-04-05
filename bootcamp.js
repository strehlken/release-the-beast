// Wordle Bootcamp — DOM overlay, ported from index_3.html prototype

const Bootcamp = {
  overlay: null,
  active: false,
  onComplete: null,

  init() {
    if (this.overlay) return;
    const el = document.createElement('div');
    el.id = 'bootcamp-overlay';
    Object.assign(el.style, {
      position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
      display: 'none', zIndex: '10000', background: '#f5f4ef',
    });
    document.body.appendChild(el);
    this.overlay = el;
  },

  show() {
    this.init();
    this.overlay.style.display = 'block';
    this.active = true;
    startLesson(1);
  },

  hide() {
    if (this.overlay) this.overlay.style.display = 'none';
    this.active = false;
    if (this.onComplete) this.onComplete();
  },
};

// ========== Engine (from index_3.html) ==========

const COLORS = ['green', 'yellow', 'gray'];
const HEX = { green: '#6aaa64', yellow: '#c9b458', gray: '#787c7e', empty: '#ddd' };
const STROKE = { green: '#5a9a54', yellow: '#b9a448', gray: '#686c6e', empty: '#bbb' };

const PROMPTS = {
  1: '"Your first assignment: How many ways are there to color a single square in a Wordle pattern?"',
  2: '"OK, great. You got the warm-up. Big whoop. Now, how many different ways are there to color TWO Wordle squares, Mr. Smarty Pants?"',
  3: '"Now we\'re cooking. How many ways to color THREE squares? Think about it."',
  4: '"Four squares now. You seeing the pattern yet?"',
  5: '"Five squares. That\'s a full Wordle row. How many possible patterns?"',
};

const MAX_N = 3;
let highestUnlocked = 1;
let currentN = 1;
let curColors = [];
let visited = new Set();
let totalVisited = 0;
let nodes = [];
let svgEl = null;
let counterEl = null;
let feedbackEl = null;

function getApp() {
  return Bootcamp.overlay;
}

function startLesson(N) {
  if (N > highestUnlocked) return;
  currentN = N;
  curColors = Array(N).fill('green');
  visited = new Set();
  totalVisited = 0;
  nodes = [];

  const app = getApp();
  app.innerHTML = `
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');

  #bootcamp-overlay .bootcamp {
    font-family: 'DM Sans', system-ui, sans-serif;
    background: #f5f4ef; color: #1a1a2a;
    display: flex; flex-direction: column; height: 100vh;
  }

  #bootcamp-overlay .dialogue-bar {
    background: #2a2a3a; color: #eee; padding: 12px 20px;
    font-size: 17px; line-height: 1.5;
    display: flex; align-items: center; gap: 12px;
    flex-shrink: 0; border-bottom: 3px solid #3a3a4a;
  }
  #bootcamp-overlay .dialogue-bar .speaker { font-weight: 700; color: #e090d0; white-space: nowrap; }

  #bootcamp-overlay .controls-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 24px; flex-shrink: 0; position: relative;
    border-bottom: 1px solid #ddd; background: #f5f4ef;
  }

  #bootcamp-overlay .answer-group { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  #bootcamp-overlay .answer-group input {
    width: 58px; padding: 8px 10px; font-size: 18px; text-align: center;
    border: 2px solid #ccc; border-radius: 6px; outline: none;
    font-family: 'DM Sans', system-ui, sans-serif; color: #1a1a2a;
  }
  #bootcamp-overlay .answer-group input::placeholder { color: #bbb; font-style: italic; }
  #bootcamp-overlay .answer-group input:focus { border-color: #6aaa64; }
  #bootcamp-overlay .answer-group button {
    padding: 8px 16px; font-size: 15px; cursor: pointer;
    background: #e8e8e3; color: #444; border: 2px solid #ccc; border-radius: 6px;
    font-family: 'DM Sans', system-ui, sans-serif; font-weight: 500;
    transition: background 0.15s;
  }
  #bootcamp-overlay .answer-group button:hover { background: #ddd; }
  #bootcamp-overlay .answer-group .feedback { font-size: 14px; min-width: 60px; }

  #bootcamp-overlay .tiles-row { display: flex; justify-content: center; align-items: center; gap: 8px; }
  #bootcamp-overlay .wordle-tile {
    width: 48px; height: 48px; border-radius: 5px;
    border: 2px solid rgba(0,0,0,0.12); cursor: pointer;
    transition: background 0.15s; user-select: none;
  }
  #bootcamp-overlay .wordle-tile:hover { opacity: 0.85; }
  #bootcamp-overlay .wordle-tile:active { transform: scale(0.95); }

  #bootcamp-overlay .nav-group { display: flex; align-items: center; gap: 7px; flex-shrink: 0; }
  #bootcamp-overlay .nav-group .label { font-size: 13px; font-weight: 500; color: #888; white-space: nowrap; }
  #bootcamp-overlay .nav-group button {
    width: 32px; height: 32px; font-size: 14px; font-weight: 600;
    border: 2px solid #ccc; border-radius: 50%; background: white; cursor: pointer;
    font-family: 'DM Sans', system-ui, sans-serif; color: #555; transition: all 0.15s;
  }
  #bootcamp-overlay .nav-group button:hover:not(.locked) { border-color: #999; }
  #bootcamp-overlay .nav-group button.active { background: #2a2a3a; color: white; border-color: #2a2a3a; }
  #bootcamp-overlay .nav-group button.locked { opacity: 0.35; cursor: not-allowed; }

  #bootcamp-overlay .tree-zone {
    flex: 1; display: flex; align-items: center; justify-content: center;
    padding: 12px 0; overflow: hidden;
  }
  #bootcamp-overlay .tree-zone svg { max-width: 100%; max-height: 100%; }

  #bootcamp-overlay .bottom-zone {
    flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    padding: 12px 0 16px; border-top: 1px solid #ddd; background: #f5f4ef;
  }
  #bootcamp-overlay .counter { font-size: 15px; color: #999; }

  @media (max-width: 600px) {
    #bootcamp-overlay .dialogue-bar { font-size: 14px; padding: 10px 14px; }
    #bootcamp-overlay .controls-row { padding: 10px 12px; }
    #bootcamp-overlay .wordle-tile { width: 36px; height: 36px; }
    #bootcamp-overlay .answer-group input { width: 46px; font-size: 15px; padding: 6px 6px; }
    #bootcamp-overlay .answer-group button { font-size: 13px; padding: 6px 10px; }
    #bootcamp-overlay .nav-group .label { font-size: 11px; }
    #bootcamp-overlay .nav-group button { width: 28px; height: 28px; font-size: 12px; }
  }
</style>
<div class="bootcamp">
  <div class="dialogue-bar">
    <span class="speaker">Carol B</span>
    <span id="dialogueText">${PROMPTS[N]}</span>
  </div>
  <div class="controls-row">
    <div class="answer-group">
      <input type="text" id="ansInput" placeholder="?">
      <button onclick="submitAnswer()">Answer</button>
      <span class="feedback" id="feedback"></span>
    </div>
    <div class="tiles-row" id="tilesRow" style="position:absolute;left:50%;transform:translateX(-50%);"></div>
    <div class="nav-group" id="navGroup">
      <span class="label"># tiles:</span>
    </div>
  </div>
  <div class="tree-zone" id="treeZone"></div>
  <div class="bottom-zone">
    <div class="counter" id="counter">0 combinations found</div>
  </div>
</div>`;

  // Build nav buttons
  const navGroup = app.querySelector('#navGroup');
  for (let i = 1; i <= MAX_N; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.id = 'nav' + i;
    if (i === N) btn.classList.add('active');
    if (i > highestUnlocked) btn.classList.add('locked');
    const level = i;
    btn.addEventListener('click', () => {
      if (level <= highestUnlocked) startLesson(level);
    });
    navGroup.appendChild(btn);
  }

  counterEl = app.querySelector('#counter');
  feedbackEl = app.querySelector('#feedback');

  // Build tiles
  const tilesRow = app.querySelector('#tilesRow');
  for (let t = 0; t < N; t++) {
    const tile = document.createElement('div');
    tile.className = 'wordle-tile';
    tile.style.background = HEX.green;
    tile.dataset.color = 'green';
    const idx = t;
    tile.addEventListener('click', () => cycleTile(tile, idx));
    tilesRow.appendChild(tile);
  }

  buildTree(N);

  document.getElementById('ansInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') submitAnswer();
  });
  document.getElementById('ansInput').focus();
}

function cycleTile(tile, idx) {
  const cur = tile.dataset.color;
  const next = COLORS[(COLORS.indexOf(cur) + 1) % 3];
  tile.dataset.color = next;
  tile.style.background = HEX[next];
  curColors[idx] = next;
  updateTree();
}

function buildTree(N) {
  const treeZone = getApp().querySelector('#treeZone');
  const isMobile = window.innerWidth <= 600;
  const leafCount = Math.pow(3, N);

  let nodeR;
  if (isMobile) {
    nodeR = N <= 2 ? 10 : N === 3 ? 7 : N === 4 ? 5 : 4;
  } else {
    nodeR = N <= 2 ? 12 : N === 3 ? 9 : N === 4 ? 7 : 5;
  }

  const ringGap = 4;
  const ringR = nodeR + ringGap;
  const refWidth = isMobile ? 320 : 700;
  const leafGap = refWidth / (leafCount + 1);
  const levelHeight = N === 1 ? 0 : (isMobile ? 50 : 70);
  const svgH = (N - 1) * levelHeight + ringR * 2 + 4;

  // Compute positions
  const positions = [];
  const leafY = (N - 1) * levelHeight + ringR + 2;
  const leafPositions = [];
  for (let i = 0; i < leafCount; i++) {
    leafPositions.push({ x: leafGap * (i + 1), y: leafY });
  }
  positions[N - 1] = leafPositions;

  for (let level = N - 2; level >= 0; level--) {
    const count = Math.pow(3, level + 1);
    const y = level * levelHeight + ringR + 2;
    const childLevel = positions[level + 1];
    const parentPositions = [];
    for (let i = 0; i < count; i++) {
      const c0 = childLevel[i * 3];
      const c2 = childLevel[i * 3 + 2];
      parentPositions.push({ x: (c0.x + c2.x) / 2, y });
    }
    positions[level] = parentPositions;
  }

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${refWidth} ${svgH}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.style.maxWidth = '100%';
  svg.style.maxHeight = '100%';
  svgEl = svg;

  // Lines
  for (let level = 0; level < N - 1; level++) {
    const parents = positions[level];
    const children = positions[level + 1];
    for (let i = 0; i < parents.length; i++) {
      for (let j = 0; j < 3; j++) {
        const child = children[i * 3 + j];
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', parents[i].x);
        line.setAttribute('y1', parents[i].y);
        line.setAttribute('x2', child.x);
        line.setAttribute('y2', child.y);
        line.setAttribute('stroke', '#ddd');
        line.setAttribute('stroke-width', '1.5');
        line.dataset.parentLevel = level;
        line.dataset.parentIdx = i;
        line.dataset.childIdx = i * 3 + j;
        svg.appendChild(line);
      }
    }
  }

  // Nodes
  nodes = [];
  for (let level = 0; level < N; level++) {
    const levelNodes = [];
    for (let i = 0; i < positions[level].length; i++) {
      const pos = positions[level][i];

      const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ring.setAttribute('cx', pos.x);
      ring.setAttribute('cy', pos.y);
      ring.setAttribute('r', ringR);
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', 'transparent');
      ring.setAttribute('stroke-width', '2.5');
      svg.appendChild(ring);

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', pos.x);
      circle.setAttribute('cy', pos.y);
      circle.setAttribute('r', nodeR);
      circle.setAttribute('fill', HEX.empty);
      circle.setAttribute('stroke', STROKE.empty);
      circle.setAttribute('stroke-width', '1.5');
      svg.appendChild(circle);

      levelNodes.push({ color: 'empty', el: circle, ringEl: ring });
    }
    nodes.push(levelNodes);
  }

  treeZone.appendChild(svg);
  updateTree();
}

function getPathIndices(colors) {
  const indices = [];
  for (let level = 0; level < colors.length; level++) {
    let idx = 0;
    for (let i = 0; i <= level; i++) {
      idx += COLORS.indexOf(colors[i]) * Math.pow(3, level - i);
    }
    indices.push(idx);
  }
  return indices;
}

function updateTree() {
  const key = curColors.join(',');
  const pathIndices = getPathIndices(curColors);

  if (!visited.has(key)) {
    visited.add(key);
    totalVisited++;
    for (let level = 0; level < currentN; level++) {
      const node = nodes[level][pathIndices[level]];
      const color = curColors[level];
      node.color = color;
      node.el.setAttribute('fill', HEX[color]);
      node.el.setAttribute('stroke', STROKE[color]);
    }
    counterEl.textContent = `${totalVisited} combination${totalVisited !== 1 ? 's' : ''} found`;
  }

  // Highlight current path — ring only, no layout shift
  for (let level = 0; level < currentN; level++) {
    for (let i = 0; i < nodes[level].length; i++) {
      nodes[level][i].ringEl.setAttribute('stroke', i === pathIndices[level] ? '#e67e22' : 'transparent');
    }
  }

  // Highlight lines on path
  if (svgEl) {
    svgEl.querySelectorAll('line').forEach(line => {
      const pLevel = parseInt(line.dataset.parentLevel);
      const pIdx = parseInt(line.dataset.parentIdx);
      const cIdx = parseInt(line.dataset.childIdx);
      const onPath = pIdx === pathIndices[pLevel] && cIdx === pathIndices[pLevel + 1];
      line.setAttribute('stroke', onPath ? '#e67e22' : '#ddd');
      line.setAttribute('stroke-width', onPath ? '2.5' : '1.5');
    });
  }
}

function submitAnswer() {
  const input = document.getElementById('ansInput');
  const total = Math.pow(3, currentN);
  if (input.value.trim() === String(total)) {
    feedbackEl.textContent = 'Correct!';
    feedbackEl.style.color = '#6aaa64';
    input.disabled = true;
    if (currentN < MAX_N) {
      highestUnlocked = Math.max(highestUnlocked, currentN + 1);
      setTimeout(() => startLesson(currentN + 1), 800);
    } else {
      document.getElementById('dialogueText').textContent =
        '"3 \u00d7 3 \u00d7 3 = 27. Every square you add multiplies by 3. Now you\'re thinking like a Wordle player."';
      setTimeout(() => Bootcamp.hide(), 4000);
    }
  } else {
    feedbackEl.textContent = 'Try again.';
    feedbackEl.style.color = '#c0392b';
    input.value = '';
    input.focus();
  }
}
