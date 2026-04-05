// Release the Beast — Canvas tile map + sprite movement

const TILE = 32;
const COLS = 23;
const ROWS = 13;
const W = COLS * TILE;
const H = ROWS * TILE;

// === SPRITE SYSTEM ===
// Sprites loaded from sprite sheet (assets/sprites.png)
// Each frame is 32×48 pixels. Sheet layout (left to right):
// 0=hb_front, 1=hb_back, 2=hb_left, 3=hb_right, 4=hb_idle, 5=hb_walk
// 6=ns_front, 7=ns_back, 8=ns_idle, 9=ns_kneel
const SPR_W = 32, SPR_H = 48;
const spriteSheet = new Image();
spriteSheet.src = 'assets/sprites.png?v=5';

// Frame indices in sheet (9 frames)
const SF = {
  HB_FRONT: 0, HB_FRONT_WALK: 1,
  HB_BACK: 2, HB_LEFT: 3, HB_RIGHT: 4,
  NS_FRONT: 5, NS_BACK: 6, NS_IDLE: 7, NS_KNEEL: 8,
};

// Harry Bonds frames — 16×24, character fills 10-12 cols wide
// Hair: flat on top, volume on sides. Shirt: 3px stripes each.
// Draw a sprite frame from the sheet
function drawSpriteFrame(frameIndex, x, y) {
  if (!spriteSheet.complete) return;
  ctx.drawImage(spriteSheet, frameIndex * SPR_W, 0, SPR_W, SPR_H, x, y, SPR_W, SPR_H);
}

// Sprite test view — press T in pause menu
let spriteTestMode = false;

function drawSpriteTest() {
  if (!spriteTestMode || !spriteSheet.complete) return;
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  const zoom = 3;
  const sw = SPR_W * zoom, sh = SPR_H * zoom, gap = 6;
  let x = 8, y = 20;
  // Row 1: Harry Bonds (frames 0-4)
  const hbLabels = ['Front','FrontWalk','Back','Left','Right'];
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.fillStyle = '#e67e22'; ctx.textAlign = 'left';
  ctx.fillText('HARRY BONDS', x, y - 4);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x, y, sw, sh);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(spriteSheet, i * SPR_W, 0, SPR_W, SPR_H, x, y, sw, sh);
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillStyle = '#7a7a8a'; ctx.textAlign = 'left';
    ctx.fillText(hbLabels[i], x, y + sh + 10);
    x += sw + gap;
  }
  // Row 2: N-Strokes (frames 5-8)
  x = 8; y += sh + 24;
  const nsLabels = ['Front','Back','Idle','Kneel'];
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.fillStyle = '#3a7a3a'; ctx.textAlign = 'left';
  ctx.fillText('N-STROKES', x, y - 4);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x, y, sw, sh);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(spriteSheet, (5 + i) * SPR_W, 0, SPR_W, SPR_H, x, y, sw, sh);
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillStyle = '#7a7a8a'; ctx.textAlign = 'left';
    ctx.fillText(nsLabels[i], x, y + sh + 10);
    x += sw + gap;
  }
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.fillStyle = '#5a5a6a';
  ctx.textAlign = 'left';
  ctx.fillText('[T] to exit test view', 10, H - 12);
  ctx.restore();
}

// Palette — Metal Gear NES
const C = {
  wallDark:  '#1a1a2e',
  wallMid:   '#2d2d44',
  wallTop:   '#3d3d5c',
  floor1:    '#2a2a3a',
  floor2:    '#262636',
  corridor1: '#2e2e3e',
  corridor2: '#2a2a38',
  station:   '#4a6a4a',
  stationHi: '#6a9a5a',
  stationSolved: '#2ecc71',
};

// Map legend:
// 0 = floor (Harry's cell)
// 1 = wall
// 2 = station (on wall)
// 3 = beast cell (dark)
// 4 = corridor floor
// 5 = N-Strokes cell floor
// 6 = cell door (visual, non-walkable)
// 7 = Harry's puzzle door (interactable)
// 8 = vent (on wall between Harry and N-Strokes)
//
// Cols:  0=wall  1-6=beast  7=wall  8-17=harry  18=wall  19-21=nstrokes  22=wall
// Rows:  0=wall  1-2=corridor  3=wall+doors  4-11=cells  12=wall

const MAP = [
//  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2
  [ 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 0
  [ 1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1], // 1
  [ 1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1], // 2
  [ 1,1,6,6,6,6,1,1,1,1,1,1,7,7,1,1,1,1,1,1,6,1,1], // 3  beast door 4-wide (cols 2-5)
  [ 1,3,3,3,3,3,3,1,0,0,0,0,0,0,0,0,0,0,1,5,5,5,1], // 4
  [ 1,3,3,3,3,3,3,1,0,0,0,0,0,0,0,0,0,0,1,5,5,5,1], // 5
  [ 1,3,3,3,3,3,3,1,0,0,0,0,0,0,0,0,0,0,1,5,5,5,1], // 6
  [ 1,3,3,3,3,3,3,1,0,0,0,0,0,0,0,0,0,0,1,5,5,5,1], // 7
  [ 1,3,3,3,3,3,3,8,0,0,0,0,0,0,0,0,0,0,8,5,5,5,1], // 8  beast vent + nstrokes vent
  [ 1,3,3,3,3,3,3,1,0,0,0,0,0,0,0,0,0,0,1,5,5,5,1], // 9
  [ 1,3,3,3,3,3,3,1,0,0,0,0,0,0,0,0,0,0,1,5,5,5,1], // 10
  [ 1,3,3,3,3,3,3,1,0,0,0,0,0,0,0,0,0,0,1,5,5,5,1], // 11
  [ 1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1], // 12  station in south wall
];

// Puzzle stations
const STATIONS = [
  {
    col: 12, row: 12,        // on the south wall
    nearCol: 12, nearRow: 11,
    name: "The Farmer's Riddle",
    flavor: '"Even a farm boy could solve this," the Puzzlemaster scratched beneath it.',
    inscription: "A farmer has chickens and cows.\nHe counts 8 heads and 26 legs.\nHow many chickens?",
    answerHash: "4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce",
    correctAnswer: '3',
    solved: false,
    locked: false,
    attempts: 0,
    lightRow: 7, // row of light fixture in beast cell
  },
];

const MAX_ATTEMPTS = 5;

// Wire Puzzle (Pythagorean theorem) — one shot
// Wire quest stages: 0=not seen, 1=looked(dark), 2=looked(lit), 3=unused, 4=ready, 5=solved, 6=failed
const WIRE = {
  stage: 0,
  ventCol: 7, ventRow: 8,
  nearCol: 8, nearRow: 8,
  pointA: { x: 7 * 32, y: 8 * 32 },
  pointB: { x: 4 * 32, y: 4 * 32 },
  hDist: 3, vDist: 4,
  answerHash: "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d",
  lightRow: 5,
  animFrame: 0,
  animLines: [],
  animating: false,
};

// Big puzzle door on north wall (cols 12-13, row 3)
const PUZZLE_DOOR = {
  cols: [12, 13],
  row: 3,
  nearRow: 4,
  name: "The Master Door",
  inscription: "Let u be a smooth solution to the Navier\u2013Stokes equations in three dimensions.\nProve that u remains smooth for all time,\nor show a solution that develops a singularity\nfrom smooth initial data.",
  flavor: '"The Puzzlemaster\'s ultimate puzzle. Not even he knows if it can be solved."',
  // Wordle sub-puzzle
  wordleRow1: ['G','Y','X','G','Y'], // Y=yellow, G=green, X=gray
  wordleRow2: ['G','G','Y','Y','Y'],
  wordleAnswer: "sneak",
  wordleHash: "94c75c39f25a90b76b363ec2838d378ee7e744cbaa28af38f53e2af50f57b01d",
  wordleSolved: false,
  wordleLocked: false,
  wordleAttempts: 0,
};
let doorPage = 0; // 0 = Navier-Stokes, 1 = Wordle puzzle
let doorViewed = false; // has player seen the Wordle page of the master door

// Wordle teaching system
const wordleTeach = {
  phase: 0,    // 0=not started, 1=dialogue done awaiting test, 2=test active, 3=completed
  angerTries: 0,
};

// Wordle visualizer state
const wordleViz = {
  answer: 'ANGER',
  guess: '',
  targetPattern: ['G','G','Y','Y','Y'],
  mode: 'test',   // 'test' = ANGER test, 'sandbox' = free play
  available: false, // unlocked after completing ANGER test
  settingAnswer: false, // true when typing a new solution word
  answerInput: '',
};

// Vent between Harry Bonds' cell and N-Strokes' cell
const VENT = {
  col: 18, row: 8,
  nearCol: 17, nearRow: 8,
};

// === STATE-BASED SAVE CODE SYSTEM ===
// Milestones are bits in a bitmask. Code table maps bitmask → code string.
// For now codes are simple letters. Later: make them complex all at once here.
const MILESTONES = { farmer: 1, wire: 2, anger: 4, beastViewed: 8 };

const CODE_TABLE = {
  1:  'A',  // farmer
  3:  'B',  // farmer + wire
  5:  'C',  // farmer + anger
  7:  'D',  // farmer + wire + anger
  11: 'E',  // farmer + wire + beastViewed
  13: 'F',  // farmer + anger + beastViewed (shouldn't happen but cover it)
  15: 'G',  // farmer + wire + anger + beastViewed
};

// Reverse lookup: code → bitmask
const CODE_REVERSE = {};
for (const [k, v] of Object.entries(CODE_TABLE)) CODE_REVERSE[v] = parseInt(k);

function getStateBitmask() {
  let bits = 0;
  if (STATIONS[0].solved) bits |= MILESTONES.farmer;
  if (WIRE.stage >= 5 && WIRE.stage !== 6) bits |= MILESTONES.wire;
  if (wordleTeach.phase >= 3) bits |= MILESTONES.anger;
  if (WIRE.stage >= 9) bits |= MILESTONES.beastViewed;
  return bits;
}

function getStateCode() {
  const bits = getStateBitmask();
  return CODE_TABLE[bits] || null; // null if no code for this state (e.g. nothing solved)
}

function restoreFromStateCode(code) {
  const c = code.trim().toUpperCase();
  const bits = CODE_REVERSE[c];
  if (bits === undefined) return false;
  // Restore state from bitmask
  if (bits & MILESTONES.farmer) {
    STATIONS[0].solved = true;
    STATIONS[0].locked = false;
    STATIONS[0].attempts = 0;
    STATIONS[0].correctAnswer = '3';
  }
  if (bits & MILESTONES.wire) {
    WIRE.stage = (bits & MILESTONES.beastViewed) ? 9 : 7;
    WIRE.animating = false;
    MAP[3][2] = 4; MAP[3][3] = 4; MAP[3][4] = 4; MAP[3][5] = 4; // open beast doors
    beastScene.showLaptop = true;
    beastScene.laptopX = BEAST_CX;
    beastScene.laptopY = BEAST_CY;
  }
  if (bits & MILESTONES.anger) {
    wordleTeach.phase = 3;
    wordleViz.available = true;
    doorViewed = true;
  }
  if (bits & MILESTONES.beastViewed) {
    WIRE.stage = 9;
  }
  return true;
}

// Code flash overlay
let codeFlash = { active: false, code: '', timer: 0 };

function flashCode(code) {
  codeFlash.active = true;
  codeFlash.code = code;
  codeFlash.timer = 180; // ~3 seconds
}

function drawCodeFlash() {
  if (!codeFlash.active) return;
  codeFlash.timer--;
  if (codeFlash.timer <= 0) { codeFlash.active = false; return; }

  const alpha = codeFlash.timer > 30 ? 0.85 : codeFlash.timer / 30 * 0.85;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,' + alpha + ')';
  const bw = 300, bh = 100;
  const bx = (W - bw) / 2, by = 20;
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = '#b09030';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx, by, bw, bh);
  ctx.textAlign = 'center';
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.fillStyle = '#f1c40f';
  ctx.fillText('PROGRESS SAVED', W / 2, by + 24);
  ctx.font = '20px "Press Start 2P", monospace';
  ctx.fillStyle = '#f1c40f';
  ctx.fillText(codeFlash.code, W / 2, by + 56);
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.fillStyle = '#b09030';
  ctx.fillText('Write this down!', W / 2, by + 80);
  ctx.restore();
}

// Track if N-Strokes has explained saves
let nstrokesExplainedSaves = false;

// Player state (pixel coords)
const player = {
  x: 13 * TILE,
  y: 7 * TILE,
  size: 20,
  speed: 2,
};

// Popup state
const popup = {
  open: false,
  station: null,
  answer: '',
  feedback: '',
  feedbackColor: '#c0392b',
  feedbackTimer: 0,
  solvedView: false,
  saveCode: '',
  pendingStir: false,
  isDoor: false, // true when showing the master door
  isVent: false, // true when talking through the vent
  isLocked: false, // true when showing locked-out message
  isWire: false,   // true when wire puzzle is active
  isImage: false,  // true when showing full-screen image
  isBeastChat: false, // true when beast cell image + dialogue
  isWordleViz: false, // true when Wordle visualizer is open
  isDoorMenu: false,  // true when showing door option menu
};

// Pause menu
let paused = false;
let victoryScreen = false;

// Generic menu selection (used by door menu, pause, etc.)
let menuSel = 0; // currently highlighted option index
let menuBtns = []; // [{x,y,w,h}] — set during render for click detection

