import React from 'react';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, prefix } from '../../../../../utility/helpers';
import { constructionMasteryThresholds } from '../../../../../parsers/construction';
import { CardTitleAndValue } from '@components/common/styles';

const defaultBonuses = [
  '+1%_REFINERY_SPD_PER_10_TOT_LV',
  '+35_MAX_LV_FOR_TRAPPER_DRONE',
  '+2%_DMG_PER_10_TOT_LV_OVER_750',
  '+100_MAX_LV_FOR_TALENT_LIBRARY',
  '+5%_BUILD_SPD_PER_10_TOT_LV_OVER_1250',
  '+100_MAX_LV_FOR_ALL_SHRINES',
  '+30_MAX_LV_FOR_ALL_WIZARD_TOWERS',
];

const ConstructMastery = ({ totalLevels }) => {
  return <>
    <CardTitleAndValue title={'Construct Lv.'} value={totalLevels}/>
      <Typography variant={'h5'}>Bonuses</Typography>
      <Stack sx={{ mb: 2 }} gap={2} direction={'row'}>
        <Bonus name={'Refinery_Spd'} label={'Ref Spd'}
               value={totalLevels >= constructionMasteryThresholds?.[0] ? `${Math.floor(totalLevels / 10)}%` : '0%'}/>
        <Bonus name={'Refinery_Dmg'} label={'Dmg'}
               value={totalLevels >= constructionMasteryThresholds?.[2]
                 ? `${2 * Math.floor((totalLevels - constructionMasteryThresholds?.[2]) / 10)}%`
                 : '0%'}/>
        <Bonus name={'Refinery_Build_Spd'} label={'Build Spd'}
               value={totalLevels >= constructionMasteryThresholds?.[4]
                 ? `${5 * Math.floor((totalLevels - constructionMasteryThresholds?.[4]) / 10)}%`
                 : '0%'}/>
      </Stack>
    <Card sx={{ width: 'fit-content' }}>
      <CardContent>
        <Stack gap={1}>
          {defaultBonuses?.map((bonus, bonusIndex) => {
            return <Typography
              sx={{ opacity: totalLevels > constructionMasteryThresholds?.[bonusIndex] ? 1 : .6 }}
              key={`bonus-${bonusIndex}`}>Lv. {constructionMasteryThresholds?.[bonusIndex]}: {cleanUnderscore(bonus.toLowerCase().capitalizeAll())}</Typography>
          })}
        </Stack>
      </CardContent>
    </Card>
  </>
};


const Bonus = ({ name, label, value }) => {
  return value ? <Card sx={{ width: 180 }}>
    <CardContent>
      <Stack direction={'row'} alignItems={'center'} gap={2}>
        <img src={`${prefix}etc/${name}.png`} alt=""/>
        <Stack>
          <Typography>{label}</Typography>
          <Typography>{value}</Typography>
        </Stack>
      </Stack>
    </CardContent>
  </Card> : null
}
export default ConstructMastery;