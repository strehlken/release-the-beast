// Release the Beast — Canvas tile map + sprite movement

const TILE = 32;
const COLS = 23;
const ROWS = 13;
const W = COLS * TILE;
const H = ROWS * TILE;

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
  [ 1,1,1,6,1,1,1,1,1,1,1,1,7,7,1,1,1,1,1,1,6,1,1], // 3
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
const WIRE_PUZZLE = {
  // Beast-side vent on the shared wall
  ventCol: 7, ventRow: 8,
  nearCol: 8, nearRow: 8,   // Harry approaches from his cell
  // Contact points in beast cell (pixel coords)
  pointA: { x: 7 * 32, y: 8 * 32 },   // vent crack, top of row 8
  pointB: { x: 4 * 32, y: 4 * 32 },   // near beast door, col 4 row 4
  hDist: 3,  // horizontal brick-lengths
  vDist: 4,  // vertical brick-lengths
  answerHash: "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d", // "5"
  state: 'unsolved',  // unsolved, asking, animating, solved, failed
  animFrame: 0,
  animLines: [],
  lightRow: 5,  // light fixture row in beast cell when solved
};

// Big puzzle door on north wall (cols 12-13, row 3)
const PUZZLE_DOOR = {
  cols: [12, 13],
  row: 3,
  nearRow: 4,
  name: "The Master Door",
  inscription: "Let u be a smooth solution to the Navier\u2013Stokes equations in three dimensions.\nProve that u remains smooth for all time,\nor show a solution that develops a singularity\nfrom smooth initial data.",
  flavor: '"The Puzzlemaster\'s ultimate puzzle. Not even he knows if it can be solved."',
};

// Vent between Harry Bonds' cell and N-Strokes' cell
const VENT = {
  col: 18, row: 8,
  nearCol: 17, nearRow: 8,
};

const SAVE_SALT = "release-the-beast-2026";

async function generateSaveCode(station) {
  const raw = await sha256(station.name + '-' + station.answerHash + '-' + SAVE_SALT);
  const code = raw.substring(0, 8).toUpperCase();
  return code.substring(0, 4) + '-' + code.substring(4, 8);
}

// Player state (pixel coords)
const player = {
  x: 13 * TILE,
  y: 7 * TILE,
  size: 20,
  speed: 3,
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
};

// Pause menu
let paused = false;
let codesScreen = false;
let codeInput = '';
let codeMessage = '';
let codeMessageColor = '#1a6a2a';

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
  WIRE_PUZZLE.state = 'unsolved';
  WIRE_PUZZLE.animFrame = 0;
  WIRE_PUZZLE.animLines = [];
  cutscene.active = false;
  cutscene.wire = 'none';
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

  const btnW = 160, btnH = 28;
  const rx = (W - btnW) / 2;

  // Resume
  const ry = by + 55;
  ctx.fillStyle = '#3a5a3a';
  ctx.fillRect(rx, ry, btnW, btnH);
  ctx.strokeStyle = '#2a4a2a';
  ctx.lineWidth = 2;
  ctx.strokeRect(rx, ry, btnW, btnH);
  ctx.font = '10px "Press Start 2P", monospace';
  ctx.fillStyle = '#d0e0d0';
  ctx.fillText('RESUME', W / 2, ry + 19);
  resumeBtn = { x: rx, y: ry, w: btnW, h: btnH };

  // Insert Codes
  const cy = by + 100;
  ctx.fillStyle = '#3a4a5a';
  ctx.fillRect(rx, cy, btnW, btnH);
  ctx.strokeStyle = '#2a3a4a';
  ctx.lineWidth = 2;
  ctx.strokeRect(rx, cy, btnW, btnH);
  ctx.fillStyle = '#d0d8e0';
  ctx.fillText('INSERT CODES', W / 2, cy + 19);
  codesBtn = { x: rx, y: cy, w: btnW, h: btnH };

  // Restart
  const rry = by + 145;
  ctx.fillStyle = '#6a2a2a';
  ctx.fillRect(rx, rry, btnW, btnH);
  ctx.strokeStyle = '#4a1a1a';
  ctx.lineWidth = 2;
  ctx.strokeRect(rx, rry, btnW, btnH);
  ctx.fillStyle = '#e0c0c0';
  ctx.fillText('RESTART', W / 2, rry + 19);
  restartBtn = { x: rx, y: rry, w: btnW, h: btnH };

  ctx.restore();
}

