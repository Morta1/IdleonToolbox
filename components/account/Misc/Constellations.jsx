import { Box, Link, Stack, Typography } from '@mui/material';
import React, { useState } from 'react';
import { cleanUnderscore, formatNum } from 'utility/helpers';
import { mapEnemiesArray, monsters } from '@website-data';
import { monsterSprite } from '@utility/spriteImages';
import { openWikiEntity } from '@utility/wiki/item-page';
import DataTable from '@components/common/DataTable';
import StatusText from '@components/common/StatusText';
import GameIcon from '@components/common/GameIcon';
import StatTile from '@components/common/cards/StatTile';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import usePageTop from '@hooks/usePageTop';

const CHAR_INDEX_MAP = Object.fromEntries('_abcdefghijklmnopqrstuvwxyz'.split('').map((c, i) => [c, i]));
const CONSTELLATIONS_TOOLBAR = { hideDone: false };
// The Mob column joins the row from the desktop width; below it the mob folds into Location's second line
const MOB_FROM = 'lg';

// The game marks a constellation done only when it is claimed at its star; its points are added then (N.js). Enough
// characters past its requirement and not claimed yet: ready to claim.
const stateOf = ({ done, completedChars, requiredPlayers }) => (done ? 'done'
  : (completedChars?.length ?? 0) >= requiredPlayers ? 'ready' : 'open');

const mobOf = (mapIndex) => {
  const raw = mapEnemiesArray?.[mapIndex];
  return !raw || raw === 'Nothing' ? null : { raw, name: cleanUnderscore(monsters?.[raw]?.Name || raw) };
};
const Mob = ({ mob, size }) => <Box component={'span'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' }}>
  <GameIcon src={monsterSprite(mob.raw)} size={size} alt={''}/>
  {mob.name}
</Box>;

// Where a constellation is done: the map (End of the Road starred, as in game) with its world under it, muted
const Location = ({ location, mapIndex }) => {
  const mob = mobOf(mapIndex);
  const world = Number.isInteger(mapIndex) ? Math.floor(mapIndex / 50) + 1 : null;
  return <Stack spacing={0.25}>
    <Box component={'span'} sx={{ fontWeight: 500 }}>{location === 'End_Of_The_Road' ? cleanUnderscore(location) + ' *' : cleanUnderscore(location)}</Box>
    {world || mob ? <Typography variant={'caption'} color={'text.secondary'} component={'div'}
                                sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 0.5 }}>
      {world ? <span>{`World ${world}`}</span> : null}
      {mob ? <Box component={'span'} sx={{ display: { xs: 'inline-flex', [MOB_FROM]: 'none' }, alignItems: 'center', gap: 0.5 }}>
        {world ? <span>·</span> : null}<Mob mob={mob} size={16}/>
      </Box> : null}
    </Typography> : null}
  </Stack>;
};

