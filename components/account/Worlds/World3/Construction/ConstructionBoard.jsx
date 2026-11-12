import { Box, Stack, Typography } from '@mui/material';
import {
  cleanUnderscore,
  formatNum,
  gameFill,
  prefix,
  secondsToCoarseDuration
} from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import { BOARD_SIZE, BOARD_X, getCogDisplayName } from '@parsers/world-3/construction';
import { NoteTrigger } from '@components/common/InfoButton';

const SLOT_GAP = 8;

/** The stat a view prints on a cog. Exp falls back to the second exp stat some cogs carry instead. */
export const getCogViewValue = (cog, view) => {
  const { a, e, b, d, c, j, f } = cog?.stats || {};
  switch (view) {
    case 'build':
      return a?.value;
    case 'buildPercent':
      return e?.value;
    case 'exp':
      return b?.value || d?.value;
    case 'playerExp':
      return f?.value;
    case 'flaggy':
      return c?.value;
    case 'classExp':
      return j?.value;
    default:
      return undefined;
  }
};

// The number a cog shows under its art in a step of the plan, in the game's Big. One line, whatever it holds, centred on
// the art: it may take half the gap on each side, and in a narrow container a smaller size, so a six character "1.16QQ"
// fits under a 30 px slot. The board itself draws its numbers on the slots (CogValue).
export const CAPTION_HEIGHT = 16;
export const CogCaption = ({ value, width }) => <Typography variant={'caption'} component={'div'} sx={{
  minHeight: CAPTION_HEIGHT,
  lineHeight: `${CAPTION_HEIGHT}px`,
  width: `calc(${width} + ${SLOT_GAP}px)`,
  mx: `-${SLOT_GAP / 2}px`,
  display: 'flex',
  justifyContent: 'center',
  whiteSpace: 'nowrap',
  fontVariantNumeric: 'tabular-nums',
  '@container (max-width: 600px)': { fontSize: 11, letterSpacing: '-0.2px' }
}}>{value ? String(formatGame(value, 'Big', { whole: true })) : null}</Typography>;

// The number a slot on the board shows, on a chip over the art's foot, as the game and the old page drew it on the cog: a
// caption row under every slot made the board's twelve rows 16 px taller each (1.62x the old page's height). The chip is
// the page's own ground, so the number reads whatever art is under it.
const VALUE_CHIP_SX = {
  position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)', px: '3px', borderRadius: '4px',
  fontSize: 11, lineHeight: '14px', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', pointerEvents: 'none',
  bgcolor: 'background.default', color: 'text.primary'
};
const CogValue = ({ value }) => (value ? <Typography variant={'caption'} component={'span'} data-on-art sx={VALUE_CHIP_SX}>
  {String(formatGame(value, 'Big', { whole: true }))}
</Typography> : null);

// The sprite a cog draws: a character's head, or the cog's own art
export const cogSprite = (name) => (name?.includes('Player') ? 'headBIG' : name);

/**
 * How long the flag standing in this slot still has to build. The game gives every placed flag the
 * whole board's flaggy rate rather than a share of it (N.js:92672 and :93493), and only the 96 board
 * slots take the neighbour flag speed boost: the small cog columns build at the plain rate.
 */
const getFlagEta = (currentAmount, requiredAmount, flagPlaced, flagSpeedBoost, flaggyRate) => {
  if (!flagPlaced || !(flaggyRate > 0)) return null;
  const remaining = requiredAmount - currentAmount;
  if (!(remaining > 0)) return null;
  return secondsToCoarseDuration((remaining / (flaggyRate * (flagSpeedBoost || 1))) * 3600);
};

const characterOf = (cog) => (cog?.name?.includes('Player') ? cog?.name?.split('Player_')[1] : '');
const slotName = (slot) => characterOf(slot?.cog) || getCogDisplayName(slot?.cog?.name) || (slot?.flagPlaced ? 'Flag' : 'Slot');

