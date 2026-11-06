import React, { useState } from 'react';
import { Box, ButtonBase, Stack } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import HiddenCapLine from '@components/common/HiddenCapLine';
import ItemCard from '@components/common/cards/ItemCard';
import Panel from '@components/common/cards/Panel';
import { getShapeColor, hasShape } from './researchGridShared';

const COLS = 20;
const CELL_SIZE = 30;

/** Compute border/fill/tint for a grid cell from square data */
function getCellColors(theme, sq) {
  const level = sq?.level ?? 0;
  const hasLevel = level >= 1;
  const canSelect = sq?.canSelect ?? false;

  if (hasShape(sq)) {
    const { line, tint } = getShapeColor(theme, sq.placementShapeIndex);
    return { borderColor: line, fillColor: line, unfilledBg: 'identity.researchGrid.unfilled', affectedTint: hasLevel ? null : tint };
  }
  if (hasLevel) {
    return { borderColor: 'identity.researchGrid.levelled', fillColor: 'identity.researchGrid.levelled', unfilledBg: 'identity.researchGrid.unfilled', affectedTint: null };
  }
  return {
    borderColor: 'identity.researchGrid.edge',
    fillColor: 'identity.researchGrid.unfilled',
    unfilledBg: canSelect ? 'identity.researchGrid.open' : 'identity.researchGrid.closed',
    affectedTint: null
  };
}

const gridContainerSx = {
  display: 'inline-grid',
  gridTemplateColumns: `repeat(${COLS}, ${CELL_SIZE}px)`,
  gridAutoRows: `${CELL_SIZE}px`,
  gap: 1,
  p: 1.5,
  bgcolor: 'background.default',
  borderRadius: 1,
  border: '1px solid',
  borderColor: 'divider',
  maxWidth: '100%',
  overflow: 'auto'
};

const CELL_BOX = {
  width: CELL_SIZE - 4,
  height: CELL_SIZE - 4,
  minWidth: CELL_SIZE - 4,
  minHeight: CELL_SIZE - 4,
  border: '2px solid',
  borderRadius: 0.5,
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

/** One cell, its level filling top to bottom. A selectable one is a button that picks it (Decision 2). */
const GridCell = ({ sq, selected, onPick }) => {
  const level = sq?.level ?? 0;
  const maxLv = Math.max(1, sq?.maxLv ?? 1);
  const fillCount = Math.min(level, maxLv);
  const canSelect = sq?.canSelect ?? false;
  const inner = <>
    <Box sx={(theme) => ({ position: 'absolute', inset: 0, bgcolor: getCellColors(theme, sq).unfilledBg })}/>
    <Box sx={(theme) => ({ position: 'absolute', inset: 0, bgcolor: getCellColors(theme, sq).affectedTint ?? 'transparent', pointerEvents: 'none' })}/>
    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      {Array.from({ length: maxLv }, (_, segIndex) => <Box key={segIndex} sx={(theme) => ({
        flex: 1,
        minHeight: 0,
        bgcolor: segIndex < fillCount ? getCellColors(theme, sq).fillColor : 'transparent'
      })}/>)}
    </Box>
  </>;
  const look = (theme) => ({ ...CELL_BOX, borderColor: getCellColors(theme, sq).borderColor });
  if (!canSelect) return <Box sx={look}>{inner}</Box>;
  return <ButtonBase aria-label={cleanUnderscore(sq?.name)} aria-pressed={selected} onClick={onPick}
                     sx={[look, selected && { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 1 }]}>
    {inner}
  </ButtonBase>;
};

/** Grid view: fixed 20-column layout (the game's own index % 20 addressing), row count derived from the catalog so a
 * future grid growing past 12 rows renders without a code change. One square's details at a time, under the board. */
const GridView = ({ squares }) => {
  const [picked, setPicked] = useState(null);
  const cellCount = Math.max(squares?.length ?? 0, COLS);
  const rows = Math.ceil(cellCount / COLS);
  const firstSelectable = (squares ?? []).findIndex((square) => square?.canSelect);
  const index = picked ?? (firstSelectable >= 0 ? firstSelectable : null);
  const square = index != null ? squares?.[index] : null;
  const name = cleanUnderscore(square?.name);

  return <Stack gap={2} alignItems={'center'}>
    <Box sx={gridContainerSx} role={'group'} aria-label={'Research grid'}>
      {Array.from({ length: rows * COLS }, (_, i) => <GridCell key={i} sq={squares?.[i] ?? null} selected={i === index}
                                                                onPick={() => setPicked(i)}/>)}
    </Box>
    {square ? <Panel title={name} meta={formatNum(square.level ?? 0, 'level', { max: Math.max(1, square.maxLv ?? 1) })}
                     sx={{ width: '100%', maxWidth: 640 }}>
      <Stack gap={1} sx={{ px: 2, py: 1.5 }}>
        {square.description ? <ItemCard.Desc text={square.description}/> : null}
        <HiddenCapLine system={'grid'} index={index} name={name}/>
      </Stack>
      {hasShape(square) && square.shapeAffectMultiplier != null
        ? <Panel.KV label={'Shape multi'} value={formatNum(Number(square.shapeAffectMultiplier), 'mult')}/>
        : null}
    </Panel> : null}
  </Stack>;
};

export default GridView;
