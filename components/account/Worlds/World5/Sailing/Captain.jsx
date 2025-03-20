import React from 'react';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '../../../../../utility/helpers';

const Captain = ({
                   lootPile,
                   shop,
                   captainsOnBoats,
                   firstBonusDescription,
                   secondBonusDescription,
                   firstBonus,
                   secondBonus,
                   level,
                   exp,
                   expReq,
                   firstBonusIndex,
                   secondBonusIndex,
                   captainIndex,
                   captainType,
                   cost
                 }) => {
  return <Card>
    <CardContent sx={{ width: 250, minHeight: !shop ? 220 : 120 }}>
      <>
        <Stack direction={'row'} alignItems={'center'} gap={1}>
          <Stack gap={1}>
            <img style={{ width: 25, height: 25, objectFit: 'contain' }}
                 src={`${prefix}etc/Sailing_Skill_${firstBonusIndex}.png`} alt=""/>
            {secondBonusIndex >= 0 ? <img style={{ width: 25, height: 25, objectFit: 'contain' }}
                                          src={`${prefix}etc/Sailing_Skill_${secondBonusIndex}.png`}
                                          alt=""/> : <>&nbsp;</>}
          </Stack>
          <img style={{ width: 40, height: 50, objectFit: 'contain' }}
               src={`${prefix}etc/Captain_${captainType}.png`} alt=""/>
          {!shop ? <Stack>
            <Typography>{captainIndex}</Typography>
            <Typography variant={'caption'}>Boat {captainsOnBoats?.[captainIndex] + 1}</Typography>
          </Stack> : null}
        </Stack>
        <Divider sx={{ my: 1 }}/>
        <Stack>
          {!shop ? <>
            <Typography>Lv.{level}</Typography>
            <Typography>Exp: {exp} / {expReq}</Typography>
          </> : <Stack sx={{ my: 1 }} gap={1} direction={'row'}>
            <img style={{ width: 25, objectFit: 'contain' }}
                 src={`${prefix}data/SailT0.png`} alt=""/>
            <Typography
              color={lootPile?.[0]?.amount >= cost ? 'success.light' : 'error.light'}
              component={'span'}>{notateNumber(lootPile?.[0]?.amount, 'Big')}/{notateNumber(cost, 'Big')}</Typography>
          </Stack>}
          <Divider sx={{ my: 1 }} flexItem/>
          <Typography
            variant={'caption'}>{cleanUnderscore(firstBonusDescription)} ({firstBonus / level})</Typography>
          {secondBonus > 0 ? <Typography
            variant={'caption'}>{cleanUnderscore(secondBonusDescription)} ({secondBonus / level})</Typography> : null}
        </Stack>
      </>    </CardContent>
  </Card>
};

export default Captain;
