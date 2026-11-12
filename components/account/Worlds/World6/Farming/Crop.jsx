import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, createRange, formatDuration, formatNum, titleCaseName } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { seedInfo } from '@website-data';
import React from 'react';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import GameIcon from '@components/common/GameIcon';

// The Crop Scientist's lines as the game prints them: the percent lines in Big (FarmingStuffs.CropSCbonus), critters
// as a flat +, the two multipliers in their own switch (FarmingStuffs.CropSCbonus_Multi). A line not earned yet is 0x.
const MULTI_STATS = ['gamingEvo', 'cookingSpeed'];
const depotValue = (stat, value) => (stat === 'critters' ? `+${formatGame(value, 'FarmingStuffs.CropSCbonus')}`
  : MULTI_STATS.includes(stat) ? (value ? `${formatGame(value, 'FarmingStuffs.CropSCbonus_Multi')}x` : formatNum(value, 'mult')) : `${formatGame(value, 'FarmingStuffs.CropSCbonus')}%`);

// What one more found crop adds to a line: a multiplier line by its base, the rest by its step through the shared multi
const perCropText = (stat, { perCrop, multiplicative, after, every, pastAfter } = {}) => {
  if (!(perCrop > 0)) return undefined;
  const step = multiplicative ? formatNum(perCrop, 'mult')
    : stat === 'critters' ? formatNum(perCrop, 'amount', { signed: true }) : formatNum(perCrop, 'pct', { signed: true });
  const per = every > 1 ? `per ${formatNum(every)} crops` : 'per crop';
  return `${step} ${per}${after > 0 && !pastAfter ? ` past ${formatNum(after)}` : ''}`;
};

// A family's max time under a second reads in milliseconds (Eleven, #86): late in the game every family is under one,
// and "<1s" on each told them apart no more. The old page printed them the same way.
const maxTimeText = (seconds) => {
  if (!(seconds > 0) || seconds >= 1) return formatDuration(seconds);
  const ms = seconds * 1000;
  return ms >= 1 ? `${Math.round(ms)}ms` : `${ms.toPrecision(2)}ms`;
};

const Crop = ({ crop, maxTimes, cropDepot }) => {
  return <>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'} mb={3}>
      {Object.entries(cropDepot ?? {}).map(([stat, line], index) => <StatTile key={stat} label={line?.name}
                                                                      icon={`etc/Pen_${index}.png`}
                                                                      value={line?.unlocked === false ? 'Locked' : depotValue(stat, line?.value)}
                                                                      status={line?.unlocked === false ? 'locked' : undefined}
                                                                      sub={line?.unlocked === false
                                                                        ? `Needs ${cleanUnderscore(line?.unlockName)}`
                                                                        : perCropText(stat, line)}/>)}
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
              Max time <Breakdown asValue data={maxTimes?.[index]?.breakdown}>{maxTimeText(maxTimes?.[index]?.value)}</Breakdown>
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