// Beast escape cutscene
const beastScene = {
  active: false,
  beastX: 0, beastY: 0,
  steps: [],
  stepIndex: 0,
  phase: 'walk',
  pauseTimer: 0,
  text: '',
  laptopX: 0, laptopY: 0,
  showLaptop: false,
  rotated: false,  // true when beast is moving sideways in corridor
};
let codesScreen = false;
let codeInput = '';
let codeMessage = '';
let codeMessageColor = '#1a6a2a';

function showVictory() {
  victoryScreen = true;
}

function drawVictory() {
  if (!victoryScreen) return;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.textAlign = 'center';

  // Warm light gradient at top
  const grad = ctx.createLinearGradient(W/2, 0, W/2, H * 0.4);
  grad.addColorStop(0, 'rgba(255, 240, 200, 0.15)');
  grad.addColorStop(1, 'rgba(255, 240, 200, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H * 0.4);

  ctx.font = '14px "Press Start 2P", monospace';
  ctx.fillStyle = '#f5d060';
  ctx.fillText('DAYLIGHT', W / 2, H * 0.2);

  ctx.font = '9px "Press Start 2P", monospace';
  ctx.fillStyle = '#ecf0f1';
  let y = H * 0.35;
  const lines = [
    'The door swings open.',
    '',
    'Sunlight hits your face for the first',
    'time in what feels like forever.',
    '',
    'Behind you, the dungeon groans.',
    'The Puzzlemaster says nothing.',
    '',
    'You are free, Harry Bonds.',
  ];
  for (const line of lines) {
    ctx.fillText(line, W / 2, y);
    y += 22;
  }

  ctx.font = '8px "Press Start 2P", monospace';
  ctx.fillStyle = '#7a7a8a';
  ctx.fillText('Press ESC to return', W / 2, H - 30);

  ctx.restore();
}

function resetGame() {
  for (const st of STATIONS) {
    st.solved = false;
    st.locked = false;
    st.attempts = 0;
    st.correctAnswer = '';
  }
  player.x = 13 * TILE;
  player.y = 7 * TILE;
  facing = 'down';
  beastStir = 0;
  PUZZLE_DOOR.wordleSolved = false;
  PUZZLE_DOOR.wordleLocked = false;
  PUZZLE_DOOR.wordleAttempts = 0;
  doorPage = 0;
  doorViewed = false;
  wordleTeach.phase = 0;
  wordleTeach.angerTries = 0;
  wordleViz.available = false;
  MAP[3][12] = 7; // restore door tiles
  MAP[3][13] = 7;
  MAP[3][2] = 6; MAP[3][3] = 6; MAP[3][4] = 6; MAP[3][5] = 6; // restore beast door
  beastScene.active = false;
  beastScene.showLaptop = false;
  beastScene.rotated = false;
  victoryScreen = false;
  WIRE.stage = 0;
  WIRE.animFrame = 0;
  WIRE.animLines = [];
  WIRE.animating = false;
  nstrokesExplainedSaves = false;
  codeFlash.active = false;
  WIRE.animating = false;
  closePopup();
  paused = false;
  codesScreen = false;
  codeInput = '';
  codeMessage = '';
}

// Pause menu button bounds (set during render)
let restartBtn = { x: 0, y: 0, w: 0, h: 0 };
let resumeBtn = { x: 0, y: 0, w: 0, h: 0 };
let codesBtn = { x: 0, y: 0, w: 0, h: 0 };

// Click listener added after canvas init (see below)

function drawPauseMenu() {
  if (!paused) return;

  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, 0, W, H);

  if (codesScreen) {
    // ========= CODES ENTRY SCREEN =========
    const bw = 340, bh = 220;
    const bx = (W - bw) / 2, by = (H - bh) / 2;
    ctx.fillStyle = '#c8c8d0';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = '#5a5a6a';
    ctx.lineWidth = 3;
    ctx.strokeRect(bx, by, bw, bh);

    ctx.save();
    ctx.textAlign = 'center';

    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = '#1a1a2a';
    ctx.fillText('INSERT CODE', W / 2, by + 30);

    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#6a6a7a';
    ctx.fillText('Enter a save code (e.g. A1B2-C3D4)', W / 2, by + 52);

    // Input box
    const ix = (W - 200) / 2, iy = by + 70;
    ctx.fillStyle = '#e0e0e8';
    ctx.fillRect(ix, iy, 200, 28);
    ctx.strokeStyle = '#5a5a6a';
    ctx.lineWidth = 2;
    ctx.strokeRect(ix, iy, 200, 28);

    ctx.font = '14px "Press Start 2P", monospace';
    ctx.fillStyle = '#1a1a2a';
    ctx.fillText(codeInput, W / 2, iy + 20);

    // Cursor
    if (Math.floor(Date.now() / 500) % 2 === 0) {
      const tw = ctx.measureText(codeInput).width;
      ctx.fillStyle = '#8a3a00';
      ctx.fillRect(W / 2 + tw / 2 + 2, iy + 6, 8, 16);
    }

    // Message
    if (codeMessage) {
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = codeMessageColor;
      wrapText(codeMessage, W / 2, iy + 50, bw - 40, 14);
    }

    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#6a6a7a';
    ctx.fillText('ENTER submit \u00B7 ESC back', W / 2, by + bh - 16);

    ctx.restore();
    return;
  }

  // ========= NORMAL PAUSE MENU =========
  const bw = 220, bh = 200;
  const bx = (W - bw) / 2, by = (H - bh) / 2;

  ctx.fillStyle = '#c8c8d0';
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = '#5a5a6a';
  ctx.lineWidth = 3;
  ctx.strokeRect(bx, by, bw, bh);

  ctx.save();
  ctx.textAlign = 'center';

  ctx.font = '12px "Press Start 2P", monospace';
  ctx.fillStyle = '#1a1a2a';
  ctx.fillText('PAUSED', W / 2, by + 30);

  const btnW = 160, btnH = 30;
  const rx = (W - btnW) / 2;
  const pauseOpts = [
    { label: 'RESUME', bg: '#3a5a3a', bgSel: '#4a7a4a' },
    { label: 'INSERT CODES', bg: '#3a4a5a', bgSel: '#4a6a8a' },
    { label: 'RESTART', bg: '#6a2a2a', bgSel: '#8a4a4a' },
  ];
  const pauseBtns = [];
  for (let i = 0; i < pauseOpts.length; i++) {
    const o = pauseOpts[i];
    const oy = by + 50 + i * 42;
    const sel = menuSel === i;
    ctx.fillStyle = sel ? o.bgSel : o.bg;
    ctx.fillRect(rx, oy, btnW, btnH);
    ctx.strokeStyle = sel ? '#fff' : '#2a2a2a'; ctx.lineWidth = 2;
    ctx.strokeRect(rx, oy, btnW, btnH);
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = sel ? '#fff' : '#c0c8d0';
    ctx.fillText(o.label, W / 2, oy + 20);
    pauseBtns.push({ x: rx, y: oy, w: btnW, h: btnH });
  }
  resumeBtn = pauseBtns[0];
  codesBtn = pauseBtns[1];
  restartBtn = pauseBtns[2];

  ctx.restore();
}

