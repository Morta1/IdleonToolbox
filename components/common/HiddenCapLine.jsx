import React, { useContext } from 'react';
import InfoIcon from '@mui/icons-material/Info';
import { Stack, Typography } from '@mui/material';
import Tooltip from '@components/Tooltip';
import { AppContext } from '@components/common/context/AppProvider';
import { getHiddenCap } from '@parsers/misc/hiddenCaps';
import { cleanUnderscore } from '@utility/helpers';

const formatAmount = (value, unit) => unit === 'percent'
  ? `${Math.round(value * 10) / 10}%`
  : Math.round(value);

// A cap the game applies where the bonus is used. Past it the overshoot is not shown: nothing the player can undo.
// inline: inside another tooltip, so the sources are listed instead of hanging off an icon.
const HiddenCapLine = ({ system, index, inline, sx }) => {
  const { state } = useContext(AppContext);
  const hiddenCap = getHiddenCap(state?.account, system, index);
  if (!hiddenCap) return null;
  const { cap, total, unit, sources } = hiddenCap;
  const shared = sources.length > 1;
  const capAmount = `${formatAmount(cap, unit)}${unit === 'missions' ? ' missions' : ''}${shared ? ' total' : ''}`;
  const maxed = total >= cap;
  const lineText = maxed
    ? `Maxed at ${capAmount}`
    : `Capped at ${capAmount} (now ${formatAmount(total, unit)})`;
  const sourceLines = sources.map(({ name, value }) => (
    <Typography key={name} variant="body2" color={inline ? 'text.secondary' : undefined}>
      {cleanUnderscore(name)}: {formatAmount(value, unit)}
    </Typography>
  ));

  return (
    <Stack sx={sx}>
      <Stack direction="row" alignItems="center" gap={0.5}>
        <Typography variant="body2" color={maxed ? 'success.main' : 'text.secondary'}>
          {lineText}
        </Typography>
        {!inline ? (
          <Tooltip title={<>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              The game caps {shared ? 'the combined bonus' : 'this bonus'} at {formatAmount(cap, unit)}{unit === 'missions'
              ? ' missions'
              : ''}; anything above it does nothing.
            </Typography>
            {shared ? sourceLines : null}
          </>}>
            <InfoIcon sx={{ fontSize: 16, opacity: 0.7, flexShrink: 0 }}/>
          </Tooltip>
        ) : null}
      </Stack>
      {inline && shared ? sourceLines : null}
    </Stack>
  );
};

export default HiddenCapLine;