// Input
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.key] = true;

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
    if (paused) return;
    if (popup.open && (popup.solvedView || popup.isDoor || popup.isVent || popup.isLocked)) { closePopup(); return; }
    if (popup.open && popup.isWire && WIRE_PUZZLE.state !== 'asking') { closePopup(); return; }
    if (popup.open) return;

    const pcol = Math.round(player.x / TILE);
    const prow = Math.round(player.y / TILE);

    // Check master door
    if (prow === PUZZLE_DOOR.nearRow && PUZZLE_DOOR.cols.some(c => Math.abs(pcol - c) <= 1)) {
      openDoorPopup();
      return;
    }

    // Check beast wall vent (wire puzzle)
    if (Math.abs(pcol - WIRE_PUZZLE.nearCol) <= 1 && Math.abs(prow - WIRE_PUZZLE.nearRow) <= 1) {
      openWirePuzzle();
      return;
    }

    // Check vent
    if (Math.abs(pcol - VENT.nearCol) <= 1 && Math.abs(prow - VENT.nearRow) <= 1) {
      openVentPopup();
      return;
    }

    // Check stations
    for (const st of STATIONS) {
      if (Math.abs(pcol - st.nearCol) <= 1 && Math.abs(prow - st.nearRow) <= 1) {
        if (st.solved) {
          openSolvedPopup(st);
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
    if (popup.open) { closePopup(); return; }
    if (codesScreen) { codesScreen = false; return; }
    paused = !paused;
    return;
  }

  // Typing into popup
  if (popup.open && !popup.solvedView && !popup.isDoor && !popup.isVent && !popup.isLocked) {
    // Wire puzzle input
    if (popup.isWire && WIRE_PUZZLE.state === 'asking') {
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
}

function openVentPopup() {
  popup.open = true;
  popup.station = null;
  popup.isVent = true;
}

function openLockedPopup(station) {
  popup.open = true;
  popup.station = station;
  popup.isLocked = true;
}

function openWirePuzzle() {
  if (WIRE_PUZZLE.state === 'solved') {
    // Show completed state
    popup.open = true;
    popup.isWire = true;
    popup.feedback = 'The wire hums. The circuit holds.';
    popup.feedbackColor = '#1a6a2a';
    return;
  }
  if (WIRE_PUZZLE.state === 'failed') {
    popup.open = true;
    popup.isWire = true;
    popup.feedback = 'A spent wire hangs limp. Nothing can be done.';
    popup.feedbackColor = '#8a2020';
    return;
  }
  WIRE_PUZZLE.state = 'asking';
  popup.open = true;
  popup.isWire = true;
  popup.answer = '';
  popup.feedback = '';
}

// Wire cutscene state
const cutscene = {
  active: false,
  success: false,
  steps: [],
  stepIndex: 0,
  phase: 'walk',
  pauseTimer: 0,
  text: '',
  textColor: '#ecf0f1',
  wire: 'none', // none, nstrokes, passing, harry, threading, connected, failed
};

async function submitWireAnswer() {
  if (!popup.answer.trim()) return;
  const hash = await sha256(popup.answer.trim());
  const isCorrect = hash === WIRE_PUZZLE.answerHash;
  const givenAnswer = popup.answer.trim();

  // Close the popup, start the cutscene
  popup.open = false;
  popup.isWire = false;
  popup.answer = '';
  WIRE_PUZZLE.state = 'animating';

  // Waypoints: beast vent → N-Strokes vent → back to beast vent
  const beastVent = { x: WIRE_PUZZLE.nearCol * TILE, y: WIRE_PUZZLE.nearRow * TILE };
  const nstrokesVent = { x: VENT.nearCol * TILE, y: VENT.nearRow * TILE };

  const answer = isCorrect ? 'Five' : givenAnswer;
  cutscene.steps = [
    { target: beastVent, text: '"' + answer + ' brick-lengths," Harry Bonds says.', pause: 80, wire: 'none' },
    { target: nstrokesVent, text: '', pause: 0, wire: 'none' },
    { target: nstrokesVent, text: 'N-Strokes produces a coil of wire.', pause: 80, wire: 'nstrokes' },
    { target: nstrokesVent, text: 'He measures, cuts. Feeds it through the vent.', pause: 90, wire: 'passing' },
    { target: beastVent, text: '', pause: 0, wire: 'harry' },
    { target: beastVent, text: 'Harry Bonds feeds the wire through the crack...', pause: 90, wire: 'threading' },
  ];
  if (isCorrect) {
    cutscene.steps.push(
      { target: beastVent, text: 'It pulls taut. Reaches. Clicks into the terminal.', pause: 90, wire: 'connected' },
      { target: beastVent, text: 'A spark. A hum. The circuit holds.', pause: 120, wire: 'connected' },
      { target: beastVent, text: 'Deep in the darkness, something stirs.', pause: 120, wire: 'connected' },
    );
    cutscene.success = true;
  } else {
    cutscene.steps.push(
      { target: beastVent, text: 'The wire pulls taut and stops three inches short.', pause: 100, wire: 'failed' },
      { target: beastVent, text: 'A spark hits wet stone. Nothing.', pause: 100, wire: 'failed' },
      { target: beastVent, text: 'The wire is spent.', pause: 120, wire: 'failed' },
    );
    cutscene.success = false;
  }

  cutscene.active = true;
  cutscene.stepIndex = 0;
  cutscene.phase = 'walk';
  cutscene.pauseTimer = 0;
  cutscene.text = '';
  cutscene.wire = 'none';
}

function updateCutscene() {
  if (!cutscene.active) return;
  const step = cutscene.steps[cutscene.stepIndex];
  if (!step) { endCutscene(); return; }

  if (cutscene.phase === 'walk') {
    // Move player toward target
    const dx = step.target.x - player.x;
    const dy = step.target.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 3) {
      // Arrived — show text and pause
      player.x = step.target.x;
      player.y = step.target.y;
      cutscene.text = step.text;
      cutscene.textColor = '#ecf0f1';
      if (step.wire) cutscene.wire = step.wire;
      if (step.pause > 0) {
        cutscene.phase = 'pause';
        cutscene.pauseTimer = step.pause;
      } else {
        // No pause, advance immediately
        cutscene.stepIndex++;
        cutscene.phase = 'walk';
      }
    } else {
      // Walk toward target
      const speed = 2.5;
      player.x += (dx / dist) * speed;
      player.y += (dy / dist) * speed;
      // Update facing
      if (Math.abs(dx) > Math.abs(dy)) {
        facing = dx > 0 ? 'right' : 'left';
      } else {
        facing = dy > 0 ? 'down' : 'up';
      }
    }
  } else if (cutscene.phase === 'pause') {
    cutscene.pauseTimer--;
    if (cutscene.pauseTimer <= 0) {
      cutscene.stepIndex++;
      cutscene.phase = 'walk';
    }
  }
}

function endCutscene() {
  cutscene.active = false;
  if (cutscene.success) {
    WIRE_PUZZLE.state = 'solved';
    setTimeout(triggerBeastStir, 500);
  } else {
    WIRE_PUZZLE.state = 'failed';
  }
}

function drawCutsceneWire() {
  if (!cutscene.active) return;
  const w = cutscene.wire;
  if (w === 'none') return;

  const pA = WIRE_PUZZLE.pointA;
  const pB = WIRE_PUZZLE.pointB;
  const nVentX = VENT.col * TILE + TILE / 2;
  const nVentY = VENT.row * TILE + TILE / 2;
  const px = player.x + TILE / 2;
  const py = player.y + TILE / 2;

  ctx.save();

  if (w === 'nstrokes') {
    // N-Strokes holding a coil of wire — small coil near his hands
    ctx.strokeStyle = '#a08040';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(nVentX + 10, nVentY, 6, 0, Math.PI * 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(nVentX + 10, nVentY, 3, 0, Math.PI * 1.5);
    ctx.stroke();
  }

  if (w === 'passing') {
    // Wire passing through the vent — line from N-Strokes side through to Harry's side
    ctx.strokeStyle = '#a08040';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(nVentX + 10, nVentY);
    ctx.lineTo(VENT.col * TILE, nVentY); // into vent
    ctx.lineTo(VENT.nearCol * TILE + TILE, nVentY); // out Harry's side
    ctx.stroke();
    // Coil on Harry's side
    ctx.beginPath();
    ctx.arc(VENT.nearCol * TILE + TILE - 4, nVentY + 8, 5, 0, Math.PI * 1.5);
    ctx.stroke();
  }

  if (w === 'harry') {
    // Harry carrying the wire — a trailing line behind him
    ctx.strokeStyle = '#a08040';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, py + 6);
    // Wire droops a little behind
    ctx.quadraticCurveTo(px + 10, py + 18, px + 20, py + 10);
    ctx.stroke();
    // Small coil at his side
    ctx.beginPath();
    ctx.arc(px - 8, py + 4, 4, 0, Math.PI * 1.5);
    ctx.stroke();
  }

  if (w === 'threading') {
    // Wire going from Harry into the beast vent, partially through
    const ventX = WIRE_PUZZLE.ventCol * TILE + TILE / 2;
    const ventY = WIRE_PUZZLE.ventRow * TILE + TILE / 2;
    ctx.strokeStyle = '#a08040';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px - 4, py);
    ctx.lineTo(ventX + 4, ventY);
    ctx.stroke();
    // Wire emerging into beast cell, dangling
    ctx.beginPath();
    ctx.moveTo(ventX, ventY);
    ctx.lineTo(ventX - TILE, ventY + 8);
    ctx.stroke();
  }

  if (w === 'connected') {
    // Wire stretched diagonally between contact points — glowing
    ctx.strokeStyle = '#e6a832';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#e6a832';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(pA.x, pA.y);
    ctx.lineTo(pB.x, pB.y);
    ctx.stroke();
    ctx.shadowBlur = 0;
    // Also draw from Harry to vent
    const ventX = WIRE_PUZZLE.ventCol * TILE + TILE / 2;
    const ventY = WIRE_PUZZLE.ventRow * TILE + TILE / 2;
    ctx.strokeStyle = '#a08040';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px - 4, py);
    ctx.lineTo(ventX + 4, ventY);
    ctx.stroke();
  }

  if (w === 'failed') {
    // Wire from contact A partway toward B but not reaching
    const frac = 0.7;
    const endX = pA.x + (pB.x - pA.x) * frac;
    const endY = pA.y + (pB.y - pA.y) * frac;
    ctx.strokeStyle = '#6a5a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pA.x, pA.y);
    ctx.lineTo(endX, endY);
    // Drooping end
    ctx.lineTo(endX - 4, endY + 10);
    ctx.stroke();
  }

  ctx.restore();
}