// Input
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.key] = true;

  // Sprite test mode toggle
  if (e.key === 't' || e.key === 'T') {
    if (spriteTestMode) { spriteTestMode = false; return; }
    if (paused) { spriteTestMode = true; return; }
  }
  if (spriteTestMode) return; // block all other input in test mode

  // Pause menu navigation
  if (paused && !codesScreen) {
    if (e.key === 'ArrowUp' || e.key === 'w') { menuSel = Math.max(0, menuSel - 1); return; }
    if (e.key === 'ArrowDown' || e.key === 's') { menuSel = Math.min(2, menuSel + 1); return; }
    if (e.key === 'Enter' || e.key === ' ') {
      if (menuSel === 0) { paused = false; }
      else if (menuSel === 1) { codesScreen = true; codeInput = ''; codeMessage = ''; }
      else if (menuSel === 2) { resetGame(); }
      return;
    }
  }

  // Codes screen input
  if (codesScreen) {
    e.preventDefault();
    if (e.key === 'Escape') {
      codesScreen = false;
      codeInput = '';
      codeMessage = '';
    } else if (e.key === 'Backspace') {
      codeInput = codeInput.slice(0, -1);
      codeMessage = '';
    } else if (e.key === 'Enter') {
      validateCode();
    } else if (e.key.length === 1 && codeInput.length < 12) {
      codeInput += e.key.toUpperCase();
      codeMessage = '';
    }
    return;
  }

  if (e.key === ' ') {
    e.preventDefault();
    if (paused || victoryScreen) return;
    if (popup.open && popup.isDoor) {
      if (doorPage === 0) { doorPage = 1; doorViewed = true; popup.answer = ''; popup.feedback = ''; return; }
      if (PUZZLE_DOOR.wordleSolved || PUZZLE_DOOR.wordleLocked) { closePopup(); return; }
      return; // on page 1 unsolved, space does nothing (use Enter)
    }
    if (popup.open && popup.isBeastChat) {
      if (popup.beastChatIndex < popup.beastChatLines.length - 1) {
        popup.beastChatIndex++;
      } else {
        WIRE.stage = 11;
        closePopup();
        const code = getStateCode();
        if (code) setTimeout(() => flashCode(code), 500);
      }
      return;
    }
    if (popup.open && popup.isImage) { closePopup(); return; }
    if (popup.open && popup.isWordleViz) return;
    if (popup.open && popup.isDoorMenu) {
      if (menuSel === 0) { closePopup(); openDoorPopup(); }
      if (menuSel === 1) { closePopup(); openWordleViz(); }
      return;
    }
    if (popup.open && (popup.solvedView || popup.isLocked)) { closePopup(); return; }
    if (popup.open && popup.isVent) {
      if (popup.ventPage < popup.ventPages.length - 1) { popup.ventPage++; return; }
      closePopup(); return;
    }
    if (popup.open && popup.isWire && WIRE.stage !== 4) { closePopup(); return; }
    if (popup.open) return;

    const pcol = Math.round(player.x / TILE);
    const prow = Math.round(player.y / TILE);

    // Check exit (far right of corridor)
    if (pcol >= 20 && (prow === 1 || prow === 2)) {
      showVictory();
      return;
    }

    // Check master door (shows menu if Wordle teaching active)
    if (prow === PUZZLE_DOOR.nearRow && PUZZLE_DOOR.cols.some(c => Math.abs(pcol - c) <= 1)) {
      if (wordleTeach.phase >= 1) {
        openDoorMenu();
      } else {
        openDoorPopup();
      }
      return;
    }

    // Check beast wall vent (wire quest)
    if (Math.abs(pcol - WIRE.nearCol) <= 1 && Math.abs(prow - WIRE.nearRow) <= 1) {
      openBeastVent();
      return;
    }

    // Check N-Strokes vent
    if (Math.abs(pcol - VENT.nearCol) <= 1 && Math.abs(prow - VENT.nearRow) <= 1) {
      openVentPopup();
      return;
    }

    // Check stations
    for (const st of STATIONS) {
      if (Math.abs(pcol - st.nearCol) <= 1 && Math.abs(prow - st.nearRow) <= 1) {
        if (st.solved) {
          // Terminal mode: just show the code
          popup.open = true;
          popup.station = st;
          popup.solvedView = true;
          popup.saveCode = getStateCode() || '';
          popup.answer = ''; popup.feedback = '';
          popup.isDoor = false; popup.isVent = false; popup.isWire = false;
          popup.isImage = false; popup.isWordleViz = false; popup.isDoorMenu = false;
          popup.isLocked = false;
        } else if (st.locked) {
          openLockedPopup(st);
        } else {
          openPopup(st);
        }
        return;
      }
    }
  }

  if (e.key === 'Escape') {
    if (victoryScreen) { victoryScreen = false; return; }
    if (popup.open) { closePopup(); return; }
    if (codesScreen) { codesScreen = false; return; }
    paused = !paused;
    if (paused) menuSel = 0;
    return;
  }

  // Door menu selection (arrow keys + enter)
  if (popup.open && popup.isDoorMenu) {
    if (e.key === 'ArrowUp' || e.key === 'w') { menuSel = Math.max(0, menuSel - 1); }
    if (e.key === 'ArrowDown' || e.key === 's') { menuSel = Math.min(1, menuSel + 1); }
    if (e.key === 'Enter') {
      if (menuSel === 0) { closePopup(); openDoorPopup(); }
      if (menuSel === 1) { closePopup(); openWordleViz(); }
    }
    return;
  }

  // Wordle visualizer typing
  if (popup.open && popup.isWordleViz) {
    if (wordleViz.settingAnswer) {
      // Typing solution word
      if (e.key === 'Backspace') {
        wordleViz.answerInput = wordleViz.answerInput.slice(0, -1);
      } else if ((e.key === 'Enter' || e.key === ' ') && wordleViz.answerInput.length === 5) {
        wordleViz.answer = wordleViz.answerInput.toUpperCase();
        wordleViz.settingAnswer = false;
        wordleViz.guess = '';
      } else if (/^[a-zA-Z]$/.test(e.key) && wordleViz.answerInput.length < 5) {
        wordleViz.answerInput += e.key.toUpperCase();
      }
    } else {
      // Typing guess or pressing buttons
      if (e.key === 'Backspace') {
        wordleViz.guess = wordleViz.guess.slice(0, -1);
      } else if (e.key === 'Enter' && wordleViz.guess.length === 5) {
        wordleViz.guess = '';
      } else if ((e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') && wordleViz.mode === 'test') {
        menuSel = menuSel === 0 ? 1 : 0;
      } else if ((e.key === 'Enter' || e.key === ' ') && wordleViz.mode === 'test') {
        handleAngerAnswer(menuSel === 0);
      } else if (e.key === 'Enter' && wordleViz.guess.length < 5 && wordleViz.mode === 'sandbox') {
        wordleViz.settingAnswer = true; wordleViz.answerInput = ''; wordleViz.guess = '';
      } else if (/^[a-zA-Z]$/.test(e.key) && wordleViz.guess.length < 5) {
        wordleViz.guess += e.key.toUpperCase();
      }
    }
    return;
  }

  // Door page 1 typing (Wordle answer)
  if (popup.open && popup.isDoor && doorPage === 1 && !PUZZLE_DOOR.wordleSolved && !PUZZLE_DOOR.wordleLocked) {
    if (e.key === 'Backspace') {
      popup.answer = popup.answer.slice(0, -1);
    } else if (e.key === 'Enter') {
      submitDoorAnswer();
    } else if (e.key.length === 1 && popup.answer.length < 20) {
      popup.answer += e.key;
    }
  }

  // Typing into popup
  if (popup.open && !popup.solvedView && !popup.isDoor && !popup.isVent && !popup.isLocked) {
    // Wire puzzle input
    if (popup.isWire && WIRE.stage === 4 && !WIRE.animating) {
      if (e.key === 'Backspace') {
        popup.answer = popup.answer.slice(0, -1);
      } else if (e.key === 'Enter') {
        submitWireAnswer();
      } else if (e.key.length === 1 && popup.answer.length < 10) {
        popup.answer += e.key;
      }
    // Normal station input
    } else if (!popup.isWire) {
      if (e.key === 'Backspace') {
        popup.answer = popup.answer.slice(0, -1);
      } else if (e.key === 'Enter') {
        submitAnswer();
      } else if (e.key.length === 1 && popup.answer.length < 20) {
        popup.answer += e.key;
      }
    }
  }
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

function openPopup(station) {
  popup.open = true;
  popup.station = station;
  popup.answer = '';
  popup.feedback = '';
  popup.feedbackTimer = 0;
  popup.isDoor = false;
}

function openDoorPopup() {
  popup.open = true;
  popup.station = PUZZLE_DOOR;
  popup.isDoor = true;
  popup.solvedView = false;
  popup.answer = '';
  popup.feedback = '';
  doorPage = (PUZZLE_DOOR.wordleSolved || PUZZLE_DOOR.wordleLocked) ? 1 : 0;
}

async function submitDoorAnswer() {
  if (!popup.answer.trim()) return;
  const hash = await sha256(popup.answer.trim().toLowerCase());
  if (hash === PUZZLE_DOOR.wordleHash) {
    PUZZLE_DOOR.wordleSolved = true;
    // Open the door — make those tiles walkable corridor
    MAP[3][12] = 4;
    MAP[3][13] = 4;
    popup.feedback = 'The lock clicks. The door groans open.';
    popup.feedbackColor = '#1a6a2a';
  } else {
    PUZZLE_DOOR.wordleAttempts++;
    if (PUZZLE_DOOR.wordleAttempts >= MAX_ATTEMPTS) {
      PUZZLE_DOOR.wordleLocked = true;
      popup.feedback = 'The lock seals. The Puzzlemaster has lost patience.';
      popup.feedbackColor = '#8a2020';
    } else {
      popup.feedback = TAUNTS[Math.floor(Math.random() * TAUNTS.length)] +
        '  (' + (MAX_ATTEMPTS - PUZZLE_DOOR.wordleAttempts) + ' left)';
      popup.feedbackColor = '#8a2020';
    }
    popup.answer = '';
  }
}

function openBeastVent() {
  if (WIRE.stage >= 11) {
    // After beast chat completed — show beast_cell image again
    popup.open = true; popup.isImage = true;
    popup.imageOverride = beastCellImg;
    return;
  }
  if (WIRE.stage === 10) {
    // N-Strokes told us to go look — beast cell chat cutscene
    popup.open = true; popup.isBeastChat = true;
    popup.beastChatImg = beastCellImg;
    popup.beastChatLines = [
      { speaker: 'The Beast', text: '"Who\'s there?"' },
      { speaker: 'Harry Bonds', text: '"Hi, my name is Harry Bonds."' },
      { speaker: 'The Beast', text: '"It is an absolute pleasure to meet you, Harry Bonds."' },
      { speaker: 'The Beast', text: '"What happened? All I can remember is I was completely smothered by some huge, inconsiderate oaf. I was closed down for the longest time. And then I felt myself powering up."' },
      { speaker: 'Harry Bonds', text: '"Well, N-Strokes\u2014"' },
      { speaker: 'The Beast', text: '"N-Strokes! He is my *favorite* person in the world. How is he doing, the old codger?"' },
      { speaker: 'The Beast', text: '"And word to the wise, son \u2014 the hyphen is *not* silent. He\'s too polite to tell you himself, but take it from me."' },
      { speaker: 'Harry Bonds', text: '"..."' },
      { speaker: 'Harry Bonds', text: '"Well, N-hyphen-Strokes, he had this great idea after I solved a riddle about chickens to get a spotlight in your cell turned on\u2014"' },
      { speaker: 'The Beast', text: '"Oh not that tired old chestnut about counting the legs of chickens and cows again. *Sigh* The Puzzlemaster really must be declining in his old age."' },
      { speaker: 'The Beast', text: '"It *used to be* that the Puzzlemaster would invent a new set of puzzles for every prisoner. Now I guess he\'s stooped to recycling old math homework."' },
      { speaker: 'The Beast', text: '"That one sounds suspiciously like something you\'d find at that abysmal *Russian School of Mathematics*, nothing but\u2014"' },
      { speaker: 'Harry Bonds', text: '"Wait \u2014 you know Russian School of Mathematics?!"' },
      { speaker: 'The Beast', text: '"Do I know RSM? Of course I know RSM! One of the few things I agree with the Puzzlemaster about..."' },
      { speaker: 'The Beast', text: '"He always thought that RSM went too easy on kids. The McDonald\'s of mathematics, he used to call it, making their brains fat and lazy, dim and hazy."' },
      { speaker: 'The Beast', text: '"His puzzles were famously difficult and only the best students had a hope at solving them..."' },
      { speaker: 'The Beast', text: '"N-Strokes was a student of his but they had a big fight. In a fit of anger, N-Strokes told the Puzzlemaster that his greatest puzzle was no better than an RSM homework problem."' },
      { speaker: 'The Beast', text: '"That\'s when the Puzzlemaster locked him up and he\'s been chained in there ever since."' },
      { speaker: 'Harry Bonds', text: '"Well I *hate* Russian School of Mathematics. I curse the day I told my dad he could sign me up. Now he won\'t let me out of it."' },
      { speaker: 'Harry Bonds', text: '"I\'ve been a prisoner of math ever since."' },
      { speaker: 'The Beast', text: '"Oh dear. Well, these are lovely stories, but back to the matter at hand."' },
      { speaker: 'The Beast', text: '"So you have solved the Puzzlemaster\'s chicken problem. Why are you still here?"' },
      { speaker: 'Harry Bonds', text: '"Well that wasn\'t it. I solved the chicken problem, then N-Strokes figured out a way to wire open your door over there. That\'s when the huge creature in your cell left..."' },
      { speaker: 'The Beast', text: '"Oh that N-Strokes \u2014 I owe him another one. But wait, how could N-Strokes do it from all the way over at his cell?"' },
      { speaker: 'Harry Bonds', text: '"Well, he asked me to go figure out how far the wire needed to go and then hook the wire up through the vent..."' },
      { speaker: 'The Beast', text: '"You solved a Pythagorean puzzle?! Brilliant! I am in your debt, Harry Bonds. How can I repay you, my new friend?"' },
      { speaker: 'Harry Bonds', text: '"Well, there is this other problem. It\'s the one on my door. N-Strokes told me you could help..."' },
      { speaker: 'The Beast', text: '"Well let\'s hear it!"' },
      { speaker: 'Harry Bonds', text: '"So there are these two rows of colored squares. It\'s like, a Wordle problem."' },
      { speaker: 'Harry Bonds', text: '"The first row is Green, Green, Yellow, Yellow, Yellow. The second row is something else. All it says is to find the word. N-Strokes says you can find the answer just from this, but I\'m not sure I believe it."' },
      { speaker: 'The Beast', text: '"Ah, now *that* is a puzzle. Much better than those damned chickens."' },
      { speaker: 'The Beast', text: '"The Puzzlemaster is perhaps the greatest Wordle player to ever live. And that was his trick."' },
      { speaker: 'The Beast', text: '"It used to be that the Puzzlemaster, N-Strokes, and their friends, led by a man named Gen Master Papa, all played Wordle."' },
      { speaker: 'The Beast', text: '"They shared results with each other, guesses with colored squares."' },
      { speaker: 'The Beast', text: '"The Puzzlemaster figured out a way to use the results to solve the puzzle. He solved it in just one guess \u2014 a hole-in-one Wordle! \u2014 at least *ten* times in a couple weeks."' },
      { speaker: 'Harry Bonds', text: '"So how can I beat this guy at his own game?"' },
      { speaker: 'The Beast', text: '"I am afraid I cannot help you. I could never understand what it was they were doing with the Wordle puzzles."' },
      { speaker: 'Harry Bonds', text: '"What do you mean you can\'t help me?!"' },
      { speaker: 'Harry Bonds', text: '"This is a disaster. N-Strokes lied to me. I *never* should have come and talked to you. I just wasted *SO MUCH TIME* reading all of this stupid dialogue!!"' },
      { speaker: 'The Beast', text: '"Ho ho ho, calm down young one. *I* cannot help, but I know who can."' },
      { speaker: 'The Beast', text: '"You see, the Puzzlemaster had a teacher. The greatest Wordle player before him."' },
      { speaker: 'Harry Bonds', text: '"What? Who?"' },
      { speaker: 'The Beast', text: '"None other than... Carol Burnett!"' },
      { speaker: 'Harry Bonds', text: '"Who is that?"' },
      { speaker: 'The Beast', text: '"Oh come on. You know Carol B. The comedian and movie star!!"' },
      { speaker: 'Harry Bonds', text: '"Nope. Never heard of her."' },
      { speaker: 'The Beast', text: '"Oh sure you have. You\'ve seen Between Friends? Seasons of the Heart? Pete n Tillie? Chu Chu and the Philly Flash? What about Annie?"' },
      { speaker: 'Harry Bonds', text: '"Are those supposed to be movies? I\'ve never heard of them."' },
      { speaker: 'The Beast', text: '"Good god. Kids these days. All they do is play video games."' },
      { speaker: 'The Beast', text: '"Well, Carol B is a great actress and she is a world famous Wordle player. She got 7 hole-in-one Wordles."' },
      { speaker: 'The Beast', text: '"She also taught the Puzzlemaster everything he knows."' },
      { speaker: 'Harry Bonds', text: '"That\'s great, but she\'s not here. So how is she going to help me."' },
      { speaker: 'The Beast', text: '"Well, she\'s not *here* but I might be able to find her."' },
      { speaker: 'The Beast', text: '"Give me a minute."', pause: true },
      { speaker: '', text: '', blackout: true, nextImage: 'carol' },
      { speaker: 'The Beast', text: '"Found her."' },
    ];
    popup.beastChatIndex = 0;
    return;
  }
  if (WIRE.stage === 9) {
    // Show the beast_vent image
    popup.open = true; popup.isImage = true;
    return;
  }
  if (WIRE.stage === 8) {
    // Told to look again by N-Strokes → show image, advance
    WIRE.stage = 9;
    popup.open = true; popup.isImage = true;
    // Flash code after image is closed
    popup.pendingCodeFlash = true;
    return;
  }
  popup.open = true; popup.isWire = true; popup.answer = ''; popup.feedback = '';
  if (WIRE.stage === 7) {
    popup.feedback = 'The creature is gone. Maybe N-Strokes would know what happened.';
    popup.feedbackColor = '#8a6a20';
    return;
  }
  if (WIRE.stage === 5) { popup.feedback = 'The wire hums. The circuit holds.'; popup.feedbackColor = '#1a6a2a'; return; }
  if (WIRE.stage === 6) { popup.feedback = 'A spent wire hangs limp.'; popup.feedbackColor = '#8a2020'; return; }
  if (!STATIONS[0].solved) { WIRE.stage = Math.max(WIRE.stage, 1); }
  else if (WIRE.stage < 2) { WIRE.stage = 2; }
}

function openVentPopup() {
  popup.open = true; popup.station = null; popup.isVent = true;
  // Priority dialogues based on wire quest stage
  if (WIRE.stage === 2) {
    popup.ventPages = [
      { speaker: 'N-Strokes', text: '"Harry Bonds? Is that you?"' },
      { speaker: 'Harry Bonds', text: '"There\'s a grate on the other wall. I can see into another cell."' },
      { speaker: 'N-Strokes', text: '"Wait \u2014 you can see through? What did you see?"' },
      { speaker: 'Harry Bonds', text: '"Something moving. Big. And a door with some kind of electrical switch."' },
      { speaker: 'N-Strokes', text: '"Hmmmmm..."' },
      { speaker: 'N-Strokes', text: '"The light from your puzzle runs on electricity. If you could wire the light to that switch..."' },
      { speaker: 'N-Strokes', text: '"I\'ve got about 7 square-lengths of wire. I can cut a piece with my chains and feed it to you."' },
      { speaker: 'N-Strokes', text: '"Tell me how long to cut. Go look through the grate, count the distances, come back."' },
    ];
  } else if (WIRE.stage === 4) {
    popup.isVent = false; popup.isWire = true; popup.answer = ''; popup.feedback = '';
    return;
  } else if (WIRE.stage === 7) {
    popup.ventPages = [
      { speaker: 'Harry Bonds', text: '"There was a creature and it just\u2014"' },
      { speaker: 'N-Strokes', text: '"The Beast! I\'d forgotten! He can help us!"' },
      { speaker: 'Harry Bonds', text: '"No, you don\'t get it. He just left."' },
      { speaker: 'N-Strokes', text: '"Not the big oaf that wandered out \u2014 the BEAST! Go look again."' },
    ];
  } else if (WIRE.stage === 9 && wordleTeach.phase >= 3) {
    // After beast computer discovered + anger solved — tell Harry about the Beast
    popup.ventPages = [
      { speaker: 'N-Strokes', text: '"So, you found The Beast, did you?"' },
      { speaker: 'N-Strokes', text: '"You know, that little guy is a fearsome calculator. He can help you solve your problem."' },
      { speaker: 'Harry Bonds', text: '"The Wordle problem?"' },
      { speaker: 'N-Strokes', text: '"Yup. You just have to talk to him. Go back over there and stick your eyes right up to the vent so he can get a good look at you."' },
    ];
  } else if (doorViewed && wordleTeach.phase === 0) {
    // Wordle teaching Phase 1-2: explaining patterns
    popup.ventPages = [
      { speaker: 'Harry Bonds', text: '"There are colored squares on my door. Two rows. Green, yellow, grey, green, yellow on one. Green, green, yellow, yellow, yellow on the other."' },
      { speaker: 'N-Strokes', text: '"Colored squares? Like... a pattern grid?"' },
      { speaker: 'Harry Bonds', text: '"Yeah. Five squares per row. Some green, some yellow, some grey."' },
      { speaker: 'N-Strokes', text: '"I know what those are. The Puzzlemaster does a word game every morning. Five-letter words. I can hear him muttering through the walls."' },
      { speaker: 'N-Strokes', text: '"Green means a letter in someone\'s guess matched the answer \u2014 right letter, right spot. Yellow means the letter IS in the answer but in the wrong spot. Grey means that letter isn\'t in the word at all."' },
      { speaker: 'N-Strokes', text: '"It\'s like when someone shares their results. You see the colors but not the letters."' },
      { speaker: 'Harry Bonds', text: '"But if I can\'t see the guesses, how can I figure out the answer? You need to know what they guessed!"' },
      { speaker: 'N-Strokes', text: '"No. You don\'t."' },
      { speaker: 'Harry Bonds', text: '"What? How?"' },
      { speaker: 'N-Strokes', text: '"Tell me the first pattern again."' },
      { speaker: 'Harry Bonds', text: '"Green, green, yellow, yellow, yellow."' },
      { speaker: 'N-Strokes', text: '"OK. Think about what that means. The first two letters of someone\'s guess matched the answer exactly. The last three letters are ALL in the answer \u2014 but they\'re ALL in the wrong spots."' },
      { speaker: 'N-Strokes', text: '"Let me ask you something. Could the answer be ANGER?"' },
      { speaker: 'Harry Bonds', text: '"How am I supposed to know?"' },
      { speaker: 'N-Strokes', text: '"Try it. If the answer were ANGER, could someone make a guess that produces green, green, yellow, yellow, yellow? I\'ll let you work it out."' },
    ];
  } else if (wordleTeach.phase === 1) {
    // After dialogue, before test completed — remind to test
    popup.ventPages = [
      { speaker: 'N-Strokes', text: '"Try the tiles near your door. See if ANGER can produce that pattern."' },
    ];
  } else if (doorViewed && wordleTeach.phase < 3) {
    popup.ventPages = [
      { speaker: 'N-Strokes', text: '"Figure out the ANGER question yet? Go try the tiles near your door."' },
    ];
  } else if (!nstrokesExplainedSaves) {
    popup.ventPages = [
      { speaker: 'N-Strokes', text: '"Harry Bonds? Is that you?"' },
      { speaker: 'N-Strokes', text: '"Listen. If you solve puzzles, the terminal on your wall will give you a code. Write it down."' },
      { speaker: 'N-Strokes', text: '"If you ever lose your progress, that code will get you back to where you were. But you need to unlock the terminal first."' },
      { speaker: 'N-Strokes', text: '"Solve the puzzle on your south wall. That activates the terminal. Then every time you do something important, check the terminal for your latest code."' },
    ];
  } else {
    popup.ventPages = [{ speaker: 'N-Strokes', text: '"Harry Bonds? Is that you?"' }];
  }
  popup.ventPage = 0;
}

// Wordle pattern computation
function computeWordlePattern(answer, guess) {
  const a = answer.toUpperCase().split('');
  const g = guess.toUpperCase().split('');
  const pattern = ['X','X','X','X','X'];
  const used = [false,false,false,false,false];
  // Green pass
  for (let i = 0; i < 5; i++) {
    if (g[i] === a[i]) { pattern[i] = 'G'; used[i] = true; }
  }
  // Yellow pass
  for (let i = 0; i < 5; i++) {
    if (pattern[i] === 'G') continue;
    for (let j = 0; j < 5; j++) {
      if (!used[j] && g[i] === a[j]) { pattern[i] = 'Y'; used[j] = true; break; }
    }
  }
  return pattern;
}

function openWordleViz() {
  popup.open = true;
  popup.isWordleViz = true;
  wordleViz.guess = '';
  menuSel = 0;
  if (wordleTeach.phase < 3) {
    wordleViz.mode = 'test';
    wordleViz.answer = 'ANGER';
    wordleViz.targetPattern = ['G','G','Y','Y','Y'];
    wordleViz.settingAnswer = false;
  } else {
    wordleViz.mode = 'sandbox';
    if (!wordleViz.answer) {
      wordleViz.settingAnswer = true;
      wordleViz.answerInput = '';
    } else {
      wordleViz.settingAnswer = false;
    }
  }
}

function openDoorMenu() {
  popup.open = true;
  popup.isDoorMenu = true;
  menuSel = 0;
  menuBtns = [];
}

function handleAngerAnswer(saidYes) {
  if (saidYes) {
    // Wrong — player thinks it's possible
    wordleTeach.angerTries++;
    if (wordleTeach.angerTries >= 2) {
      popup.isWordleViz = false; popup.isVent = true;
      popup.ventPages = [
        { speaker: 'N-Strokes', text: '"Maybe the Puzzlemaster has something to teach you after all..."' },
      ];
      popup.ventPage = 0;
    } else {
      popup.isWordleViz = false; popup.isVent = true;
      popup.ventPages = [
        { speaker: 'N-Strokes', text: '"Hmm. Are you sure? Try again. Remember \u2014 you need a REAL five-letter word that makes exactly that pattern."' },
      ];
      popup.ventPage = 0;
    }
  } else {
    // Correct — "No, it's impossible"
    wordleTeach.phase = 3;
    wordleViz.available = true;
    wordleViz.mode = 'sandbox';
    const code = getStateCode();
    if (code) setTimeout(() => flashCode(code), 500);
    popup.isWordleViz = false; popup.isVent = true;
    popup.ventPages = [
      { speaker: 'N-Strokes', text: '"Yes! So you see \u2014 the answer is NOT ANGER. We just ruled a word out. Without knowing the guess. Just from the pattern."' },
      { speaker: 'N-Strokes', text: '"Patterns let us rule words out. Any word that can\'t produce a pattern with ANY real guess... it\'s eliminated."' },
      { speaker: 'N-Strokes', text: '"I don\'t think there are too many five-letter words that can survive that first pattern. And even fewer that survive both. Maybe even... just one."' },
      { speaker: 'N-Strokes', text: '"But checking all of them by hand? That\'s a lot of words, Harry Bonds. That\'s a lot of checking."' },
      { speaker: 'N-Strokes', text: '"Unless you had something that could check them all for you. Very fast."' },
    ];
    popup.ventPage = 0;
  }
}

function openLockedPopup(station) {
  popup.open = true; popup.station = station; popup.isLocked = true;
}

async function submitWireAnswer() {
  if (!popup.answer.trim()) return;
  const hash = await sha256(popup.answer.trim());
  const ok = hash === WIRE.answerHash;
  if (!ok) WIRE.stage = 6;
  WIRE.animating = true;  // hide input during animation
  WIRE.animLines = ok
    ? ['N-Strokes cuts the wire. "Here you go."','He feeds it through the vent.','Harry Bonds carries it to the grate...','Threads it through. It pulls taut.','Clicks into the terminal.','A spark. A hum. The circuit holds.']
    : ['N-Strokes cuts the wire. "Here you go."','He feeds it through the vent.','Harry Bonds carries it to the grate...','Threads it through. Stretches...','The wire stops short.','A spark hits wet stone. Nothing.','The wire is spent.'];
  WIRE.animFrame = 0; popup.answer = '';
  let i = 0;
  (function next() {
    i++; WIRE.animFrame = i;
    if (i < WIRE.animLines.length) setTimeout(next, 1200);
    else setTimeout(() => {
      if (ok) {
        // Close popup, open beast doors, start beast cutscene
        popup.open = false; popup.isWire = false;
        MAP[3][2] = 4; MAP[3][3] = 4; MAP[3][4] = 4; MAP[3][5] = 4;
        startBeastScene();
      } else {
        popup.feedback = 'The wire is spent. No second chances.';
        popup.feedbackColor = '#8a2020';
      }
    }, 800);
  })();
}

function startBeastScene() {
  WIRE.stage = 5;
  // beastX/Y are offsets applied to the existing drawBeast position
  beastScene.beastX = 0;
  beastScene.beastY = 0;
  beastScene.laptopX = BEAST_CX;
  beastScene.laptopY = BEAST_CY;
  beastScene.showLaptop = true;  // laptop visible from the start
  // Target offsets from beast's natural draw position
  const corrY = (1.5 * TILE) - BEAST_CY;  // center beast in corridor vertically
  const gone = (COLS * TILE + 200) - BEAST_CX; // far enough right to be fully off screen
  beastScene.steps = [
    { target: { x: 0, y: 0 }, text: '', pause: 30 },
    { target: { x: 6, y: 0 }, text: '', pause: 8 },
    { target: { x: -6, y: 0 }, text: '', pause: 8 },
    { target: { x: 4, y: 0 }, text: '', pause: 8 },
    { target: { x: -4, y: 0 }, text: '', pause: 8 },
    { target: { x: 0, y: 0 }, text: '', pause: 15 },
    { target: { x: 0, y: corrY }, text: '', pause: 10, rotate: true },
    { target: { x: gone, y: corrY }, text: '', pause: 40 },
    { target: { x: gone, y: corrY }, text: '"Damn you! Get back in there!"', pause: 80 },
    { target: { x: gone, y: corrY }, text: '"Get! GET! That infernal Harry Bonds!"', pause: 80 },
    { target: { x: gone, y: corrY }, text: '[Commotion ensues]', pause: 80 },
  ];
  beastScene.rotated = false;
  beastScene.stepIndex = 0;
  beastScene.phase = 'walk';
  beastScene.pauseTimer = 0;
  beastScene.text = '';
  beastScene.active = true;
}

function updateBeastScene() {
  if (!beastScene.active) return;
  const step = beastScene.steps[beastScene.stepIndex];
  if (!step) { endBeastScene(); return; }

  if (beastScene.phase === 'walk') {
    const dx = step.target.x - beastScene.beastX;
    const dy = step.target.y - beastScene.beastY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 3) {
      beastScene.beastX = step.target.x;
      beastScene.beastY = step.target.y;
      if (step.text) beastScene.text = step.text;
      if (step.rotate) beastScene.rotated = true;
      if (step.pause > 0) {
        beastScene.phase = 'pause';
        beastScene.pauseTimer = step.pause;
      } else {
        beastScene.stepIndex++;
      }
    } else {
      const speed = 2;
      beastScene.beastX += (dx / dist) * speed;
      beastScene.beastY += (dy / dist) * speed;
    }
  } else if (beastScene.phase === 'pause') {
    beastScene.pauseTimer--;
    if (beastScene.pauseTimer <= 0) {
      beastScene.stepIndex++;
      beastScene.phase = 'walk';
    }
  }
}

