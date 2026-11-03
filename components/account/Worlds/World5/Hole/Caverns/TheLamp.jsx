import { CardTitleAndValue } from '@components/common/styles';
import { Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation } from '@utility/helpers';
import React from 'react';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@components/Tooltip';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

const TheLamp = ({ hole }) => {
  const theLamp = hole?.caverns?.theLamp;

  return <>
    <Stack mb={3} direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      <CardTitleAndValue title={'Wishes'}
                         value={theLamp?.currentWishes}/>
      <CardTitleAndValue title={'Wish per day'}
                         value={Math.round(100 * theLamp?.wishPerDay) / 100}/>
      <CardTitleAndValue title={'Opals found'} icon={'data/Opal.png'} imgStyle={{ width: 24, height: 24 }}
                         value={hole?.holesObject?.opalsPerCavern?.[6] || 0}/>
    </Stack>
    <Divider sx={{ my: 2 }}/>
    <CardGrid size={'m'}>
      {theLamp?.wishes?.map(({ description, name, futureCosts, cost }, index) => {
        return <ItemCard key={`wish-${index}`}
                         title={cleanUnderscore(name)}
                         footer={<ItemCard.Facts rows={[['Cost', <Stack key={'cost'} component={'span'} direction={'row'}
                                                                       alignItems={'center'} gap={.5}>
                           {cost}
                           <Tooltip title={<Stack>
                             <Typography variant={'body2'} style={{ fontWeight: 'bold' }}> Future costs</Typography>
                             {futureCosts.map((futureCost, costIndex) => <div
                               key={`fc-${costIndex}`}>{commaNotation(futureCost)}</div>)}
                           </Stack>}>
                             <InfoIcon fontSize={'small'}/>
                           </Tooltip>
                         </Stack>]]}/>}>
          <ItemCard.Desc text={description}/>
        </ItemCard>
      })}
    </CardGrid>
  </>;
};

export default TheLamp;
