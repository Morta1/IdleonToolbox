import React from 'react';
import { useTheme } from '@mui/material';
import {
  GRID_CELLS,
  GRID_COLUMNS,
  getGridLabel,
  getShapeVertices
} from '@parsers/world-7/researchOptimizer';

// The game's board in its own pixels: nodes on a 30 px pitch from (15, 24), 26 px drawn.
const cellX = (node) => 17 + 30 * (node % GRID_COLUMNS);
const cellY = (node) => 26 + 30 * Math.floor(node / GRID_COLUMNS);
const FULL = [14, 23, 602, 362];
const points = (vertices) => vertices.map(([x, y]) => `${x},${y}`).join(' ');
const middle = (vertices) => [vertices.reduce((sum, [x]) => sum + x, 0) / vertices.length, vertices.reduce((sum, [, y]) => sum + y, 0) / vertices.length]
  .map(Math.round);

// The box round some shapes, snapped out to whole cells, for a close-up.
export const cropAround = (catalog, placements, pad = 20) => {
  const all = placements.flatMap((placement) => getShapeVertices(catalog[placement.shape], placement));
  const xs = all.map(([x]) => x);
  const ys = all.map(([, y]) => y);
  const left = Math.max(FULL[0], 17 + 30 * Math.floor((Math.min(...xs) - pad - 17) / 30) - 3);
  const top = Math.max(FULL[1], 26 + 30 * Math.floor((Math.min(...ys) - pad - 26) / 30) - 3);
  const right = Math.min(FULL[0] + FULL[2], 17 + 30 * Math.ceil((Math.max(...xs) + pad - 17) / 30) - 1);
  const bottom = Math.min(FULL[1] + FULL[3], 26 + 30 * Math.ceil((Math.max(...ys) + pad - 26) / 30) - 1);
  return [left, top, right - left, bottom - top];
};

/**
 * The Research grid with shapes over it. `stays` are drawn faint, `moves` (in order) dashed where they are now and solid
 * where they go, with their step number. `focus` dims every move but that one. `labels` prints each cell's coordinate.
 */
const ShapeBoard = ({ closeUp = false, goalNodes = [], catalog, levels, maxLevels, selectable, stays = [], moves = [], focus = null, view = FULL, labels = false, label }) => {
  const theme = useTheme();
  const palette = (theme.vars || theme).palette;
  const grid = palette.identity.researchGrid;
  const shapeColor = (shape) => palette.identity.researchShapes[shape]?.line ?? palette.identity.researchShapes[0].line;
  const [vx, vy, vw, vh] = view;
  const inView = (node) => cellX(node) + 26 >= vx && cellX(node) <= vx + vw && cellY(node) + 26 >= vy && cellY(node) <= vy + vh;
  const nodes = Array.from({ length: GRID_CELLS }, (_, node) => node).filter(inView);
  const id = `research-board-${vx}-${vy}-${vw}`;
  return <svg viewBox={view.join(' ')} role={'img'} aria-label={label} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 6 }}>
    <defs>
      <pattern id={id} x={17} y={26} width={30} height={30} patternUnits={'userSpaceOnUse'}>
        <rect width={26} height={26} style={{ fill: grid.closed }}/>
      </pattern>
    </defs>
    <rect x={vx} y={vy} width={vw} height={vh} style={{ fill: palette.identity.frame.surface }}/>
    <rect x={vx} y={vy} width={vw} height={vh} fill={`url(#${id})`}/>
    {nodes.map((node) => {
      const level = levels[node] ?? 0;
      if (level <= 0 && !selectable[node]) return null;
      const max = Math.max(1, maxLevels[node] ?? 1);
      return <g key={node}>
        <rect x={cellX(node)} y={cellY(node)} width={26} height={26} style={{ fill: level > 0 ? grid.unfilled : grid.open, stroke: grid.edge, strokeWidth: 1.5 }}/>
        {level > 0 ? <rect x={cellX(node)} y={cellY(node)} width={26} height={(26 * Math.min(level, max)) / max} style={{ fill: grid.levelled }}/> : null}
      </g>;
    })}
    {/* Under the shapes, so an outline never hides one */}
    {goalNodes.filter((node) => (levels[node] ?? 0) > 0 && inView(node)).map((node) => <rect
      key={`goal-${node}`} x={cellX(node)} y={cellY(node)} width={26} height={26}
      style={{ fill: 'none', stroke: palette.primary.main, strokeWidth: 3 }}/>)}
    {stays.map((placement) => <polygon key={`stay-${placement.shape}`} points={points(getShapeVertices(catalog[placement.shape], placement))}
                                       style={{ fill: shapeColor(placement.shape), fillOpacity: 0.16, stroke: shapeColor(placement.shape), strokeWidth: 1.5 }}/>)}
    {moves.map(({ from, to }, i) => {
      const color = shapeColor(to.shape);
      const toVertices = getShapeVertices(catalog[to.shape], to);
      const [bx, by] = middle(toVertices);
      return <g key={`move-${to.shape}`} style={{ opacity: focus == null || focus === i ? 1 : 0.12 }}>
        {from ? <polygon points={points(getShapeVertices(catalog[from.shape], from))}
                         style={{ fill: 'none', stroke: color, strokeWidth: 1.5, strokeDasharray: '4 4', opacity: 0.8 }}/> : null}
        {/* A dark edge round the shape keeps it readable over light cells and outlines */}
        <polygon points={points(toVertices)} style={{ fill: 'none', stroke: palette.identity.frame.surface, strokeWidth: closeUp ? 7 : 5.5, strokeLinejoin: 'round' }}/>
        <polygon points={points(toVertices)}
                 style={{ fill: color, fillOpacity: closeUp ? 0.45 : 0.3, stroke: color, strokeWidth: closeUp ? 3.5 : 2.5, strokeLinejoin: 'round' }}/>
        {/* The close-up names its step beside it, so the number would only cover the cells */}
        {closeUp ? null : <>
          <circle cx={bx} cy={by} r={11} style={{ fill: palette.identity.frame.surface, stroke: color, strokeWidth: 2 }}/>
          <text x={bx} y={by + 4.5} textAnchor={'middle'} fontSize={13} fontWeight={700} style={{ fill: palette.identity.frame.text }}>{i + 1}</text>
        </>}
      </g>;
    })}
    {/* Coordinates last, so a shape never hides the cell it should land on */}
    {labels ? nodes.filter((node) => (levels[node] ?? 0) > 0 || selectable[node]).map((node) => <text
      key={`label-${node}`} x={cellX(node) + 13} y={cellY(node) + 17} textAnchor={'middle'} fontSize={9} fontWeight={700}
      style={{ fill: palette.identity.frame.text, paintOrder: 'stroke', stroke: palette.identity.frame.surface, strokeWidth: 2.5 }}>{getGridLabel(node)}</text>) : null}
  </svg>;
};

export default ShapeBoard;
