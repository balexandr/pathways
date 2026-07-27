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

## Stack

React + Vite · CSS Modules · localStorage · GitHub Pages

---

## Puzzles

Puzzles run from **July 14, 2026** through **December 31, 2026** (171 days), stored in `src/data/puzzles.json` keyed by date. Every puzzle is a 5×5 grid with 5 color pairs.

Puzzles are generated, not hand-written: `scripts/generate-puzzles.mjs` finds a randomized Hamiltonian path covering the entire grid (a route touching every cell exactly once), then cuts it into 5 contiguous segments — each segment's two endpoints become a color's dot pair, and the segment itself proves the puzzle is solvable. Re-run with `npm run generate-puzzles` to extend or regenerate the set.
