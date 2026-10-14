import React, { useState } from 'react';
import { Stack, TextField, Typography } from '@mui/material';
import { cleanUnderscore } from '@utility/helpers';
import { costCurrency, costsAt, costsToMax, formatAmount, levelledText, readLevel } from '@utility/wiki/effects.mjs';

// One level field for every wiki page whose numbers depend on a level. A page has no save, so the
// reader picks the level; the static HTML renders level 1, a real sentence rather than a blank.
// This was a fixed ladder of levels first: one field answers any level instead of the four somebody
// happened to pick.
const DEFAULT_COST_LABEL = 'Cost for this level';
const DEFAULT_COST_NOTE = 'Base cost, before discounts.';

const LevelledEffect = ({ node }) => {
  const [input, setInput] = useState('1');
  const cap = node?.effect?.cap ?? null;
  const level = readLevel(input, cap);
  const text = levelledText(node, level);
  const totals = costsToMax(node);
  const unitOf = (cost, amount) => {
    const currency = costCurrency(cost, amount);
    return currency ? ` ${cleanUnderscore(currency)}` : '';
  };
  // A node can pay in several currencies at once: one cost line, and one total, per currency.
  const costs = costsAt(node, level).map((cost, i) => ({
    ...cost,
    label: cost.label ?? DEFAULT_COST_LABEL,
    note: cost.note ?? DEFAULT_COST_NOTE,
    unit: unitOf(cost, cost.value),
    total: totals[i].value,
    totalUnit: unitOf(cost, totals[i].value)
  })).filter(({ value }) => value !== null);
  // One note when every cost says the same thing, otherwise each under its own cost.
  const sharedNote = costs.every(({ note }) => note === costs[0].note) ? costs[0]?.note : null;
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
    {costs.map(({ label: costLabel, prefix, value, unit, total, totalUnit, note }, i) => <React.Fragment key={i}>
      <Typography variant={'body2'} color={'text.secondary'}>
        {`${costLabel}: ${prefix ?? ''}${formatAmount(value)}${unit}`}
      </Typography>
      {total !== null ? <Typography variant={'body2'} color={'text.secondary'}>
        {`Total to max: ${formatAmount(total)}${totalUnit}`}
      </Typography> : null}
      {sharedNote ? null : <Typography variant={'caption'} color={'text.disabled'}>{note}</Typography>}
    </React.Fragment>)}
    {/* Account discounts and bonuses are player data; the page shows only the part every player shares. */}
    {sharedNote ? <Typography variant={'caption'} color={'text.disabled'}>
      {sharedNote}
    </Typography> : null}
  </Stack>;
};

export default LevelledEffect;