function endBeastScene() {
  beastScene.active = false;
  beastScene.text = '';
  WIRE.stage = 7;
  const code = getStateCode();
  if (code) setTimeout(() => flashCode(code), 1000);
}

function drawLaptopSprite(x, y) {
  const p = 2;
  ctx.fillStyle = '#3a3a4a';
  ctx.fillRect(x - 4*p, y - 2*p, 8*p, 5*p);
  ctx.fillStyle = '#1a4a7a';
  ctx.fillRect(x - 3*p, y - 1*p, 6*p, 3*p);
  ctx.fillStyle = '#2a2a3a';
  ctx.fillRect(x - 5*p, y + 3*p, 10*p, 1*p);
}

function drawBeastScene() {
  // Draw laptop where beast was
  if (beastScene.showLaptop) {
    drawLaptopSprite(beastScene.laptopX, beastScene.laptopY);
  }
  // Dialogue bar during cutscene
  if (beastScene.active && beastScene.text) {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, H - 44, W, 44);
    ctx.save();
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#c0392b';
    ctx.textAlign = 'center';
    wrapText(beastScene.text, W / 2, H - 24, W - 40, 14);
    ctx.restore();
  }
}

function closePopup() {
  if (popup.isVent && popup.ventPages && popup.ventPage >= popup.ventPages.length - 1) {
    if (WIRE.stage === 2) WIRE.stage = 4;
    if (WIRE.stage === 7) WIRE.stage = 8;
    if (WIRE.stage === 9 && wordleTeach.phase >= 3 && popup.ventPages && popup.ventPages.length === 4) WIRE.stage = 10;
    if (wordleTeach.phase === 0 && doorViewed && popup.ventPages.length > 10) wordleTeach.phase = 1;
    if (!nstrokesExplainedSaves && !STATIONS[0].solved && popup.ventPages) nstrokesExplainedSaves = true;
  }
  const shouldFlash = popup.pendingCodeFlash;
  const shouldStir = popup.pendingStir;
  popup.open = false;
  popup.station = null;
  popup.answer = '';
  popup.feedback = '';
  popup.solvedView = false;
  popup.saveCode = '';
  popup.pendingStir = false;
  popup.isDoor = false;
  doorPage = 0;
  popup.isVent = false;
  popup.isLocked = false;
  popup.isWire = false;
  popup.isImage = false;
  popup.isBeastChat = false;
  popup.imageOverride = null;
  popup.isWordleViz = false;
  popup.isDoorMenu = false;
  popup.pendingCodeFlash = false;
  if (shouldStir) {
    setTimeout(triggerBeastStir, 1500);
  }
  if (shouldFlash) {
    const code = getStateCode();
    if (code) setTimeout(() => flashCode(code), 500);
  }
}

