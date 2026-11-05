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

// The mastery unlocks from the Rift: below it no level reads Reached; in a failed section its bonuses read "-" and none
// reads Reached, while the building levels (the towers') stay
const ConstructMastery = ({ totalLevels, account, sectionFailed }) => {
  const levels = totalLevels ?? 0;
  // At any level the refinery tier pays once the Rift has opened the mastery
  const riftReached = getConstructionMasteryBonus(account, CONSTRUCT_MASTERY.REFINERY_SPEED, Infinity) > 0;
  const masteryBonus = (bonus) => (sectionFailed ? '-' : formatNum(getConstructionMasteryBonus(account, bonus), 'pct'));
  return <>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'} mb={3}>
      <StatTile label={'Construct LV'} value={levels} kind={'amount'}/>
      <StatTile label={'Refinery speed'} icon={'etc/Refinery_Spd.png'}
                value={masteryBonus(CONSTRUCT_MASTERY.REFINERY_SPEED)}/>
      <StatTile label={'Damage'} icon={'etc/Refinery_Dmg.png'}
                value={masteryBonus(CONSTRUCT_MASTERY.DAMAGE)}/>
      <StatTile label={'Build speed'} icon={'etc/Refinery_Build_Spd.png'}
                value={masteryBonus(CONSTRUCT_MASTERY.BUILD_SPEED)}/>
    </Stack>
    <Panel title={'Bonuses'} sx={{ maxWidth: 560 }}>
      {defaultBonuses.map((bonus, bonusIndex) => {
        const threshold = constructionMasteryThresholds?.[bonusIndex];
        return <Panel.KV key={`bonus-${bonusIndex}`} label={`Lv ${formatNum(threshold ?? 0)}`}
                         value={<>{sentenceCase(cleanUnderscore(bonus))}{!sectionFailed && riftReached && levels >= threshold
                           ? <StatusText status={'done'} sx={{ ml: 1 }}>Reached</StatusText> : null}</>}/>;
      })}
    </Panel>
  </>
};

export default ConstructMastery;
