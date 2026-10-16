import React, { useState } from 'react';
import { Box, Stack, TextField, Typography } from '@mui/material';
import { notateGame } from '@utility/wiki/notate';
import Tooltip from '@components/Tooltip';
import CoinAmount from './CoinAmount';
import { cleanUnderscore, prefix } from '@utility/helpers';
import { costCurrency, costsAt, costsToMax, firstLevel, formatAmount, levelledText, readLevel } from '@utility/wiki/effects.mjs';

// One level field for every wiki page whose numbers depend on a level. A page has no save, so the
// reader picks the level; the static HTML renders the effect's first level, a real sentence rather than a blank.
// This was a fixed ladder of levels first: one field answers any level instead of the four somebody
// happened to pick.
const DEFAULT_COST_LABEL = 'Cost for this level';
const DEFAULT_COST_NOTE = 'Base cost, before discounts.';

// A currency's art drawn after its amount, in place of its name: the name is the image's alt text and its tooltip.
export const CurrencyIcon = ({ icon, name }) => (icon ? <Tooltip title={name}>
  <img
    // The icon is rooted at `/`, and a slash after the prefix would read as a protocol-relative URL.
    src={`${prefix}${icon.replace(/^\//, '')}`}
    alt={name}
    width={16}
    height={16}
    style={{ objectFit: 'contain', verticalAlign: 'middle', marginLeft: 4 }}
  />
</Tooltip> : null);

// From a million up the digits stop being comparable at a glance, so an amount reads in the game's own notation
// ("45.5M", ceil-based like the game's) under a dotted underline whose tooltip is the exact amount.
const SHORT_FROM = 1e6;
// Exact digits only while they are exact: past 2^53 a float's digits are noise, so the tooltip goes scientific.
const EXACT_BELOW = Number.MAX_SAFE_INTEGER;
const exactText = (amount) => (Math.abs(amount) < EXACT_BELOW
  ? Math.round(amount).toLocaleString('en-US')
  : amount.toExponential(3).replace('e+', 'e'));

export const ShortAmount = ({ amount }) => {
  const short = Number.isFinite(amount) && Math.abs(amount) >= SHORT_FROM ? notateGame(amount) : null;
  if (!short) return formatAmount(amount);
  return <Tooltip title={exactText(amount)}>
    <Box component={'span'} sx={{ textDecoration: 'underline dotted', textUnderlineOffset: 3, cursor: 'help' }}>{short}</Box>
  </Tooltip>;
};

// "59,000" and the art when the currency has art, "59,000 Feathers" when it has none. Coins read in their tiers,
// the way the game prints them.
export const CostAmount = ({ amount, currency, icon, prefix: amountPrefix = '' }) => (currency === 'Coins' && Number.isFinite(amount)
  ? <CoinAmount amount={amount} size={16} inline/>
  : <>
    {amountPrefix}<ShortAmount amount={amount}/>{icon || !currency ? null : ` ${cleanUnderscore(currency)}`}
    <CurrencyIcon icon={icon} name={cleanUnderscore(currency ?? '')}/>
  </>);

const LevelledEffect = ({ node }) => {
  // A family bonus starts at the class's promotion level, a sneaking floor at Ninja Mastery 0; neither reads below it.
  const from = firstLevel(node);
  const [input, setInput] = useState(String(from));
  const cap = node?.effect?.cap ?? null;
  const level = readLevel(input, cap, from);
  const text = levelledText(node, level);
  const totals = costsToMax(node);
  // The field is the level the player is at, so the remainder starts at the next one.
  const remaining = cap && level > from && level < cap ? costsToMax(node, level) : null;
  // A node can pay in several currencies at once: one cost line, and one total, per currency.
  const costs = costsAt(node, level).map((cost, i) => ({
    ...cost,
    label: cost.label ?? DEFAULT_COST_LABEL,
    note: cost.note ?? DEFAULT_COST_NOTE,
    total: totals[i].value,
    // Left out when it overflows: the total to max already reads ∞ there.
    rest: Number.isFinite(remaining?.[i]?.value) ? remaining[i].value : null,
    currencyAt: (amount) => costCurrency(cost, amount)
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
      helperText={node?.effect?.noMax ? 'No max level' : undefined}
      sx={{ width: 200 }}
    />
    {text ? <Typography variant={'body2'}>{text}</Typography> : null}
    {costs.map(({ label: costLabel, prefix: amountPrefix, value, total, rest, note, currencyIcon, currencyAt }, i) => <React.Fragment key={i}>
      <Typography variant={'body2'} color={'text.secondary'}>
        {`${costLabel}: `}
        <CostAmount amount={value} currency={currencyAt(value)} icon={currencyIcon} prefix={amountPrefix ?? ''}/>
      </Typography>
      {rest !== null ? <Typography variant={'body2'} color={'text.secondary'}>
        {`From level ${level} to max: `}
        <CostAmount amount={rest} currency={currencyAt(rest)} icon={currencyIcon}/>
      </Typography> : null}
      {total !== null ? <Typography variant={'body2'} color={'text.secondary'}>
        {'Total to max: '}
        <CostAmount amount={total} currency={currencyAt(total)} icon={currencyIcon}/>
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
