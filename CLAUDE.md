# CLAUDE.md — Release the Beast

## What This Is

A browser-based RPG math/puzzle game for an 8-year-old kid. Pure HTML5 canvas, deployed on GitHub Pages. Single file: `game.js` + minimal `index.html`. No build tools, no backend. The kid solves puzzles to progress through a dungeon, wake a sleeping Beast, and eventually escape.

**Repo:** `strehlken/release-the-beast` (was `puzzlemaster-game`, renamed during this session)
**Pages URL:** https://strehlken.github.io/release-the-beast/
**Local dir:** `~/Documents/9_works/kids/release-the-beast/`

## Visual Style

Metal Gear NES (1987). Top-down, tile-based, pixel art. 8-bit palette: stone grays, torch orange, dark greens, black shadows. Press Start 2P font loaded from Google Fonts. CRT-style feel. Popups use a LIGHT gray background with dark text (not dark-on-dark).

## Architecture

Everything is in `game.js`. Single HTML5 canvas, 32px tiles, 23 cols x 13 rows.

### Map Layout (all walls 1 tile thick)
```
Row 0:    North wall
Rows 1-2: Corridor (runs full width, light at far right suggesting exit)
Row 3:    Wall with doors — beast door cols 2-5, Harry's door cols 12-13, N-Strokes door col 20
Rows 4-11: Cell interiors
Row 12:   South wall

Col 0:     West wall
Cols 1-6:  Beast's cell (dark, type 3)
Col 7:     Shared wall (beast vent at row 8, type 8)
Cols 8-17: Harry Bonds' cell (floor, type 0)
Col 18:    Shared wall (N-Strokes vent at row 8, type 8)
Cols 19-21: N-Strokes' cell (floor, type 5)
Col 22:    East wall
```

