import React from 'react';
import { Stack } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { CONSTRUCT_MASTERY, constructionMasteryThresholds, getConstructionMasteryBonus } from '@parsers/world-3/construction';
import StatTile from '@components/common/cards/StatTile';
import Panel from '@components/common/cards/Panel';
import StatusText from '@components/common/StatusText';
import { sentenceCase } from './Tasks';

const defaultBonuses = [
  '+1%_REFINERY_SPD_PER_10_TOT_LV',
  '+35_MAX_LV_FOR_TRAPPER_DRONE',
  '+2%_DMG_PER_10_TOT_LV_OVER_750',
  '+100_MAX_LV_FOR_TALENT_LIBRARY',
  '+5%_BUILD_SPD_PER_10_TOT_LV_OVER_1250',
  '+100_MAX_LV_FOR_ALL_SHRINES',
  '+30_MAX_LV_FOR_ALL_WIZARD_TOWERS',
];

const ConstructMastery = ({ totalLevels, account }) => {
  const levels = totalLevels ?? 0;
  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      <StatTile label={'Construct LV'} value={levels} kind={'amount'}/>
      <StatTile label={'Refinery speed'} icon={'etc/Refinery_Spd.png'}
                value={formatNum(getConstructionMasteryBonus(account, CONSTRUCT_MASTERY.REFINERY_SPEED), 'pct')}/>
      <StatTile label={'Damage'} icon={'etc/Refinery_Dmg.png'}
                value={formatNum(getConstructionMasteryBonus(account, CONSTRUCT_MASTERY.DAMAGE), 'pct')}/>
      <StatTile label={'Build speed'} icon={'etc/Refinery_Build_Spd.png'}
                value={formatNum(getConstructionMasteryBonus(account, CONSTRUCT_MASTERY.BUILD_SPEED), 'pct')}/>
    </Stack>
    <Panel title={'Bonuses'} sx={{ maxWidth: 560 }}>
      {defaultBonuses.map((bonus, bonusIndex) => {
        const threshold = constructionMasteryThresholds?.[bonusIndex];
        return <Panel.KV key={`bonus-${bonusIndex}`} label={`Lv ${formatNum(threshold ?? 0)}`}
                         value={<>{sentenceCase(cleanUnderscore(bonus))}{levels >= threshold
                           ? <StatusText status={'done'} sx={{ ml: 1 }}>Reached</StatusText> : null}</>}/>;
      })}
    </Panel>
  </>
};

export default ConstructMastery;
