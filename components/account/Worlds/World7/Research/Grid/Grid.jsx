import React, { useState } from 'react';
import Tooltip from '@components/Tooltip';
import { Box, Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import GridView from './GridView';
import CardView from './CardView';

const VIEW = { CARD: 'card', GRID: 'grid' };

/** Research grid: 12×20 cells. Toggle between card view (default) and grid view. */
const Grid = ({ gridSquares }) => {
  const [viewMode, setViewMode] = useState(VIEW.CARD);
  const squares = gridSquares ?? [];
  const isGrid = viewMode === VIEW.GRID;

  return (
    <Stack spacing={2} sx={{ width: '100%' }}>
      <Stack direction="row" justifyContent="flex-end" sx={{ width: '100%', flexShrink: 0 }}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, newMode) => newMode && setViewMode(newMode)}
          size="small"
        >
          <ToggleButton value={VIEW.CARD} aria-label="Card view">
            <Tooltip title="Card view">
              <ViewModuleIcon />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value={VIEW.GRID} aria-label="Grid view">
            <Tooltip title="Grid view">
              <ViewListIcon />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: isGrid ? 'center' : 'flex-start',
        }}
      >
        {isGrid ? <GridView squares={squares} /> : <CardView squares={squares} />}
      </Box>
    </Stack>
  );
};

export default Grid;
