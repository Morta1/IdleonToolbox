import React, { useContext } from 'react';
import { Stack, Typography } from '@mui/material';
import InfoButton from '@components/common/InfoButton';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { AppContext } from '@components/common/context/AppProvider';
import { getHiddenCap } from '@parsers/misc/hiddenCaps';
import { flatLines } from '@parsers/breakdown';
import { cleanUnderscore } from '@utility/helpers';

const formatAmount = (value, unit) => unit === 'percent'
  ? `${Math.round(value * 10) / 10}%`
  : Math.round(value);

// The game writes some names in capitals (the Exotic Market's); their cards title them, so the cap does too, the
// card's way (each word of the raw BUD_COURIER capitalized, then the underscores cleaned).
const sourceName = (name) => {
  const raw = name ?? '';
  return cleanUnderscore(raw === raw.toUpperCase() ? raw.toLowerCase().capitalizeAll() : raw);
};

// A cap the game applies where the bonus is used. Past it the overshoot is not shown: nothing the player can undo.
// A cap several sources share opens them as a breakdown from its amount (Info board: a note is a sentence, not a
// list). inline: inside an item's own details (another tooltip), so the sources are listed under the line instead.
// name: the capped bonus the line sits under (its card's title), which names the cap; else its first source.
const HiddenCapLine = ({ system, index, name, inline, sx }) => {
  const { state } = useContext(AppContext);
  const hiddenCap = getHiddenCap(state?.account, system, index);
  if (!hiddenCap) return null;
  const { cap, total, unit, sources } = hiddenCap;
  const shared = sources.length > 1;
  const units = unit === 'missions' ? ' missions' : '';
  const capAmount = `${formatAmount(cap, unit)}${units}${shared ? ' total' : ''}`;
  const maxed = total >= cap;
  const capName = name || sourceName(sources[0]?.name);
  // A list, so the drawer reads the line's numbers back and adds no share or what-if: the cap, not the sum, is what
  // counts. The total is the line's own, and a sum past the cap is one plain row under the sources.
  const capBreakdown = shared && !inline ? {
    statName: `${capName} cap`,
    totalValue: maxed ? capAmount : `${formatAmount(total, unit)}${units}`,
    combine: 'list',
    tree: flatLines([
      ...sources.map((source) => ({ name: sourceName(source?.name), value: source?.value, formatted: `${formatAmount(source?.value, unit)}${units}` })),
      ...(total > cap ? [{ name: 'Sum before the cap', value: total, formatted: `${formatAmount(total, unit)}${units}` }] : [])
    ])
  } : null;
  // The amount the sources add up to: "40% total" when maxed, "now 38%" below the cap.
  const sum = maxed ? capAmount : `now ${formatAmount(total, unit)}`;
  const amount = capBreakdown ? <Breakdown asValue data={capBreakdown}>{sum}</Breakdown> : sum;
  // Spans shown as blocks: inline, the list sits inside another tooltip.
  const sourceLines = sources.map(({ name, value }) => (
    <Typography key={name} variant="body2" component="span" color={'text.secondary'} sx={{ display: 'block' }}>
      {sourceName(name)}: {formatAmount(value, unit)}
    </Typography>
  ));

  return (
    <Stack sx={sx}>
      <Stack direction="row" alignItems="center" gap={0.5}>
        <Typography variant="body2" color={maxed ? 'text.success' : 'text.secondary'}>
          {maxed ? <>Maxed at {amount}</> : <>Capped at {capAmount} ({amount})</>}
        </Typography>
        {!inline ? (
          <InfoButton label={`the ${capName} cap`}>
            The game caps {shared ? 'the combined bonus' : 'this bonus'} at {formatAmount(cap, unit)}{unit === 'missions'
            ? ' missions'
            : ''}; anything above it does nothing.
          </InfoButton>
        ) : null}
      </Stack>
      {inline && shared ? sourceLines : null}
    </Stack>
  );
};

export default HiddenCapLine;
