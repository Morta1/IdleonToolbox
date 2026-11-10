import React, { useContext, useDeferredValue } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { Box, Stack, Typography } from '@mui/material';
import {
  DEATH_NOTE_RANKS,
  ECLIPSE_SKULL_KILLS,
  ECLIPSE_SKULL_RANK,
  getDeathNote,
  getDeathNoteRank,
  MINI_BOSS_DEATH_NOTE_RANKS
} from '@parsers/world-3/deathNote';
import { cleanUnderscore, formatNum, notateNumber, worlds } from 'utility/helpers';
import { NextSeo } from 'next-seo';
import { MissingData, isSectionFailed } from '@components/common/styles';
import DataTable from '@components/common/DataTable';
import CardGrid from '@components/common/cards/CardGrid';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import GameIcon from '@components/common/GameIcon';
import Toolbar from '@components/common/Toolbar';

import useToolbarState from '@hooks/useToolbarState';

const DEATH_NOTE_TOOLBAR = { search: '', world: 'all' };
// A world's table at its narrowest with no scrollbar (name, a short kill count, the rank skull): four to a row on a 1920
// window's 1,265 px page
const WORLD_TABLE_MIN = 292;
// The world's name is the table's title, in its own case: in capitals "Frostbite Tundra" broke in two, so heads in one row
// differed in height, and kept on one line it made the table scroll. In its world's colour, as the old page wrote it
// (palette.identity.worlds); the minibosses in their pink
const worldHeadSx = (worldIndex) => ({
  '& thead th:first-of-type': {
    textTransform: 'none', letterSpacing: 0, fontSize: 13,
    color: (theme) => {
      const { worlds: colors, miniBosses } = (theme.vars || theme).palette.identity;
      return colors[worldIndex] ?? miniBosses;
    }
  }
});

// A rank's skull: StatusSkull0 to 6 by the formula below, the eclipse skull past rank 10, none before the first.
const skullOf = (rank) => {
  const iconNumber = rank - 1 - Math.floor(rank / 7) - 2 * Math.floor(rank / 10);
  if (iconNumber === -1) return null;
  return rank > 10 ? 'etc/EclipseSkull.png' : `data/StatusSkull${iconNumber}.png`;
};

// The kill thresholds of each rank in the Rank column's note: both kinds share the same point steps, so one small
// table holds both (two tables ran taller than a phone's screen)
const LEGEND_COLUMNS = [
  {
    key: 'points', label: 'Points', value: ({ points }) => formatNum(points),
    icon: ({ icon }) => <GameIcon src={icon} alt={''} size={24}/>
  },
  { key: 'monsters', label: 'Monsters', numeric: true, value: ({ monsters }) => monsters, kind: 'amount' },
  { key: 'minibosses', label: 'Minibosses', numeric: true, value: ({ minibosses }) => minibosses, kind: 'amount' }
];
const LEGEND_ROWS = [...DEATH_NOTE_RANKS.map(([kills, points], index) => ({
  points, monsters: kills, minibosses: MINI_BOSS_DEATH_NOTE_RANKS.find(([, miniPoints]) => miniPoints === points)?.[0] ?? null,
  icon: `data/StatusSkull${index}.png`
})), { points: ECLIPSE_SKULL_RANK, monsters: ECLIPSE_SKULL_KILLS, minibosses: null, icon: 'etc/EclipseSkull.png' }];
const RANK_LEGEND = <Stack gap={1}>
  <DataTable fits columns={LEGEND_COLUMNS} rowKey={'points'} rows={LEGEND_ROWS}/>
  {/* The parser checks the rift bonus for the eclipse rank */}
  <Typography variant={'body2'}>{`The ${formatNum(ECLIPSE_SKULL_RANK)} point rank needs the rift's Eclipse Skulls bonus.`}</Typography>
</Stack>;

