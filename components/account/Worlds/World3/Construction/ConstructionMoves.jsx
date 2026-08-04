import React, { useEffect, useRef } from 'react';
import { Box, Checkbox, Divider, LinearProgress, Stack, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import { prefix } from '@utility/helpers';
import { cogSlotLabel } from '@parsers/world-3/constructionOptimizer';
import { getCogDisplayName } from '@parsers/world-3/construction';
import { navBarHeight } from '@components/constants';

const cogIcon = (name) => `${prefix}data/${name?.includes('Player') ? 'headBIG' : name}.png`;

// fromIndex covers every source slot; fromSlot only board ones. Falling back keeps a move off the
// board labelled correctly rather than calling it "Inventory" if an older worker build is running.
export const moveSourceLabel = (move) => cogSlotLabel(move?.fromIndex ?? move?.fromSlot);

/**
 * The swaps are order dependent, so progress is a cursor rather than a set of independent ticks:
 * everything before it is done, the row on it is the swap to make next. Ticking a row moves the
 * cursor to it, which also rewinds the board.
 */
const ConstructionMoves = ({ moves, cursor, onCursorChange, onHover }) => {
  const listRef = useRef(null);
  const currentRef = useRef(null);

  // Back/Next live under the board, which is pinned far from whatever row is current once the list
  // gets long - so the list follows the cursor instead of making you hunt for it.
  useEffect(() => {
    const list = listRef.current;
    const row = currentRef.current;
    if (!list || !row) return;
    // When the list has its own scrollbar, move it by hand. scrollIntoView would walk up and scroll
    // the document too, dragging the board off screen on every Next.
    if (list.scrollHeight > list.clientHeight) {
      const listBox = list.getBoundingClientRect();
      const rowBox = row.getBoundingClientRect();
      if (rowBox.top < listBox.top) list.scrollTop -= listBox.top - rowBox.top;
      else if (rowBox.bottom > listBox.bottom) list.scrollTop += rowBox.bottom - listBox.bottom;
      return;
    }
    // Narrow screens run the list at full height, so the page is the only thing that can scroll.
    row.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  if (!moves) return null;
  if (moves.length === 0) {
    return <Typography variant={'body2'}>
      Your board is already the best one found - nothing to move.
    </Typography>;
  }

  // flex 1 + minHeight 0 so the rows below can take whatever height the column was given and scroll
  // inside it. With an unbounded column (narrow screens) this just grows to fit and never scrolls.
  const done = cursor >= moves.length;

  return <Stack sx={{ width: '100%', flex: '1 1 auto', minHeight: 0 }} gap={1}>
    <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} gap={2}>
      <Typography variant={'h6'}>Steps to apply</Typography>
      <Typography variant={'body2'} sx={{ color: 'text.secondary' }}>{cursor} / {moves.length}</Typography>
    </Stack>
    <LinearProgress variant={'determinate'} value={(cursor / moves.length) * 100} sx={{ height: 6, borderRadius: 3 }}/>
    {/* Back and Next belong here rather than under the board: the board is taller than the screen, so
        controls beneath it sit below the fold exactly when you are stepping through. */}
    <Stack direction={'row'} alignItems={'center'} gap={1}>
      <Button size={'small'} variant={'outlined'} disabled={cursor === 0}
              onClick={() => onCursorChange(cursor - 1)}>Back</Button>
      <Button size={'small'} variant={'contained'} disabled={done}
              onClick={() => onCursorChange(cursor + 1)}>Next</Button>
      <Typography variant={'caption'} noWrap sx={{ color: 'text.secondary', flexGrow: 1, minWidth: 0 }}>
        {done ? `All ${moves.length} steps done` : `Step ${cursor + 1} of ${moves.length}`}
      </Typography>
      {cursor > 0
        ? <Button size={'small'} color={'inherit'} sx={{ textTransform: 'unset' }}
                  onClick={() => onCursorChange(0)}>Reset</Button>
        : null}
    </Stack>
    <Typography variant={'caption'} sx={{ color: 'text.secondary' }}>
      Do these in order. The board follows along.
    </Typography>
    <Divider sx={{ my: 0.5 }}/>
    <Stack ref={listRef} gap={0.5} sx={{ overflowY: 'auto', minHeight: 0, flex: '1 1 auto' }}>
      {moves.map((move, index) => {
        const isDone = index < cursor;
        const isCurrent = index === cursor;
        return <Stack key={`${move.from}-${move.to}-${index}`}
                      ref={isCurrent ? currentRef : null}
                      direction={'row'}
                      alignItems={'center'}
                      gap={1}
                      onMouseEnter={() => onHover?.([move.fromSlot, move.to])}
                      onMouseLeave={() => onHover?.(null)}
                      sx={{
                        px: 1,
                        borderRadius: 1,
                        opacity: isDone ? 0.45 : 1,
                        outline: isCurrent ? '1px solid #ffb300' : '',
                        // Drawn inside the box, otherwise the scroll container clips the edges off.
                        outlineOffset: '-1px',
                        // scrollIntoView does not know about the fixed nav bar and would park the row
                        // underneath it.
                        scrollMarginTop: `${navBarHeight + 16}px`,
                        scrollMarginBottom: '16px',
                        '&:hover': { backgroundColor: 'action.hover' }
                      }}>
          <Checkbox size={'small'} checked={isDone}
                    onChange={() => onCursorChange(isDone ? index : index + 1)}/>
          <Typography variant={'body2'} sx={{ width: 26, color: 'text.secondary' }}>{index + 1}.</Typography>
          <Box component={'img'} src={cogIcon(move.name)} alt={''} sx={{ width: 32, height: 32 }}/>
          <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant={'body2'} noWrap
                        sx={{ textDecoration: isDone ? 'line-through' : 'none' }}>
              {moveSourceLabel(move)} &rarr; {cogSlotLabel(move.to)}
            </Typography>
            <Typography variant={'caption'} noWrap sx={{ color: 'text.secondary' }}>
              {getCogDisplayName(move.name)} swaps with {getCogDisplayName(move.displacedName)}
            </Typography>
          </Stack>
          <Box component={'img'} src={cogIcon(move.displacedName)} alt={''} sx={{ width: 32, height: 32, opacity: 0.6 }}/>
        </Stack>;
      })}
    </Stack>
  </Stack>;
};

export default ConstructionMoves;
