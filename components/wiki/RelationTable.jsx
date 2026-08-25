import React, { useState } from 'react';
import { Box, Chip, Link, Stack, TextField, Typography } from '@mui/material';
import Tooltip from '@components/Tooltip';
import { EntityIcon } from './EntityPanel';
import CoinAmount, { isCoin } from './CoinAmount';
import { entityName } from '@utility/wiki/names';
import { dropChanceLabel, dropTalentLabel, oneIn, percentLabel } from '@utility/wiki/drops';

// A flat list is right for the median entity, which has three relations. Silver Pen has 248, and
// there a list is a wall: nothing lines up, nothing sorts, and the same monster appears five times
// because it reaches the item through five drop tables. This is that section as a table.
const PAGE_SIZE = 50;

const HEAD = {
  fontSize: 12,
  lineHeight: 1.66,
  letterSpacing: '0.03333em',
  fontWeight: 500,
  textTransform: 'uppercase',
  color: 'text.secondary',
  textAlign: 'left',
  py: 1,
  px: 1.5,
  borderBottom: '1px solid',
  borderColor: 'divider'
};

const CELL = {
  fontSize: 14,
  lineHeight: 1.43,
  py: 0.75,
  px: 1.5,
  borderBottom: '1px solid',
  borderColor: 'action.hover'
};