// A world's table names its world in its first column's head, where "Monster" said nothing: the band that named it took two
// lines a table, and its multikill bonus now sits in the tiles above, where the worlds compare at a glance.
const columnsOf = (world) => [
  { key: 'monster', label: world, value: (mob) => cleanUnderscore(mob.displayName) },
  { key: 'kills', label: 'Kills', numeric: true, sortable: true, phone: true, value: (mob) => mob.kills,
    // In short form as the page always printed them (124K, 2.5B, 4.2QQ), not the game's own 4,200,000T
    render: (mob) => notateNumber(mob.kills, 'Big') },
  {
    // On the phone row too, beside the kills: the name and two short cells fit 336 px
    key: 'rank', label: 'Rank', numeric: true, sortable: true, phone: true, info: RANK_LEGEND, value: (mob) => mob.noteRank,
    render: (mob) => {
      const skull = skullOf(mob.noteRank);
      return skull ? <GameIcon src={skull} alt={`Rank ${mob.noteRank}`} size={24}/> : null;
    }
  }
];

const DeathNote = () => {
  const { state } = useContext(AppContext);
  const sectionFailed = isSectionFailed(state?.account, 'deathNote');
  const parsed = state?.account?.deathNote ?? {};
  // A failed section lists every mob at zero (the parser's catalog with no save), with no multikill bonus
  const deathNote = sectionFailed && !Object.keys(parsed).length ? getDeathNote({}, [], state?.account) : parsed;
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('death-note', DEATH_NOTE_TOOLBAR);
  // The table follows the search a beat behind the box, so typing stays responsive
  const searchText = useDeferredValue(toolbar?.search ?? '');
  // A failed section has no Toolbar, so nothing narrows its catalog
  const query = sectionFailed ? '' : searchText.trim().toLowerCase();
  const world = sectionFailed ? 'all' : toolbar?.world ?? 'all';
  // A table per world, each sorting on its own
  const worldBands = Object.entries(deathNote).map(([worldIndex, { mobs, rank }]) => ({
    key: worldIndex,
    label: worlds?.[worldIndex] || 'Minibosses',
    multikill: rank,
    rows: (mobs ?? []).map((mob) => ({
      ...mob,
      kills: parseInt(mob.kills),
      noteRank: getDeathNoteRank(state?.account, mob.kills, worldIndex === 'miniBosses')
    }))
  }));
  const countOf = (list) => list.reduce((sum, { rows }) => sum + rows.length, 0);
  const bands = worldBands
    .filter(({ key }) => world === 'all' || key === world)
    .map(({ rows, ...band }) => ({
      ...band,
      rows: query ? rows.filter((mob) => cleanUnderscore(mob.displayName).toLowerCase().includes(query)) : rows
    }))
    .filter(({ rows }) => rows.length);

  return (
    <>
      <NextSeo
        title="Death Note | Idleon Toolbox"
        description="Track your Death Note monster kill counts, multikill progress, and world completion in Legends of Idleon"
      />
      {sectionFailed ? <MissingData name={'Death Note'} failed atZero/> : null}
      {worldBands.length ? <PageSummary label={'Multikill bonus'}>
        {worldBands.map(({ key, label, multikill }) => <StatTile key={key} label={`${label} multikill`} failed={sectionFailed}
                                                                 value={formatNum(multikill ?? 0, 'pct')}/>)}
      </PageSummary> : null}
      <Box>
        {!sectionFailed && worldBands.length ? <Toolbar state={toolbar} defaults={DEATH_NOTE_TOOLBAR} onChange={setToolbar}
                                                        onReset={resetToolbar} total={countOf(worldBands)} shown={countOf(bands)}
                                                        noun={'monsters'}>
          <Toolbar.Search placeholder={'Search monsters'}/>
          <Toolbar.Show name={'world'} label={'World'} options={[['all', 'All worlds', countOf(worldBands)],
            ...worldBands.map(({ key, label, rows }) => [key, label, rows.length])]}/>
        </Toolbar> : null}
        {/* A short table per world, side by side, as the old page laid them out: one long table ran three times its height
            on a desktop. A row of worlds takes its tallest one's height. A world with no match draws no table. */}
        <CardGrid size={'s'} sx={{ alignItems: 'start', gridTemplateColumns: `repeat(auto-fill, minmax(min(${WORLD_TABLE_MIN}px, 100%), 1fr))` }}>
          {bands.map(({ key, label, rows }) => <DataTable key={key} columns={columnsOf(label)} rows={rows} rowKey={'rawName'}
                                                          rowLabel={(mob) => cleanUnderscore(mob.displayName)} surface={'card'} dense
                                                          sx={worldHeadSx(key)}/>)}
        </CardGrid>
      </Box>
    </>
  );
};

export default DeathNote;