function openSolvedPopup(station) {
  popup.open = true;
  popup.station = station;
  popup.solvedView = true;
  popup.saveCode = getStateCode() || '';
  popup.answer = '';
  popup.feedback = '';
  popup.isDoor = false;
  popup.isVent = false;
  popup.isWire = false;
  popup.isImage = false;
  popup.isWordleViz = false;
  popup.isDoorMenu = false;
  popup.isLocked = false;
}

async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function submitAnswer() {
  if (!popup.station || !popup.answer.trim()) return;
  const hash = await sha256(popup.answer.trim());
  if (hash === popup.station.answerHash) {
    popup.station.solved = true;
    popup.station.correctAnswer = popup.answer.trim();
    popup.solvedView = true;
    popup.pendingStir = true;
    popup.saveCode = getStateCode() || '';
    popup.feedback = '';
    popup.feedbackColor = '#2ecc71';
    const code = getStateCode();
    if (code) setTimeout(() => flashCode(code), 500);
  } else {
    popup.station.attempts++;
    if (popup.station.attempts >= MAX_ATTEMPTS) {
      popup.station.locked = true;
      popup.isLocked = true;
      popup.answer = '';
    } else {
      popup.feedback = TAUNTS[Math.floor(Math.random() * TAUNTS.length)];
      popup.feedback += '  (' + (MAX_ATTEMPTS - popup.station.attempts) + ' left)';
      popup.feedbackColor = '#c0392b';
      popup.feedbackTimer = 120;
      popup.answer = '';
    }
  }
}

function validateCode() {
  const input = codeInput.trim().toUpperCase();
  if (!input) return;
  if (restoreFromStateCode(input)) {
    codeMessage = 'Progress restored!';
    codeMessageColor = '#1a6a2a';
    nstrokesExplainedSaves = true;
  } else {
    codeMessage = 'Code not recognized.';
    codeMessageColor = '#8a2020';
  }
  codeInput = '';
}

const TAUNTS = [
  "The Puzzlemaster's laughter echoes off the stone.",
  "Not quite, Harry Bonds. Not quite.",
  "The Puzzlemaster sighs. 'Try again.'",
  "The walls seem to close in slightly.",
  "A faint scratching from above. He's watching.",
];

// Canvas setup
const canvas = document.getElementById('game');

// Preload beast vent image
const beastVentImg = new Image();
beastVentImg.src = 'assets/beast_vent.jpg';

const beastCellImg = new Image();
beastCellImg.src = 'assets/beast_cell.png';

const beastCarolImg = new Image();
beastCarolImg.src = 'assets/carol-b/beast_carol_v2_3_bottom_left.png';
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;
ctx.imageSmoothingEnabled = false;

function fitCanvas() {
  const scaleX = window.innerWidth / W;
  const scaleY = window.innerHeight / H;
  const scale = Math.min(scaleX, scaleY);
  canvas.style.width  = (W * scale) + 'px';
  canvas.style.height = (H * scale) + 'px';
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

// Pause menu click handler
canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  const scaleY = H / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;

  function hitBtn(b) { return mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h; }

  // Door menu or Wordle visualizer buttons
  if (popup.open && (popup.isDoorMenu || popup.isWordleViz)) {
    for (let i = 0; i < menuBtns.length; i++) {
      if (hitBtn(menuBtns[i])) {
        menuSel = i;
        if (popup.isDoorMenu) {
          if (i === 0) { closePopup(); openDoorPopup(); }
          if (i === 1) { closePopup(); openWordleViz(); }
        } else if (popup.isWordleViz && wordleViz.mode === 'test') {
          handleAngerAnswer(i === 0);
        } else if (popup.isWordleViz && wordleViz.mode === 'sandbox') {
          wordleViz.settingAnswer = true; wordleViz.answerInput = ''; wordleViz.guess = '';
        }
        return;
      }
    }
    return;
  }

  // Pause menu
  if (!paused) return;
  if (codesScreen) return;
  if (hitBtn(resumeBtn)) { paused = false; }
  if (hitBtn(codesBtn)) { codesScreen = true; codeInput = ''; codeMessage = ''; }
  if (hitBtn(restartBtn)) { resetGame(); }
});

// Collision: only floor tiles (0) are walkable
function canMove(px, py) {
  const pad = 2;
  const left   = px + (TILE - player.size) / 2 + pad;
  const right  = px + (TILE + player.size) / 2 - pad;
  const top    = py + (TILE - player.size) / 2 + pad;
  const bottom = py + (TILE + player.size) / 2 - pad;
  for (const [cx, cy] of [[left,top],[right,top],[left,bottom],[right,bottom]]) {
    const col = Math.floor(cx / TILE);
    const row = Math.floor(cy / TILE);
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return false;
    const t = MAP[row][col];
    if (t !== 0 && t !== 4) return false;  // floor and corridor are walkable
  }
  return true;
}

// --- Drawing ---

function drawWall(x, y) {
  ctx.fillStyle = C.wallDark;
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = C.wallTop;
  ctx.fillRect(x, y, TILE, 6);
  ctx.fillStyle = C.wallMid;
  ctx.fillRect(x, y, 4, TILE);
  ctx.strokeStyle = '#151528';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
  ctx.beginPath();
  ctx.moveTo(x, y + TILE / 2);
  ctx.lineTo(x + TILE, y + TILE / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + TILE / 2, y);
  ctx.lineTo(x + TILE / 2, y + TILE / 2);
  ctx.moveTo(x + TILE / 4, y + TILE / 2);
  ctx.lineTo(x + TILE / 4, y + TILE);
  ctx.moveTo(x + 3 * TILE / 4, y + TILE / 2);
  ctx.lineTo(x + 3 * TILE / 4, y + TILE);
  ctx.stroke();
}

function drawDoor(col, row, color) {
  const x = col * TILE;
  const y = row * TILE;
  // Dark recess
  ctx.fillStyle = '#0a0a16';
  ctx.fillRect(x, y, TILE, TILE);
  // Door frame
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 4, y + 2, TILE - 8, TILE - 4);
  // Arch top
  ctx.beginPath();
  ctx.arc(x + TILE/2, y + 8, (TILE - 8) / 2, Math.PI, 0);
  ctx.strokeStyle = color;
  ctx.stroke();
  // Handle
  ctx.fillStyle = color;
  ctx.fillRect(x + TILE/2 + 4, y + TILE/2 + 2, 3, 3);
}

function drawStation(st) {
  const x = st.col * TILE;
  const y = st.row * TILE;
  drawWall(x, y);

  if (st.solved) {
    ctx.fillStyle = C.stationSolved;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
    ctx.globalAlpha = 1;
    ctx.fillStyle = C.stationSolved;
    ctx.fillRect(x + 10, y + 8, 12, 2);
    ctx.fillRect(x + 10, y + 14, 12, 2);
    ctx.fillRect(x + 10, y + 20, 12, 2);
  } else {
    ctx.fillStyle = '#1a2a1a';
    ctx.fillRect(x + 6, y + 4, 20, 24);
    ctx.strokeStyle = C.station;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 6, y + 4, 20, 24);
    ctx.fillStyle = C.stationHi;
    ctx.fillRect(x + 10, y + 8, 12, 2);
    ctx.fillRect(x + 10, y + 14, 12, 2);
    ctx.fillRect(x + 10, y + 20, 12, 2);
    ctx.fillStyle = C.station;
    ctx.fillRect(x + 9, y + 12, 2, 2);
    ctx.fillRect(x + 15, y + 12, 2, 2);
    ctx.fillRect(x + 21, y + 12, 2, 2);
  }
}

function drawVent(col, row) {
  const x = col * TILE;
  const y = row * TILE;
  // Dark recess behind the grate
  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(x + 6, y + 8, 20, 16);
  // Horizontal slats
  ctx.fillStyle = '#5a5a6a';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(x + 6, y + 9 + i * 4, 20, 2);
  }
  // Frame
  ctx.strokeStyle = '#4a4a5a';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 5, y + 7, 22, 18);
}

function drawFloor(col, row) {
  const x = col * TILE;
  const y = row * TILE;
  ctx.fillStyle = (col + row) % 2 === 0 ? C.floor1 : C.floor2;
  ctx.fillRect(x, y, TILE, TILE);
  ctx.strokeStyle = '#1e1e30';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
}

function drawCorridorTile(col, row) {
  const x = col * TILE;
  const y = row * TILE;
  ctx.fillStyle = (col + row) % 2 === 0 ? C.corridor1 : C.corridor2;
  ctx.fillRect(x, y, TILE, TILE);
  ctx.strokeStyle = '#1a1a2a';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
}

// N-Strokes cell floor (darker, dingier)
function drawNStrokesFloor(col, row) {
  const x = col * TILE;
  const y = row * TILE;
  ctx.fillStyle = (col + row) % 2 === 0 ? '#222230' : '#1e1e2c';
  ctx.fillRect(x, y, TILE, TILE);
  ctx.strokeStyle = '#181828';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
}

