export default function Sparkline({ values, width = 70, height = 22, color }) {
  if (!values || values.length < 2) return null;
  // Drop leading nulls (member wasn't in the guild yet); treat interior nulls as 0.
  const firstReal = values.findIndex(v => v !== null);
  if (firstReal === -1) return null;
  const plotValues = values.slice(firstReal).map(v => v ?? 0);
  if (plotValues.length < 2) return null;
  const min = Math.min(...plotValues);
  const max = Math.max(...plotValues);
  const range = max - min || 1;
  const coords = plotValues.map((v, i) => {
    const x = (i / (plotValues.length - 1)) * (width - 2) + 1;
    const y = height - 2 - ((v - min) / range) * (height - 4);
    return [x, y];
  });
  const linePoints = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const baselineY = height - 1;
  const firstX = coords[0][0];
  const [lastX, lastY] = coords[coords.length - 1];
  const areaPoints = [
    `${firstX.toFixed(1)},${baselineY}`,
    ...coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`),
    `${lastX.toFixed(1)},${baselineY}`
  ].join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polygon points={areaPoints} fill={color} fillOpacity="0.2" />
      <polyline points={linePoints} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r="2" fill={color} />
    </svg>
  );
}