// A slot's note, opened on a tap or a click: the cog, a flag's progress and time left, each stat in the game's two
// decimals (MultiplierInfo), and the slots it boosts or is boosted by. A flag's progress prints as the game's board does
// (N.js:92922): Small below 10, Big from there, the requirement in Big.
const cogNote = ({ currentAmount, requiredAmount, cog, affectedBy, affects, flagPlaced, flagSpeedBoost }, { flaggyRate }) => {
  const eta = getFlagEta(currentAmount, requiredAmount, flagPlaced, flagSpeedBoost, flaggyRate);
  const stats = Object.values(cog?.stats || {}).filter(({ name }) => name);
  return <Stack gap={0.5}>
    <Typography variant={'cardTitle'} component={'div'}>{characterOf(cog) || getCogDisplayName(cog?.name) || 'Flag'}</Typography>
    {currentAmount < requiredAmount ? <Typography variant={'body2'}>
      {`${gameFill(currentAmount, currentAmount < 10 ? 'Small' : 'Big', { whole: true })} / ${formatGame(requiredAmount, 'WorkbenchStuff.FlagReq', { whole: true })} (${formatNum((currentAmount / requiredAmount) * 100, 'pct')})`}
    </Typography> : null}
    {eta ? <Typography variant={'body2'} color={'text.secondary'}>{`Unlocks in ${eta}`}</Typography> : null}
    {stats.map(({ name, value }, statIndex) => <Typography key={`${name}-${statIndex}`} variant={'body2'}>
      {formatNum(value, 'mult', { bare: true })}{cleanUnderscore(name)}
    </Typography>)}
    {/* Counts, with the squares themselves outlined on the board while this cog is hovered: the board has no row or
        column labels, so a list of coordinates had to be counted out by hand */}
    {affectedBy?.length > 0 ? <Typography variant={'body2'} color={'text.secondary'}>
      {`Boosted by ${formatNum(affectedBy.length)} cog${affectedBy.length === 1 ? '' : 's'} (amber)`}
    </Typography> : null}
    {affects?.length > 0 ? <Typography variant={'body2'} color={'text.secondary'}>
      {`Boosts ${formatNum(affects.length)} square${affects.length === 1 ? '' : 's'} (blue)`}
    </Typography> : null}
  </Stack>;
};

// Below this the numbers printed under the slots stop being readable, so the board scrolls sideways
// instead of shrinking further. Above it there is nothing to gain from bigger slots.
const SLOT_MIN = 30;
const SLOT_MAX = 52;
// The board is the game's picture: its art follows the slot's CSS size, outside GameIcon's fixed sizes
const SLOT_ART_SX = { width: 'var(--cog-slot)', height: 'var(--cog-slot)', display: 'block' };

/**
 * Narrowest the board can be drawn whole: the 12 board columns plus a small cog strip either side.
 * The column holding it must not shrink past this or the board starts scrolling sideways.
 */
export const BOARD_MIN_WIDTH = (BOARD_X + 2) * SLOT_MIN + (BOARD_X + 1) * SLOT_GAP;