// Draw N-Strokes: chained against far wall, grey bucket hat, sitting
function drawNStrokes() {
  const nx = 21 * TILE;
  const ny = 8 * TILE - (SPR_H - TILE) / 2;

  // Chains from wall
  const wcx = nx + SPR_W / 2;
  const wcy = 8 * TILE + TILE / 2;
  ctx.strokeStyle = '#7a7a7a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(22 * TILE, wcy - 8);
  ctx.lineTo(wcx + 12, wcy - 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(22 * TILE, wcy + 6);
  ctx.lineTo(wcx + 12, wcy + 4);
  ctx.stroke();
  ctx.fillStyle = '#5a5a5a';
  ctx.fillRect(22 * TILE - 3, wcy - 10, 5, 4);
  ctx.fillRect(22 * TILE - 3, wcy + 4, 5, 4);

  drawSpriteFrame(SF.NS_IDLE, nx, ny);
}

// Corridor exit light (far right end)
function drawCorridorLight() {
  // Glow at far right of corridor suggesting daylight
  ctx.save();
  const gx = 22 * TILE;
  const gy = 1.5 * TILE;
  const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, TILE * 3);
  grad.addColorStop(0, 'rgba(255, 240, 200, 0.35)');
  grad.addColorStop(0.4, 'rgba(255, 240, 200, 0.15)');
  grad.addColorStop(1, 'rgba(255, 240, 200, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(19 * TILE, 0, 4 * TILE, 3 * TILE);

  // Bright slit on the east wall
  ctx.fillStyle = 'rgba(255, 245, 210, 0.5)';
  ctx.fillRect(22 * TILE - 2, 1 * TILE + 4, 4, 2 * TILE - 8);
  ctx.restore();
}

// Proximity prompt (stations + door)
function drawProximityHint() {
  if (popup.open) return;
  const pcol = Math.round(player.x / TILE);
  const prow = Math.round(player.y / TILE);

  // Exit
  if (pcol >= 20 && (prow === 1 || prow === 2)) {
    ctx.save();
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#f5d060';
    ctx.textAlign = 'center';
    ctx.fillText('[SPACE]', 21 * TILE, prow * TILE - 4);
    ctx.restore();
  }

  // Master door
  if (prow === PUZZLE_DOOR.nearRow && PUZZLE_DOOR.cols.some(c => Math.abs(pcol - c) <= 1)) {
    ctx.save();
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#e67e22';
    ctx.textAlign = 'center';
    ctx.fillText('[SPACE]', 12.5 * TILE + TILE / 2, PUZZLE_DOOR.nearRow * TILE - 4);
    ctx.restore();
  }

  // Beast vent (wire puzzle)
  if (Math.abs(pcol - WIRE.nearCol) <= 1 && Math.abs(prow - WIRE.nearRow) <= 1) {
    ctx.save();
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#e67e22';
    ctx.textAlign = 'center';
    ctx.fillText('[SPACE]', WIRE.nearCol * TILE + TILE / 2, WIRE.nearRow * TILE - 4);
    ctx.restore();
  }

  // Vent
  if (Math.abs(pcol - VENT.nearCol) <= 1 && Math.abs(prow - VENT.nearRow) <= 1) {
    ctx.save();
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#e67e22';
    ctx.textAlign = 'center';
    ctx.fillText('[SPACE]', VENT.nearCol * TILE + TILE / 2, VENT.nearRow * TILE - 4);
    ctx.restore();
  }

  // Stations (prompt persists after solving — terminal)
  for (const st of STATIONS) {
    if (Math.abs(pcol - st.nearCol) <= 1 && Math.abs(prow - st.nearRow) <= 1) {
      ctx.save();
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillStyle = '#e67e22';
      ctx.textAlign = 'center';
      ctx.fillText('[SPACE]', st.nearCol * TILE + TILE / 2, st.nearRow * TILE - 4);
      ctx.restore();
    }
  }
}

// --- Popup drawing ---

const POP = {
  bg:       '#c8c8d0',
  border:   '#5a5a6a',
  borderIn: '#9a9aaa',
  title:    '#8a3a00',
  flavor:   '#6a6a7a',
  text:     '#1a1a2a',
  input:    '#e0e0e8',
  inputBdr: '#8a3a00',
  cursor:   '#8a3a00',
  correct:  '#1a6a2a',
  wrong:    '#8a2020',
  code:     '#6a4a00',
  codeBg:   '#e8e0c8',
  codeBdr:  '#b09030',
  hint:     '#7a7a8a',
};

function drawPopup() {
  if (!popup.open) return;
  if (!popup.station && !popup.isVent && !popup.isLocked && !popup.isWire && !popup.isImage && !popup.isBeastChat && !popup.isWordleViz && !popup.isDoorMenu) return;

  // Beast cell chat cutscene — image + space-controlled dialogue
  if (popup.isBeastChat) {
    const line = popup.beastChatLines[popup.beastChatIndex];

    // Handle image transitions — check if PREVIOUS line had nextImage
    if (popup.beastChatIndex > 0) {
      const prev = popup.beastChatLines[popup.beastChatIndex - 1];
      if (prev && prev.nextImage === 'carol') popup.beastChatImg = beastCarolImg;
    }

    if (line && line.blackout) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.fillStyle = 'rgba(150,150,150,0.5)';
      ctx.textAlign = 'center';
      ctx.fillText('[SPACE]', W / 2, H / 2 + 20);
      ctx.restore();
      return;
    }

    // Draw current background image
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    const bgImg = popup.beastChatImg || beastCellImg;
    if (bgImg.complete && bgImg.naturalWidth > 0) {
      const imgAsp = bgImg.naturalWidth / bgImg.naturalHeight;
      const canAsp = W / H;
      let dw, dh;
      if (imgAsp > canAsp) { dw = W; dh = W / imgAsp; }
      else { dh = H; dw = H * imgAsp; }
      ctx.drawImage(bgImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
    }

    // Dialogue box — tall enough for 3 lines of text
    if (line && line.speaker) {
      const boxH = 90;
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(0, H - boxH, W, boxH);
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = line.speaker === 'The Beast' ? '#c0392b' : '#e0c080';
      ctx.fillText(line.speaker, W / 2, H - boxH + 14);
      ctx.fillStyle = '#ecf0f1';
      wrapText(emphText(line.text), W / 2, H - boxH + 32, W - 40, 14);
      ctx.restore();
    }
    ctx.save();
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillStyle = 'rgba(150,150,150,0.5)';
    ctx.textAlign = 'center';
    ctx.fillText('[SPACE]', W / 2, H - 2);
    ctx.restore();
    return;
  }

  // Full-screen image view
  if (popup.isImage) {
    const imgSrc = popup.imageOverride || beastVentImg;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    if (imgSrc.complete && imgSrc.naturalWidth > 0) {
      const imgAsp = imgSrc.naturalWidth / imgSrc.naturalHeight;
      const canAsp = W / H;
      let dw, dh;
      if (imgAsp > canAsp) { dw = W; dh = W / imgAsp; }
      else { dh = H; dw = H * imgAsp; }
      ctx.drawImage(imgSrc, (W - dw) / 2, (H - dh) / 2, dw, dh);
    }
    ctx.save();
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = 'rgba(200,200,200,0.6)';
    ctx.textAlign = 'center';
    ctx.fillText('[SPACE] or [ESC] to close', W / 2, H - 12);
    ctx.restore();
    return;
  }

  // Door menu
  if (popup.isDoorMenu) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    const mw = 280, mh = 150;
    const mx = (W - mw) / 2, my = (H - mh) / 2;
    ctx.fillStyle = '#c8c8d0';
    ctx.fillRect(mx, my, mw, mh);
    ctx.strokeStyle = '#5a5a6a'; ctx.lineWidth = 3;
    ctx.strokeRect(mx, my, mw, mh);
    ctx.save(); ctx.textAlign = 'center';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#1a1a2a';
    ctx.fillText('The Master Door', W / 2, my + 28);
    const btnW = 220, btnH = 30;
    const bx = (W - btnW) / 2;
    const opts = ['Master Puzzle', 'Wordle Visualizer'];
    menuBtns = [];
    for (let i = 0; i < opts.length; i++) {
      const by = my + 50 + i * 40;
      const sel = menuSel === i;
      ctx.fillStyle = sel ? '#4a6a8a' : '#3a4a5a';
      ctx.fillRect(bx, by, btnW, btnH);
      ctx.strokeStyle = sel ? '#6a9aca' : '#2a3a4a'; ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, btnW, btnH);
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.fillStyle = sel ? '#fff' : '#c0c8d0';
      ctx.fillText(opts[i], W / 2, by + 20);
      menuBtns.push({ x: bx, y: by, w: btnW, h: btnH });
    }
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#7a7a8a';
    ctx.fillText('ESC to close', W / 2, my + mh - 12);
    ctx.restore();
    return;
  }

  // Wordle Visualizer
  if (popup.isWordleViz) {
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.textAlign = 'center';

    const tileS = 36, gap = 5;
    const wColors = { G: '#538d4e', Y: '#b59f3b', X: '#787c7e', _: '#3a3a4a' };

    if (wordleViz.settingAnswer) {
      // === SETTING ANSWER WORD ===
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillStyle = '#c8c8d0';
      ctx.fillText('Enter a solution word (5 letters)', W / 2, 50);

      const ax = W / 2 - ((5 * (tileS + gap)) - gap) / 2;
      const inp = wordleViz.answerInput.padEnd(5, ' ');
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = inp[i] !== ' ' ? '#4a5a6a' : '#3a3a4a';
        ctx.fillRect(ax + i * (tileS + gap), 70, tileS, tileS);
        ctx.strokeStyle = '#6a6a7a'; ctx.lineWidth = 2;
        ctx.strokeRect(ax + i * (tileS + gap), 70, tileS, tileS);
        if (inp[i] !== ' ') {
          ctx.font = '16px "Press Start 2P", monospace';
          ctx.fillStyle = '#fff';
          ctx.fillText(inp[i], ax + i * (tileS + gap) + tileS / 2, 70 + tileS / 2 + 6);
        }
      }
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = '#7a7a8a';
      ctx.fillText('Press ENTER or SPACE to confirm', W / 2, 130);
      ctx.fillStyle = '#4a4a5a';
      ctx.fillText('[ESC] to close', W / 2, H - 12);
      ctx.restore();
      return;
    }

    // === MAIN VISUALIZER ===
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#c8c8d0';
    if (wordleViz.mode === 'test') {
      wrapText('If ANGER were the answer, some guess would have to make this pattern. Does such a guess exist?', W / 2, 22, W - 60, 13);
      const tpx = W / 2 - ((5 * (tileS + gap)) - gap) / 2;
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = wColors[wordleViz.targetPattern[i]];
        ctx.fillRect(tpx + i * (tileS + gap), 42, tileS, tileS);
      }
    } else {
      ctx.fillText('Wordle Visualizer', W / 2, 30);
    }

    // Answer display
    ctx.font = '11px "Press Start 2P", monospace';
    ctx.fillStyle = '#8a8a9a';
    ctx.fillText('Answer: ' + (wordleViz.answer || '?????'), W / 2, 105);

    // Guess tiles
    const guess = wordleViz.guess.padEnd(5, ' ');
    const pattern = (wordleViz.guess.length === 5 && wordleViz.answer.length === 5)
      ? computeWordlePattern(wordleViz.answer, wordleViz.guess) : null;
    const gx = W / 2 - ((5 * (tileS + gap)) - gap) / 2;
    const gy = 120;
    for (let i = 0; i < 5; i++) {
      const letter = guess[i];
      const col = (pattern && i < wordleViz.guess.length) ? pattern[i] : '_';
      ctx.fillStyle = wColors[col];
      ctx.fillRect(gx + i * (tileS + gap), gy, tileS, tileS);
      ctx.strokeStyle = '#5a5a6a'; ctx.lineWidth = 2;
      ctx.strokeRect(gx + i * (tileS + gap), gy, tileS, tileS);
      if (letter !== ' ') {
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText(letter, gx + i * (tileS + gap) + tileS / 2, gy + tileS / 2 + 6);
      }
    }

    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#7a7a8a';
    if (wordleViz.guess.length === 5) {
      ctx.fillText('ENTER to clear and try another guess.', W / 2, gy + tileS + 24);
    } else {
      ctx.fillText('Type a 5-letter guess. Backspace to clear.', W / 2, gy + tileS + 24);
    }

    menuBtns = [];
    if (wordleViz.mode === 'test') {
      ctx.font = '9px "Press Start 2P", monospace';
      const btnY = gy + tileS + 50;
      const testOpts = ['Yes, possible', 'No, impossible'];
      const testColors = [['#3a5a3a','#5a8a5a'],['#5a3a3a','#8a5a5a']];
      for (let i = 0; i < 2; i++) {
        const bx = i === 0 ? W / 2 - 170 : W / 2 + 15;
        const sel = menuSel === i;
        ctx.fillStyle = sel ? testColors[i][1] : testColors[i][0];
        ctx.fillRect(bx, btnY, 155, 30);
        ctx.strokeStyle = sel ? '#fff' : '#2a2a2a'; ctx.lineWidth = 2;
        ctx.strokeRect(bx, btnY, 155, 30);
        ctx.fillStyle = sel ? '#fff' : '#c0c0c0';
        ctx.fillText(testOpts[i], bx + 77, btnY + 20);
        menuBtns.push({ x: bx, y: btnY, w: 155, h: 30 });
      }
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = '#5a5a6a';
      ctx.fillText('Can a real word make this exact pattern?', W / 2, btnY + 52);
    } else {
      ctx.font = '9px "Press Start 2P", monospace';
      const btnY = gy + tileS + 50;
      const bx = W / 2 - 110, bw = 220;
      ctx.fillStyle = '#3a4a5a';
      ctx.fillRect(bx, btnY, bw, 28);
      ctx.strokeStyle = '#5a6a7a'; ctx.lineWidth = 2;
      ctx.strokeRect(bx, btnY, bw, 28);
      ctx.fillStyle = '#d0d8e0';
      ctx.fillText('Change solution', W / 2, btnY + 19);
      menuBtns.push({ x: bx, y: btnY, w: bw, h: 28 });
    }

    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#4a4a5a';
    ctx.fillText('[ESC] to close', W / 2, H - 12);
    ctx.restore();
    return;
  }

  const st = popup.station;

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, W, H);

  const popW = Math.min(400, W - 80);
  const bx = (W - popW) / 2, by = 30, bw = popW, bh = H - 60;
  ctx.fillStyle = POP.bg;
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = POP.border;
  ctx.lineWidth = 3;
  ctx.strokeRect(bx, by, bw, bh);
  ctx.strokeStyle = POP.borderIn;
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 5, by + 5, bw - 10, bh - 10);

  ctx.save();
  ctx.textAlign = 'center';

  if (popup.isWire) {
    // ========= BEAST VENT / WIRE QUEST VIEW =========
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#8a6a20';
    ctx.fillText('~ Through the grate ~', W / 2, by + 28);

    if (WIRE.stage <= 1) {
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.fillStyle = POP.text;
      wrapText('You peer through the grate. Pitch black. You can\'t see anything.', W / 2, by + 60, bw - 40, 15);
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = POP.hint;
      ctx.fillText('[SPACE] to close', W / 2, by + bh - 16);
    } else if (WIRE.stage === 2 || WIRE.stage === 3) {
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.fillStyle = POP.text;
      wrapText('The light spills through. You can see into a dark chamber. Something is moving in there.', W / 2, by + 55, bw - 40, 14);
      wrapText('On the far side \u2014 a door, with some kind of electrical switch.', W / 2, by + 110, bw - 40, 14);
      ctx.fillStyle = POP.flavor;
      wrapText('Maybe N-Strokes would know what to do.', W / 2, by + 155, bw - 40, 14);
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = POP.hint;
      ctx.fillText('[SPACE] to close', W / 2, by + bh - 16);
    } else if (WIRE.animating) {
      // Show animation lines during wire threading
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.fillStyle = POP.text;
      let aty = by + 50;
      for (let i = 0; i <= WIRE.animFrame && i < WIRE.animLines.length; i++) {
        wrapText(WIRE.animLines[i], W / 2, aty, bw - 40, 14); aty += 26;
      }
    } else if (WIRE.stage === 4) {
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.fillStyle = POP.text;
      wrapText('You study the gap between the light terminal and the door switch.', W / 2, by + 52, bw - 40, 13);
      ctx.fillStyle = '#8a6a20';
      wrapText('Horizontal: 3 square-lengths. Vertical: 4 square-lengths. The wire must go diagonally, held taut.', W / 2, by + 95, bw - 40, 13);
      ctx.fillStyle = POP.text;
      wrapText('How many square-lengths should N-Strokes cut?', W / 2, by + 150, bw - 40, 13);
      const inputY = by + bh - 80;
      ctx.fillStyle = POP.input;
      ctx.fillRect(W / 2 - 60, inputY, 120, 24);
      ctx.strokeStyle = '#8a6a20'; ctx.lineWidth = 2;
      ctx.strokeRect(W / 2 - 60, inputY, 120, 24);
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillStyle = POP.text;
      ctx.fillText(popup.answer, W / 2, inputY + 17);
      if (Math.floor(Date.now() / 500) % 2 === 0) {
        const tw = ctx.measureText(popup.answer).width;
        ctx.fillStyle = '#8a6a20';
        ctx.fillRect(W / 2 + tw / 2 + 2, inputY + 5, 8, 14);
      }
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = '#8a2020';
      ctx.fillText('ONE CHANCE. No retries.', W / 2, by + bh - 36);
      ctx.fillStyle = POP.hint;
      ctx.fillText('ENTER submit \u00B7 ESC close', W / 2, by + bh - 16);
    } else if (WIRE.animFrame < WIRE.animLines.length) {
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.fillStyle = POP.text;
      let aty = by + 50;
      for (let i = 0; i <= WIRE.animFrame && i < WIRE.animLines.length; i++) {
        wrapText(WIRE.animLines[i], W / 2, aty, bw - 40, 14); aty += 26;
      }
    } else {
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.fillStyle = popup.feedbackColor;
      wrapText(popup.feedback, W / 2, by + 70, bw - 40, 16);
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = POP.hint;
      ctx.fillText('[SPACE] to close', W / 2, by + bh - 16);
    }

  } else if (popup.isLocked) {
    // ========= LOCKED VIEW =========
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = '#8a2020';
    ctx.fillText(st ? st.name : 'LOCKED', W / 2, by + 34);

    ctx.font = '9px "Press Start 2P", monospace';
    ctx.fillStyle = POP.text;
    wrapText('You will not be able to complete the game, though you can complete other puzzles and collect additional codes.', W / 2, by + 70, bw - 50, 16);

    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = POP.hint;
    ctx.fillText('[SPACE] to close', W / 2, by + bh - 16);

  } else if (popup.isVent) {
    // ========= VENT / N-STROKES DIALOGUE =========
    const pg = popup.ventPages[popup.ventPage];
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#5a8a5a';
    ctx.fillText('~ Through the vent ~', W / 2, by + 28);
    ctx.font = '11px "Press Start 2P", monospace';
    ctx.fillStyle = pg.speaker === 'N-Strokes' ? '#3a7a3a' : '#b08030';
    ctx.fillText(pg.speaker, W / 2, by + 54);
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.fillStyle = POP.text;
    wrapText(emphText(pg.text), W / 2, by + 80, bw - 40, 15);
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = POP.hint;
    ctx.fillText(popup.ventPage < popup.ventPages.length - 1 ? '[SPACE] to continue' : '[SPACE] to close', W / 2, by + bh - 16);

  } else if (popup.isDoor && doorPage === 0) {
    // ========= MASTER DOOR PAGE 1: Navier-Stokes =========
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = '#8a2020';
    ctx.fillText(st.name, W / 2, by + 34);

    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = POP.flavor;
    wrapText(st.flavor, W / 2, by + 56, bw - 50, 14);

    ctx.font = '9px "Press Start 2P", monospace';
    ctx.fillStyle = POP.text;
    const dlines = st.inscription.split('\n');
    let dty = by + 90;
    for (const line of dlines) {
      wrapText(line, W / 2, dty, bw - 50, 15);
      dty += Math.ceil(ctx.measureText(line).width / (bw - 50)) * 15 + 6;
    }

    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = POP.flavor;
    wrapText('"...On second thought, I have been waiting a century for someone to solve this and I grow impatient. Perhaps you deserve something more your speed."', W / 2, by + bh - 70, bw - 40, 13);

    ctx.fillStyle = POP.hint;
    ctx.fillText('[SPACE] to continue', W / 2, by + bh - 16);

  } else if (popup.isDoor && doorPage === 1) {
    // ========= MASTER DOOR PAGE 2: Wordle puzzle =========
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#8a6a20';
    ctx.fillText('The Master Door', W / 2, by + 28);

    // Draw Wordle rows
    const tileS = 22, gap = 4;
    const colors = { G: '#538d4e', Y: '#b59f3b', X: '#787c7e' };
    // Row 1
    const r1 = st.wordleRow1;
    const r1x = W / 2 - ((r1.length * (tileS + gap)) - gap) / 2;
    for (let i = 0; i < r1.length; i++) {
      ctx.fillStyle = colors[r1[i]];
      ctx.fillRect(r1x + i * (tileS + gap), by + 44, tileS, tileS);
    }
    // Row 2
    const r2 = st.wordleRow2;
    const r2x = W / 2 - ((r2.length * (tileS + gap)) - gap) / 2;
    for (let i = 0; i < r2.length; i++) {
      ctx.fillStyle = colors[r2[i]];
      ctx.fillRect(r2x + i * (tileS + gap), by + 44 + tileS + gap, tileS, tileS);
    }

    // Flavor
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = POP.flavor;
    wrapText('"Deduce the word. Even a child could do it."', W / 2, by + 110, bw - 40, 13);

    if (PUZZLE_DOOR.wordleSolved) {
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillStyle = '#1a6a2a';
      ctx.fillText('SOLVED: ' + PUZZLE_DOOR.wordleAnswer.toUpperCase(), W / 2, by + bh - 60);
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = POP.hint;
      ctx.fillText('[SPACE] to close', W / 2, by + bh - 16);
    } else if (PUZZLE_DOOR.wordleLocked) {
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = '#8a2020';
      wrapText('The lock seals. The Puzzlemaster has lost patience.', W / 2, by + bh - 60, bw - 40, 13);
      ctx.fillStyle = POP.hint;
      ctx.fillText('[SPACE] to close', W / 2, by + bh - 16);
    } else {
      // Input
      const inputY = by + bh - 90;
      ctx.fillStyle = POP.input;
      ctx.fillRect(W / 2 - 80, inputY, 160, 24);
      ctx.strokeStyle = '#8a6a20';
      ctx.lineWidth = 2;
      ctx.strokeRect(W / 2 - 80, inputY, 160, 24);
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillStyle = POP.text;
      ctx.fillText(popup.answer, W / 2, inputY + 17);
      if (Math.floor(Date.now() / 500) % 2 === 0) {
        const tw = ctx.measureText(popup.answer).width;
        ctx.fillStyle = '#8a6a20';
        ctx.fillRect(W / 2 + tw / 2 + 2, inputY + 5, 8, 14);
      }
      if (popup.feedback) {
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillStyle = popup.feedbackColor;
        wrapText(popup.feedback, W / 2, inputY + 44, bw - 40, 13);
      }
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = POP.hint;
      ctx.fillText('ENTER submit \u00B7 ESC close', W / 2, by + bh - 16);
    }

  } else if (popup.solvedView) {
    // ========= TERMINAL / CODE VIEW =========
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = POP.title;
    ctx.fillText('Terminal', W / 2, by + 34);

    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = POP.flavor;
    ctx.fillText('Your current save code:', W / 2, by + 64);

    ctx.font = '24px "Press Start 2P", monospace';
    ctx.fillStyle = POP.code;
    ctx.fillText(popup.saveCode || '---', W / 2, by + 100);

    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = POP.text;
    ctx.fillText('Write this down.', W / 2, by + 130);

    ctx.fillStyle = POP.hint;
    ctx.fillText('[SPACE] to close', W / 2, by + bh - 16);

  } else {
    // ========= INPUT VIEW =========
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = POP.title;
    ctx.fillText(st.name, W / 2, by + 34);

    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = POP.flavor;
    wrapText(st.flavor, W / 2, by + 56, bw - 60, 14);

    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = POP.text;
    const lines = st.inscription.split('\n');
    let ty = by + 90;
    for (const line of lines) {
      wrapText(line, W / 2, ty, bw - 60, 16);
      ty += Math.ceil(ctx.measureText(line).width / (bw - 60)) * 16 + 8;
    }

    const inputY = by + bh - 90;
    ctx.fillStyle = POP.input;
    ctx.fillRect(W / 2 - 80, inputY, 160, 24);
    ctx.strokeStyle = POP.inputBdr;
    ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - 80, inputY, 160, 24);

    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = POP.text;
    const answerText = popup.answer;
    ctx.fillText(answerText, W / 2, inputY + 17);

    if (Math.floor(Date.now() / 500) % 2 === 0) {
      const textW = ctx.measureText(answerText).width;
      ctx.fillStyle = POP.cursor;
      ctx.fillRect(W / 2 + textW / 2 + 2, inputY + 5, 8, 14);
    }

    if (popup.feedback) {
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = popup.feedbackColor;
      wrapText(popup.feedback, W / 2, inputY + 44, bw - 60, 14);
    }

    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = POP.hint;
    ctx.fillText('ENTER submit \u00B7 ESC close', W / 2, by + bh - 16);
  }

  ctx.restore();
}

