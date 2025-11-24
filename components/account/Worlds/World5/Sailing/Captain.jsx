import React from 'react';
import { Card, CardContent, Divider, Stack, Typography, Box } from '@mui/material';
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
            {captainType === -1 ? <Box sx={{ width: 25, height: 25 }} /> : <img style={{ width: 25, height: 25, objectFit: 'contain' }}
              src={`${prefix}etc/Sailing_Skill_${firstBonusIndex}.png`} alt="" />}
            {captainType === -1 ? <Box sx={{ width: 25, height: 25 }} /> : secondBonusIndex >= 0 ? <img style={{ width: 25, height: 25, objectFit: 'contain' }}
              src={`${prefix}etc/Sailing_Skill_${secondBonusIndex}.png`}
              alt="" /> : <>&nbsp;</>}
          </Stack>
          <img style={{ width: 40, height: 50, objectFit: 'contain' }}
            src={`${prefix}etc/Captain_${captainType === -1 ? 0 : captainType}.png`} alt="" />
          {!shop ? <Stack>
            <Typography>{captainIndex}</Typography>
            <Typography variant={'caption'}>{captainType === -1 ? 'None' : 'Boat ' + captainsOnBoats?.[captainIndex] + 1}</Typography>
          </Stack> : null}
        </Stack>
        <Divider sx={{ my: 1 }} />
        <Stack>
          {!shop ? <>
            <Typography>Lv.{level}</Typography>
            <Typography>Exp: {exp} / {expReq}</Typography>
          </> : <Stack sx={{ my: 1 }} gap={1} direction={'row'}>
            <img style={{ width: 25, objectFit: 'contain' }}
              src={`${prefix}data/SailT0.png`} alt="" />
            <Typography
              color={lootPile?.[0]?.amount >= cost ? 'success.light' : 'error.light'}
              component={'span'}>{notateNumber(lootPile?.[0]?.amount, 'Big')}/{notateNumber(cost, 'Big')}</Typography>
          </Stack>}
          <Divider sx={{ my: 1 }} flexItem />
          {captainType !== -1 ? <Typography
            variant={'caption'}>{cleanUnderscore(firstBonusDescription)} ({firstBonus / level})</Typography> : null}
          {captainType !== -1 && secondBonus > 0 ? <Typography
            variant={'caption'}>{cleanUnderscore(secondBonusDescription)} ({secondBonus / level})</Typography> : null}
        </Stack>
      </>    </CardContent>
  </Card>
};

export default Captain;
