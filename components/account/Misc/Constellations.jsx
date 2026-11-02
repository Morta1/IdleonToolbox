import { Checkbox, FormControlLabel, Link, Stack, Typography } from '@mui/material';
import React, { useState } from 'react';
import { cleanUnderscore, prefix } from 'utility/helpers';
import { mapEnemiesArray, monsters } from '@website-data';
import { monsterImage } from '@utility/spriteImages';
import { openWikiEntity } from '@utility/wiki/item-page';
import DataTable from '@components/common/DataTable';
import StatusText from '@components/common/StatusText';
import usePageTop from '@hooks/usePageTop';

// Each constellation's shape, cut from the game's StarSign sheet (the lit frame) into public/etc. Opens its wiki page.
const ConstellationIcon = ({ rawIndex, name }) => rawIndex == null ? null : <img
  src={`${prefix}etc/Constellation_${rawIndex}.png`}
  alt={cleanUnderscore(name)}
  width={32}
  height={32}
  onClick={() => openWikiEntity(`constellation:${name}`)}
  style={{ objectFit: 'contain', flexShrink: 0, cursor: 'pointer' }}
/>;

const CHAR_INDEX_MAP = Object.fromEntries('_abcdefghijklmnopqrstuvwxyz'.split('').map((c, i) => [c, i]));

// Where a constellation is done: the map (End of the Road starred, as in game), its world, and the mob that lives
// there. monsterImage returns a full URL, so the sprite is a plain img rather than a GameIcon.
const Location = ({ location, mapIndex }) => {
  const monsterRaw = mapEnemiesArray?.[mapIndex];
  const monsterName = monsterRaw === 'Nothing' ? null : cleanUnderscore(monsters?.[monsterRaw]?.Name || monsterRaw);
  const world = Number.isInteger(mapIndex) ? Math.floor(mapIndex / 50) + 1 : null;
  return <Stack spacing={0.25}>
    <span>{location === 'End_Of_The_Road' ? cleanUnderscore(location) + ' *' : cleanUnderscore(location)}</span>
    {world ? <Typography variant={'caption'} color={'text.secondary'}>World {world}</Typography> : null}
    {monsterName ? <Stack direction={'row'} spacing={0.5} alignItems={'center'}>
      <img src={monsterImage(monsterRaw)} alt={''} width={24} height={24} style={{ objectFit: 'contain' }}/>
      <Typography variant={'caption'} color={'text.secondary'}>Mob: {monsterName}</Typography>
    </Stack> : null}
  </Stack>;
};

const ConstellationsComp = ({ constellations = [], characters = [] }) => {
  const [hideCompleted, setHideCompleted] = useState(false);
  const pageTop = usePageTop();

  const characterNames = characters?.map(({ name }) => name) || [];
  const constellationList = hideCompleted ? constellations?.filter(({ done }) => !done) : constellations;

  const getCompletedNames = (completedChars) => {
    const indices = completedChars
      ?.split('')
      ?.map((char) => CHAR_INDEX_MAP?.[char])
      ?.filter((idx) => idx !== undefined);
    const uniqueSorted = [...new Set(indices)]?.sort((a, b) => a - b);
    return uniqueSorted?.map((idx) => characterNames?.[idx] || `Char ${idx + 1}`) || [];
  };

  const getTotalPoints = () => {
    const { ownedPoints, totalPoints } = constellations?.reduce((res, { points, done }) => {
      if (done) {
        res.ownedPoints += points;
      }
      res.totalPoints += points;
      return res;
    }, { ownedPoints: 0, totalPoints: 0 });
    return `${ownedPoints} / ${totalPoints}`;
  }

  const columns = [
    {
      key: 'name',
      label: 'Name',
      icon: ({ rawIndex, name }) => <ConstellationIcon rawIndex={rawIndex} name={name}/>,
      render: ({ name }) => <Link component={'button'} variant={'body2'} color={'inherit'} underline={'hover'} textAlign={'left'}
                                  onClick={() => openWikiEntity(`constellation:${name}`)}>{cleanUnderscore(name)}</Link>
    },
    {
      key: 'progress',
      label: 'Progress',
      numeric: true,
      sortable: true,
      sortValue: ({ done, completedChars, requiredPlayers }) => (done ? 1 : (completedChars?.length ?? 0) / (requiredPlayers || 1)),
      render: ({ done, completedChars, requiredPlayers }) => (done
        ? <StatusText status={'maxed'}>Done</StatusText>
        : `${completedChars?.length ?? 0}/${requiredPlayers}`)
    },
    { key: 'location', label: 'Location', render: ({ location, mapIndex }) => <Location location={location} mapIndex={mapIndex}/> },
    { key: 'requirement', label: 'Requirement', value: ({ requirement }) => cleanUnderscore(requirement) },
    { key: 'points', label: 'Points', kind: 'amount', sortable: true, phone: true, value: ({ points }) => points },
    {
      key: 'completedBy',
      label: 'Completed by',
      cellSx: { wordBreak: 'break-word' },
      value: ({ completedChars }) => getCompletedNames(completedChars).join(', ') || null
    }
  ];

  return (
    <Stack gap={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent={'space-between'} gap={1} alignItems={'center'}>
        <Typography variant={'sectionTitle'} component={'h2'} textAlign={'center'}>Total Points: {getTotalPoints()}</Typography>
        <FormControlLabel control={<Checkbox checked={hideCompleted} onChange={(e) => setHideCompleted(e.target.checked)}/>}
                          label="Hide completed"/>
      </Stack>
      <DataTable
        columns={columns}
        rows={constellationList ?? []}
        rowKey={'name'}
        rowLabel={({ name }) => cleanUnderscore(name)}
        surface={'card'}
        stickyTop={pageTop}
      />
    </Stack>
  );
};

export default ConstellationsComp;
