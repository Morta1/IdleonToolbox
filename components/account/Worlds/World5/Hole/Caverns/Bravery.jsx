import { Breakdown, CardTitleAndValue } from '@components/common/styles';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, msToDate, notateNumber } from '@utility/helpers';
import React from 'react';
import { CardWithBreakdown } from '@components/account/Worlds/World5/Hole/commons';

const Bravery = ({ hole }) => {
  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      <CardTitleAndValue title={'Damage'} icon={'etc/Bravery_Sword.png'} imgStyle={{ width: 24, height: 24 }}
                         value={`${commaNotation(hole?.caverns?.bravery?.damage?.min)} - ${commaNotation(hole?.caverns?.bravery?.damage?.max)}`}/>
      <CardTitleAndValue title={'Swords'} icon={'data/HoleBraverySword.png'} imgStyle={{ width: 24, height: 24 }}
                         value={hole?.caverns?.bravery?.ownedSwords}/>
      <CardTitleAndValue title={'Max rethrows'} icon={'etc/Bravery_Rethrow.png'} imgStyle={{ width: 24, height: 24 }}
                         value={`${hole?.caverns?.bravery?.maxRethrow}`}/>
      <CardTitleAndValue title={'Max retelling'} icon={'etc/Bravery_Retelling.png'} imgStyle={{ width: 24, height: 24 }}
                         value={`${hole?.caverns?.bravery?.maxRetelling}`}/>
      <CardTitleAndValue title={'Opal chance'} icon={'data/Opal.png'} imgStyle={{ width: 24, height: 24 }}
                         value={`${notateNumber(hole?.caverns?.bravery?.opalChance * 100, 'MultiplierInfo')}%`}/>
      <CardTitleAndValue title={'Hours'}
                         value={`${commaNotation(hole?.caverns?.bravery?.hours)}`}/>
      <CardTitleAndValue title={'Reward multi'}
                         value={`${hole?.caverns?.bravery?.rewardMulti < 1
                           ? '0'
                           : Math.round(10 * hole?.caverns?.bravery?.rewardMulti) / 10}x`}/>
      <CardTitleAndValue title={'Next fight in'}
                         value={hole?.caverns?.bravery?.timeForNextFight > 0
                           ? msToDate(hole?.caverns?.bravery?.timeForNextFight * 1000)
                           : 'Now!'}/>
      {hole?.caverns?.bravery?.nextHourBreakpoint ? <CardTitleAndValue title={'Next hour reward'}
                          value={`${commaNotation(hole?.caverns?.bravery?.nextHourBreakpoint?.hours)}hrs: ${cleanUnderscore(hole?.caverns?.bravery?.nextHourBreakpoint?.reward)}`}/> : null}
      {hole?.caverns?.bravery?.monumentAfkReq ? <CardWithBreakdown title={'Afk hours req'} breakdown={hole?.caverns?.bravery?.monumentAfkReq}/> : null}
      <CardTitleAndValue title={'Enemy HP'} tooltipTitle={<Breakdown breakdown={hole?.caverns?.bravery?.hps}/>}
                         value={'Hover me!'}/>
    </Stack>
    <Divider sx={{ my: 2 }}/>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      {hole?.caverns?.bravery?.bonuses.map(({ description, level }, index) => {
        return <Card key={`bonus-${index}`}>
          <CardContent sx={{ width: 300, opacity: level === 0 ? .5 : 1 }}>
            <Typography>Lv. {level}</Typography>
            <Typography>{cleanUnderscore(description)}</Typography>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default Bravery;
