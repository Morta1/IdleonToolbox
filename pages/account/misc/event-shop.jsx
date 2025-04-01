import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, numberWithCommas, prefix } from '@utility/helpers';
import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { CardTitleAndValue } from '@components/common/styles';
import { ninjaExtraInfo } from '../../../data/website-data';
import { getEventShopBonus } from '@parsers/misc';

const shopItems = ninjaExtraInfo?.[39]?.split(' ').toChunks(2).map(([text, price]) => ({ text, price }));

const EventShop = () => {
  const { state } = useContext(AppContext);
  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      <CardTitleAndValue title={'Stars'}
                         icon={'etc/Event_Currency.png'}
                         value={numberWithCommas(state?.account?.accountOptions?.[310])}/>
    </Stack>
    <Divider sx={{ mb: 2 }}/>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      {shopItems?.map(({ text, price }, index) => {
        const [name, description] = text.split('@');
        const hasBonus = getEventShopBonus(state?.account, index);
        return <Card
          key={`event-bonus-${index}`}>
          <CardContent sx={{
            width: 350,
            minHeight: 215,
            border: hasBonus ? '1px solid' : '',
            borderColor: hasBonus ? 'success.light' : ''
          }}>
            <Stack direction="row" alignItems={'center'} gap={2}>
              <img src={`${prefix}data/EventShopBuy${index}.png`}
                   alt={'event-' + index}/>
              <Typography variant={'body1'}>{cleanUnderscore(name)}</Typography>
            </Stack>
            <Divider sx={{ my: 1 }}/>
            <Typography variant={'body1'}>{cleanUnderscore(description)}</Typography>
            <Divider sx={{ my: 1 }}/>
            <Typography variant={'body1'}>Price: {price}</Typography>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default EventShop;
