# CLAUDE.md — The Puzzlemaster's Dungeon

## What This Is

A browser-based RPG math challenge game for an 8-year-old. Deployed on GitHub Pages (static only, no backend). The kid solves math problems to progress through a dungeon narrative and earn real money toward a gaming laptop called "The Beast" (~$1,099).

## Visual Style

Metal Gear NES (1987). Top-down, tile-based, pixel art. 8-bit palette: stone grays, torch orange, dark greens, black shadows. This should feel like a real retro game, not an edutainment toy.

## Screen Layout

Single canvas, three cells in a row:
- LEFT: The Beast's cell. Dark. Barred grate visible from Harry Bonds' cell. Gradually illuminates as puzzles are solved. At 10/10, the Beast emerges.
- CENTER: Harry Bonds' cell. The playable area. Player moves Harry Bonds with arrow keys. 10 puzzle stations around the walls (etched markings with code pads). Spacebar near a station opens puzzle popup.
- RIGHT: N-Strokes' cell. Barred grate. A figure visible but unreachable. (Chat integration comes later.)
- NORTH: A doorway with daylight beyond it. The exit. Locked.

## Core Game Loop

1. Arrow keys move Harry Bonds around his cell
2. Spacebar near a puzzle station → popup with puzzle text + answer input
3. Correct answer → station lights up, beam of light shines into Beast's cell, station marked solved
4. Wrong answer → Puzzlemaster taunt, popup stays open to retry
5. At 10/10 solved → Beast awakens sequence

## Characters

- **Harry Bonds** — the player. Always "Harry Bonds", never just "Harry."
- **The Puzzlemaster** — the villain. Compulsive puzzle-maker. Locks people up to force them to solve his puzzles. Never seen, only heard through taunts and inscriptions. Sardonic, theatrical.
- **N-Strokes** ("the hyphen is not silent") — ally in adjacent cell. Can hear Harry Bonds but can't see his puzzles. Gives hints, never answers. Warm, wry, speaks in short bursts. (Chat system TBD.)
- **The Beast** — a creature sleeping in the left cell. Each solved puzzle wakes it further. When fully awake it breaks free. It IS the laptop in the real-world economy.

## Beast Awakening Stages

0/10: "Deep in the dungeon, something sleeps."
1/10: "A faint rumble from the far chamber."
2/10: "The beast shifts in its sleep."
3/10: "A low growl reverberates through the stone."
4/10: "Dust falls from the ceiling. Something is stirring."
5/10: "The ground trembles. The beast is dreaming."
6/10: "A deep, rhythmic breathing shakes the walls."
7/10: "The beast's eyes glow behind the sealed door."
8/10: "Cracks appear in the beast's chamber door."
9/10: "The beast ROARS. The dungeon shakes."
10/10: "THE BEAST AWAKENS."

## The 10 Puzzles

Each has a single numeric or fraction answer. Answers should be hashed (SHA-256) in source, never plaintext.

1. "A farmer has chickens and cows. He counts 8 heads and 26 legs. How many chickens?" → 5
2. "Start with 60. Take 1/3 of it. Add 1/2 of 60. Subtract 1/5 of 60. What remains?" → 38
3. "I think of a number. Double it. Add 5. Triple that. I get 57. What was my number?" → 7
4. "A rectangle has perimeter 56 cm, length is 3× its width. Area in sq cm?" → 147
5. "5 friends each shake hands with every other person once. How many handshakes?" → 10
6. "Calculate 37 × 99." → 3663
7. "3 pencils + 2 erasers = $1.60. 1 pencil + 2 erasers = $1.00. Price of 1 pencil in cents?" → 30
8. "1/2 + 1/4 + 1/8 + 1/16 + 1/32 = ? (answer as fraction)" → 31/32
9. "Square garden area 81 sq ft. Path 2 ft wide around it. Area of just the path?" → 88
10. "3×3 checkerboard. How many squares of ALL sizes (1×1, 2×2, 3×3)?" → 14

## Puzzlemaster Flavor Text (per puzzle)

1. "Even a farm boy could solve this."
2. "The numbers spiral like a chain. Each link depends on the last."
3. "Work backwards. Or don't. He just wants to watch you think."
4. "The Puzzlemaster etched a perfect rectangle into the door. Its proportions taunt you."
5. "The Puzzlemaster has no friends. Perhaps that's why he finds this problem so fascinating."
6. "A merchant's ledger. 'Compute this without an abacus.'"
7. "The Puzzlemaster loves a good deal. He got these pencils wholesale."
8. "The fractions grow smaller, smaller, smaller. Almost nothing. Almost everything."
9. "The Puzzlemaster tends a garden in his mind. No one is allowed to walk in it."
10. "He scratched a grid into the stone with his fingernail. He counted. Can you?"

## Wrong Answer Taunts (rotate through these)

- "The Puzzlemaster's laughter echoes off the stone."
- "A faint scratching from above. Is he watching? He's always watching."
- "Not quite, Harry Bonds. Not quite."
- "The Puzzlemaster sighs. 'Try again.'"
- "The walls seem to close in slightly. Or is that your imagination?"

## Tech Details

- Pure HTML/CSS/JS, single page, canvas-based
- GitHub Pages hosting (static only, no backend)
- localStorage for progress persistence
- Answers verified via SHA-256 hash comparison
- No build tools — raw files
- Target device: Chromebook, Chrome browser, landscape

## Save Code System (not yet built)

Each solved puzzle generates a short deterministic code (8-12 chars). Kid can write codes down. On fresh browser, enter codes to restore progress. Codes = the save state. No backend needed.

## N-Strokes Chat (not yet built)

Will use Claude API client-side. N-Strokes can hear Harry Bonds but can't see puzzles. Kid must describe the problem. N-Strokes gives Socratic hints only, never answers.

## Future Stuff (don't build yet)

- The master puzzle on Harry Bonds' own door (visible but locked)
- The endgame fork: rescue N-Strokes ($1000, Harry Bonds stays locked in) vs rescue the Beast (it becomes his pet/the laptop)
- Beast brute-force algorithm visualization
- $25 / $50 / $100 tier challenge problems
- Sound effects

## Current Status

(Update this section as work progresses)
- [ ] Canvas with tile map and room layout
- [ ] Harry Bonds sprite with arrow key movement
- [ ] 10 puzzle stations placed around cell walls
- [ ] Spacebar interaction with puzzle popup
- [ ] Answer checking against hashed answers
- [ ] Beast cell lighting up progressively
- [ ] Beast awakening sequence at 10/10
- [ ] Save code generation
- [ ] N-Strokes chat integration
