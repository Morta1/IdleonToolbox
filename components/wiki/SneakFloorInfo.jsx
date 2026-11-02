import React, { useState } from 'react';
import { Box, Link, Stack, Typography } from '@mui/material';
import NumberField from '@components/common/NumberField';
import { firstLevel, levelMax, readLevel, termValue } from '@utility/wiki/effects.mjs';
import { oneInOrNothing, percentLabel } from '@utility/wiki/odds.mjs';
import { entityName } from '@utility/wiki/names.mjs';
import EntityIcon from './EntityIcon';
import ShortAmount from '@components/common/ShortAmount';
import { CELL, NUM } from '@components/common/DataTable/parts';
import DataTable from '@components/common/DataTable';
import { linkProps, navigateOnPlainClick } from './links';

const SectionTitle = ({ children }) => <Typography variant={'groupLabel'} component={'h3'} color={'text.secondary'}>
  {children}
</Typography>;

// The loot a floor rolls at this mastery: the last step at or below it.
const lootAt = (steps, level) => steps.filter(({ from }) => from <= level).at(-1) ?? steps[0];

// A sneaking floor's page body: one Ninja Mastery field driving both its stats and its loot, since both change with it.
// The rail had held all of it as a sentence and a list of "Item: 1 in N (x%)" lines beside an empty column.
export const sneakFloorShows = (node) => Boolean(node?.kind === 'sneakfloor' && node.panel?.stats);

const SneakFloorInfo = ({ node, index, hrefFor, onNavigate }) => {
  const from = firstLevel(node);
  const [input, setInput] = useState(from);
  if (!sneakFloorShows(node)) return null;
  const level = readLevel(input, null, from);
  const stats = node.panel.stats
    .map(({ label, token }) => ({ label, value: termValue(node.effect?.terms?.find((term) => term.token === token), level) }))
    .filter(({ value }) => value !== null);
  const step = lootAt(node.panel.loot, level);
  // What each later mastery adds over the step before it. The export is the Mastery 0 page, so this is also where those
  // items' pages are linked from.
  const later = node.panel.loot
    .map((laterStep, at, steps) => ({
      from: laterStep.from,
      added: at === 0 ? [] : laterStep.loot.filter(({ id }) => !steps[at - 1].loot.some((entry) => entry.id === id))
    }))
    .filter(({ from: mastery, added }) => mastery > level && added.length);
  const itemLink = ({ id, need }) => {
    const item = index?.byId?.[id];
    if (!item) return null;
    return <React.Fragment key={id}>
      <Link {...linkProps(hrefFor, id)} underline={'hover'} onClick={navigateOnPlainClick(onNavigate, id, Boolean(hrefFor?.(id)))}>
        {entityName(item)}
      </Link>
      {need ? ` (needs a ${need})` : null}
    </React.Fragment>;
  };

  return <Stack gap={2} sx={{ mt: 2, maxWidth: 720 }}>
    <NumberField
      value={input}
      onChange={setInput}
      label={node.effect?.levelLabel ?? 'Ninja Mastery'}
      min={from}
      max={levelMax(node)}
      integer
      help={node.effect?.noMax ? 'No max level' : undefined}
      sx={{ width: 200 }}
    />
    {stats.length ? <Stack gap={0.5}>
      <SectionTitle>Stats</SectionTitle>
      <Box component={'table'} sx={{ borderCollapse: 'collapse', width: '100%' }}>
        <tbody>
        {stats.map(({ label, value }) => <tr key={label}>
          <Box component={'th'} scope={'row'} sx={{ ...CELL, fontWeight: 400, textAlign: 'left', color: 'text.secondary' }}>{label}</Box>
          <Box component={'td'} sx={NUM}><ShortAmount amount={value}/></Box>
        </tr>)}
        </tbody>
      </Box>
    </Stack> : null}
    {step?.loot.length ? <Stack gap={0.5}>
      <SectionTitle>{`Loot at Ninja Mastery ${step.from === level ? level : `${level} (same as ${step.from})`}`}</SectionTitle>
      {/* Odds is the phone's number; the percentage beside it shows from sm. */}
      <DataTable
        rows={step.loot}
        rowKey={'id'}
        rowLabel={({ id }) => (index?.byId?.[id] ? entityName(index.byId[id]) : id)}
        columns={[
          {
            key: 'item',
            label: 'Item',
            icon: ({ id }) => (index?.byId?.[id] ? <EntityIcon node={index.byId[id]} size={32}/> : null),
            render: ({ id, need }) => {
              const item = index?.byId?.[id];
              return <Stack component={'span'}>
                {item
                  ? <Link {...linkProps(hrefFor, id)} underline={'hover'} onClick={navigateOnPlainClick(onNavigate, id, Boolean(hrefFor?.(id)))}>
                    {entityName(item)}
                  </Link>
                  : id}
                {need ? <Typography variant={'caption'} color={'text.secondary'}>{`Needs a ${need}`}</Typography> : null}
              </Stack>;
            }
          },
          { key: 'odds', label: 'Odds', numeric: true, phone: true, render: ({ chance }) => oneInOrNothing(chance) || null },
          { key: 'chance', label: 'Chance', numeric: true, render: ({ chance }) => percentLabel(chance) }
        ]}
      />
      {node.panel.hatNote ? <Typography variant={'caption'} color={'text.secondary'}>{node.panel.hatNote}</Typography> : null}
      {/* A class-locked item sits in the roll order only with its class on the account, which shifts every chance below it. */}
      {[...new Set(step.loot.map(({ need }) => need).filter(Boolean))].map((need) => <Typography key={need} variant={'caption'} color={'text.secondary'}>
        {`The chances assume a ${need} on the account.`}
      </Typography>)}
      {later.map(({ from: mastery, added }) => <Typography key={mastery} variant={'caption'} color={'text.secondary'} data-mastery-adds>
        {`Ninja Mastery ${mastery} adds: `}
        {added.map((entry, at) => <React.Fragment key={entry.id}>{at ? ', ' : null}{itemLink(entry)}</React.Fragment>)}
      </Typography>)}
    </Stack> : null}
  </Stack>;
};

export default SneakFloorInfo;
