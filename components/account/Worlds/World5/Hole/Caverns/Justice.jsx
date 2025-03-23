import { CardTitleAndValue } from '@components/common/styles';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, msToDate, notateNumber } from '@utility/helpers';
import React from 'react';
import { CardWithBreakdown } from '@components/account/Worlds/World5/Hole/commons';

const Justice = ({ hole }) => {
  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      <CardTitleAndValue title={'Mental health'} icon={'etc/Justice_Health.png'} imgStyle={{ width: 24, height: 24 }}
                         value={`${hole?.caverns?.justice?.health}`}/>
      <CardTitleAndValue title={'Coins'} icon={'etc/Justice_Coin.png'} imgStyle={{ width: 24, height: 24 }}
                         value={`${hole?.caverns?.justice?.coins}`}/>
      <CardTitleAndValue title={'Popularity'} icon={'etc/Justice_Popularity.png'} imgStyle={{ width: 24, height: 24 }}
                         value={`${hole?.caverns?.justice?.popularity}`}/>
      <CardTitleAndValue title={'Dismissals'} icon={'etc/Justice_Dismissals.png'} imgStyle={{ width: 24, height: 24 }}
                         value={`${hole?.caverns?.justice?.dismissals}`}/>
      <CardTitleAndValue title={'Opal chance'} icon={'data/Opal.png'} imgStyle={{ width: 24, height: 24 }}
                         value={`${notateNumber(hole?.caverns?.justice?.opalChance * 100, 'MultiplierInfo')}%`}/>
      <CardTitleAndValue title={'Hours'}
                         value={`${commaNotation(hole?.caverns?.justice?.hours)}`}/>
      <CardTitleAndValue title={'Reward multi'}
                         value={`${hole?.caverns?.justice?.rewardMulti < 1
                           ? '0'
                           : Math.round(10 * hole?.caverns?.justice?.rewardMulti) / 10}x`}/>
      <CardTitleAndValue title={'Next fight in'}
                         value={hole?.caverns?.justice?.timeForNextFight > 0
                           ? msToDate(hole?.caverns?.justice?.timeForNextFight * 1000)
                           : 'Now!'}/>
      {hole?.caverns?.justice?.monumentAfkReq ? <CardWithBreakdown title={'Afk hours req'} breakdown={hole?.caverns?.justice?.monumentAfkReq}/> : null}
      {hole?.caverns?.justice?.nextHourBreakpoint ? <CardTitleAndValue title={'Next hour reward'}
                          value={`${commaNotation(hole?.caverns?.justice?.nextHourBreakpoint?.hours)}hrs: ${cleanUnderscore(hole?.caverns?.justice?.nextHourBreakpoint?.reward)}`}/> : null}
    </Stack>
    <Divider sx={{ my: 2 }}/>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      {hole?.caverns?.justice?.bonuses.map(({ description, level }, index) => {
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

export default Justice;
