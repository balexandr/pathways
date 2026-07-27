import styles from './HowToPlay.module.css';

const BLUE = '#3b82f6';
const ORANGE = '#f97316';

// A tiny fully-solved 3×3 example: which color owns each cell.
const EXAMPLE = [
  [BLUE, BLUE, BLUE],
  [ORANGE, ORANGE, BLUE],
  [ORANGE, ORANGE, BLUE],
];
const EXAMPLE_DOTS = {
  '0,0': BLUE, '0,2': BLUE,
  '1,0': ORANGE, '2,1': ORANGE,
};

export default function HowToPlay({ onClose }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>How to Play</h2>
        <p className={styles.intro}>Connect every pair of matching dots with a single line — and fill the entire grid doing it.</p>

        <div className={styles.steps}>
          <div className={styles.step}>
            <span className={styles.stepIcon}>👆</span>
            <div>
              <p className={styles.stepTitle}>Drag between matching dots</p>
              <p className={styles.stepDesc}>Press a colored dot and drag through the grid to its matching dot. Only up/down/left/right moves — no diagonals.</p>
            </div>
          </div>
          <div className={styles.step}>
            <span className={styles.stepIcon}>🧩</span>
            <div>
              <p className={styles.stepTitle}>Fill every cell</p>
              <p className={styles.stepDesc}>You haven't solved it until every single cell on the board belongs to a path — not just the pairs connected.</p>
            </div>
          </div>
          <div className={styles.step}>
            <span className={styles.stepIcon}>🔀</span>
            <div>
              <p className={styles.stepTitle}>Paths can't cross</p>
              <p className={styles.stepDesc}>Drag over another color's line and it gets ripped up so you can reroute through that space — redraw as much as you like.</p>
            </div>
          </div>
          <div className={styles.step}>
            <span className={styles.stepIcon}>⚡</span>
            <div>
              <p className={styles.stepTitle}>No submit button</p>
              <p className={styles.stepDesc}>The board solves itself the instant every cell is filled and every pair is connected — no need to confirm anything.</p>
            </div>
          </div>
        </div>

        <div className={styles.example}>
          <p className={styles.exampleLabel}>Solved example</p>
          <div className={styles.exampleGrid}>
            {EXAMPLE.map((row, r) => (
              <div key={r} className={styles.exRow}>
                {row.map((color, c) => {
                  const dotColor = EXAMPLE_DOTS[`${r},${c}`];
                  return (
                    <span key={c} className={styles.exCell} style={{ background: `${color}33`, borderColor: `${color}66` }}>
                      {dotColor && <span className={styles.exDot} style={{ background: dotColor }} />}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
          <p className={styles.exampleCaption}>Two colors, every cell filled, no crossings — that's a solve.</p>
        </div>

        <button className={styles.playButton} onClick={onClose}>
          Start playing
        </button>
      </div>
    </div>
  );
}
