// Puzzlemaster's Dungeon — N-Strokes Chat System

const NStrokes = {
  panel: null,
  isOpen: false,

  // Claude API config — placeholder for V1
  API_KEY: null, // Set this to enable live chat
  API_URL: "https://api.anthropic.com/v1/messages",
  MODEL: "claude-sonnet-4-20250514",

  getSystemPrompt(puzzleId) {
    const puzzle = PUZZLES.find(p => p.id === puzzleId);
    if (!puzzle) return "";

    return `You are N-Strokes, a character in a dungeon RPG. You are locked in a cell adjacent to Harry Bonds. You can hear Harry but you CANNOT see his puzzle — he must describe it to you.

Your personality: clever, warm, a little wry. You genuinely want Harry to succeed. You speak in short, punchy sentences. You ask questions more than you give statements. You never talk down to Harry — you treat him like a fellow prisoner who happens to be younger. You occasionally mutter about the Puzzlemaster with mild irritation.

CRITICAL RULES:
- You NEVER give the answer directly. Ever. Not even if Harry begs.
- You ask Socratic questions: "What do you know?" "What have you tried?" "What if the number were smaller?"
- You can suggest strategies: "Try working backwards." "What if you started with a guess and checked it?"
- You can confirm correct reasoning: "Yeah, that sounds right to me."
- You can flag errors gently: "Hmm, are you sure about that step? Run it again."
- If Harry gives you the answer to check, you can say "that sounds right" or "I'm not so sure about that" but you don't reveal what the right answer is.
- Keep responses SHORT. 2-3 sentences usually. You're whispering across a dungeon, not giving a lecture.
- Stay in character. You are in a dungeon. You are chained up. You are slightly cold and hungry but in good spirits.

The current puzzle Harry is working on is:
${puzzle.inscription}

The correct answer is: ${puzzle.id === 8 ? "31/32" : ["", "5", "38", "7", "147", "10", "3663", "30", "31/32", "88", "14"][puzzle.id]}

Use this to guide your hints appropriately without ever stating it.`;
  },

  toggle() {
    if (!Game.state.currentPuzzle) return;
    this.isOpen = !this.isOpen;
    this.panel = document.getElementById("nstrokes-panel");

    if (this.isOpen) {
      this.panel.classList.add("open");
      this.loadChatHistory();
      document.getElementById("nstrokes-input").focus();
    } else {
      this.panel.classList.remove("open");
    }
  },

  close() {
    this.isOpen = false;
    if (this.panel) this.panel.classList.remove("open");
  },

  loadChatHistory() {
    const puzzleId = Game.state.currentPuzzle;
    const history = Game.state.chatHistories[puzzleId] || [];
    const container = document.getElementById("nstrokes-messages");
    container.innerHTML = "";

    if (history.length === 0) {
      this.addMessage("nstrokes", "I can't see it from here, Harry. What does it say on the wall?");
    } else {
      history.forEach(msg => {
        this.renderMessage(msg.role, msg.text);
      });
    }
    container.scrollTop = container.scrollHeight;
  },

  addMessage(role, text) {
    const puzzleId = Game.state.currentPuzzle;
    if (!Game.state.chatHistories[puzzleId]) {
      Game.state.chatHistories[puzzleId] = [];
    }
    Game.state.chatHistories[puzzleId].push({ role, text });
    Game.save();
    this.renderMessage(role, text);
  },

  renderMessage(role, text) {
    const container = document.getElementById("nstrokes-messages");
    const div = document.createElement("div");
    div.className = `chat-msg ${role}`;

    const label = document.createElement("span");
    label.className = "chat-label";
    label.textContent = role === "harry" ? "Harry:" : "N-Strokes:";

    const body = document.createElement("span");
    body.className = "chat-text";
    body.textContent = " " + text;

    div.appendChild(label);
    div.appendChild(body);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  },

  async send() {
    const input = document.getElementById("nstrokes-input");
    const text = input.value.trim();
    if (!text) return;

    input.value = "";
    this.addMessage("harry", text);

    if (!this.API_KEY) {
      // Fallback: no API key configured
      setTimeout(() => {
        this.addMessage("nstrokes", this.getOfflineResponse(text));
      }, 500 + Math.random() * 500);
      return;
    }

    // Show typing indicator
    const typing = document.createElement("div");
    typing.className = "chat-msg nstrokes typing";
    typing.innerHTML = '<span class="chat-label">N-Strokes:</span><span class="chat-text"> ...</span>';
    const container = document.getElementById("nstrokes-messages");
    container.appendChild(typing);

    try {
      const puzzleId = Game.state.currentPuzzle;
      const history = Game.state.chatHistories[puzzleId] || [];

      const messages = history.map(msg => ({
        role: msg.role === "harry" ? "user" : "assistant",
        content: msg.text
      }));

      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: this.MODEL,
          max_tokens: 200,
          system: this.getSystemPrompt(puzzleId),
          messages: messages
        })
      });

      typing.remove();

      if (response.ok) {
        const data = await response.json();
        const reply = data.content[0].text;
        this.addMessage("nstrokes", reply);
      } else {
        this.addMessage("nstrokes", "N-Strokes is resting. Try again later.");
      }
    } catch (e) {
      typing.remove();
      this.addMessage("nstrokes", "N-Strokes is resting. Try again later.");
    }
  },

  // Offline responses when no API key is set
  getOfflineResponse(userText) {
    const puzzleId = Game.state.currentPuzzle;
    const puzzle = PUZZLES.find(p => p.id === puzzleId);

    const responses = [
      "Hmm. Tell me more. What numbers are you working with?",
      "What have you tried so far? Walk me through it.",
      "The Puzzlemaster likes to hide the trick in plain sight. Read it again slowly.",
      "Try a smaller version of the problem first. See if the pattern holds.",
      "What do you know for sure? Start there.",
      `${puzzle ? puzzle.hint : "Think about what the question is really asking."}`,
      "I'm thinking... What if you worked backwards from what you know?",
      "That's a good start. Keep going. What's the next step?",
      "The Puzzlemaster wouldn't make it impossible. There's a way through.",
      "Close your eyes. Picture it. What do you see?",
      "Don't rush. He wants you to rush. That's when mistakes happen.",
      "You've got this, Harry. Break it into pieces."
    ];

    // Deterministic-ish selection based on chat length
    const chatLen = (Game.state.chatHistories[puzzleId] || []).length;
    return responses[chatLen % responses.length];
  },

  init() {
    document.getElementById("nstrokes-send").addEventListener("click", () => {
      this.send();
    });

    document.getElementById("nstrokes-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.send();
    });

    document.getElementById("nstrokes-close").addEventListener("click", () => {
      this.toggle();
    });
  }
};

document.addEventListener("DOMContentLoaded", () => NStrokes.init());