const ConstructionBoard = ({ view, board, leftColumn, rightColumn, markSpares, dimUnchanged, highlightSlots, boardFlaggyRate }) => {
  // The board cog under the pointer (or open on a tap): the cogs boosting it and the squares it boosts get outlined
  const [hovered, setHovered] = useState(null);
  const hoveredSlot = hovered != null ? board?.[hovered] : null;
  const boostedBy = new Set(hoveredSlot?.affectedBy ?? []);
  const boosts = new Set(hoveredSlot?.affects ?? []);
  // The side strips hold 12 small cogs against the board's 8 rows. Laying all three out in one grid
  // left 48 blank cells in the middle, so each is its own grid and they simply sit side by side.
  const columns = [
    leftColumn ? { key: 'left', slots: leftColumn.map((slot) => ({ ...slot, boardPosition: -1 })) } : null,
    { key: 'board', cols: BOARD_X, slots: board?.map((slot, index) => ({ ...slot, boardPosition: index })) ?? [] },
    rightColumn ? { key: 'right', slots: rightColumn.map((slot) => ({ ...slot, boardPosition: -1 })) } : null
  ].filter(Boolean);

  // Every gap between adjacent slots is the same, board or side strip, so the whole thing is just
  // one row of slots with one gap between each.
  const totalColumns = columns.reduce((sum, { cols = 1 }) => sum + cols, 0);
  const gapTotal = (totalColumns - 1) * SLOT_GAP;

  // The slot size follows the width this column was given rather than fixed breakpoints: the width
  // left over depends on the ad gutter and the steps panel, not on the viewport. Below the minimum
  // it stops shrinking and scrolls sideways instead, which is what phones get.
  // px:1 leaves room for the 1px the fill overlay bleeds past the last slot, which otherwise puts a
  // scrollbar under a board that fits perfectly.
  return <Box sx={{ maxWidth: '100%', overflowX: 'auto', containerType: 'inline-size', pb: 1, px: '1px' }}><Box
    sx={{
      '--cog-slot': `clamp(${SLOT_MIN}px, calc((100cqw - ${gapTotal}px) / ${totalColumns}), ${SLOT_MAX}px)`,
      display: 'flex',
      gap: `${SLOT_GAP}px`,
      width: 'fit-content'
    }}
  >
    {columns.map(({ key, cols = 1, slots }) => <Box
      key={key}
      sx={{
        display: 'grid',
        gap: `${SLOT_GAP}px`,
        gridTemplateColumns: `repeat(${cols}, var(--cog-slot))`,
        // A row is one slot, its number on it. The strips beside the board are taller than it, so the rows keep their own
        // height instead of sharing the slack.
        gridAutoRows: 'var(--cog-slot)',
        alignContent: 'start'
      }}
    >
    {slots?.map((slot, index) => {
      if (!slot) return <Box key={index} sx={{ width: 'var(--cog-slot)', height: 'var(--cog-slot)' }}/>;
      const { currentAmount, requiredAmount, flagPlaced, cog, boardPosition } = slot;
      const viewValue = getCogViewValue(cog, view);
      const filled = (currentAmount / requiredAmount) * 100;
      const rest = 100 - filled;
      // On an optimized board a cog whose original index sits past the board came out of the inventory.
      const fromSpares = markSpares && boardPosition >= 0 && cog?.originalIndex >= BOARD_SIZE;
      const stepHighlight = boardPosition >= 0 && highlightSlots?.includes(boardPosition);
      // A cog still sitting where it started did not move, so it fades out and the ones that did move
      // stand out against it.
      const unchanged = dimUnchanged && boardPosition >= 0 && cog?.originalIndex === boardPosition;
      const art = <Stack sx={{ width: 'var(--cog-slot)' }}>
        <SlotBackground filled={filled} rest={rest}>
          {flagPlaced ? <Box component={'img'} src={`${prefix}data/CogFLflag.png`} alt={''} sx={SLOT_ART_SX}/> : null}
          {cog?.name && !flagPlaced
            ? <Box component={'img'} src={`${prefix}data/${cogSprite(cog?.name)}.png`} alt={''} sx={SLOT_ART_SX}/>
            : null}
          <CogValue value={!flagPlaced ? viewValue : null}/>
        </SlotBackground>
      </Stack>;
      return (
        <Box key={index}
             onMouseEnter={boardPosition >= 0 && cog?.name ? () => setHovered(boardPosition) : undefined}
             onMouseLeave={boardPosition >= 0 ? () => setHovered(null) : undefined}
             onFocus={boardPosition >= 0 && cog?.name ? () => setHovered(boardPosition) : undefined}
             onBlur={boardPosition >= 0 ? () => setHovered(null) : undefined}
             sx={{
               // The step you are on takes the selected line's color; a cog pulled from the inventory keeps success
               outline: boostedBy.has(boardPosition)
                 ? '2px solid var(--mui-palette-warning-main)'
                 : boosts.has(boardPosition) || stepHighlight
                 ? '2px solid var(--mui-palette-primary-main)'
                 : fromSpares
                   ? '1px solid var(--mui-palette-success-main)'
                   : '',
               // Inside the box, so the scroll container never shaves an edge off.
               outlineOffset: '-1px',
               opacity: unchanged && !stepHighlight ? .5 : 1
             }}
        >
          {cog?.name || flagPlaced
            ? <NoteTrigger block label={slotName(slot)}
                           note={cogNote(slot, { flaggyRate: boardFlaggyRate })}>{art}</NoteTrigger>
            : art}
        </Box>
      );
    })}
    </Box>)}
  </Box></Box>
};

const SlotBackground = styled(Stack)`
  position: relative;
  background-image: url(${() => `${prefix}data/CogSq0.png`});
  background-repeat: no-repeat;
  background-position: center;

  background-size: contain;

  width: var(--cog-slot);
  height: var(--cog-slot);

  &:before {
    content: "";
    display: block;
    position: absolute;
    z-index: -1;
    ${({ filled }) => (filled === 0 || filled === 100
            ? ''
            : `background: linear-gradient(to top, var(--mui-palette-success-main) ${filled}%, transparent 0%);`)}

    width: calc(var(--cog-slot) + 2px);
    height: calc(var(--cog-slot) + 1px);
    top: 1px;
    left: -1px;
  }
`;

export default ConstructionBoard;