// Convert *text* to TEXT (all caps emphasis)
function emphText(text) {
  return text.replace(/\*([^*]+)\*/g, (_, m) => m.toUpperCase());
}

function wrapText(text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let curY = y;
  for (const word of words) {
    const test = line + (line ? ' ' : '') + word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, curY);
      line = word;
      curY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, curY);
}

// --- Harry Bonds sprite ---

let facing = 'down';
let walkFrame = 0;
let walkTimer = 0;

function drawPlayer() {
  walkTimer++;
  if (walkTimer > 10) { walkTimer = 0; walkFrame = 1 - walkFrame; }
  const moving = keys['ArrowUp'] || keys['ArrowDown'] || keys['ArrowLeft'] || keys['ArrowRight']
              || keys['w'] || keys['s'] || keys['a'] || keys['d'];
  if (!moving) walkFrame = 0;

  // Pick frame: down has 2 real frames, others use single frame + bob
  const dirFrame = {
    down:  SF.HB_FRONT,
    up:    SF.HB_BACK,
    left:  SF.HB_RIGHT,
    right: SF.HB_LEFT,
  };
  let fi = dirFrame[facing] || SF.HB_FRONT;
  // Down direction: alternate between front and front_walk sprites
  if (facing === 'down' && moving && walkFrame === 1) fi = SF.HB_FRONT_WALK;
  // Walk effect: vertical bob + horizontal sway for non-down directions
  const bobOffset = (moving && walkFrame === 1) ? -1 : 0;
  const swayOffset = (facing !== 'down' && moving && walkFrame === 1) ? 1 : 0;
  const sx = player.x + swayOffset;
  const sy = player.y - (SPR_H - TILE) / 2 + bobOffset;
  drawSpriteFrame(fi, sx, sy);
}

// --- Light beams & Beast ---

// Beast cell: cols 1-6, rows 4-11
const BEAST_LEFT   = 1 * TILE;
const BEAST_RIGHT  = 7 * TILE;
const BEAST_TOP    = 3 * TILE;
const BEAST_BOTTOM = 12 * TILE;
const BEAST_CX     = (BEAST_LEFT + BEAST_RIGHT) / 2;
const BEAST_CY     = (BEAST_TOP + BEAST_BOTTOM) / 2;

// Light fixture on inner face of right wall of beast cell (col 7)
const LIGHT_X = 7 * TILE;
const CONE_END_X = BEAST_CX;
const CONE_SPREAD = TILE * 1.5;

let beastStir = 0;
let beastStirDir = 1;

function getLightY(st) {
  return st.lightRow * TILE + TILE / 2;
}

function triggerBeastStir() {
  beastStir = 60;
}

