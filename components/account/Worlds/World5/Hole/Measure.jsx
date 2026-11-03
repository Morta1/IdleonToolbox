import { Divider, Stack } from '@mui/material';
import React from 'react';
import { cleanUnderscore, notateNumber, numberWithCommas } from '@utility/helpers';
import { getHoleLeaderboardTotals } from '@parsers/world-5/hole';
import { holeCostIcon, villagerTiles } from '@components/account/Worlds/World5/Hole/commons';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

const Measure = ({ hole }) => {
  const measure = hole?.villagers?.[3];
  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      {villagerTiles(measure)}
      <StatTile label={'Total measurement levels'} value={getHoleLeaderboardTotals(hole).measurementLevels} kind={'amount'}/>
    </Stack>
    <Divider sx={{ my: 2 }}/>
    <CardGrid size={'m'}>
      {hole?.measurements?.map(({ description, baseBonus, totalBonus, multi, measuredBy, level, cost, owned, icon }, index) => {
        if (description === 'i') return null
        const desc = description.toLowerCase().replace('访', '&');
        const bonusText = (value) => cleanUnderscore(desc.replace('|', ' ').replace('{', notateNumber(value, 'Big')));
        return <ItemCard key={`measure-${index}`}
                         icon={`etc/Measure_${index}.png`}
                         title={bonusText(totalBonus)}
                         level={{ value: level }}
                         footer={<ItemCard.Cost icon={holeCostIcon(icon)} iconAlt={icon} need={cost} have={owned}
                                                game={'Holes.MeasurementCost'}/>}>
          <ItemCard.Facts rows={[
            ['Base', bonusText(baseBonus)],
            ['Multi', `${notateNumber(multi, 'MultiplierInfo')}x`],
            [measuredBy?.label, measuredBy?.value < 1e6
              ? numberWithCommas(measuredBy?.value)
              : notateNumber(measuredBy?.value, 'Big')]
          ]}/>
        </ItemCard>
      })}
    </CardGrid>
  </>
};

export default Measure;
