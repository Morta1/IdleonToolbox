import { Box, Divider, Stack, Typography } from '@mui/material';
import Tooltip from '../../../../Tooltip';
import {
  cleanUnderscore,
  isProd,
  kFormatter,
  notateNumber,
  numberWithCommas,
  prefix
} from '@utility/helpers';
import React from 'react';
import styled from '@emotion/styled';
import { BOARD_SIZE, BOARD_X, getCogDisplayName } from '@parsers/world-3/construction';

const bonusTextSx = {
  fontSize: 12,
  fontWeight: 400,
  position: 'absolute',
  top: 0,
  left: 0,
  backgroundColor: 'black'
};

const indexSx = {
  fontSize: 12,
  fontWeight: 400,
  position: 'absolute',
  bottom: 0,
  right: 0,
  backgroundColor: 'blue'
};

const CogTooltip = ({ character, index, currentAmount, requiredAmount, cog, affectedBy, affects, roundedValues }) => {
  return (
    <>
      <Typography sx={{ fontWeight: 'bold' }}>{character || getCogDisplayName(cog?.name)}</Typography>
      {currentAmount < requiredAmount ? (
        <Typography>
          {kFormatter(currentAmount, 2)} / {kFormatter(requiredAmount, 2)} ({kFormatter((currentAmount / requiredAmount) * 100, 2)}%)
        </Typography>
      ) : null}
      {Object.values(cog?.stats || {})?.map(({ name, value }, statIndex) =>
        name ? (
          <React.Fragment key={`${name}-${statIndex}`}>
            {statIndex > 0 ? <Divider sx={{ my: 1 }}/> : null}
            <Typography variant="body2">
              {roundedValues ? notateNumber(value, 'MultiplierInfo') : numberWithCommas(value.toFixed(2).replace('.00', ''))}
              {cleanUnderscore(name)}
            </Typography>
          </React.Fragment>
        ) : null
      )}
      <Divider sx={{ my: 1 }}/>
      <Typography variant="body2">Index: {index}</Typography>
      {affectedBy?.length > 0 && (
        <Typography variant="body2">Affected by: {affectedBy.join(', ')}</Typography>
      )}
      {affects?.length > 0 && (
        <Typography variant="body2">Affects: {affects.join(', ')}</Typography>
      )}
    </>
  );
};

const SLOT_GAP = 8;
// Below this the numbers printed on the slots stop being readable, so the board scrolls sideways
// instead of shrinking further. Above it there is nothing to gain from bigger slots.
const SLOT_MIN = 30;
const SLOT_MAX = 52;

/**
 * Narrowest the board can be drawn whole - the 12 board columns plus a small cog strip either side.
 * The column holding it must not shrink past this or the board starts scrolling sideways.
 */
export const BOARD_MIN_WIDTH = (BOARD_X + 2) * SLOT_MIN + (BOARD_X + 1) * SLOT_GAP;

const ConstructionBoard = ({ view, board, showTooltip, roundedValues, leftColumn, rightColumn, markSpares, dimUnchanged, highlightSlots }) => {
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

  // The slot size follows the width this column was given rather than fixed breakpoints - the width
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
        gridAutoRows: 'var(--cog-slot)'
      }}
    >
    {slots?.map((slot, index) => {
      if (!slot) return <Box key={index} sx={{ width: 'var(--cog-slot)', height: 'var(--cog-slot)' }}/>;
      const { currentAmount, requiredAmount, flagPlaced, cog, affectedBy, affects, boardPosition } = slot;
      const {
        a: buildRate,
        e: buildPercent,
        b: exp,
        d: secondExp,
        c: flaggyRate,
        j: classExp,
        f: playerExp
      } = cog?.stats || {};
      const filled = (currentAmount / requiredAmount) * 100;
      const rest = 100 - filled;
      // On an optimized board a cog whose original index sits past the board came out of the inventory.
      const fromSpares = markSpares && boardPosition >= 0 && cog?.originalIndex >= BOARD_SIZE;
      const stepHighlight = boardPosition >= 0 && highlightSlots?.includes(boardPosition);
      // A cog still sitting where it started did not move, so it fades out and the ones that did move
      // stand out against it.
      const unchanged = dimUnchanged && boardPosition >= 0 && cog?.originalIndex === boardPosition;
      return (
        <Box key={index}
             sx={{
               outline: stepHighlight
                 ? '2px solid #ffb300'
                 : fromSpares
                   ? '1px solid #66bb6a'
                   : '',
               // Inside the box, so the scroll container never shaves an edge off.
               outlineOffset: '-1px',
               opacity: unchanged && !stepHighlight ? .5 : 1
             }}
        >
          <Tooltip title={showTooltip ? <CogTooltip {...slot} index={cog?.originalIndex}
                                                    roundedValues={roundedValues}
                                                    character={cog?.name?.includes('Player')
                                                      ? cog?.name?.split('Player_')[1]
                                                      : ''}/> : ''}>
            <SlotBackground filled={filled} rest={rest}>
              {flagPlaced ? <FlagIcon src={`${prefix}data/CogFLflag.png`} alt=""/> : null}
              {cog?.name && !flagPlaced ?
                <SlotIcon src={`${prefix}data/${cog?.name?.includes('Player') ? 'headBIG' : cog?.name}.png`}
                          alt=""/> : null}
              {!isProd ? <Typography sx={indexSx}>{cog?.originalIndex}</Typography> : null}
              {view === 'build' && !flagPlaced && buildRate?.value
                ?
                <Typography sx={bonusTextSx}>{notateNumber(buildRate?.value, 'Big') || null}</Typography>
                : null}
              {view === 'buildPercent' && !flagPlaced && buildPercent?.value
                ?
                <Typography sx={bonusTextSx}>{notateNumber(buildPercent?.value, 'Big') || null}</Typography>
                : null}
              {view === 'exp' && !flagPlaced
                ? <Typography
                  sx={bonusTextSx}>{(exp?.value && notateNumber(exp?.value, 'Big')) || (secondExp?.value && notateNumber(secondExp?.value, 'Big')) || null}</Typography>
                : null}
              {view === 'playerExp' && !flagPlaced
                ? <Typography
                  sx={bonusTextSx}>{(playerExp?.value && notateNumber(playerExp?.value, 'Big')) || null}</Typography>
                : null}
              {view === 'flaggy' && !flagPlaced && flaggyRate?.value
                ?
                <Typography sx={bonusTextSx}>{notateNumber(flaggyRate?.value, 'Big') || null}</Typography>
                : null}
              {view === 'classExp' && !flagPlaced && classExp?.value
                ?
                <Typography sx={bonusTextSx}>{notateNumber(classExp?.value, 'Big') || null}</Typography>
                : null}
            </SlotBackground>
          </Tooltip>
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
            : `background: linear-gradient(to top, #9de060 ${filled}%, transparent 0%);`)}

    width: calc(var(--cog-slot) + 2px);
    height: calc(var(--cog-slot) + 1px);
    top: 1px;
    left: -1px;
  }
`;

const FlagIcon = styled.img`
  width: var(--cog-slot);
  height: var(--cog-slot);
`;

const SlotIcon = styled.img`
  width: var(--cog-slot);
  height: var(--cog-slot);
`;

export default ConstructionBoard;