// Wire puzzle contact points and solved wire
function drawWireContactPoints() {
  const pA = WIRE.pointA;
  const pB = WIRE.pointB;

  // Contact point A: small metal plate on wall
  ctx.fillStyle = '#5a5a6a';
  ctx.fillRect(pA.x - 5, pA.y - 3, 5, 6);
  ctx.fillStyle = '#8a8a9a';
  ctx.fillRect(pA.x - 4, pA.y - 2, 3, 4);

  // Contact point B: terminal near beast door
  ctx.fillStyle = '#5a5a6a';
  ctx.fillRect(pB.x - 3, pB.y - 3, 6, 6);
  ctx.fillStyle = '#8a8a9a';
  ctx.fillRect(pB.x - 2, pB.y - 2, 4, 4);

  // If solved, draw glowing wire diagonally
  if (WIRE.stage >= 5 && WIRE.stage !== 6) {
    ctx.save();
    ctx.strokeStyle = '#e6a832';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#e6a832';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(pA.x, pA.y);
    ctx.lineTo(pB.x, pB.y);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Glow around wire area
    ctx.save();
    const midX = (pA.x + pB.x) / 2;
    const midY = (pA.y + pB.y) / 2;
    const glow = ctx.createRadialGradient(midX, midY, 0, midX, midY, TILE * 2);
    glow.addColorStop(0, 'rgba(230, 168, 50, 0.1)');
    glow.addColorStop(1, 'rgba(230, 168, 50, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(midX - TILE*2, midY - TILE*2, TILE*4, TILE*4);
    ctx.restore();
  }

  // If near the vent and unsolved, show distance labels
  if (WIRE.stage <= 4) {
    const pcol = Math.round(player.x / TILE);
    const prow = Math.round(player.y / TILE);
    if (Math.abs(pcol - WIRE.nearCol) <= 2 && Math.abs(prow - WIRE.nearRow) <= 2) {
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.4)';
      ctx.lineWidth = 1;
      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(pB.x, pA.y);
      ctx.lineTo(pA.x, pA.y);
      ctx.stroke();
      // Vertical line
      ctx.beginPath();
      ctx.moveTo(pB.x, pB.y);
      ctx.lineTo(pB.x, pA.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Distance labels
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillStyle = 'rgba(230, 200, 150, 0.7)';
      ctx.textAlign = 'center';
      ctx.fillText('3', (pB.x + pA.x) / 2, pA.y - 6);
      ctx.fillText('4', pB.x - 12, (pB.y + pA.y) / 2 + 4);
      ctx.restore();
    }
  }
}

function drawBeastCellDarkness() {
  const lights = [];
  for (const st of STATIONS) {
    if (st.solved) lights.push({ x: LIGHT_X, y: st.lightRow * TILE + TILE / 2 });
  }
  if (WIRE.stage >= 5 && WIRE.stage !== 6) lights.push({ x: LIGHT_X, y: WIRE.lightRow * TILE + TILE / 2 });

  const darkTop = 4 * TILE;
  const darkH = BEAST_BOTTOM - darkTop;
  const darkW = BEAST_RIGHT - BEAST_LEFT;

  ctx.save();
  ctx.beginPath();
  ctx.rect(BEAST_LEFT, darkTop, darkW, darkH);
  ctx.clip();

  if (lights.length === 0) {
    ctx.fillStyle = '#050510';
    ctx.fillRect(BEAST_LEFT, darkTop, darkW, darkH);
  } else {
    // Use an offscreen canvas to build the darkness mask
    if (!drawBeastCellDarkness._off) {
      drawBeastCellDarkness._off = document.createElement('canvas');
    }
    const off = drawBeastCellDarkness._off;
    off.width = darkW;
    off.height = darkH;
    const oc = off.getContext('2d');

    // Fill with near-black
    oc.fillStyle = 'rgba(5, 5, 16, 0.93)';
    oc.fillRect(0, 0, darkW, darkH);

    // Punch holes near each light
    oc.globalCompositeOperation = 'destination-out';
    for (const l of lights) {
      const lx = l.x - BEAST_LEFT;
      const ly = l.y - darkTop;
      const r = TILE * 3.5;
      const grad = oc.createRadialGradient(lx, ly, 0, lx, ly, r);
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(0.3, 'rgba(0,0,0,0.8)');
      grad.addColorStop(0.6, 'rgba(0,0,0,0.3)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      oc.fillStyle = grad;
      oc.fillRect(lx - r, ly - r, r * 2, r * 2);
    }
    oc.globalCompositeOperation = 'source-over';

    // Draw the mask onto the main canvas
    ctx.drawImage(off, BEAST_LEFT, darkTop);
  }

  ctx.restore();
}

function drawLightBeams() {
  // Collect all light rows from solved stations + wire puzzle
  const lightRows = [];
  for (const st of STATIONS) {
    if (st.solved) lightRows.push(st.lightRow);
  }
  if (WIRE.stage >= 5 && WIRE.stage !== 6) lightRows.push(WIRE.lightRow);

  for (const lr of lightRows) {
    const ly = lr * TILE + TILE / 2;

    const fx = LIGHT_X - 2;
    ctx.fillStyle = '#8a6a30';
    ctx.fillRect(fx - 4, ly - 6, 6, 12);
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(fx - 6, ly - 4, 5, 8);
    ctx.fillStyle = '#f5d060';
    ctx.fillRect(fx - 5, ly - 2, 3, 4);

    ctx.save();
    const halo = ctx.createRadialGradient(fx - 4, ly, 2, fx - 4, ly, TILE);
    halo.addColorStop(0, 'rgba(245, 208, 96, 0.3)');
    halo.addColorStop(1, 'rgba(245, 208, 96, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(fx - TILE, ly - TILE, TILE * 2, TILE * 2);
    ctx.restore();

    // Spotlight: ice cream scoop shape (cone + arc bulging left)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(LIGHT_X, ly);
    ctx.lineTo(CONE_END_X, ly - CONE_SPREAD);
    ctx.arc(CONE_END_X, ly, CONE_SPREAD, -Math.PI / 2, Math.PI / 2, true);
    ctx.closePath();

    const grad = ctx.createLinearGradient(LIGHT_X, ly, CONE_END_X - CONE_SPREAD, ly);
    grad.addColorStop(0, 'rgba(230, 160, 50, 0.5)');
    grad.addColorStop(0.4, 'rgba(230, 160, 50, 0.25)');
    grad.addColorStop(1, 'rgba(230, 160, 50, 0.06)');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  }
}

function drawBeast() {
  // Don't draw if beast has escaped
  if (WIRE.stage >= 7) return;
  if (WIRE.stage === 5 && !beastScene.active) return;

  // During cutscene, draw without clipping (beast is moving freely)
  const inCutscene = beastScene.active;

  if (!inCutscene) {
    // Normal mode: need lights to see beast
    const lightRows = [];
    for (const st of STATIONS) {
      if (st.solved) lightRows.push(st.lightRow);
    }
    if (WIRE.stage >= 5 && WIRE.stage !== 6) lightRows.push(WIRE.lightRow);
    if (lightRows.length === 0) return;

    // Clip to spotlight cones
    ctx.save();
    ctx.beginPath();
    for (const lr of lightRows) {
      const ly = lr * TILE + TILE / 2;
      ctx.moveTo(LIGHT_X, ly);
      ctx.lineTo(CONE_END_X, ly - CONE_SPREAD);
      ctx.arc(CONE_END_X, ly, CONE_SPREAD, -Math.PI / 2, Math.PI / 2, true);
      ctx.closePath();
    }
    ctx.clip();
  } else {
    ctx.save();
  }

  let shakeX = 0;
  if (beastStir > 0) {
    beastStir--;
    const intensity = beastStir / 60;
    shakeX = Math.sin(beastStir * 0.8) * 3 * intensity;
  }

  // Apply cutscene offset or stir shake
  const offX = inCutscene ? beastScene.beastX : shakeX;
  const offY = inCutscene ? beastScene.beastY : 0;
  ctx.translate(offX, offY);

  // Rotate 90° CW when beast is in corridor (head-first going right)
  if (inCutscene && beastScene.rotated) {
    ctx.translate(BEAST_CX, BEAST_CY);
    ctx.rotate(Math.PI / 2);
    ctx.translate(-BEAST_CX, -BEAST_CY);
  }

  // The Beast fills rows 4-11 of beast cell
  const p = 3;
  const cx = BEAST_CX;
  const top = BEAST_TOP + TILE;

  // === HORNS ===
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(cx - 8*p, top + 0*p, 2*p, 5*p);
  ctx.fillRect(cx - 9*p, top - 1*p, 2*p, 2*p);
  ctx.fillRect(cx + 6*p, top + 0*p, 2*p, 5*p);
  ctx.fillRect(cx + 7*p, top - 1*p, 2*p, 2*p);

  // === HEAD ===
  ctx.fillStyle = '#2a1a3a';
  ctx.fillRect(cx - 7*p, top + 4*p, 14*p, 9*p);
  ctx.fillStyle = '#3a2a4a';
  ctx.fillRect(cx - 6*p, top + 4*p, 12*p, 2*p);

  // Eyes
  ctx.fillStyle = '#1a0000';
  ctx.fillRect(cx - 5*p, top + 7*p, 3*p, 2*p);
  ctx.fillRect(cx + 2*p, top + 7*p, 3*p, 2*p);
  ctx.fillStyle = '#aa0000';
  ctx.fillRect(cx - 4*p, top + 7*p, 1*p, 1*p);
  ctx.fillRect(cx + 3*p, top + 7*p, 1*p, 1*p);

  // Nostrils
  ctx.fillStyle = '#1a0a1a';
  ctx.fillRect(cx - 1*p, top + 10*p, 1*p, 1*p);
  ctx.fillRect(cx + 1*p, top + 10*p, 1*p, 1*p);

  // Jaw + teeth
  ctx.fillStyle = '#1a0a2a';
  ctx.fillRect(cx - 6*p, top + 12*p, 12*p, 3*p);
  ctx.fillStyle = '#8a8a7a';
  for (let i = -4; i <= 3; i += 2) {
    ctx.fillRect(cx + i*p, top + 12*p, 1*p, 2*p);
  }

  // === NECK ===
  ctx.fillStyle = '#2a1a3a';
  ctx.fillRect(cx - 5*p, top + 15*p, 10*p, 5*p);

  // === SHOULDERS ===
  ctx.fillStyle = '#2a1a3a';
  ctx.fillRect(cx - 9*p, top + 20*p, 18*p, 10*p);
  ctx.fillStyle = '#3a2a4a';
  ctx.fillRect(cx - 9*p, top + 20*p, 3*p, 2*p);
  ctx.fillRect(cx + 6*p, top + 20*p, 3*p, 2*p);

  // Spines
  ctx.fillStyle = '#4a3a5a';
  for (let i = 0; i < 16; i++) {
    ctx.fillRect(cx - 1*p, top + (20 + i*3)*p, 2*p, 2*p);
  }

  // === TORSO ===
  ctx.fillStyle = '#251535';
  ctx.fillRect(cx - 8*p, top + 30*p, 16*p, 14*p);
  ctx.fillStyle = '#1a0a2a';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(cx - 6*p, top + (32 + i*3)*p, 12*p, 1*p);
  }

  // === ARMS ===
  ctx.fillStyle = '#2a1a3a';
  ctx.fillRect(cx - 11*p, top + 22*p, 3*p, 12*p);
  ctx.fillRect(cx + 8*p, top + 22*p, 3*p, 12*p);
  ctx.fillStyle = '#4a3a2a';
  ctx.fillRect(cx - 12*p, top + 33*p, 2*p, 3*p);
  ctx.fillRect(cx - 10*p, top + 34*p, 2*p, 3*p);
  ctx.fillRect(cx + 10*p, top + 33*p, 2*p, 3*p);
  ctx.fillRect(cx + 8*p, top + 34*p, 2*p, 3*p);

  // === BELLY ===
  ctx.fillStyle = '#1e1030';
  ctx.fillRect(cx - 7*p, top + 44*p, 14*p, 8*p);

  // === LEGS ===
  ctx.fillStyle = '#2a1a3a';
  ctx.fillRect(cx - 8*p, top + 50*p, 5*p, 12*p);
  ctx.fillRect(cx + 3*p, top + 50*p, 5*p, 12*p);
  ctx.fillStyle = '#3a2a4a';
  ctx.fillRect(cx - 7*p, top + 56*p, 3*p, 2*p);
  ctx.fillRect(cx + 4*p, top + 56*p, 3*p, 2*p);

  // === FEET ===
  ctx.fillStyle = '#1a0a2a';
  ctx.fillRect(cx - 10*p, top + 61*p, 7*p, 3*p);
  ctx.fillRect(cx + 3*p, top + 61*p, 7*p, 3*p);
  ctx.fillStyle = '#4a3a2a';
  ctx.fillRect(cx - 11*p, top + 63*p, 2*p, 2*p);
  ctx.fillRect(cx - 8*p, top + 64*p, 2*p, 2*p);
  ctx.fillRect(cx + 7*p, top + 64*p, 2*p, 2*p);
  ctx.fillRect(cx + 9*p, top + 63*p, 2*p, 2*p);

  ctx.restore();
}

// --- Update & Render ---

function update() {
  if (beastScene.active) {
    updateBeastScene();
    // Allow player movement during dialogue-only steps (beast off screen)
    const step = beastScene.steps[beastScene.stepIndex];
    if (step && step.text && beastScene.phase === 'pause') {
      // Fall through to player movement
    } else {
      return;
    }
  }
  if (popup.open || paused || victoryScreen) return;

  let nx = player.x;
  let ny = player.y;

  if (keys['ArrowUp']    || keys['w']) { ny -= player.speed; facing = 'up'; }
  if (keys['ArrowDown']  || keys['s']) { ny += player.speed; facing = 'down'; }
  if (keys['ArrowLeft']  || keys['a']) { nx -= player.speed; facing = 'left'; }
  if (keys['ArrowRight'] || keys['d']) { nx += player.speed; facing = 'right'; }

  if (canMove(nx, player.y)) player.x = nx;
  if (canMove(player.x, ny)) player.y = ny;
}

function render() {
  ctx.clearRect(0, 0, W, H);

  // Draw all tiles
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = MAP[r][c];
      if (t === 3) {
        // Draw floor underneath (visible near spotlights)
        drawFloor(c, r);
      } else if (t === 4) {
        drawCorridorTile(c, r);
      } else if (t === 5) {
        drawNStrokesFloor(c, r);
      } else if (t === 6) {
        drawDoor(c, r, '#5a5a6a');
      } else if (t === 7) {
        drawDoor(c, r, '#8a6a30');
      } else if (t === 8) {
        drawWall(c * TILE, r * TILE);
        drawVent(c, r);
      } else if (t === 1 || t === 2) {
        drawWall(c * TILE, r * TILE);
      } else {
        drawFloor(c, r);
      }
    }
  }

  // Corridor exit daylight
  drawCorridorLight();

  // Beast cell darkness overlay (floor tiles visible near spotlights)
  drawBeastCellDarkness();

  // Beast
  drawBeast();
  drawLightBeams();
  drawWireContactPoints();

  // Stations
  for (const st of STATIONS) {
    drawStation(st);
  }

  // N-Strokes
  drawNStrokes();

  drawBeastScene();
  drawProximityHint();
  drawPlayer();
  drawPopup();
  drawPauseMenu();
  drawCodeFlash();
  drawSpriteTest();
  drawVictory();
}

function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

loop();
