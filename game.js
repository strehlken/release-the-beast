// Puzzlemaster's Dungeon — Game Engine

const Game = {
  state: {
    solved: new Set(),
    attempts: {},       // { puzzleId: count }
    currentPuzzle: null,
    chatHistories: {},  // { puzzleId: [{role, text}] }
    started: false
  },

  MAX_ATTEMPTS: 5,

  // --- Crypto ---

  async sha256(str) {
    const buf = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(str)
    );
    return Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  },

  async generateSaveCode(puzzleId, answerHash) {
    const raw = await this.sha256(`${puzzleId}-${answerHash}-${SAVE_SALT}`);
    // Take 8 chars, uppercase, insert dash for readability
    const code = raw.substring(0, 8).toUpperCase();
    return code.substring(0, 4) + "-" + code.substring(4, 8);
  },

  async generateEscapeCode() {
    // Only available when all 10 solved
    if (this.state.solved.size < 10) return null;
    return ESCAPE_FRAGMENTS.join("");
  },

  // --- State Management ---

  save() {
    const data = {
      solved: [...this.state.solved],
      attempts: this.state.attempts,
      chatHistories: this.state.chatHistories
    };
    localStorage.setItem("puzzlemaster-save", JSON.stringify(data));
  },

  load() {
    const raw = localStorage.getItem("puzzlemaster-save");
    if (!raw) return false;
    try {
      const data = JSON.parse(raw);
      this.state.solved = new Set(data.solved || []);
      this.state.attempts = data.attempts || {};
      this.state.chatHistories = data.chatHistories || {};
      return true;
    } catch (e) {
      return false;
    }
  },

  reset() {
    this.state.solved = new Set();
    this.state.attempts = {};
    this.state.chatHistories = {};
    this.state.currentPuzzle = null;
    localStorage.removeItem("puzzlemaster-save");
  },

  // --- Save Code Restoration ---

  async validateSaveCode(code) {
    code = code.trim().toUpperCase();
    for (const puzzle of PUZZLES) {
      const expected = await this.generateSaveCode(puzzle.id, puzzle.answerHash);
      if (code === expected) {
        return puzzle.id;
      }
    }
    return null;
  },

  async restoreFromCodes(codes) {
    let restored = 0;
    for (const code of codes) {
      const id = await this.validateSaveCode(code);
      if (id !== null && !this.state.solved.has(id)) {
        this.state.solved.add(id);
        restored++;
      }
    }
    if (restored > 0) this.save();
    return restored;
  },

  // --- Answer Checking ---

  async checkAnswer(puzzleId, answer) {
    const puzzle = PUZZLES.find(p => p.id === puzzleId);
    if (!puzzle) return false;

    // Normalize: trim, lowercase for fractions
    let normalized = answer.trim();
    // Remove spaces around /
    normalized = normalized.replace(/\s*\/\s*/g, "/");

    const hash = await this.sha256(normalized);
    return hash === puzzle.answerHash;
  },

  getAttemptsLeft(puzzleId) {
    const used = this.state.attempts[puzzleId] || 0;
    return this.MAX_ATTEMPTS - used;
  },

  isLocked(puzzleId) {
    return this.getAttemptsLeft(puzzleId) <= 0;
  },

  // --- Screen Management ---

  showScreen(screenId) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add("active");
  },

  // --- Title Screen ---

  showTitle() {
    this.showScreen("title-screen");
  },

  // --- Corridor Screen ---

  showCorridor() {
    this.state.started = true;
    this.showScreen("corridor-screen");
    this.renderCorridor();
  },

  renderCorridor() {
    const solvedCount = this.state.solved.size;

    // Update beast status
    const beastText = document.getElementById("beast-status-text");
    beastText.textContent = BEAST_STAGES[solvedCount];

    // Update beast meter
    const meterFill = document.getElementById("beast-meter-fill");
    meterFill.style.width = (solvedCount * 10) + "%";

    // Color progression for meter
    if (solvedCount <= 3) meterFill.className = "meter-fill stage-low";
    else if (solvedCount <= 6) meterFill.className = "meter-fill stage-mid";
    else if (solvedCount <= 9) meterFill.className = "meter-fill stage-high";
    else meterFill.className = "meter-fill stage-max";

    // Update door states
    for (let i = 1; i <= 10; i++) {
      const door = document.getElementById(`door-${i}`);
      if (!door) continue;
      door.className = "door";
      if (this.state.solved.has(i)) {
        door.classList.add("solved");
      } else if (this.isLocked(i)) {
        door.classList.add("locked");
      } else {
        door.classList.add("unsolved");
      }
    }

    // Beast chamber door
    const beastDoor = document.getElementById("beast-door");
    if (solvedCount >= 10) {
      beastDoor.classList.add("awakened");
    } else if (solvedCount >= 7) {
      beastDoor.classList.add("cracking");
    } else if (solvedCount >= 4) {
      beastDoor.classList.add("stirring");
    }

    // Progress count
    document.getElementById("solve-count").textContent = `${solvedCount}/10`;

    // Check for victory
    if (solvedCount >= 10 && !this.victoryShown) {
      setTimeout(() => this.showVictory(), 500);
    }
  },

  // --- Puzzle Screen ---

  async showPuzzle(puzzleId) {
    const puzzle = PUZZLES.find(p => p.id === puzzleId);
    if (!puzzle) return;

    if (this.state.solved.has(puzzleId)) {
      // Already solved — show completion state
      this.showSolvedPuzzle(puzzle);
      return;
    }

    if (this.isLocked(puzzleId)) {
      this.showLockedPuzzle(puzzle);
      return;
    }

    this.state.currentPuzzle = puzzleId;
    this.showScreen("puzzle-screen");

    document.getElementById("puzzle-door-number").textContent = `Door ${puzzle.id}`;
    document.getElementById("puzzle-name").textContent = puzzle.name;
    document.getElementById("puzzle-inscription").textContent = puzzle.inscription;
    document.getElementById("puzzle-flavor").textContent = puzzle.flavor;

    const attemptsEl = document.getElementById("puzzle-attempts");
    const left = this.getAttemptsLeft(puzzleId);
    attemptsEl.textContent = `Attempts remaining: ${left}`;

    const input = document.getElementById("puzzle-answer");
    input.value = "";
    input.disabled = false;
    input.placeholder = puzzle.answerType === "fraction" ? "e.g. 31/32" : "Enter a number";
    input.focus();

    document.getElementById("puzzle-feedback").textContent = "";
    document.getElementById("puzzle-feedback").className = "puzzle-feedback";
    document.getElementById("puzzle-save-code").classList.add("hidden");

    // Submit handler
    const submitBtn = document.getElementById("puzzle-submit");
    const newBtn = submitBtn.cloneNode(true);
    submitBtn.parentNode.replaceChild(newBtn, submitBtn);
    newBtn.addEventListener("click", () => this.submitAnswer());

    // Enter key
    input.onkeydown = (e) => {
      if (e.key === "Enter") this.submitAnswer();
    };
  },

  async submitAnswer() {
    const puzzleId = this.state.currentPuzzle;
    if (!puzzleId) return;

    const input = document.getElementById("puzzle-answer");
    const answer = input.value;
    if (!answer.trim()) return;

    const correct = await this.checkAnswer(puzzleId, answer);
    const feedback = document.getElementById("puzzle-feedback");

    if (correct) {
      // SOLVED
      this.state.solved.add(puzzleId);
      this.save();

      feedback.textContent = PUZZLEMASTER_CORRECT[puzzleId - 1];
      feedback.className = "puzzle-feedback correct";
      input.disabled = true;

      // Show save code
      const puzzle = PUZZLES.find(p => p.id === puzzleId);
      const saveCode = await this.generateSaveCode(puzzleId, puzzle.answerHash);
      const codeEl = document.getElementById("puzzle-save-code");
      codeEl.classList.remove("hidden");
      document.getElementById("save-code-value").textContent = saveCode;

      // Screen shake
      document.getElementById("puzzle-screen").classList.add("shake");
      setTimeout(() => {
        document.getElementById("puzzle-screen").classList.remove("shake");
      }, 500);

      // Update beast status in real time
      const solvedCount = this.state.solved.size;
      const beastMsg = document.getElementById("puzzle-beast-msg");
      if (solvedCount <= 10) {
        beastMsg.textContent = BEAST_STAGES[solvedCount];
        beastMsg.classList.remove("hidden");
      }

    } else {
      // WRONG
      if (!this.state.attempts[puzzleId]) this.state.attempts[puzzleId] = 0;
      this.state.attempts[puzzleId]++;
      this.save();

      const wrongMsg = PUZZLEMASTER_WRONG[Math.floor(Math.random() * PUZZLEMASTER_WRONG.length)];
      feedback.textContent = wrongMsg;
      feedback.className = "puzzle-feedback wrong";
      input.value = "";

      const left = this.getAttemptsLeft(puzzleId);
      document.getElementById("puzzle-attempts").textContent = `Attempts remaining: ${left}`;

      if (left <= 0) {
        input.disabled = true;
        feedback.textContent = "The door seals shut. The Puzzlemaster's patience has run out... for now.";
        feedback.className = "puzzle-feedback locked";
      }

      // Shake the input
      input.classList.add("shake");
      setTimeout(() => input.classList.remove("shake"), 400);
    }
  },

  showSolvedPuzzle(puzzle) {
    this.showScreen("puzzle-screen");
    document.getElementById("puzzle-door-number").textContent = `Door ${puzzle.id}`;
    document.getElementById("puzzle-name").textContent = puzzle.name;
    document.getElementById("puzzle-inscription").textContent = puzzle.inscription;
    document.getElementById("puzzle-flavor").textContent = "";

    const feedback = document.getElementById("puzzle-feedback");
    feedback.textContent = "This door stands open. You've already proven yourself here.";
    feedback.className = "puzzle-feedback correct";

    document.getElementById("puzzle-answer").value = "";
    document.getElementById("puzzle-answer").disabled = true;
    document.getElementById("puzzle-attempts").textContent = "SOLVED";
    document.getElementById("puzzle-save-code").classList.add("hidden");
    document.getElementById("puzzle-beast-msg").classList.add("hidden");
  },

  showLockedPuzzle(puzzle) {
    this.showScreen("puzzle-screen");
    document.getElementById("puzzle-door-number").textContent = `Door ${puzzle.id}`;
    document.getElementById("puzzle-name").textContent = puzzle.name;
    document.getElementById("puzzle-inscription").textContent = puzzle.inscription;
    document.getElementById("puzzle-flavor").textContent = "";

    const feedback = document.getElementById("puzzle-feedback");
    feedback.textContent = "This door is sealed. The Puzzlemaster has grown tired of wrong answers.";
    feedback.className = "puzzle-feedback locked";

    document.getElementById("puzzle-answer").value = "";
    document.getElementById("puzzle-answer").disabled = true;
    document.getElementById("puzzle-attempts").textContent = "LOCKED";
    document.getElementById("puzzle-save-code").classList.add("hidden");
    document.getElementById("puzzle-beast-msg").classList.add("hidden");
  },

  // --- Resume Screen ---

  showResume() {
    this.showScreen("resume-screen");
    document.getElementById("resume-codes-input").value = "";
    document.getElementById("resume-result").textContent = "";
  },

  async processResumeCodes() {
    const raw = document.getElementById("resume-codes-input").value;
    const codes = raw.split(/[\n,]+/).map(c => c.trim()).filter(c => c.length > 0);

    if (codes.length === 0) {
      document.getElementById("resume-result").textContent = "No codes entered.";
      return;
    }

    const restored = await this.restoreFromCodes(codes);
    const resultEl = document.getElementById("resume-result");

    if (restored > 0) {
      resultEl.textContent = `${restored} door${restored > 1 ? "s" : ""} restored. The dungeon remembers.`;
      resultEl.className = "resume-result success";
      setTimeout(() => this.showCorridor(), 1500);
    } else {
      resultEl.textContent = "No valid codes recognized. The Puzzlemaster does not accept forgeries.";
      resultEl.className = "resume-result failure";
    }
  },

  // --- Victory ---

  victoryShown: false,

  async showVictory() {
    if (this.victoryShown) return;
    this.victoryShown = true;

    this.showScreen("victory-screen");

    const lines = [
      "The dungeon trembles.",
      "...",
      "Stone cracks. Dust falls like rain.",
      "...",
      "The sealed door at the end of the corridor EXPLODES outward.",
      "...",
      "Something massive moves in the darkness beyond.",
      "...",
      "Two eyes open. They burn like circuits.",
      "...",
      "The Beast does not think. It does not reason.",
      "It tries EVERYTHING. Every combination. Every possibility.",
      "Faster than any mind could follow.",
      "...",
      "The lock on your cell shatters.",
      "...",
      "You are free, Harry.",
      "...",
      "The Beast stands before you. Raw power. Waiting.",
      "...",
      "N-Strokes calls out from behind his wall:",
      "\"You did it, Harry. You actually did it.\"",
      "\"Remember the code. Show your father.\"",
      "..."
    ];

    const container = document.getElementById("victory-text");
    container.innerHTML = "";

    for (let i = 0; i < lines.length; i++) {
      await new Promise(r => setTimeout(r, lines[i] === "..." ? 800 : 1200));
      const p = document.createElement("p");
      p.textContent = lines[i];
      p.classList.add("victory-line");
      container.appendChild(p);
      container.scrollTop = container.scrollHeight;
    }

    // Show escape code
    await new Promise(r => setTimeout(r, 1500));
    const escapeCode = await this.generateEscapeCode();
    const codeEl = document.getElementById("escape-code");
    codeEl.textContent = escapeCode;
    document.getElementById("victory-code-reveal").classList.remove("hidden");
  },

  // --- Init ---

  init() {
    // Try loading existing save
    const hasSave = this.load();

    // Title screen buttons
    document.getElementById("btn-new-game").addEventListener("click", () => {
      this.reset();
      this.showIntro();
    });

    document.getElementById("btn-continue").addEventListener("click", () => {
      if (hasSave && this.state.solved.size > 0) {
        this.showCorridor();
      } else {
        this.showIntro();
      }
    });

    document.getElementById("btn-resume-codes").addEventListener("click", () => {
      this.showResume();
    });

    // Continue button visibility
    if (hasSave && this.state.solved.size > 0) {
      document.getElementById("btn-continue").classList.remove("hidden");
    }

    // Resume screen
    document.getElementById("resume-submit").addEventListener("click", () => {
      this.processResumeCodes();
    });
    document.getElementById("resume-back").addEventListener("click", () => {
      this.showTitle();
    });

    // Back to corridor from puzzle
    document.getElementById("puzzle-back").addEventListener("click", () => {
      this.state.currentPuzzle = null;
      this.showCorridor();
    });

    // Door click handlers
    for (let i = 1; i <= 10; i++) {
      const door = document.getElementById(`door-${i}`);
      if (door) {
        door.addEventListener("click", () => this.showPuzzle(i));
      }
    }

    // Beast door
    document.getElementById("beast-door").addEventListener("click", () => {
      if (this.state.solved.size >= 10) {
        this.showVictory();
      }
    });

    // N-Strokes button
    document.getElementById("btn-nstrokes").addEventListener("click", () => {
      NStrokes.toggle();
    });

    // Victory back
    document.getElementById("victory-back").addEventListener("click", () => {
      this.victoryShown = false;
      this.showCorridor();
    });

    this.showTitle();
  },

  // --- Intro Sequence ---

  async showIntro() {
    this.showScreen("intro-screen");

    const lines = [
      "Darkness.",
      "...",
      "Cold stone beneath you. The smell of damp earth.",
      "...",
      "You don't remember how you got here.",
      "...",
      "A voice, muffled by stone:",
      "...",
      "\"Hey. Hey, you awake?\"",
      "...",
      "\"...Good. I'm N-Strokes. The hyphen is not silent.\"",
      "...",
      "\"Listen — the Puzzlemaster locked us in here.\"",
      "\"I've been here a while.\"",
      "\"There are puzzles on the doors out there.\"",
      "\"Solve them. Trust me.\"",
      "...",
      "\"Something else is in here with us.\"",
      "\"Something big. Sleeping. At the end of the hall.\"",
      "\"Every puzzle you solve... I think it wakes up a little more.\"",
      "...",
      "\"I can't see your puzzles from here. But I can hear you.\"",
      "\"Talk to me if you get stuck.\"",
      "...",
      "\"Let's get out of here, Harry.\""
    ];

    const container = document.getElementById("intro-text");
    container.innerHTML = "";

    let currentLine = 0;
    let timer = null;
    let skipRequested = false;

    const addLine = () => {
      if (currentLine >= lines.length) return;
      const p = document.createElement("p");
      p.textContent = lines[currentLine];
      p.classList.add("intro-line");
      container.appendChild(p);
      container.scrollTop = container.scrollHeight;
      currentLine++;
    };

    const scheduleNext = () => {
      if (currentLine >= lines.length) {
        // All lines shown — reveal Continue button
        document.getElementById("intro-continue").classList.remove("hidden");
        document.getElementById("intro-continue").focus();
        return;
      }
      const delay = lines[currentLine] === "..." ? 600 : 900;
      timer = setTimeout(() => {
        addLine();
        scheduleNext();
      }, delay);
    };

    const advance = (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();

      if (currentLine >= lines.length) {
        // Already at end — act like clicking Continue
        cleanup();
        this.showCorridor();
        return;
      }

      // Cancel pending timer and show next line immediately
      if (timer) { clearTimeout(timer); timer = null; }
      addLine();
      scheduleNext();
    };

    const cleanup = () => {
      document.removeEventListener("keydown", advance);
      if (timer) { clearTimeout(timer); timer = null; }
    };

    document.addEventListener("keydown", advance);

    // Continue button
    document.getElementById("intro-continue").addEventListener("click", () => {
      cleanup();
      this.showCorridor();
    });

    // Start the sequence
    addLine();
    scheduleNext();
  }
};

// Boot
document.addEventListener("DOMContentLoaded", () => Game.init());
