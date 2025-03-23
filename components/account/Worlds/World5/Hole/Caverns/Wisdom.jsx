import { CardTitleAndValue } from '@components/common/styles';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, msToDate, notateNumber } from '@utility/helpers';
import React from 'react';
import { CardWithBreakdown } from '@components/account/Worlds/World5/Hole/commons';

const Wisdom = ({ hole }) => {
  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      <CardTitleAndValue title={'Attempts'} icon={'etc/Wisdom_Attempts.png'} imgStyle={{ width: 24, height: 24 }}
                         value={`${hole?.caverns?.wisdom?.attempts}`}/>
      <CardTitleAndValue title={'Attempts per round'} icon={'etc/Wisdom_Attempts.png'} imgStyle={{ width: 24, height: 24 }}
                         value={`${hole?.caverns?.wisdom?.attemptsGainPerRound}`}/>
      <CardTitleAndValue title={'Time per match'} icon={'etc/Justice_Health.png'} imgStyle={{ width: 24, height: 24 }}
                         value={`${hole?.caverns?.wisdom?.timePerMatch}`}/>
      <CardTitleAndValue title={'Instant matches'} icon={'etc/Wisdom_InstantMatch.png'} imgStyle={{ width: 24, height: 24 }}
                         value={`${hole?.caverns?.wisdom?.instantMatches}`}/>
      <CardTitleAndValue title={'Opal chance'} icon={'data/Opal.png'} imgStyle={{ width: 24, height: 24 }}
                         value={`${notateNumber(hole?.caverns?.wisdom?.opalChance * 100, 'MultiplierInfo')}%`}/>
      <CardTitleAndValue title={'Hours'}
                         value={`${commaNotation(hole?.caverns?.wisdom?.hours)}`}/>
      <CardTitleAndValue title={'Reward multi'}
                         value={`${hole?.caverns?.wisdom?.rewardMulti < 1
                           ? '0'
                           : Math.round(10 * hole?.caverns?.wisdom?.rewardMulti) / 10}x`}/>
      <CardTitleAndValue title={'Next fight in'}
                         value={hole?.caverns?.wisdom?.timeForNextFight > 0
                           ? msToDate(hole?.caverns?.wisdom?.timeForNextFight * 1000)
                           : 'Now!'}/>
      {hole?.caverns?.wisdom?.monumentAfkReq ? <CardWithBreakdown title={'Afk hours req'} breakdown={hole?.caverns?.wisdom?.monumentAfkReq} /> : null}
      <CardTitleAndValue title={'Next hour reward'}
                         value={`${commaNotation(hole?.caverns?.wisdom?.nextHourBreakpoint?.hours)}hrs: ${cleanUnderscore(hole?.caverns?.wisdom?.nextHourBreakpoint?.reward)}`}/>
    </Stack>
    <Divider sx={{ my: 2 }}/>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      {hole?.caverns?.wisdom?.bonuses.map(({ description, level }, index) => {
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

export default Wisdom;