// Right-aligned tabular figures, so a column of rates compares by eye down the page. This is the
// thing a list of inline captions cannot do at all.
const NUM = { ...CELL, textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' };

// A section arrives as one or more groups: a monster's drops come pre-split into the game's drop
// tables, everything else is a single unlabelled group. Groups become full-width band rows inside
// ONE table rather than a table each, which is what lets a monster's 16 drops across 3 tiers read
// as one sorted thing instead of three short lists that each miss the threshold.
const RelationTable = ({ groups, index, onNavigate, hrefFor, showChance }) => {
  const [filter, setFilter] = useState('');
  const [shown, setShown] = useState(PAGE_SIZE);

  const named = groups.map((group) => ({
    ...group,
    // Best odds first when there are odds to sort by, alphabetical otherwise. A rate column nobody
    // ordered is just a column: the reason to tabulate is to see which row to act on.
    rows: group.rows
      .map((row) => ({ ...row, other: index.byId[row.otherId] }))
      .filter((row) => row.other)
      .sort((a, b) => (showChance
        ? (b.combinedChance ?? 0) - (a.combinedChance ?? 0)
        : entityName(a.other).localeCompare(entityName(b.other))))
  }));

  const needle = filter.trim().toLowerCase();
  const filtered = named
    .map((group) => ({
      ...group,
      rows: needle ? group.rows.filter((row) => entityName(row.other).toLowerCase().includes(needle)) : group.rows
    }))
    .filter((group) => group.rows.length > 0);

  const total = filtered.reduce((sum, group) => sum + group.rows.length, 0);

  // The cap counts rows across the whole section rather than per group, so the count in the header
  // is the count a reader sees.
  let budget = shown;
  const visibleGroups = [];
  for (const group of filtered) {
    if (budget <= 0) break;
    visibleGroups.push({ ...group, rows: group.rows.slice(0, budget) });
    budget -= group.rows.length;
  }
  const visibleCount = visibleGroups.reduce((sum, group) => sum + group.rows.length, 0);

  // Only worth a column when at least one row actually merged several drop tables; on a section
  // where every row is a single path it would be a column of ones.
  const anyMerged = named.some((group) => group.rows.some((row) => row.paths > 1));
  // Same rule for quantity: most sections drop one of a thing, and a column of blanks is worse
  // than no column. Coins always earn it, since their amount IS the interesting part.
  const rowAmount = (row) => row.edge?.meta?.quantity ?? row.edge?.meta?.amount;
  const anyQuantity = named.some((group) => group.rows.some((row) => rowAmount(row) > 1 || isCoin(row.other)));
  const columns = 2 + (anyQuantity ? 1 : 0) + (anyMerged ? 1 : 0) + (showChance ? 2 : 0);

  return <Stack gap={1} sx={{ mt: 1 }}>
    <Stack direction={'row'} gap={1} alignItems={'center'} flexWrap={'wrap'}>
      <TextField
        size={'small'}
        value={filter}
        onChange={(event) => {
          setFilter(event.target.value);
          setShown(PAGE_SIZE);
        }}
        label={'Filter'}
        sx={{ width: 240 }}
      />
      <Typography variant={'caption'} color={'text.secondary'}>
        {visibleCount < total
          ? `showing ${visibleCount} of ${total.toLocaleString('en-US')}`
          : `${total.toLocaleString('en-US')} total`}
      </Typography>
    </Stack>

    <Box sx={{ overflowX: 'auto' }}>
      <Box component={'table'} sx={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
        <Box component={'tr'}>
          <Box component={'th'} sx={{ ...HEAD, width: 44 }}/>
          <Box component={'th'} sx={HEAD}>Name</Box>
          {anyQuantity ? <Box component={'th'} sx={{ ...HEAD, textAlign: 'right', width: 130 }}>Qty</Box> : null}
          {anyMerged ? <Box component={'th'} sx={{ ...HEAD, textAlign: 'right', width: 80 }}>
            <Tooltip title={'How many separate drop tables reach it. Each is its own roll.'}>
              <span>Tables</span>
            </Tooltip>
          </Box> : null}
          {showChance ? <Box component={'th'} sx={{ ...HEAD, textAlign: 'right', width: 140 }}>
            {anyMerged ? 'Per kill' : 'Rate'}
          </Box> : null}
          {showChance ? <Box component={'th'} sx={{ ...HEAD, textAlign: 'right', width: 110 }}>Chance</Box> : null}
        </Box>
        </thead>
        <tbody>
        {visibleGroups.map((group) => <React.Fragment key={group.key}>
        {group.label ? <Box component={'tr'}>
          <Box component={'td'} colSpan={columns} sx={{ ...CELL, bgcolor: 'action.hover' }}>
            <Stack direction={'row'} gap={1} alignItems={'baseline'} flexWrap={'wrap'}>
              <Typography variant={'body2'} fontWeight={600}>{group.label}</Typography>
              {group.odds ? <Typography variant={'caption'} color={'text.secondary'}>
                table rolls {group.odds}
              </Typography> : null}
              {group.table ? <Typography variant={'caption'} color={'text.disabled'}>
                {group.table}
              </Typography> : null}
            </Stack>
          </Box>
        </Box> : null}
        {group.rows.map((row) => {
          const href = hrefFor?.(row.otherId);
          const label = entityName(row.other);
          const talent = dropTalentLabel(row.edge?.meta);
          return <Box component={'tr'} key={row.key}>
            <Box component={'td'} sx={CELL}><EntityIcon node={row.other} size={24}/></Box>
            <Box component={'td'} sx={CELL}>
              <Stack direction={'row'} gap={1} alignItems={'center'} flexWrap={'wrap'}>
                {row.other.navigable === false
                  ? <Typography variant={'body2'}>{label}</Typography>
                  : <Link
                    href={href}
                    variant={'body2'}
                    underline={'hover'}
                    onClick={(event) => {
                      if (!onNavigate) return;
                      event.preventDefault();
                      onNavigate(row.otherId);
                    }}
                  >
                    {label}
                  </Link>}
                {row.edge?.meta?.recipe ? <Chip size={'small'} variant={'outlined'} label={'Recipe'}/> : null}
                {talent ? <Typography variant={'caption'} color={'text.secondary'}>{talent}</Typography> : null}
              </Stack>
            </Box>
            {anyQuantity ? <Box component={'td'} sx={NUM}>
              {isCoin(row.other)
                ? <Stack direction={'row'} justifyContent={'flex-end'}><CoinAmount amount={rowAmount(row)} size={16}/></Stack>
                : <Typography variant={'caption'} color={'text.secondary'}>
                  {rowAmount(row) > 1 ? rowAmount(row).toLocaleString('en-US') : ''}
                </Typography>}
            </Box> : null}
            {anyMerged ? <Box component={'td'} sx={NUM}>
              <Typography variant={'caption'} color={row.paths > 1 ? 'text.primary' : 'text.disabled'}>
                {row.paths}
              </Typography>
            </Box> : null}
            {showChance ? <Box component={'td'} sx={NUM}>
              <Tooltip title={row.paths > 1
                ? `${dropChanceLabel({ effectiveChance: row.combinedChance })} across ${row.paths} tables, best single table ${oneIn(row.bestChance)}`
                : dropChanceLabel(row.edge?.meta || {})}>
                <Typography variant={'caption'} color={'text.secondary'} sx={{ cursor: 'help' }}>
                  {oneIn(row.combinedChance)}
                </Typography>
              </Tooltip>
            </Box> : null}
            {/* The odds twice, deliberately: "1 in 618" is what a player quotes, a percentage is
                what the game's own drop tables are written in, and neither converts in the head. */}
            {showChance ? <Box component={'td'} sx={NUM}>
              <Typography variant={'caption'} color={'text.disabled'}>
                {percentLabel(row.combinedChance)}
              </Typography>
            </Box> : null}
          </Box>;
        })}
        </React.Fragment>)}
        </tbody>
      </Box>
    </Box>

    {visibleCount < total ? <Link
      component={'button'}
      type={'button'}
      variant={'body2'}
      underline={'hover'}
      sx={{ alignSelf: 'flex-start' }}
      onClick={() => setShown((current) => current + PAGE_SIZE)}
    >
      Show {Math.min(PAGE_SIZE, total - visibleCount)} more
    </Link> : null}
  </Stack>;
};

export default RelationTable;
