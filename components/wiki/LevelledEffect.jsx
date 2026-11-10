import React, { useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import NumberField from '@components/common/NumberField';
import GameIcon from '@components/common/GameIcon';
import { NoteTrigger } from '@components/common/InfoButton';
import CoinAmount from './CoinAmount';
import ShortAmount from '@components/common/ShortAmount';
import { cleanUnderscore } from '@utility/helpers';
import { costCurrency, costsAt, costsToMax, firstLevel, levelMax, levelledLines, levelledText, readLevel, summaryLevel, tierLines } from '@utility/wiki/effects.mjs';

// One level field for every wiki page whose numbers depend on a level. A page has no save, so the
// reader picks the level; the static HTML renders the effect's first level, a real sentence rather than a blank.
// This was a fixed ladder of levels first: one field answers any level instead of the four somebody
// happened to pick.
const DEFAULT_COST_LABEL = 'Cost for this level';
const DEFAULT_COST_NOTE = 'Base cost, before discounts.';

// A currency's art drawn after its amount, in place of its name: the name opens from it on a tap, a click, a hover and
// Enter. The icon is rooted at /, GameIcon's src under public/.
export const CurrencyIcon = ({ icon, name }) => (icon ? <NoteTrigger note={name} label={name} sx={{ ml: 0.5 }}>
  <GameIcon src={icon.replace(/^\//, '')} size={16} alt={name}/>
</NoteTrigger> : null);

// A label and its value on one row, the Panel.KV shape in a box that already holds the padding.
const Line = ({ label, children }) => <Stack data-cost-line direction={'row'} justifyContent={'space-between'} columnGap={2} flexWrap={'wrap'}>
  <Typography variant={'body2'} color={'text.secondary'} component={'div'}>{label}</Typography>
  <Typography variant={'body2'} component={'div'} sx={{ ml: 'auto', textAlign: 'right', fontWeight: 'fontWeightMedium' }}>{children}</Typography>
</Stack>;

// "59,000" and the art when the currency has art, "59,000 Feathers" when it has none. Coins read in their tiers,
// the way the game prints them.
export const CostAmount = ({ amount, currency, icon, prefix: amountPrefix = '' }) => (currency === 'Coins' && Number.isFinite(amount)
  ? <CoinAmount amount={amount} inline/>
  : <>
    {amountPrefix}<ShortAmount amount={amount}/>{icon || !currency ? null : ` ${cleanUnderscore(currency)}`}
    <CurrencyIcon icon={icon} name={cleanUnderscore(currency ?? '')}/>
  </>);

const LevelledEffect = ({ node }) => {
  // A family bonus starts at the class's promotion level, a sneaking floor at Ninja Mastery 0; neither reads below it.
  const from = firstLevel(node);
  const [input, setInput] = useState(summaryLevel(node));
  const cap = node?.effect?.cap ?? null;
  const level = readLevel(input, cap, from);
  const lines = levelledLines(node, level);
  // Labelled lines replace the joined sentence, which stays the description for the bot and search.
  const text = lines.length ? null : levelledText(node, level);
  const totals = costsToMax(node);
  // The field is the level the player is at, so the remainder starts at the next one.
  const remaining = cap && level > from && level < cap ? costsToMax(node, level) : null;
  // A node can pay in several currencies at once: one cost line, and one total, per currency.
  const costs = costsAt(node, level).map((cost, i) => ({
    ...cost,
    label: cost.label ?? DEFAULT_COST_LABEL,
    note: cost.note ?? DEFAULT_COST_NOTE,
    total: totals[i].value,
    // Left out when it overflows: the total to max already reads No max there.
    rest: Number.isFinite(remaining?.[i]?.value) ? remaining[i].value : null,
    currencyAt: (amount) => costCurrency(cost, amount)
  })).filter(({ value }) => value !== null);
  // One note when every cost says the same thing, otherwise each under its own cost.
  const sharedNote = costs.every(({ note }) => note === costs[0].note) ? costs[0]?.note : null;

  return <Stack gap={1}>
    <NumberField
      value={input}
      onChange={setInput}
      label={node?.effect?.levelLabel}
      min={from}
      max={levelMax(node)}
      integer
      help={node?.effect?.noMax ? 'No max level' : undefined}
      sx={{ width: 200 }}
    />
    {text ? <Typography variant={'body2'}>{text}</Typography> : null}
    {lines.map(({ label: lineLabel, text: lineText }, i) => <Typography key={i} variant={'body2'}>
      {lineLabel ? <Box component={'span'} color={'text.secondary'}>{`${lineLabel}: `}</Box> : null}
      {lineText}
    </Typography>)}
    {/* Past the field's max: the tiers read off the max level bonus whatever level the field holds. */}
    {tierLines(node).map(({ label: tierLabel, level: tierLevel, text: tierText }) => <Line key={tierLabel} label={`${tierLabel} (level ${tierLevel})`}>
      {tierText}
    </Line>)}
    {costs.map(({ label: costLabel, prefix: amountPrefix, value, total, rest, note, currencyIcon, currencyAt }, i) => <React.Fragment key={i}>
      <Line label={costLabel}>
        <CostAmount amount={value} currency={currencyAt(value)} icon={currencyIcon} prefix={amountPrefix ?? ''}/>
      </Line>
      {rest !== null ? <Line label={`From level ${level} to max`}>
        <CostAmount amount={rest} currency={currencyAt(rest)} icon={currencyIcon}/>
      </Line> : null}
      {total !== null ? <Line label={'Total to max'}>
        {Number.isFinite(total) ? <CostAmount amount={total} currency={currencyAt(total)} icon={currencyIcon}/> : 'No max'}
      </Line> : null}
      {sharedNote ? null : <Typography variant={'caption'} color={'text.muted'}>{note}</Typography>}
    </React.Fragment>)}
    {/* Account discounts and bonuses are player data; the page shows only the part every player shares. */}
    {sharedNote ? <Typography variant={'caption'} color={'text.muted'}>
      {sharedNote}
    </Typography> : null}
  </Stack>;
};

export default LevelledEffect;
