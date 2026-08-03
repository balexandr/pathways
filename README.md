# Pathways — Daily Flow Puzzle

A daily puzzle game where you connect matching colored dot pairs with a single unbroken line — and fill every cell on the grid doing it.

Part of the [NoodleGames](https://noodlegames.co) family alongside **Knot** and **Zero In**.

---

## How to play

Drag between two dots of the same color to connect them, moving up/down/left/right only. The board isn't solved until **every cell** belongs to a path, not just the pairs that are connected.

- Drag over another color's line and it gets ripped up so you can reroute through that space — redraw as much as you like.
- There's no submit button: the board solves itself the instant every cell is filled and every pair is connected.
- Resets daily at **midnight ET**.

---

## Scoring

| | |
|---|---|
| **Time** | How long from page load to solving |
| **Redraws** | How many times a color's path got overwritten by another |

---

## Sharing

After a solve you can share your time and redraw count. Once you've finished at least one NoodleGame today, a **Share all completed** button appears in the footer, letting you share every game you've solved today in one message.

---

## Stack

React + Vite · CSS Modules · localStorage · GitHub Pages

---

## Puzzles

Puzzles run from **July 27, 2026** through **January 13, 2027** (171 days), stored in `src/data/puzzles.json` keyed by date.

Difficulty follows the day of the week — easiest on Monday, climbing daily, hardest on Sunday, then resetting:

| Day | Grid | Colors |
|---|---|---|
| Monday | 5×5 | 5 |
| Tuesday | 6×6 | 5 |
| Wednesday | 6×6 | 6 |
| Thursday | 7×7 | 6 |
| Friday | 7×7 | 7 |
| Saturday | 8×8 | 7 |
| Sunday | 8×8 | 8 |

Puzzles are generated, not hand-written: `scripts/generate-puzzles.mjs` finds a randomized Hamiltonian path covering the entire grid (a route touching every cell exactly once), then cuts it into contiguous segments — each segment's two endpoints become a color's dot pair, and the segment itself proves the puzzle is solvable. Re-run with `npm run generate-puzzles` to extend or regenerate the set.