// sectionFailed: the catalog by name, with no progress, points owned or Toolbar
const ConstellationsComp = ({ constellations = [], characters = [], sectionFailed }) => {
  const [view, setView, resetView] = useToolbarState('constellations', CONSTELLATIONS_TOOLBAR);
  const [toolbarBottom, setToolbarBottom] = useState(null);
  const pageTop = usePageTop();

  const characterNames = characters?.map(({ name }) => name) || [];
  const rows = !sectionFailed && view.hideDone ? constellations?.filter(({ done }) => !done) : constellations;

  const getCompletedNames = (completedChars) => {
    const indices = completedChars
      ?.split('')
      ?.map((char) => CHAR_INDEX_MAP?.[char])
      ?.filter((idx) => idx !== undefined);
    const uniqueSorted = [...new Set(indices)].toSorted((a, b) => a - b);
    return uniqueSorted.map((idx) => cleanUnderscore(characterNames?.[idx]) || `Char ${idx + 1}`);
  };

  // The points the game has added: the claimed constellations'. Ready ones add theirs once claimed at their star
  const { ownedPoints, totalPoints, readyPoints, readyCount } = (constellations ?? []).reduce((res, row) => ({
    ownedPoints: res.ownedPoints + (row?.done ? row?.points ?? 0 : 0),
    totalPoints: res.totalPoints + (row?.points ?? 0),
    readyPoints: res.readyPoints + (stateOf(row) === 'ready' ? row?.points ?? 0 : 0),
    readyCount: res.readyCount + (stateOf(row) === 'ready' ? 1 : 0)
  }), { ownedPoints: 0, totalPoints: 0, readyPoints: 0, readyCount: 0 });

  const columns = [
    {
      key: 'name',
      label: 'Name',
      icon: ({ rawIndex }) => (rawIndex == null ? null : <GameIcon src={`etc/Constellation_${rawIndex}.png`} size={24} alt={''}/>),
      // nowrap: "A-10" broke at its hyphen at 1920
      render: ({ name }) => <Link component={'button'} variant={'body2'} color={'inherit'} textAlign={'left'}
                                  sx={{ whiteSpace: 'nowrap' }} onClick={() => openWikiEntity(`constellation:${name}`)}>{cleanUnderscore(name)}</Link>
    },
    {
      key: 'progress',
      label: 'Progress',
      numeric: true,
      align: 'left',
      // A star's Done or Ready to claim shows without opening its row on a phone
      phone: !sectionFailed,
      sortable: !sectionFailed,
      sortValue: (row) => ({ done: 2, ready: 1 })[stateOf(row)] ?? (row?.completedChars?.length ?? 0) / (row?.requiredPlayers || 1),
      render: (row) => (sectionFailed ? null
        : stateOf(row) === 'done' ? <StatusText status={'done'}>Done</StatusText>
          // It may take two lines on the narrowest phones, so the row's chevron stays in the card
          : stateOf(row) === 'ready' ? <StatusText status={'ready'} sx={{ whiteSpace: { xs: 'normal', sm: 'nowrap' } }}>Ready to claim</StatusText>
            : `${formatNum(Math.min(row?.completedChars?.length ?? 0, row?.requiredPlayers ?? 0))} / ${formatNum(row?.requiredPlayers ?? 0)}`)
    },
    { key: 'location', label: 'Location', render: ({ location, mapIndex }) => <Location location={location} mapIndex={mapIndex}/> },
    {
      key: 'mob', label: 'Mob', from: MOB_FROM, details: false,
      render: ({ mapIndex }) => (mobOf(mapIndex) ? <Mob mob={mobOf(mapIndex)} size={24}/> : null)
    },
    { key: 'requirement', label: 'Requirement', value: ({ requirement }) => cleanUnderscore(requirement) },
    { key: 'points', label: 'Points', kind: 'amount', sortable: true, phone: true, value: ({ points }) => points },
    {
      key: 'completedBy',
      label: 'Completed by',
      // Names wrap between names, never inside one
      render: ({ completedChars }) => {
        const names = sectionFailed ? [] : getCompletedNames(completedChars);
        return names.length ? names.map((name, index) => <React.Fragment key={`${name}-${index}`}>
          {index ? ', ' : null}<Box component={'span'} sx={{ whiteSpace: 'nowrap' }}>{name}</Box>
        </React.Fragment>) : null;
      }
    }
  ];

  return (
    <Stack gap={3}>
      <Box>
        <StatTile label={'Constellation points'}
                  value={sectionFailed ? '-' : `${formatNum(ownedPoints)} / ${formatNum(totalPoints)}`}
                  sub={!sectionFailed && readyCount
                    ? `+${formatNum(readyPoints)} from ${formatNum(readyCount)} ready to claim`
                    : undefined}/>
      </Box>
      <Box>
        {sectionFailed ? null : <Toolbar state={view} defaults={CONSTELLATIONS_TOOLBAR} onChange={setView} onReset={resetView}
                                         total={constellations?.length ?? 0} shown={rows?.length ?? 0} noun={'constellations'}
                                         onStickyBottom={setToolbarBottom}>
          <Toolbar.Filter name={'hideDone'} label={'Hide done'}/>
        </Toolbar>}
        <DataTable
          columns={columns}
          rows={rows ?? []}
          rowKey={'name'}
          rowLabel={({ name }) => cleanUnderscore(name)}
          surface={'card'}
          stickyTop={toolbarBottom ?? pageTop}
        />
      </Box>
    </Stack>
  );
};

export default ConstellationsComp;
