import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { Stack, Typography } from '@mui/material';
import {
  DEATH_NOTE_RANKS,
  ECLIPSE_SKULL_KILLS,
  ECLIPSE_SKULL_RANK,
  getDeathNote,
  getDeathNoteRank,
  MINI_BOSS_DEATH_NOTE_RANKS
} from '@parsers/world-3/deathNote';
import { cleanUnderscore, formatNum, worldColor, worlds } from 'utility/helpers';
import { NextSeo } from 'next-seo';
import { MissingData, isSectionFailed } from '@components/common/styles';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import usePageTop from '@hooks/usePageTop';

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

const COLUMNS = [
  { key: 'monster', label: 'Monster', value: (mob) => cleanUnderscore(mob.displayName) },
  { key: 'kills', label: 'Kills', numeric: true, sortable: true, phone: true, value: (mob) => mob.kills, kind: 'whole' },
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
  const pageTop = usePageTop();
  // One table, a band per world (the board's call over a wall of cards); each sorts within its band.
  // A band with no world color (the minibosses) draws no accent.
  const bands = Object.entries(deathNote).map(([worldIndex, { mobs, rank }]) => ({
    key: worldIndex,
    label: worlds?.[worldIndex] || 'Minibosses',
    accent: worldColor?.[worldIndex],
    meta: sectionFailed ? undefined : `Multikill bonus ${formatNum(rank ?? 0, 'pct')}`,
    rows: (mobs ?? []).map((mob) => ({
      ...mob,
      kills: parseInt(mob.kills),
      noteRank: getDeathNoteRank(state?.account, mob.kills, worldIndex === 'miniBosses')
    }))
  }));

  return (
    <>
      <NextSeo
        title="Death Note | Idleon Toolbox"
        description="Track your Death Note monster kill counts, multikill progress, and world completion in Legends of Idleon"
      />
      {sectionFailed ? <MissingData name={'Death Note'} failed atZero/> : null}
      {/* An empty table draws no header */}
      {bands.length ? <DataTable columns={COLUMNS} bands={bands} bandNoun={'monsters'} rowKey={'rawName'}
                                 rowLabel={(mob) => cleanUnderscore(mob.displayName)} surface={'card'} stickyTop={pageTop}/> : null}
    </>
  );
};

export default DeathNote;
