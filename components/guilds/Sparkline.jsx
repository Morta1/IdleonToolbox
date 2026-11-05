import { useEffect, useRef, useState } from 'react';

// A list shows hundreds of these, so each draws once it is near the screen: one shared observer, and a box of the same
// size until then, so nothing jumps.
let observer = null;
const waiting = new Map();
const watch = (element, onSeen) => {
  if (typeof IntersectionObserver === 'undefined') {
    onSeen();
    return () => {};
  }
  observer ??= new IntersectionObserver((entries) => entries.forEach(({ isIntersecting, target }) => {
    if (!isIntersecting) return;
    observer.unobserve(target);
    waiting.get(target)?.();
    waiting.delete(target);
  }), { rootMargin: '300px' });
  waiting.set(element, onSeen);
  observer.observe(element);
  return () => {
    observer.unobserve(element);
    waiting.delete(element);
  };
};

// A tenth of a pixel is all the line needs.
const tenth = (value) => Math.round(value * 10) / 10;

// wide: a tile's line (Cards board, a hero with its number's history): the line alone, across the box it sits in, its
// stroke unstretched. width is then only the drawing's shape.
export default function Sparkline({ values, width = 70, height = 22, color, wide = false }) {
  const box = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => (box.current ? watch(box.current, () => setSeen(true)) : undefined), []);
  if (!values || values.length < 2) return null;
  // Drop leading nulls (member wasn't in the guild yet); treat interior nulls as 0.
  const firstReal = values.findIndex((v) => v !== null);
  if (firstReal === -1) return null;
  const plotValues = values.slice(firstReal).map((v) => v ?? 0);
  if (plotValues.length < 2) return null;
  if (!seen) return <span ref={box} style={{ display: 'block', width: wide ? '100%' : width, height }}/>;
  const min = Math.min(...plotValues);
  const max = Math.max(...plotValues);
  const range = max - min || 1;
  const coords = plotValues.map((v, i) => {
    const x = (i / (plotValues.length - 1)) * (width - 2) + 1;
    const y = height - 2 - ((v - min) / range) * (height - 4);
    return [x, y];
  });
  const linePoints = coords.map(([x, y]) => `${tenth(x)},${tenth(y)}`).join(' ');
  if (wide) {
    return <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio={'none'} aria-hidden style={{ display: 'block', width: '100%', height }}>
      <polyline points={linePoints} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
    </svg>;
  }
  const baselineY = height - 1;
  const firstX = coords[0][0];
  const [lastX, lastY] = coords[coords.length - 1];
  const areaPoints = [
    `${tenth(firstX)},${baselineY}`,
    ...coords.map(([x, y]) => `${tenth(x)},${tenth(y)}`),
    `${tenth(lastX)},${baselineY}`
  ].join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polygon points={areaPoints} fill={color} fillOpacity="0.2" />
      <polyline points={linePoints} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r="2" fill={color} />
    </svg>
  );
}
