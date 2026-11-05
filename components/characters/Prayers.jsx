import { Stack, Typography } from '@mui/material';
import { cleanUnderscore } from 'utility/helpers';
import { fillPrayer, prayerValue } from '@utility/gameNotation';
import { calcPrayerCost } from '@parsers/world-3/prayers';
import React from 'react';
import Panel from '@components/common/cards/Panel';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import ItemCard from '@components/common/cards/ItemCard';
import StatusText from '@components/common/StatusText';

const Prayers = ({ prayers }) => <Panel title={'Prayers'}>
  {prayers?.length ? <CardGrid size={'icon'} sheetColumns={[8, 6]}>
    {prayers.map((prayer) => <IconTile key={prayer?.prayerIndex} icon={`data/Prayer${prayer?.prayerIndex}.png`}
                                       alt={cleanUnderscore(prayer?.name ?? '')} details={<PrayerDetails {...prayer}/>}/>)}
  </CardGrid> : <Typography variant={'body2'} color={'text.secondary'}>No prayers equipped</Typography>}
</Panel>;

// The game's numbers, as the Prayers page fills them, and the souls it costs against the ones owned
const PrayerDetails = ({ name, x1, x2, level, prayerIndex, effect, curse, maxLevel, totalAmount, costMulti, soul }) => <Stack gap={1}>
  <Typography variant={'cardTitle'} component={'div'}>{cleanUnderscore(name)}</Typography>
  <ItemCard.Facts rows={[
    ['Bonus', fillPrayer(effect, prayerValue(x1, level))],
    ['Curse', fillPrayer(curse, prayerValue(x2, level))]
  ]}/>
  {level >= maxLevel ? <StatusText status={'maxed'}/>
    : <ItemCard.Cost icon={soul ? `data/${soul}.png` : undefined} iconAlt={'Souls'} game={'WorshipStuff.PrayerCost'} have={totalAmount ?? 0}
                     need={calcPrayerCost({ name, x1, x2, level, prayerIndex, costMulti })}/>}
</Stack>;

export default Prayers;
