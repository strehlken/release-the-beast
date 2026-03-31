// Puzzlemaster's Dungeon — Puzzle Data
// Answers stored as SHA-256 hashes only. No plaintext answers in source.

const PUZZLES = [
  {
    id: 1,
    name: "The Farmer's Riddle",
    inscription: "A farmer has chickens and cows. He counts 8 heads and 26 legs in total. How many chickens does he have?",
    flavor: "The Puzzlemaster carved this with a smirk. \"Even a farm boy could solve this,\" he scratched beneath it.",
    answerHash: "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d",
    hint: "Think about what's different between a chicken and a cow.",
    answerType: "integer"
  },
  {
    id: 2,
    name: "The Chain of Thirds",
    inscription: "Start with the number 60. Take 1/3 of it. Then add 1/2 of 60 to your result. Then subtract 1/5 of 60 from your total. What number remains?",
    flavor: "The numbers spiral across the stone like a chain. Each link depends on the last.",
    answerHash: "aea92132c4cbeb263e6ac2bf6c183b5d81737f179f21efdc5863739672f0f470",
    hint: "Each fraction is of 60, not of your running total.",
    answerType: "integer"
  },
  {
    id: 3,
    name: "The Reverse Machine",
    inscription: "I think of a number. I double it. I add 5. I triple that result. I get 57. What was my number?",
    flavor: "Work backwards, the Puzzlemaster whispers. Or don't. He doesn't care. He just wants to watch you think.",
    answerHash: "7902699be42c8a8e46fbbb4501726517e86b22c56a189f7625a6da49081b2451",
    hint: "Start from 57 and undo each step in reverse order.",
    answerType: "integer"
  },
  {
    id: 4,
    name: "The Rectangle's Secret",
    inscription: "A rectangle has a perimeter of 56 cm. Its length is 3 times its width. What is the area of the rectangle, in square centimeters?",
    flavor: "The Puzzlemaster etched a perfect rectangle into the door. Its proportions taunt you.",
    answerHash: "1d28c120568c10e19b9d8abe8b66d0983fa3d2e11ee7751aca50f83c6f4a43aa",
    hint: "If the length is 3 times the width, what does that make the perimeter in terms of width?",
    answerType: "integer"
  },
  {
    id: 5,
    name: "The Handshake Problem",
    inscription: "Five friends meet. Every person shakes hands with every other person exactly once. How many handshakes happen in total?",
    flavor: "The Puzzlemaster has no friends. Perhaps that's why he finds this problem so fascinating.",
    answerHash: "4a44dc15364204a80fe80e9039455cc1608281820fe2b24f1e5233ade6af1dd5",
    hint: "Person 1 shakes 4 hands. Person 2 shakes 3 NEW hands. Keep going...",
    answerType: "integer"
  },
  {
    id: 6,
    name: "The Merchant's Shortcut",
    inscription: "Calculate 37 × 99.",
    flavor: "A merchant's ledger is scratched into the wall. \"Compute this without an abacus,\" it reads.",
    answerHash: "90b8243fdbf5e03d85ff2a105242ab4be7bf44f5d7699c2cb648068c36237d48",
    hint: "99 is very close to a much rounder number...",
    answerType: "integer"
  },
  {
    id: 7,
    name: "The Market Stall",
    inscription: "Three pencils and two erasers cost $1.60 altogether. One pencil and two erasers cost $1.00 altogether. How much does one pencil cost, in cents?",
    flavor: "The Puzzlemaster loves a good deal. He got these pencils wholesale.",
    answerHash: "624b60c58c9d8bfb6ff1886c2fd605d2adeb6ea4da576068201b6c6958ce93f4",
    hint: "What changes between the two purchases? What stays the same?",
    answerType: "integer"
  },
  {
    id: 8,
    name: "The Infinite Halves",
    inscription: "What is 1/2 + 1/4 + 1/8 + 1/16 + 1/32? Give your answer as a fraction: type the top number, then /, then the bottom number.",
    flavor: "The fractions grow smaller, smaller, smaller. Almost nothing. Almost everything.",
    answerHash: "7b819e0b6fd29e80c816b939517c3446dc01daebb1f495505db818a4d5319b00",
    hint: "Find a common denominator. What's the biggest one you need?",
    answerType: "fraction"
  },
  {
    id: 9,
    name: "The Garden Path",
    inscription: "A square garden has an area of 81 square feet. A path goes all the way around the outside. The path is 2 feet wide. What is the area of just the path, in square feet?",
    flavor: "The Puzzlemaster tends a garden in his mind. No one is allowed to walk in it.",
    answerHash: "8b940be7fb78aaa6b6567dd7a3987996947460df1c668e698eb92ca77e425349",
    hint: "The path adds width on BOTH sides of the garden.",
    answerType: "integer"
  },
  {
    id: 10,
    name: "The Counting Grid",
    inscription: "On a 3×3 checkerboard (3 rows, 3 columns of small squares), how many squares of ALL sizes can you find? Count 1×1, 2×2, and 3×3.",
    flavor: "The Puzzlemaster scratched a grid into the stone with his fingernail. He counted. He wants to know if you can.",
    answerHash: "8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61",
    hint: "Don't forget: a 2×2 square can start at different positions in the grid.",
    answerType: "integer"
  }
];

