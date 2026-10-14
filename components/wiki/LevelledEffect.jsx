import React, { useState } from 'react';
import { Stack, TextField, Typography } from '@mui/material';
import { cleanUnderscore } from '@utility/helpers';
import { costAt, costToMax, formatAmount, levelledText, readLevel } from '@utility/wiki/effects.mjs';

// One level field for every wiki page whose numbers depend on a level. A page has no save, so the
// reader picks the level; the static HTML renders level 1, a real sentence rather than a blank.
// This was a fixed ladder of levels first: one field answers any level instead of the four somebody
// happened to pick.
const LevelledEffect = ({ node }) => {
  const [input, setInput] = useState('1');
  const cap = node?.effect?.cap ?? null;
  const level = readLevel(input, cap);
  const text = levelledText(node, level);
  const cost = costAt(node, level);
  const total = costToMax(node);
  const costLabel = node?.cost?.label ?? 'Cost for this level';
  const costNote = node?.cost?.note ?? 'Base cost, before discounts.';
  const currency = node?.cost?.currency ? ` ${cleanUnderscore(node.cost.currency)}` : '';
  const label = cap ? `${node.effect.levelLabel} (max ${cap})` : node?.effect?.levelLabel;

  return <Stack gap={1}>
    <TextField
      size={'small'}
      type={'number'}
      value={input}
      onChange={(event) => setInput(event.target.value)}
      label={label}
      inputProps={{ min: 1, max: cap ?? undefined }}
      sx={{ width: 200 }}
    />
    {text ? <Typography variant={'body2'}>{text}</Typography> : null}
    {cost !== null ? <Typography variant={'body2'} color={'text.secondary'}>
      {`${costLabel}: ${formatAmount(cost)}${currency}`}
    </Typography> : null}
    {total !== null ? <Typography variant={'body2'} color={'text.secondary'}>
      {`Total to max: ${formatAmount(total)}${currency}`}
    </Typography> : null}
    {/* Account discounts and bonuses are player data; the page shows only the part every player shares. */}
    {cost !== null ? <Typography variant={'caption'} color={'text.disabled'}>
      {costNote}
    </Typography> : null}
  </Stack>;
};

export default LevelledEffect;