function drawCutsceneText() {
  if (!cutscene.active || !cutscene.text) return;
  // Dark bar at bottom of screen
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(0, H - 44, W, 44);
  ctx.strokeStyle = '#3d3d5c';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, H - 44);
  ctx.lineTo(W, H - 44);
  ctx.stroke();
  // Text
  ctx.save();
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.fillStyle = cutscene.textColor;
  ctx.textAlign = 'center';
  wrapText(cutscene.text, W / 2, H - 24, W - 40, 14);
  ctx.restore();
}

function closePopup() {
  const shouldStir = popup.pendingStir;
  popup.open = false;
  popup.station = null;
  popup.answer = '';
  popup.feedback = '';
  popup.solvedView = false;
  popup.saveCode = '';
  popup.pendingStir = false;
  popup.isDoor = false;
  popup.isVent = false;
  popup.isLocked = false;
  popup.isWire = false;
  if (shouldStir) {
    setTimeout(triggerBeastStir, 1500);
  }
}

async function openSolvedPopup(station) {
  popup.open = true;
  popup.station = station;
  popup.solvedView = true;
  popup.answer = station.correctAnswer || '';
  popup.saveCode = await generateSaveCode(station);
  popup.feedback = '';
  popup.feedbackColor = '#2ecc71';
  popup.isDoor = false;
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
    popup.saveCode = await generateSaveCode(popup.station);
    popup.feedback = '';
    popup.feedbackColor = '#2ecc71';
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

async function validateCode() {
  const input = codeInput.trim().toUpperCase();
  if (!input) return;
  for (const st of STATIONS) {
    const expected = await generateSaveCode(st);
    if (input === expected) {
      if (st.solved) {
        codeMessage = st.name + ' is already solved.';
        codeMessageColor = '#6a6a7a';
      } else {
        st.solved = true;
        st.locked = false;
        st.correctAnswer = '';
        codeMessage = st.name + ' restored!';
        codeMessageColor = '#1a6a2a';
        triggerBeastStir();
      }
      codeInput = '';
      return;
    }
  }
  codeMessage = 'Code not recognized.';
  codeMessageColor = '#8a2020';
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
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

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
  if (!paused) return;
  if (codesScreen) return; // codes screen uses keyboard only
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  const scaleY = H / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;

  if (mx >= resumeBtn.x && mx <= resumeBtn.x + resumeBtn.w &&
      my >= resumeBtn.y && my <= resumeBtn.y + resumeBtn.h) {
    paused = false;
  }
  if (mx >= codesBtn.x && mx <= codesBtn.x + codesBtn.w &&
      my >= codesBtn.y && my <= codesBtn.y + codesBtn.h) {
    codesScreen = true;
    codeInput = '';
    codeMessage = '';
  }
  if (mx >= restartBtn.x && mx <= restartBtn.x + restartBtn.w &&
      my >= restartBtn.y && my <= restartBtn.y + restartBtn.h) {
    resetGame();
  }
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
    if (MAP[row][col] !== 0) return false;
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
  // Sitting against east wall (col 22), vertically centered
  const cx = 21 * TILE + TILE / 2;
  const cy = 8 * TILE + TILE / 2;
  const p = 2;

  const px = (offX, offY, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(cx + offX * p, cy + offY * p, w * p, h * p);
  };

  const skin  = '#c68c5a';
  const hat   = '#7a7a7a';
  const hatDk = '#5a5a5a';
  const shirt = '#4a5a3a';
  const pants = '#3a3a4a';
  const chain = '#6a6a6a';

  // Chains from wall
  ctx.strokeStyle = chain;
  ctx.lineWidth = 2;
  // Left chain
  ctx.beginPath();
  ctx.moveTo(22 * TILE, cy - 3 * p);
  ctx.lineTo(cx + 3 * p, cy - 1 * p);
  ctx.stroke();
  // Right chain
  ctx.beginPath();
  ctx.moveTo(22 * TILE, cy + 2 * p);
  ctx.lineTo(cx + 3 * p, cy + 2 * p);
  ctx.stroke();

  // Chain links on wall
  ctx.fillStyle = '#5a5a5a';
  ctx.fillRect(22 * TILE - 2, cy - 4 * p, 4, 3);
  ctx.fillRect(22 * TILE - 2, cy + 1 * p, 4, 3);

  // Bucket hat (wider, flat top)
  px(-4, -8, 8, 2, hat);     // flat top
  px(-5, -6, 10, 1, hatDk);  // brim
  px(-3, -7, 6, 1, hatDk);   // band

  // Head
  px(-3, -6, 6, 5, skin);
  // Eyes (looking left toward Harry Bonds)
  px(-2, -5, 2, 1, '#fff');
  px(-2, -5, 1, 1, '#222');
  px(1, -5, 2, 1, '#fff');
  px(1, -5, 1, 1, '#222');
  // Mouth
  px(-1, -2, 2, 1, '#a06a3a');

  // Torso (sitting, compressed)
  px(-3, -1, 6, 4, shirt);

  // Arms at sides (wrists chained)
  px(-4, -1, 1, 4, skin);
  px(3, -1, 1, 4, skin);
  // Shackles
  px(-5, 2, 2, 1, chain);
  px(3, 2, 2, 1, chain);

  // Legs (sitting, bent forward)
  px(-3, 3, 6, 2, pants);
  px(-3, 5, 3, 2, pants);
  px(1, 5, 3, 2, pants);
  // Shoes
  px(-4, 6, 3, 1, '#222');
  px(1, 6, 3, 1, '#222');
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
  if (Math.abs(pcol - WIRE_PUZZLE.nearCol) <= 1 && Math.abs(prow - WIRE_PUZZLE.nearRow) <= 1) {
    ctx.save();
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#e67e22';
    ctx.textAlign = 'center';
    ctx.fillText('[SPACE]', WIRE_PUZZLE.nearCol * TILE + TILE / 2, WIRE_PUZZLE.nearRow * TILE - 4);
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

  // Stations
  for (const st of STATIONS) {
    if (st.solved) continue;
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
  if (!popup.station && !popup.isVent && !popup.isLocked && !popup.isWire) return;
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
    // ========= WIRE PUZZLE VIEW =========
    ctx.font = '11px "Press Start 2P", monospace';
    ctx.fillStyle = '#8a6a20';
    ctx.fillText('The Wire', W / 2, by + 30);

    if (WIRE_PUZZLE.state === 'asking') {
      // Show puzzle description
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = POP.flavor;
      wrapText('Through the grate you see two contact points in the Beast\'s cell. A metal plate on the wall, and a terminal by the door.', W / 2, by + 52, bw - 40, 13);

      ctx.fillStyle = POP.text;
      wrapText('Horizontal gap: 3 brick-lengths. Vertical gap: 4 brick-lengths. The wire must go diagonally, held taut.', W / 2, by + 105, bw - 40, 13);

      ctx.fillStyle = '#8a6a20';
      wrapText('N-Strokes has 7 brick-lengths of wire. He gets one cut. How many brick-lengths should the piece be?', W / 2, by + 160, bw - 40, 13);

      // Input box
      const inputY = by + bh - 80;
      ctx.fillStyle = POP.input;
      ctx.fillRect(W / 2 - 60, inputY, 120, 24);
      ctx.strokeStyle = '#8a6a20';
      ctx.lineWidth = 2;
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

    } else {
      // Solved or failed — show result
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
    // ========= VENT / N-STROKES VIEW =========
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#5a8a5a';
    ctx.fillText('~ Through the vent ~', W / 2, by + 30);

    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = '#3a7a3a';
    ctx.fillText('N-Strokes', W / 2, by + 56);

    ctx.font = '9px "Press Start 2P", monospace';
    ctx.fillStyle = POP.text;
    wrapText('"Harry Bonds? Is that you?"', W / 2, by + 90, bw - 50, 16);

    // Placeholder for future menu options
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = POP.flavor;
    ctx.fillText('...', W / 2, by + 130);

    ctx.fillStyle = POP.hint;
    ctx.fillText('[SPACE] to close', W / 2, by + bh - 16);

  } else if (popup.isDoor) {
    // ========= MASTER DOOR VIEW =========
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = '#8a2020';
    ctx.fillText(st.name, W / 2, by + 34);

    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = POP.flavor;
    wrapText(st.flavor, W / 2, by + 56, bw - 50, 14);

    ctx.font = '9px "Press Start 2P", monospace';
    ctx.fillStyle = POP.text;
    const lines = st.inscription.split('\n');
    let ty = by + 90;
    for (const line of lines) {
      wrapText(line, W / 2, ty, bw - 50, 15);
      ty += Math.ceil(ctx.measureText(line).width / (bw - 50)) * 15 + 6;
    }

    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#8a2020';
    ctx.fillText('SEALED', W / 2, by + bh - 40);

    ctx.fillStyle = POP.hint;
    ctx.fillText('[SPACE] to close', W / 2, by + bh - 16);

  } else if (popup.solvedView) {
    // ========= SOLVED VIEW =========
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = POP.title;
    ctx.fillText(st.name, W / 2, by + 34);

    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = POP.correct;
    ctx.fillText('CORRECT!', W / 2, by + 62);

    ctx.font = '14px "Press Start 2P", monospace';
    ctx.fillStyle = POP.text;
    ctx.fillText(popup.station.correctAnswer || '', W / 2, by + 88);

    const codeY = by + 120;
    const codeH = 80;
    ctx.fillStyle = POP.codeBg;
    ctx.fillRect(bx + 25, codeY, bw - 50, codeH);
    ctx.strokeStyle = POP.codeBdr;
    ctx.lineWidth = 2;
    ctx.strokeRect(bx + 25, codeY, bw - 50, codeH);

    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = POP.flavor;
    ctx.fillText('N-Strokes whispers:', W / 2, codeY + 18);
    ctx.fillStyle = POP.text;
    ctx.fillText('"Remember this, Harry Bonds."', W / 2, codeY + 34);

    ctx.font = '16px "Press Start 2P", monospace';
    ctx.fillStyle = POP.code;
    ctx.fillText(popup.saveCode, W / 2, codeY + 58);

    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = POP.hint;
    ctx.fillText('Write this down.', W / 2, codeY + 74);

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
  const cx = player.x + TILE / 2;
  const cy = player.y + TILE / 2;
  const p = 2;

  walkTimer++;
  if (walkTimer > 8) { walkTimer = 0; walkFrame = 1 - walkFrame; }
  const moving = keys['ArrowUp'] || keys['ArrowDown'] || keys['ArrowLeft'] || keys['ArrowRight']
              || keys['w'] || keys['s'] || keys['a'] || keys['d'];
  if (!moving) walkFrame = 0;

  const px = (offX, offY, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(cx + offX * p, cy + offY * p, w * p, h * p);
  };

  const skin   = '#c68c5a';
  const hat    = '#1a3a8a';
  const jersey = '#e8e8e8';
  const stripe = '#1a3a8a';
  const pants  = '#3d3d5c';
  const shoes  = '#222';
  const bat    = '#c89040';
  const batDk  = '#a06820';

  px(-3, -7, 6, 2, hat);
  if (facing === 'left') {
    px(-5, -5, 4, 1, hat);
    px(-3, -5, 6, 1, hat);
  } else if (facing === 'right') {
    px(-3, -5, 6, 1, hat);
    px(1, -5, 4, 1, hat);
  } else {
    px(-4, -5, 8, 1, hat);
  }

  px(-3, -5, 6, 4, skin);
  if (facing === 'up') {
    px(-3, -5, 6, 1, hat);
  } else if (facing === 'left') {
    px(-2, -4, 2, 1, '#fff');
    px(-2, -4, 1, 1, '#222');
    px(-1, -2, 2, 1, '#a06a3a');
  } else if (facing === 'right') {
    px(0, -4, 2, 1, '#fff');
    px(1, -4, 1, 1, '#222');
    px(-1, -2, 2, 1, '#a06a3a');
  } else {
    px(-2, -4, 2, 1, '#fff');
    px(1, -4, 2, 1, '#fff');
    px(-2, -4, 1, 1, '#222');
    px(2, -4, 1, 1, '#222');
    px(-1, -2, 2, 1, '#a06a3a');
  }

  px(-3, -1, 6, 4, jersey);
  px(-3, 0, 6, 1, stripe);
  if (facing === 'up') {
    px(-1, 0, 1, 2, stripe);
    px(0, 0, 1, 1, stripe);
    px(0, 1, 1, 1, stripe);
    px(1, 0, 1, 2, stripe);
  }

  if (facing !== 'right') {
    const armOff = walkFrame === 1 && moving ? -1 : 0;
    px(-5, -1 + armOff, 2, 3, skin);
  }
  if (facing !== 'left') {
    const armOff = walkFrame === 1 && moving ? 1 : 0;
    px(3, -1 + armOff, 2, 3, skin);
    px(4, -4, 1, 4, bat);
    px(4, -6, 1, 2, batDk);
  }

  px(-3, 3, 6, 2, pants);
  if (moving && walkFrame === 1) {
    px(-3, 5, 2, 2, pants);
    px(1, 5, 2, 2, pants);
    px(-3, 7, 2, 1, shoes);
    px(1, 7, 2, 1, shoes);
  } else {
    px(-2, 5, 2, 2, pants);
    px(1, 5, 2, 2, pants);
    px(-2, 7, 2, 1, shoes);
    px(1, 7, 2, 1, shoes);
  }
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
  const pA = WIRE_PUZZLE.pointA;
  const pB = WIRE_PUZZLE.pointB;

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
  if (WIRE_PUZZLE.state === 'solved') {
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
  if (WIRE_PUZZLE.state === 'unsolved' || WIRE_PUZZLE.state === 'asking') {
    const pcol = Math.round(player.x / TILE);
    const prow = Math.round(player.y / TILE);
    if (Math.abs(pcol - WIRE_PUZZLE.nearCol) <= 2 && Math.abs(prow - WIRE_PUZZLE.nearRow) <= 2) {
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

function drawLightBeams() {
  // Collect all light rows from solved stations + wire puzzle
  const lightRows = [];
  for (const st of STATIONS) {
    if (st.solved) lightRows.push(st.lightRow);
  }
  if (WIRE_PUZZLE.state === 'solved') lightRows.push(WIRE_PUZZLE.lightRow);

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
  // Collect all active light rows
  const lightRows = [];
  for (const st of STATIONS) {
    if (st.solved) lightRows.push(st.lightRow);
  }
  if (WIRE_PUZZLE.state === 'solved') lightRows.push(WIRE_PUZZLE.lightRow);
  if (lightRows.length === 0) return;

  let shakeX = 0;
  if (beastStir > 0) {
    beastStir--;
    const intensity = beastStir / 60;
    shakeX = Math.sin(beastStir * 0.8) * 3 * intensity;
  }

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
  ctx.translate(shakeX, 0);

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
  if (cutscene.active) { updateCutscene(); return; }
  if (popup.open || paused) return;

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
        ctx.fillStyle = '#050510';
        ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
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

  drawProximityHint();
  drawPlayer();
  drawCutsceneWire();
  drawPopup();
  drawCutsceneText();
  drawPauseMenu();
}

function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

loop();