const BEAST_STAGES = [
  "Deep in the dungeon, something sleeps.",
  "A faint rumble from the far chamber.",
  "The beast shifts in its sleep.",
  "A low growl reverberates through the stone.",
  "Dust falls from the ceiling. Something is stirring.",
  "The ground trembles. The beast is dreaming.",
  "A deep, rhythmic breathing shakes the walls.",
  "The beast's eyes glow behind the sealed door.",
  "Cracks appear in the beast's chamber door.",
  "The beast ROARS. The dungeon shakes.",
  "THE BEAST AWAKENS."
];

const PUZZLEMASTER_CORRECT = [
  "The Puzzlemaster does not applaud. But the silence after your answer feels... approving.",
  "A faint scratching from above. He saw that. He's impressed. He'll never say it.",
  "The stone groans. The door yields. The Puzzlemaster mutters something you can't quite hear.",
  "\"Adequate,\" echoes a voice from nowhere. High praise from the Puzzlemaster.",
  "The door slides open. Dust falls. Somewhere, the Puzzlemaster nods.",
  "A correct answer rings through the corridor like a bell. The dungeon remembers.",
  "The Puzzlemaster carved this with confidence. You solved it anyway.",
  "\"I made that one on a Tuesday,\" echoes above. \"I was feeling generous.\"",
  "The lock clicks. The stone shifts. Another chain loosened.",
  "The final door yields. The Puzzlemaster is silent. Even he knows what comes next."
];

const PUZZLEMASTER_WRONG = [
  "The Puzzlemaster's laughter echoes off the stone. \"Not quite, Harry. Not quite.\"",
  "A cold draft. Was that a chuckle from above?",
  "The inscription glows red for a moment, then fades. Wrong.",
  "\"Try again,\" scratched into the wall in fresh marks. When did he write that?",
  "The door does not move. The Puzzlemaster is patient. He has nowhere to be.",
  "A faint tapping from above. Disappointment, or encouragement? Hard to tell.",
  "The stone is cold. The answer is wrong. The dungeon waits.",
  "\"Careless,\" whispers the wall. Or was it the wind?"
];

// Salt for save code generation
const SAVE_SALT = "puzzlemaster-dungeon-2026";

// Escape code fragments — each puzzle contributes a piece
// The final escape code is assembled from all 10 pieces
const ESCAPE_FRAGMENTS = [
  "BEA", "ST-", "AWA", "KEN", "S-T",
  "HE-", "DUN", "GEO", "N-X", "742"
];
