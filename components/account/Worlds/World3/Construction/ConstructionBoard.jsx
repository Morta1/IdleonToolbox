import { Box, Stack, Typography } from '@mui/material';
import {
  cleanUnderscore,
  formatNum,
  prefix,
  secondsToCoarseDuration
} from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import React from 'react';
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

// The number a cog shows under its art, in the game's Big: its own row, never over the sprite. It may take half the
// gap on each side, so a five character "87.4K" fits under a 30 px slot. One that still doesn't fit ("1.16QQ") never
// cuts: it takes a second line, breaking before its suffix ("1.16" over "QQ"), and the row grows with it.
export const CAPTION_HEIGHT = 16;
const captionText = (value) => {
  const text = String(formatGame(value, 'Big', { whole: true }));
  const [, digits, suffix] = text.match(/^([\d.,]+)([A-Za-z].*)$/) ?? [];
  return digits ? <>{digits}<wbr/>{suffix}</> : text;
};
export const CogCaption = ({ value, width }) => <Typography variant={'caption'} component={'div'} sx={{
  minHeight: CAPTION_HEIGHT,
  lineHeight: `${CAPTION_HEIGHT}px`,
  width: `calc(${width} + ${SLOT_GAP}px)`,
  mx: `-${SLOT_GAP / 2}px`,
  textAlign: 'center',
  overflowWrap: 'anywhere',
  fontVariantNumeric: 'tabular-nums'
}}>{value ? captionText(value) : null}</Typography>;

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
// decimals (MultiplierInfo), and the slots it boosts or is boosted by
const cogNote = ({ currentAmount, requiredAmount, cog, affectedBy, affects, flagPlaced, flagSpeedBoost }, { flaggyRate }) => {
  const eta = getFlagEta(currentAmount, requiredAmount, flagPlaced, flagSpeedBoost, flaggyRate);
  const stats = Object.values(cog?.stats || {}).filter(({ name }) => name);
  return <Stack gap={0.5}>
    <Typography variant={'cardTitle'} component={'div'}>{characterOf(cog) || getCogDisplayName(cog?.name) || 'Flag'}</Typography>
    {currentAmount < requiredAmount ? <Typography variant={'body2'}>
      {`${formatGame(currentAmount, 'WorkbenchStuff.FlagReq', { whole: true })} / ${formatGame(requiredAmount, 'WorkbenchStuff.FlagReq', { whole: true })} (${formatNum((currentAmount / requiredAmount) * 100, 'pct')})`}
    </Typography> : null}
    {eta ? <Typography variant={'body2'} color={'text.secondary'}>{`Unlocks in ${eta}`}</Typography> : null}
    {stats.map(({ name, value }, statIndex) => <Typography key={`${name}-${statIndex}`} variant={'body2'}>
      {formatNum(value, 'mult', { bare: true })}{cleanUnderscore(name)}
    </Typography>)}
    {cog?.originalIndex != null ? <Typography variant={'body2'} color={'text.secondary'}>{`Index ${cog.originalIndex}`}</Typography> : null}
    {affectedBy?.length > 0 ? <Typography variant={'body2'} color={'text.secondary'}>{`Affected by: ${affectedBy.join(', ')}`}</Typography> : null}
    {affects?.length > 0 ? <Typography variant={'body2'} color={'text.secondary'}>{`Affects: ${affects.join(', ')}`}</Typography> : null}
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
        // Each row holds the slot's art and the caption row under it, taller where a caption takes two lines. The
        // strips beside the board are taller than it, so the rows keep their own height instead of sharing the slack.
        gridAutoRows: `minmax(calc(var(--cog-slot) + ${CAPTION_HEIGHT}px), auto)`,
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
        </SlotBackground>
        <CogCaption value={!flagPlaced ? viewValue : null} width={'var(--cog-slot)'}/>
      </Stack>;
      return (
        <Box key={index}
             sx={{
               // The step you are on takes the selected line's color; a cog pulled from the inventory keeps success
               outline: stepHighlight
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
