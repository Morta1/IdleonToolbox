import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { Stack, Typography } from '@mui/material';
import {
  DEATH_NOTE_RANKS,
  ECLIPSE_SKULL_KILLS,
  ECLIPSE_SKULL_RANK,
  getDeathNoteRank,
  MINI_BOSS_DEATH_NOTE_RANKS
} from '@parsers/world-3/deathNote';
import { cleanUnderscore, notateNumber, numberWithCommas, prefix, worldColor, worlds } from 'utility/helpers';
import { NextSeo } from 'next-seo';
import { CardTitleAndValue } from '@components/common/styles';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import Tooltip from '@components/Tooltip';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import usePageTop from '@hooks/usePageTop';

// A rank's skull: StatusSkull0 to 6 by the formula below, the eclipse skull past rank 10, none before the first.
const skullOf = (rank) => {
  const iconNumber = rank - 1 - Math.floor(rank / 7) - 2 * Math.floor(rank / 10);
  if (iconNumber === -1) return null;
  return rank > 10 ? 'etc/EclipseSkull.png' : `data/StatusSkull${iconNumber}.png`;
};

const COLUMNS = [
  { key: 'monster', label: 'Monster', value: (mob) => cleanUnderscore(mob.displayName) },
  { key: 'kills', label: 'Kills', numeric: true, sortable: true, phone: true, value: (mob) => mob.kills, render: (mob) => notateNumber(mob.kills, 'Big') },
  {
    key: 'rank', label: 'Rank', numeric: true, sortable: true, value: (mob) => mob.noteRank,
    render: (mob) => {
      const skull = skullOf(mob.noteRank);
      return skull ? <GameIcon src={skull} alt={`Rank ${mob.noteRank}`} size={24}/> : null;
    }
  }
];

const DeathNote = () => {
  const { state } = useContext(AppContext);
  const { deathNote } = state?.account || { deathNote: {} };
  const pageTop = usePageTop();
  // One table, a band per world (the board's call over a wall of cards); each sorts within its band.
  const bands = Object.entries(deathNote ?? {}).map(([worldIndex, { mobs, rank }]) => ({
    key: worldIndex,
    label: worlds?.[worldIndex] || 'Minibosses',
    accent: worldColor?.[worldIndex] || '#e987e6',
    meta: `Multikill bonus ${rank}%`,
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
      <Stack direction={'row'} alignItems={'center'} gap={2} mb={2}>
        <CardTitleAndValue title={'Normal Monsters'}>
          <Stack direction={'row'} alignItems={'center'} gap={1}>
            <Typography>Legend</Typography>
            <Tooltip title={<LegendTooltip/>}>
              <IconInfoCircleFilled size={18}/>
            </Tooltip>
          </Stack>
        </CardTitleAndValue>
        <CardTitleAndValue title={'Minibosses'}>
          <Stack direction={'row'} alignItems={'center'} gap={1}>
            <Typography>Legend</Typography>
            <Tooltip title={<MinibossLegendTooltip/>}>
              <IconInfoCircleFilled size={18}/>
            </Tooltip>
          </Stack>
        </CardTitleAndValue>
      </Stack>

      <DataTable columns={COLUMNS} bands={bands} rowKey={'rawName'} rowLabel={(mob) => cleanUnderscore(mob.displayName)}
                 surface={'card'} stickyTop={pageTop}/>
    </>
  );
};

// The skull icon of each rank step: StatusSkull0 for the first rank up to StatusSkull6 for the last
const RankLegend = ({ ranks, children }) => {
  return <Stack gap={1}>
    {ranks.map(([kills, points], index) => <LegendItem key={kills} number={kills} points={points}
                                                         icon={`data/StatusSkull${index}`}/>)}
    {children}
  </Stack>
}

const LegendTooltip = () => {
  return <RankLegend ranks={DEATH_NOTE_RANKS}>
    <LegendItem number={ECLIPSE_SKULL_KILLS} points={ECLIPSE_SKULL_RANK} icon={'etc/EclipseSkull'}/>
  </RankLegend>
}

const MinibossLegendTooltip = () => {
  return <RankLegend ranks={MINI_BOSS_DEATH_NOTE_RANKS}/>
}

const LegendItem = ({ number, points, icon }) => {
  return <Stack direction={'row'} alignItems={'center'}>
    <img style={{ marginTop: -10 }} src={`${prefix}${icon}.png`} alt="skull-icon"/>
    <Typography variant={'body1'} sx={{ mx: 1 }}>{numberWithCommas(number)}</Typography>
    <Typography variant={'body1'} sx={{ whiteSpace: 'no-wrap' }}>{points > 1
      ? `= ${points} points`
      : `= ${points} point`}</Typography>
  </Stack>
}

export default DeathNote;