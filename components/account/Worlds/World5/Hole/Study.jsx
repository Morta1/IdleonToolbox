import React, { useState } from 'react';
import { Box, Checkbox, Divider, FormControlLabel, Stack } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import { cleanUnderscore, commaNotation, msToDate } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { villagerTiles } from '@components/account/Worlds/World5/Hole/commons';
import StatTile from '@components/common/cards/StatTile';
import { isSuperbitUnlocked } from '@parsers/world-5/gaming';
import { IconAlertTriangle } from '@tabler/icons-react';
import Tooltip from '@components/Tooltip';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

// The game's study list colors, drawn as a dot beside the name (data colors mark, never write)
const colors = {
  0: 'secondary.main',
  1: 'warning.light',
  2: 'success.light'
}

const Study = ({ account }) => {
  const { hole } = account || {};
  const study = hole?.villagers?.[4];
  const [sortByTime, setSortByTime] = useState(false);
  const peripheralVision = !!isSuperbitUnlocked(account, 'Peripheral_Vision');

  const sortedStudies = !hole?.studies?.studies
    ? []
    : [...hole.studies.studies].sort((a, b) => {
      if (!sortByTime) return 0;
      const aTime = (a.req - a.progress) / hole?.studies?.studyPerHour;
      const bTime = (b.req - b.progress) / hole?.studies?.studyPerHour;
      return aTime - bTime;
    });

  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      <StatTile label={'Study rate'} icon={'etc/Study_Rate.png'}
                value={`${formatGame(hole?.studies?.studyPerHour ?? 0, 'Holes.BolaiaStudyRate')}/hr`}/>
      {villagerTiles(study)}
    </Stack>
    <Divider/>
    <Stack>
      <CardTitleAndValue title={'Sort'}
                         value={<FormControlLabel
                           control={<Checkbox checked={sortByTime} onChange={() => setSortByTime(!sortByTime)}/>}
                           label="Sort by time"/>}/>
    </Stack>
    <Divider sx={{ mb: 3 }}/>
    <CardGrid size={'m'}>
      {sortedStudies.map(({
                            name,
                            description,
                            level,
                            active,
                            peripheralVisionActive,
                            progress,
                            req,
                            listIndex
                          }, index) => {
        const nextLv = (req - progress) / hole?.studies?.studyPerHour * 1000 * 3600;
        const isActive = active || peripheralVisionActive;

        return <ItemCard key={`bonus-${index}`}
                         icon={<Box component={'span'} aria-hidden={'true'}
                                    sx={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, bgcolor: colors?.[listIndex] }}/>}
                         title={cleanUnderscore(name)}
                         level={{ value: level }}
                         status={isActive ? 'active' : undefined}
                         statusLabel={peripheralVisionActive ? 'Active (Peripheral Vision)' : undefined}
                         aside={name === 'The_bell' ? <Tooltip title={'Bonus triggers on rings 19, 39, 59, 79 ...'}>
                           <Box component={'span'} sx={{ display: 'inline-flex', color: 'text.warning' }}>
                             <IconAlertTriangle size={18}/>
                           </Box>
                         </Tooltip> : null}
                         footer={<ItemCard.Facts rows={[
                           ['Progress', `${commaNotation(progress)} / ${commaNotation(req)}`],
                           ['Next level', nextLv < 0 ? 'Ready' : msToDate(nextLv)]
                         ]}/>}>
          <ItemCard.Desc text={description}/>
        </ItemCard>
      })}
    </CardGrid>
  </>
};

export default Study;
