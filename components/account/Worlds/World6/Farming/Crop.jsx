import { Stack, Typography } from '@mui/material';
import { createRange, formatDuration, formatNum, titleCaseName } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { seedInfo } from '@website-data';
import React from 'react';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import GameIcon from '@components/common/GameIcon';

// The Crop Scientist's lines as the game prints them: the percent lines in Big (FarmingStuffs.CropSCbonus), critters
// as a flat +, the two multipliers in the mult kind (the game's own switch for them is short in gameNotation).
const MULTI_STATS = ['gamingEvo', 'cookingSpeed'];
const depotValue = (stat, value) => (stat === 'critters' ? `+${formatGame(value, 'FarmingStuffs.CropSCbonus')}`
  : MULTI_STATS.includes(stat) ? formatNum(value, 'mult') : `${formatGame(value, 'FarmingStuffs.CropSCbonus')}%`);

const Crop = ({ crop, maxTimes, cropDepot }) => {
  return <>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'} mb={3}>
      {Object.entries(cropDepot ?? {}).map(([stat, { name, value }], index) => <StatTile key={stat} label={name}
                                                                                  icon={`etc/Pen_${index}.png`}
                                                                                  value={depotValue(stat, value)}/>)}
    </Stack>
    <Stack gap={3}>
      {seedInfo.map(({ name, seedId, cropIdMin, cropIdMax }, index) => {
        const array = createRange(cropIdMin, cropIdMax);
        const img = name === 'MEDAL' ? `data/FarmCrop230.png` : `etc/Seed_${seedId}.png`;
        const label = titleCaseName(name);
        return <Stack key={name} gap={1}>
          <Stack direction={'row'} gap={1} alignItems={'center'} flexWrap={'wrap'}>
            <GameIcon src={img} size={24} alt={''}/>
            <Typography variant={'cardTitle'} component={'h3'}>{label}</Typography>
            <Typography variant={'body2'} color={'text.secondary'} component={'span'}>
              Max time <Breakdown asValue data={maxTimes?.[index]?.breakdown}>{formatDuration(maxTimes?.[index]?.value)}</Breakdown>
            </Typography>
          </Stack>
          <CardGrid size={'icon'}>
            {array.map((cropId, position) => {
              const found = crop?.[cropId] >= 0;
              // Crops have no names in the game data, so a tile is named by its seed and its place
              return <IconTile key={cropId} icon={`data/FarmCrop${cropId}.png`} alt={`${label} crop ${position + 1}`}
                               value={found ? crop?.[cropId] : 0} kind={'whole'} status={found ? undefined : 'missing'}
                               details={found ? formatNum(crop?.[cropId], 'exact') : undefined}/>;
            })}
          </CardGrid>
        </Stack>;
      })}
    </Stack>
  </>;
};

export default Crop;
