import React, { useState } from 'react';
import { Stack, TextField, Typography } from '@mui/material';
import { cleanUnderscore, prefix } from '@utility/helpers';
import { costCurrency, costsAt, costsToMax, formatAmount, levelledText, readLevel } from '@utility/wiki/effects.mjs';

// One level field for every wiki page whose numbers depend on a level. A page has no save, so the
// reader picks the level; the static HTML renders level 1, a real sentence rather than a blank.
// This was a fixed ladder of levels first: one field answers any level instead of the four somebody
// happened to pick.
const DEFAULT_COST_LABEL = 'Cost for this level';
const DEFAULT_COST_NOTE = 'Base cost, before discounts.';

// Art drawn after a cost line's text, for a currency the game never names in text; the text keeps its word
// for the bot and search.
const CurrencyIcon = ({ icon }) => (icon ? <img
  // The icon is rooted at `/`, and a slash after the prefix would read as a protocol-relative URL.
  src={`${prefix}${icon.replace(/^\//, '')}`}
  alt={''}
  width={16}
  height={16}
  style={{ objectFit: 'contain', verticalAlign: 'middle', marginLeft: 4 }}
/> : null);

const LevelledEffect = ({ node }) => {
  // A family bonus starts at the class's promotion level and reads nothing below it.
  const from = node?.effect?.from ?? 1;
  const [input, setInput] = useState(String(from));
  const cap = node?.effect?.cap ?? null;
  const level = Math.max(from, readLevel(input, cap));
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
      inputProps={{ min: from, max: cap ?? undefined }}
      sx={{ width: 200 }}
    />
    {text ? <Typography variant={'body2'}>{text}</Typography> : null}
    {costs.map(({ label: costLabel, prefix: amountPrefix, value, unit, total, totalUnit, note, currencyIcon }, i) => <React.Fragment key={i}>
      <Typography variant={'body2'} color={'text.secondary'}>
        {`${costLabel}: ${amountPrefix ?? ''}${formatAmount(value)}${unit}`}
        <CurrencyIcon icon={currencyIcon}/>
      </Typography>
      {total !== null ? <Typography variant={'body2'} color={'text.secondary'}>
        {`Total to max: ${formatAmount(total)}${totalUnit}`}
        <CurrencyIcon icon={currencyIcon}/>
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