### Tile Types
- 0 = floor (Harry's cell, walkable)
- 1 = wall
- 2 = puzzle station (in wall)
- 3 = beast cell (pitch black)
- 4 = corridor (walkable when accessible)
- 5 = N-Strokes cell floor
- 6 = cell door (visual, non-walkable)
- 7 = Harry's puzzle door (interactable, becomes type 4 when solved)
- 8 = vent (on wall, interactable from adjacent floor)

### Key Constants
- `BEAST_CX`, `BEAST_CY`: center of beast cell for drawing
- `LIGHT_X = 7 * TILE`: light fixtures on inner face of beast cell right wall
- `CONE_END_X = BEAST_CX`: spotlights reach halfway into beast cell
- `CONE_SPREAD = TILE * 1.5`: narrow spotlight cone

## Characters

### Harry Bonds
- Player character. Always "Harry Bonds", never "Harry"
- Pixelated baseball kid: dark tan skin (#c68c5a), blue cap, white jersey with blue stripe, gray pants, wooden bat over shoulder
- Walk animation, 4-direction facing, eyes follow direction
- Arrow keys or WASD to move, spacebar to interact

### N-Strokes
- "The hyphen is not silent"
- Chained against far east wall of his cell (col 21, row 8)
- Grey bucket hat, olive shirt, shackles on wrists with chains to wall
- Eyes look left toward Harry Bonds
- Multi-page dialogue system through vent (col 18, row 8)

### The Beast
- Massive creature filling the entire beast cell vertically
- Drawn with pixel blocks (p=3): horns, head with red eyes, teeth, neck, shoulders with spines, ribcage, arms with claws, legs, feet
- Only visible where spotlight cones illuminate it (canvas clipping)
- Stirs (shake animation) when puzzles are solved — triggers 1.5s AFTER popup closes so player sees it
- The Beast IS the laptop in the real-world economy

### The Puzzlemaster
- Never seen. Heard through taunts, inscriptions, and angry shouts
- Sardonic, theatrical

## Puzzles Implemented

### 1. The Farmer's Riddle (puzzle station, south wall)
- "A farmer has chickens and cows. 8 heads, 26 legs. How many chickens?"
- **Answer: 3** (SHA-256 hashed, the old CLAUDE.md had 5 which was wrong)
- 5 attempts before lockout
- On solve: spotlight turns on at lightRow 7 in beast cell, beast stirs
- Save code generated deterministically from puzzle name + hash + salt
- Can revisit solved puzzle anytime to see answer + save code

### 2. The Wire Puzzle (Pythagorean theorem, one-shot)
Progressive quest through multiple stages (WIRE.stage 0-9):
- **Stage 0-1:** Look through beast vent — dark, can't see
- **Stage 2:** Look with farmer light on — see movement, door with switch. Told to ask N-Strokes
- **Stage 4:** After N-Strokes dialogue — return to vent, see distances (3 horizontal, 4 vertical). Input answer. ONE CHANCE.
- **Answer: 5** (diagonal = sqrt(3²+4²))
- **Stage 5:** Success — popup animation text, then beast doors open, beast cutscene plays
- **Stage 6:** Failure — wire spent, locked permanently
- **Stage 7:** After beast escapes — vent says creature is gone, talk to N-Strokes
- **Stage 8-9:** After N-Strokes dialogue ("the BEAST! Go look again.") — shows `assets/beast_vent.jpg` fullscreen

Contact points in beast cell:
- Point A: col 7, row 8 (vent crack) — pixel (224, 256)
- Point B: col 4, row 4 (near beast door) — pixel (128, 128)
- When solved: glowing wire drawn diagonally between them

### 3. The Master Door / Wordle Puzzle (north wall, cols 12-13)
Two-page popup:
- **Page 1:** Navier-Stokes millennium problem inscription. Puzzlemaster quip: "On second thought, I have been waiting a century..."
- **Page 2:** Two rows of Wordle tiles (colored squares, no letters):
  - Row 1: Green, Yellow, Gray, Green, Yellow
  - Row 2: Green, Green, Yellow, Yellow, Yellow
  - Gray = light gray (#787c7e), not dark
  - "Deduce the word. Even a child could do it."
- **Answer: "sneak"** (case-insensitive, 5 attempts)
- On solve: door tiles become walkable corridor (type 4)

## Beast Escape Cutscene

When wire puzzle is solved (stage 5):
1. Popup auto-closes after wire animation text
2. Beast door tiles (cols 2-5, row 3) open (become corridor)
3. Beast wiggles in place (offset shake)
4. Beast translates north to corridor center (row 1.5)
5. Rotates 90° CW (head-first going right), full size (no scaling!)
6. Glides east through corridor and out past the lit exit door
7. Beast goes COMPLETELY off screen before dialogue appears
8. Puzzlemaster dialogue in red at bottom: "Damn you! Get back in there!" / "Get! GET! That infernal Harry Bonds!" / "[Commotion ensues]"
9. Small laptop sprite appears where beast was sleeping (visible from start of cutscene)

## Corridor & Victory

- Solving the Wordle puzzle opens Harry's door (cols 12-13 become walkable)
- Harry can walk into corridor, explore left/right
- At far right end near exit light: spacebar triggers victory screen
- "DAYLIGHT" in gold, warm gradient, "You are free, Harry Bonds."
- ESC returns to game

## Systems

### Save Codes
- Each solved puzzle generates a deterministic 8-char code (XXXX-XXXX)
- Generated from SHA-256 of puzzle name + answer hash + salt
- Accessible via ESC menu → Insert Codes
- Entering a valid code marks that puzzle as solved

### Pause Menu (ESC)
- Resume, Insert Codes, Restart
- Restart resets all puzzle states, player position, map tiles, wire quest, beast scene

### Attempt Limits
- Regular puzzles: 5 attempts, then locked with message: "You will not be able to complete the game, though you can complete other puzzles and collect additional codes."
- Wire puzzle: 1 attempt (one-shot)
- Wordle puzzle: 5 attempts

### Spotlight System
- Each solved puzzle adds a light fixture on the inner right wall of beast cell
- Light cone shape: "ice cream scoop" — triangle from fixture to midpoint, ending in semicircle bulging LEFT (away from fixture)
- Gradient: bright near fixture, fading out
- Beast only visible where light cones clip (canvas clipping path)

## What Broke / Gotchas

- **sed destroyed game.js** once — it emptied the file. Always use Edit tool, never bash sed on this file.
- **Cutscene walk attempt (reverted):** Tried to make Harry physically walk across the room during wire puzzle. Got stuck, reverted 2 commits. The popup-based animation works. Cutscene walking is a future goal.
- **Beast disappearing during wire animation:** Fixed by delaying WIRE.stage = 5 until startBeastScene() is called, not when answer is submitted.
- **Beast scaling in corridor:** Removed the scale(0.3) — beast stays full size, just rotates.
- **Popup not auto-closing after wire solve:** Fixed by adding WIRE.animating flag to show animation text instead of input box during the text sequence.

## Files

- `index.html` — minimal shell, loads Press Start 2P font + game.js
- `game.js` — everything: map, player, puzzles, rendering, popups, cutscenes
- `style.css` — unused (legacy from old DOM version)
- `puzzles.js` — unused (legacy, puzzle data is now in game.js)
- `nstrokes.js` — unused (legacy)
- `assets/beast_vent.jpg` — image shown when looking through grate after N-Strokes says "Go look again"
- `assets/beast_cell.png`, `assets/beast_home.png` — additional assets, not yet used

## What's NOT Built Yet (from original design)

- [ ] Remaining 8 of the 10 puzzle stations (only farmer's riddle exists)
- [ ] Beast awakening stages text (0/10 through 10/10 — partially implemented via spotlights)
- [ ] N-Strokes AI chat integration (Claude API, Socratic hints)
- [ ] Save code restoration on page load (codes work via menu, not auto-load)
- [ ] localStorage persistence (not implemented — refresh loses progress)
- [ ] Sound effects
- [ ] Walking cutscene for wire puzzle (attempted, reverted — popup animation works for now)
- [ ] Endgame fork after seeing the laptop through vent
- [ ] What happens after you see beast_vent.jpg (next quest stage)
- [ ] The beast IS the laptop reveal / real-world economy tie-in
- [ ] Harry's own cell door puzzle (master puzzle concept)
- [ ] $25/$50/$100 tier challenge problems

## Session Notes

- Farmer's riddle answer is 3, not 5 (the old CLAUDE.md was wrong)
- Wordle answer is "sneak" (case-insensitive)
- Wire answer is 5 (Pythagorean: 3-4-5)
- All popups use light gray background (#c8c8d0) with dark text
- The Puzzlemaster's Navier-Stokes joke: he put an actual Millennium Prize problem on the door, then relented
- N-Strokes distinguishes between "the big oaf that wandered out" and "the BEAST" (the laptop)
