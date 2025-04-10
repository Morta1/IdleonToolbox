import { Box, Divider, Stack, Typography } from '@mui/material';
import Tooltip from '../../../../Tooltip';
import {
  cleanUnderscore,
  isProd,
  kFormatter,
  notateNumber,
  numberWithCommas,
  prefix
} from '../../../../../utility/helpers';
import React from 'react';
import styled from '@emotion/styled';

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
      {character ? <Typography sx={{ fontWeight: 'bold' }}>{character}</Typography> : null}
      {currentAmount < requiredAmount ? (
        <Typography>
          {kFormatter(currentAmount, 2)} / {kFormatter(requiredAmount, 2)} ({kFormatter((currentAmount / requiredAmount) * 100, 2)}%)
        </Typography>
      ) : null}
      {Object.values(cog?.stats)?.map(({ name, value }, index) =>
        name ? (
          <>
            {index > 0 ? <Divider sx={{my:1}}/> : null}
            <Typography variant="body2" key={`${name}-${index}`}>
              {roundedValues ? notateNumber(value, 'Big') : numberWithCommas(value.toFixed(2).replace('.00', ''))}
              {cleanUnderscore(name)}
            </Typography>

          </>
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

const ConstructionBoard = ({ view, board, showTooltip, setOutsideHighlight, outsideHighlight, roundedValues }) => {
  return <Box
    mt={3}
    sx={{
      display: 'grid',
      gap: '8px',
      gridTemplateColumns: { xs: 'repeat(8, minmax(45px, 1fr))', md: 'repeat(12, minmax(45px, 1fr))' },
      gridTemplateRows: { xs: 'repeat(8, minmax(45px, 1fr))', md: 'repeat(8, minmax(45px, 1fr))' }
    }}
  >
    {board?.map((slot, index) => {
      const { currentAmount, requiredAmount, flagPlaced, cog, affectedBy, affects } = slot;
      const {
        a: buildRate,
        e: buildPercent,
        b: exp,
        d: secondExp,
        c: flaggyRate,
        j: classExp,
        f: playerExp
      } = cog?.stats;
      const filled = (currentAmount / requiredAmount) * 100;
      const rest = 100 - filled;
      return (
        <Box key={index}
             sx={{
               outline: cog?.originalIndex === outsideHighlight
                 ? '1px solid red'
                 : '',
               opacity: !setOutsideHighlight && cog?.originalIndex === index ? .5 : 1
             }}
             onMouseEnter={() => typeof setOutsideHighlight === 'function' && setOutsideHighlight(cog?.originalIndex)}
             onMouseLeave={() => typeof setOutsideHighlight === 'function' && setOutsideHighlight(null)}
        >
          <Tooltip title={showTooltip ? <CogTooltip {...slot} index={index}
                                                    roundedValues={roundedValues}
                                                    character={cog?.name?.includes('Player')
                                                      ? cog?.name?.split('Player_')[1]
                                                      : ''}/> : ''}>
            <SlotBackground filled={filled} rest={rest}>
              {flagPlaced ? <FlagIcon src={`${prefix}data/CogFLflag.png`} alt=""/> : null}
              {cog?.name && !flagPlaced ?
                <SlotIcon src={`${prefix}data/${cog?.name?.includes('Player') ? 'headBIG' : cog?.name}.png`}
                          alt=""/> : null}
              {!isProd ? <Typography sx={indexSx}>{index}</Typography> : null}
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
  </Box>
};

const SlotBackground = styled(Stack)`
  position: relative;
  background-image: url(${() => `${prefix}data/CogSq0.png`});
  background-repeat: no-repeat;
  background-position: center;

  width: 46px;
  height: 46px;

  &:before {
    content: "";
    display: block;
    position: absolute;
    z-index: -1;
    ${({ filled }) => (filled === 0 || filled === 100
            ? ''
            : `background: linear-gradient(to top, #9de060 ${filled}%, transparent 0%);`)}

    width: 48px;
    height: 47px;
    top: 1px;
    left: -1px;
  }
`;

const FlagIcon = styled.img`
  width: 47px;
  height: 47px;
`;

const SlotIcon = styled.img`
  width: 47px;
  height: 47px;
`;

export default ConstructionBoard;
