import { Box, Stack, Typography } from '@mui/material';
import React from 'react';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { fillPrayer, prayerValue } from '@utility/gameNotation';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import ItemCard from '@components/common/cards/ItemCard';
import Panel from '@components/common/cards/Panel';

const Prayers = ({ prayers, account, character }) => <Panel title={'Prayers'}>
  <Box sx={{ p: 2 }}>
    <CardGrid size={'icon'} fill>
      {prayers?.map((prayer, index) => {
        const { name, prayerIndex } = prayer || {};
        const isEquipped = character?.prayers?.filter(({ name: pName }) => pName === name)?.length > 0;
        return <IconTile key={`${name}-${index}`} icon={`data/Prayer${prayerIndex}.png`} alt={cleanUnderscore(name ?? '')}
                         status={isEquipped ? undefined : 'missing'}
                         details={<PrayerDetails {...prayer} realPrayer={account?.prayers?.[prayerIndex]}/>}/>;
      })}
    </CardGrid>
  </Box>
</Panel>;

// The Prayers page's numbers, rounded as the game rounds them, a Lv 0 prayer at its Lv 1 numbers. A failed prayers
// section reads the catalog's: the sentence stays, and its level says it isn't known.
const PrayerDetails = ({ name, effect, curse, x1, x2, realPrayer }) => {
  const level = realPrayer?.level;
  return <Stack gap={1}>
    <Typography variant={'cardTitle'} component={'div'}>{cleanUnderscore(name ?? '')}</Typography>
    <ItemCard.Facts rows={[
      ['Level', level === undefined ? '-' : formatNum(level, 'level')],
      ['Bonus', fillPrayer(realPrayer?.effect ?? effect, prayerValue(realPrayer?.x1 ?? x1, level))],
      ['Curse', fillPrayer(realPrayer?.curse ?? curse, prayerValue(realPrayer?.x2 ?? x2, level))]
    ]}/>
  </Stack>;
};

export default Prayers;
