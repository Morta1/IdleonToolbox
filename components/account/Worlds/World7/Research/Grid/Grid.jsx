import React, { useState } from 'react';
import { Box } from '@mui/material';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import GridView from './GridView';
import CardView from './CardView';
import { hasShape } from './researchGridShared';

const GRID_TOOLBAR = { hideUnlevelled: false, view: 'cards' };
// The catalog's real squares: the other cells are placeholders named "Name" (the goals registry skips them too)
const isRealSquare = (square) => Boolean(square?.name) && square.name !== 'Name';
const isLevelled = (square) => (square?.level ?? 0) >= 1 || hasShape(square);

/** Research grid: 12×20 cells. Every real square as a card (Decision 7), or the game's board. */
const Grid = ({ gridSquares }) => {
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('research-grid', GRID_TOOLBAR);
  const [toolbarBottom, setToolbarBottom] = useState(0);
  const squares = gridSquares ?? [];
  const real = squares.filter(isRealSquare);
  const isGrid = toolbar?.view === 'grid';
  const shown = toolbar?.hideUnlevelled && !isGrid ? real.filter(isLevelled) : real;
  return <Box>
    <Toolbar state={toolbar} defaults={GRID_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
             total={real.length} shown={shown.length} noun={'squares'} onStickyBottom={setToolbarBottom}>
      {isGrid ? null : <Toolbar.Filter name={'hideUnlevelled'} label={'Hide unlevelled'}/>}
      <Toolbar.View options={[['cards', 'Cards'], ['grid', 'Grid']]}/>
    </Toolbar>
    {isGrid ? <GridView squares={squares} stickyTop={toolbarBottom}/> : <CardView squares={shown}/>}
  </Box>;
};

export default Grid;
