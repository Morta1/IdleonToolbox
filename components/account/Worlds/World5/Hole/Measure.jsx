import { Stack } from '@mui/material';
import React from 'react';
import { cleanUnderscore } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { getHoleLeaderboardTotals } from '@parsers/world-5/hole';
import { holeCostIcon, holeResourceName, villagerTiles } from '@components/account/Worlds/World5/Hole/commons';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

// A measurement's line as the game prints it (Holes.MeasurementBonusTOTAL): { the bonus in Big, | a space, 访 the
// game's &, in lower case as before
const measureText = (description, value) => cleanUnderscore((description ?? '').toLowerCase().replace('访', '&')
  .replace('|', ' ').replace('{', formatGame(value ?? 0, 'Holes.MeasurementBonusTOTAL')));

const Measure = ({ hole }) => {
  const measure = hole?.villagers?.[3];
  return <>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'} mb={3}>
      {villagerTiles(measure)}
      <StatTile label={'Total measurement levels'} value={getHoleLeaderboardTotals(hole).measurementLevels} kind={'amount'}/>
    </Stack>
    <CardGrid size={'m'}>
      {(hole?.measurements ?? []).map(({ description, baseBonus, totalBonus, multi, measuredBy, level, cost, owned, icon }, index) => {
        if (description === 'i') return null;
        return <ItemCard key={`measure-${index}`}
                         icon={`etc/Measure_${index}.png`}
                         title={measureText(description, totalBonus)}
                         level={{ value: level ?? 0 }}
                         footer={<ItemCard.Cost icon={holeCostIcon(icon)} iconAlt={holeResourceName(icon)} need={cost ?? 0}
                                                have={owned ?? 0} game={'Holes.MeasurementCost'}/>}>
          <ItemCard.Facts rows={[
            ['Base', measureText(description, baseBonus)],
            ['Multi', `${formatGame(multi ?? 1, 'Holes.MeasurementMulti')}x`],
            measuredBy?.label ? [measuredBy.label, formatGame(measuredBy?.value ?? 0, 'Holes.MeasurementQTYfound', { whole: true })] : null
          ]}/>
        </ItemCard>;
      })}
    </CardGrid>
  </>;
};

export default Measure;
