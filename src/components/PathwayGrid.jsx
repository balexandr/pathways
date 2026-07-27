import { useRef, useCallback, useEffect } from 'react';
import styles from './PathwayGrid.module.css';

function isAdjacent([r1, c1], [r2, c2]) {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
}

function cellKey([r, c]) {
  return `${r},${c}`;
}

export default function PathwayGrid({
  puzzle,
  paths,
  dotColorMap,
  cellOwner,
  completedColors,
  gameStatus,
  onPathsChange,
  onInterference,
}) {
  const { size, colors } = puzzle;
  const won = gameStatus === 'won';

  const drawingRef = useRef(null);
  const gridRef = useRef(null);

  const colorById = {};
  for (const c of colors) colorById[c.id] = c;

  const cellFromPoint = useCallback((x, y) => {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const cell = el.closest('[data-row]');
    if (!cell) return null;
    return [parseInt(cell.dataset.row), parseInt(cell.dataset.col)];
  }, []);

  const handlePointerDown = useCallback((e, r, c) => {
    if (won) return;
    const colorId = dotColorMap[cellKey([r, c])];
    if (colorId === undefined) return;
    e.preventDefault();
    drawingRef.current = { colorId };
    onPathsChange({ ...paths, [colorId]: [[r, c]] });
  }, [won, dotColorMap, paths, onPathsChange]);

  const handlePointerMove = useCallback((e) => {
    if (!drawingRef.current || won) return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const pos = cellFromPoint(clientX, clientY);
    if (!pos) return;
    const [r, c] = pos;
    const { colorId } = drawingRef.current;
    const path = paths[colorId] || [];
    if (path.length === 0) return;

    const last = path[path.length - 1];
    if (last[0] === r && last[1] === c) return;

    // Stepping back onto the second-to-last cell shrinks the path — lets
    // the player retrace without penalty, same forgiving feel as Chain Link.
    if (path.length >= 2) {
      const secondLast = path[path.length - 2];
      if (secondLast[0] === r && secondLast[1] === c) {
        onPathsChange({ ...paths, [colorId]: path.slice(0, -1) });
        return;
      }
    }

    if (!isAdjacent(last, [r, c])) return;

    const k = cellKey([r, c]);
    const targetDotColor = dotColorMap[k];
    if (targetDotColor !== undefined && targetDotColor !== colorId) return; // another color's dot — hard blocked

    const ownSet = new Set(path.map(cellKey));
    if (ownSet.has(k)) return;

    const next = { ...paths, [colorId]: [...path, [r, c]] };
    const owner = cellOwner[k];
    if (owner !== undefined && owner !== colorId) {
      next[owner] = []; // steal: ripping up another color's pipe
      onInterference();
    }
    onPathsChange(next);
  }, [won, paths, cellOwner, dotColorMap, cellFromPoint, onPathsChange, onInterference]);

  const handlePointerUp = useCallback(() => {
    drawingRef.current = null;
  }, []);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    el.addEventListener('touchmove', handlePointerMove, { passive: false });
    el.addEventListener('touchend', handlePointerUp, { passive: false });
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    return () => {
      el.removeEventListener('touchmove', handlePointerMove);
      el.removeEventListener('touchend', handlePointerUp);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const cellSize = 100 / size;

  return (
    <div className={styles.boardFrame}>
      <div
        className={styles.gridWrap}
        ref={gridRef}
        style={{ '--size': size }}
        onMouseDown={(e) => {
          const cell = e.target.closest('[data-row]');
          if (cell) handlePointerDown(e, parseInt(cell.dataset.row), parseInt(cell.dataset.col));
        }}
        onTouchStart={(e) => {
          const cell = e.target.closest('[data-row]');
          if (cell) handlePointerDown(e, parseInt(cell.dataset.row), parseInt(cell.dataset.col));
        }}
      >
        <svg className={styles.pathSvg} aria-hidden="true">
          {colors.map((color) => {
            const path = paths[color.id] || [];
            const done = completedColors.has(color.id);
            return path.slice(1).map((pos, i) => {
              const [r1, c1] = path[i];
              const [r2, c2] = pos;
              const x1 = (c1 + 0.5) * cellSize;
              const y1 = (r1 + 0.5) * cellSize;
              const x2 = (c2 + 0.5) * cellSize;
              const y2 = (r2 + 0.5) * cellSize;
              return (
                <line
                  key={`${color.id}-${i}`}
                  x1={`${x1}%`} y1={`${y1}%`}
                  x2={`${x2}%`} y2={`${y2}%`}
                  className={styles.pathLine}
                  style={{
                    stroke: color.hex,
                    opacity: done ? 0.95 : 0.8,
                    filter: `drop-shadow(0 0 4px ${color.hex}) drop-shadow(0 0 10px ${color.hex}88)`,
                  }}
                />
              );
            });
          })}
        </svg>

        <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${size}, 1fr)`, gridTemplateRows: `repeat(${size}, 1fr)` }}>
          {Array.from({ length: size }).map((_, r) =>
            Array.from({ length: size }).map((_, c) => {
              const k = cellKey([r, c]);
              const ownerId = cellOwner[k];
              const owner = ownerId !== undefined ? colorById[ownerId] : null;
              const dotColorId = dotColorMap[k];
              const dotColor = dotColorId !== undefined ? colorById[dotColorId] : null;
              const done = dotColor && completedColors.has(dotColor.id);

              const cellStyle = owner
                ? {
                    background: `${owner.hex}26`,
                    borderColor: `${owner.hex}55`,
                  }
                : undefined;

              return (
                <div
                  key={k}
                  className={`${styles.cell} ${owner ? styles.cellFilled : ''}`}
                  style={cellStyle}
                  data-row={r}
                  data-col={c}
                >
                  {dotColor && (
                    <span
                      className={`${styles.dot} ${done ? styles.dotDone : ''}`}
                      style={{ background: dotColor.hex, boxShadow: `0 0 10px ${dotColor.hex}, 0 0 20px ${dotColor.hex}55` }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
