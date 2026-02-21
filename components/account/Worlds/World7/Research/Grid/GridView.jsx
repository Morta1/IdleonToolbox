import React from 'react';
import Tooltip from '@components/Tooltip';
import { Box, Stack, Typography, Divider } from '@mui/material';
import { cleanUnderscore } from '@utility/helpers';
import { getShapeColor, hasShape } from './researchGridShared';

const COLS = 20;
const ROWS = 12;
const CELL_SIZE = 30;

/** Compute border/fill/tint for a grid cell from square data */
function getCellColors(sq) {
  const level = sq?.level ?? 0;
  const hasLevel = level >= 1;
  const canSelect = sq?.canSelect ?? false;

  if (hasShape(sq)) {
    const sc = getShapeColor(sq.placementShapeIndex);
    return {
      borderColor: sc.border,
      fillColor: sc.fill,
      unfilledBg: 'grey.700',
      affectedTint: hasLevel ? null : sc.tint,
    };
  }
  if (hasLevel) {
    return { borderColor: 'grey.500', fillColor: 'grey.500', unfilledBg: 'grey.700', affectedTint: null };
  }
  return {
    borderColor: 'grey.600',
    fillColor: 'grey.700',
    unfilledBg: canSelect ? 'grey.800' : 'grey.900',
    affectedTint: null,
  };
}

const gridContainerSx = {
  display: 'inline-grid',
  gridTemplateColumns: `repeat(${COLS}, ${CELL_SIZE}px)`,
  gridAutoRows: `${CELL_SIZE}px`,
  gap: 1,
  p: 1.5,
  bgcolor: 'background.paper',
  borderRadius: 1,
  border: '1px solid',
  borderColor: 'divider',
  maxWidth: '100%',
  overflow: 'auto',
};

/** Single grid cell with tooltip and level fill (top to bottom) */
const GridCell = ({ sq, index }) => {
  const level = sq?.level ?? 0;
  const maxLv = Math.max(1, sq?.maxLv ?? 1);
  const fillCount = Math.min(level, maxLv);
  const canSelect = sq?.canSelect ?? false;
  const { borderColor, fillColor, unfilledBg, affectedTint } = getCellColors(sq);

  const tooltipTitle = canSelect ? (
    <Box sx={{ '& > * + *': { mt: 0.5 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle1" fontWeight={600} display="block">
          {cleanUnderscore(sq?.name || `#${index}`)}
        </Typography>
        <Typography variant="body1" color="text.secondary" display="block">
          Lv {level} / {maxLv}
        </Typography>
      </Stack>
      <Divider sx={{ my: 0.5 }} />
      {(sq?.description || sq?.name) && (
        <Typography variant="body1" display="block">
          {cleanUnderscore(sq?.description || sq?.name || '')}
        </Typography>
      )}
      {hasShape(sq) && sq?.shapeAffectMultiplier != null && (
        <Typography variant="body1" fontWeight={500} color="primary.light" display="block" sx={{ mt: 0.5 }}>
          Shape mult: ×{Number(sq.shapeAffectMultiplier).toFixed(2)}
        </Typography>
      )}
    </Box>
  ) : null;

  return (
    <Tooltip title={tooltipTitle}>
      <Box
        sx={{
          width: CELL_SIZE - 4,
          height: CELL_SIZE - 4,
          minWidth: CELL_SIZE - 4,
          minHeight: CELL_SIZE - 4,
          border: '2px solid',
          borderColor,
          borderRadius: 0.5,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: canSelect ? 'pointer' : 'default',
        }}
      >
        <Box sx={{ position: 'absolute', inset: 0, bgcolor: unfilledBg }} />
        {affectedTint && (
          <Box sx={{ position: 'absolute', inset: 0, bgcolor: affectedTint, pointerEvents: 'none' }} />
        )}
        {maxLv >= 1 && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {Array.from({ length: maxLv }, (_, segIndex) => (
              <Box
                key={segIndex}
                sx={{
                  flex: 1,
                  minHeight: 0,
                  bgcolor: segIndex < fillCount ? fillColor : 'transparent',
                }}
              />
            ))}
          </Box>
        )}
      </Box>
    </Tooltip>
  );
};

/** Grid view: 12×20 cell grid */
const GridView = ({ squares }) => {
  const getSquare = (row, col) => squares[row * COLS + col] ?? null;

  return (
    <Box sx={gridContainerSx}>
      {Array.from({ length: ROWS * COLS }, (_, i) => {
        const row = Math.floor(i / COLS);
        const col = i % COLS;
        const sq = getSquare(row, col);
        return <GridCell key={i} sq={sq} index={i} />;
      })}
    </Box>
  );
};

export default GridView;
