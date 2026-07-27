// Offline puzzle generator for Pathways.
//
// Each puzzle is a square grid where every cell must end up covered by
// exactly one colored path connecting that color's two dots. We generate a
// puzzle by first finding a Hamiltonian path over the whole grid (a route
// that visits every cell exactly once), then cutting that single path into
// K contiguous segments. Each segment's two endpoints become a color's dot
// pair, and the segment itself is proof the puzzle has at least one valid
// solution — the player doesn't need to reconstruct our exact route, just
// any set of non-crossing paths that connects every pair and fills the grid.
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const EPOCH = '2026-07-27';
const NUM_DAYS = 171; // through 2027-01-13

const PALETTE = [
  { name: 'red', hex: '#f43f5e' },
  { name: 'blue', hex: '#3b82f6' },
  { name: 'green', hex: '#22c55e' },
  { name: 'yellow', hex: '#eab308' },
  { name: 'orange', hex: '#f97316' },
  { name: 'purple', hex: '#a855f7' },
  { name: 'cyan', hex: '#06b6d4' },
  { name: 'pink', hex: '#ec4899' },
];

// Difficulty follows the day of the week: easiest on Monday, climbing every
// day, hardest on Sunday, then resets back down on Monday. Index 0 = Monday
// ... index 6 = Sunday. Reorder/edit this array to change the weekly curve
// (the max is 8 colors — that's all the 8-color PALETTE supports).
const WEEKLY_DIFFICULTY = [
  { size: 5, colors: 5 }, // Monday
  { size: 6, colors: 5 }, // Tuesday
  { size: 6, colors: 6 }, // Wednesday
  { size: 7, colors: 6 }, // Thursday
  { size: 7, colors: 7 }, // Friday
  { size: 8, colors: 7 }, // Saturday
  { size: 8, colors: 8 }, // Sunday
];

function difficultyForDate(dateKey) {
  // getUTCDay(): Sun=0..Sat=6. Shift so Mon=0..Sun=6 to index the array above.
  const utcDay = new Date(`${dateKey}T00:00:00Z`).getUTCDay();
  const mondayIndexed = (utcDay + 6) % 7;
  return WEEKLY_DIFFICULTY[mondayIndexed];
}

// djb2 string hash -> uint32 seed
function hashSeed(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  }
  return h >>> 0;
}

// mulberry32 PRNG
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rng) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function neighbors(r, c, size) {
  const out = [];
  if (r > 0) out.push([r - 1, c]);
  if (r < size - 1) out.push([r + 1, c]);
  if (c > 0) out.push([r, c - 1]);
  if (c < size - 1) out.push([r, c + 1]);
  return out;
}

// Randomized DFS with Warnsdorff's rule (prefer neighbors with the fewest
// onward options) — finds a full-coverage Hamiltonian path on grid graphs
// up to ~7x7. Two safeguards keep it fast:
//  1. Parity check: a grid's checkerboard coloring is unbalanced whenever
//     size is odd (one more cell of one color than the other). An open
//     Hamiltonian path can only start AND end on the majority color — a
//     start on the minority color is provably impossible, but plain DFS
//     backtracking has no way to know that up front and will exhaustively
//     search a combinatorially enormous dead-end tree before giving up.
//     So we only ever start from majority-color cells.
//  2. Step budget: caps how much work a single attempt can do before we
//     abandon it and retry with a fresh start, so even an unlucky ordering
//     fails fast instead of hanging.
function findHamiltonianPath(size, rng, maxAttempts = 300, stepBudget = 150000) {
  const total = size * size;
  const key = (r, c) => r * size + c;
  const majorityParity = 0; // (r+c) % 2 === 0 is always >= the other class

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const visited = new Uint8Array(total);
    const path = [];
    let steps = 0;
    let budgetExceeded = false;

    function degree(r, c) {
      let d = 0;
      for (const [nr, nc] of neighbors(r, c, size)) {
        if (!visited[key(nr, nc)]) d++;
      }
      return d;
    }

    function backtrack(r, c) {
      if (++steps > stepBudget) { budgetExceeded = true; return false; }

      visited[key(r, c)] = 1;
      path.push([r, c]);
      if (path.length === total) return true;

      let nbrs = neighbors(r, c, size).filter(([nr, nc]) => !visited[key(nr, nc)]);
      nbrs = shuffle(nbrs, rng)
        .map((n) => ({ n, deg: degree(n[0], n[1]) }))
        .sort((a, b) => a.deg - b.deg)
        .map((x) => x.n);

      for (const [nr, nc] of nbrs) {
        if (backtrack(nr, nc)) return true;
        if (budgetExceeded) return false;
      }

      visited[key(r, c)] = 0;
      path.pop();
      return false;
    }

    let startR, startC;
    if (size % 2 === 1) {
      // Restrict to majority-parity cells so we never waste time on a
      // provably-infeasible start.
      do {
        startR = Math.floor(rng() * size);
        startC = Math.floor(rng() * size);
      } while ((startR + startC) % 2 !== majorityParity);
    } else {
      startR = Math.floor(rng() * size);
      startC = Math.floor(rng() * size);
    }

    if (backtrack(startR, startC)) return path;
  }
  return null;
}

function cutIntoSegments(path, k, rng, minLen = 3) {
  const total = path.length;
  // Guarantee every segment is at least minLen cells so no color ends up
  // with a trivially-adjacent dot pair (boring, zero-maze-required puzzle).
  const m = total >= k * minLen ? minLen : Math.floor(total / k);
  const slack = total - k * m;

  const lengths = Array.from({ length: k }, () => m);
  for (let s = 0; s < slack; s++) {
    lengths[Math.floor(rng() * k)] += 1;
  }

  const segments = [];
  let idx = 0;
  for (const len of lengths) {
    segments.push(path.slice(idx, idx + len));
    idx += len;
  }
  return segments;
}

function generatePuzzle(dateKey) {
  const rng = mulberry32(hashSeed(dateKey));
  const { size, colors: k } = difficultyForDate(dateKey);

  const hamPath = findHamiltonianPath(size, rng);
  if (!hamPath) throw new Error(`Failed to generate Hamiltonian path for ${dateKey}`);

  // Bigger boards get a higher minimum segment length too, so harder days
  // don't just add more colors to the same short, easy connections.
  const minLen = size >= 7 ? 4 : 3;
  const segments = cutIntoSegments(hamPath, k, rng, minLen);
  const palette = shuffle(PALETTE, rng).slice(0, k);

  const colors = segments.map((seg, i) => ({
    id: i,
    name: palette[i].name,
    hex: palette[i].hex,
    dots: [seg[0], seg[seg.length - 1]],
  }));

  return { size, colors };
}

function formatDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function main() {
  const puzzles = {};
  const start = new Date(`${EPOCH}T00:00:00Z`);

  for (let i = 0; i < NUM_DAYS; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    const dateKey = formatDateKey(d);
    puzzles[dateKey] = generatePuzzle(dateKey);
  }

  const outPath = join(__dirname, '..', 'src', 'data', 'puzzles.json');
  writeFileSync(outPath, JSON.stringify(puzzles, null, 2));
  console.log(`Generated ${NUM_DAYS} puzzles -> ${outPath}`);
}

main();
