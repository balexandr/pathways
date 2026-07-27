import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import puzzles from '../data/puzzles.json';

const STORAGE_KEY = 'pathways-game-state';
const EPOCH = '2026-07-27';

function getTodayKey() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
}

function cellKey([r, c]) {
  return `${r},${c}`;
}

function loadState(dateKey) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (saved.dateKey !== dateKey) return null;
    return saved;
  } catch { return null; }
}

function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function emptyPaths(colors) {
  const p = {};
  for (const c of colors) p[c.id] = [];
  return p;
}

function isColorComplete(color, path) {
  if (!path || path.length < 2) return false;
  const [d1, d2] = color.dots;
  const first = path[0];
  const last = path[path.length - 1];
  const at = (pos, dot) => pos[0] === dot[0] && pos[1] === dot[1];
  const startsAtDot = at(first, d1) || at(first, d2);
  const endsAtDot = at(last, d1) || at(last, d2);
  const notSameCell = !(first[0] === last[0] && first[1] === last[1]);
  return startsAtDot && endsAtDot && notSameCell;
}

export function useGameState() {
  const dateKey = getTodayKey();
  const puzzle = puzzles[dateKey] || null;
  const puzzleNumber = Math.floor((new Date(dateKey) - new Date(EPOCH)) / 86400000) + 1;

  const [paths, setPathsState] = useState(() => (puzzle ? emptyPaths(puzzle.colors) : {}));
  const [gameStatus, setGameStatus] = useState('playing');
  const [interference, setInterference] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const timerRef = useRef(null);
  const elapsedRef = useRef(0);

  // Timer tick
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsedSeconds(elapsedRef.current);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  // Init
  useEffect(() => {
    if (!puzzle) { setInitialized(true); return; }

    const saved = loadState(dateKey);
    if (saved && saved.paths) {
      setPathsState(saved.paths);
      setGameStatus(saved.gameStatus || 'playing');
      setInterference(saved.interference || 0);
      elapsedRef.current = saved.elapsedSeconds || 0;
      setElapsedSeconds(elapsedRef.current);
      if ((saved.gameStatus || 'playing') === 'playing') setTimerRunning(true);
    } else {
      setTimerRunning(true);
    }
    setInitialized(true);
  }, [dateKey]);

  // Persist
  useEffect(() => {
    if (!initialized || !puzzle) return;
    saveState({ dateKey, paths, gameStatus, elapsedSeconds, interference });
  }, [paths, gameStatus, elapsedSeconds, interference, initialized]);

  // Dot ownership lookup: cellKey -> colorId, for cells that are puzzle dots
  const dotColorMap = useMemo(() => {
    if (!puzzle) return {};
    const map = {};
    for (const c of puzzle.colors) {
      for (const dot of c.dots) map[cellKey(dot)] = c.id;
    }
    return map;
  }, [puzzle]);

  // Which color currently owns each cell, derived from paths
  const cellOwner = useMemo(() => {
    const map = {};
    for (const [colorId, path] of Object.entries(paths)) {
      for (const pos of path) map[cellKey(pos)] = Number(colorId);
    }
    return map;
  }, [paths]);

  const filledCount = useMemo(
    () => Object.values(paths).reduce((sum, p) => sum + p.length, 0),
    [paths]
  );

  const completedColors = useMemo(() => {
    if (!puzzle) return new Set();
    const set = new Set();
    for (const c of puzzle.colors) {
      if (isColorComplete(c, paths[c.id])) set.add(c.id);
    }
    return set;
  }, [puzzle, paths]);

  const won = useMemo(() => {
    if (!puzzle) return false;
    if (filledCount !== puzzle.size * puzzle.size) return false;
    return puzzle.colors.every((c) => completedColors.has(c.id));
  }, [puzzle, filledCount, completedColors]);

  useEffect(() => {
    if (won && gameStatus === 'playing') {
      setGameStatus('won');
      setTimerRunning(false);
    }
  }, [won, gameStatus]);

  const setPaths = useCallback((updater) => {
    if (gameStatus !== 'playing') return;
    setPathsState((prev) => (typeof updater === 'function' ? updater(prev) : updater));
  }, [gameStatus]);

  // Called whenever a drag steals a non-dot cell out from under another
  // color's existing pipe — used for the share card's "clean solve" badge.
  const recordInterference = useCallback(() => {
    setInterference((n) => n + 1);
  }, []);

  const generateShareText = useCallback(() => {
    if (!puzzle) return '';
    const mm = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
    const ss = String(elapsedSeconds % 60).padStart(2, '0');
    const badge = interference === 0 ? '✨ Clean' : `🔁 ${interference} redraw${interference === 1 ? '' : 's'}`;
    return `Pathways #${puzzleNumber} ⚡\n⏱ ${mm}:${ss}  •  ${badge}`;
  }, [puzzle, elapsedSeconds, interference, puzzleNumber]);

  return {
    puzzle,
    dateKey,
    puzzleNumber,
    initialized,
    paths,
    setPaths,
    dotColorMap,
    cellOwner,
    completedColors,
    filledCount,
    interference,
    recordInterference,
    gameStatus,
    elapsedSeconds,
    timerRunning,
    generateShareText,
  };
}
