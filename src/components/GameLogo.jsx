export function GameLogo() {
  const blue = '#3b82f6';
  const copper = '#d97757';

  const bluePath = [[8, 8], [24, 8], [24, 24], [8, 24]];
  const copperPath = [[40, 8], [40, 24], [40, 40], [24, 40]];

  return (
    <svg viewBox="0 0 48 48" width="24" height="24" aria-hidden="true" style={{ flexShrink: 0 }}>
      {bluePath.slice(1).map(([x2, y2], i) => {
        const [x1, y1] = bluePath[i];
        return <line key={`b${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={blue} strokeWidth="3" strokeLinecap="round" />;
      })}
      {copperPath.slice(1).map(([x2, y2], i) => {
        const [x1, y1] = copperPath[i];
        return <line key={`c${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={copper} strokeWidth="3" strokeLinecap="round" />;
      })}
      <circle cx="8" cy="8" r="3.4" fill={blue} />
      <circle cx="8" cy="24" r="3.4" fill={blue} />
      <circle cx="40" cy="8" r="3.4" fill={copper} />
      <circle cx="24" cy="40" r="3.4" fill={copper} />
    </svg>
  );
}
