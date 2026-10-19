import React from 'react';
import { Box, Card, CardContent, Divider, LinearProgress, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, notateNumber, prefix } from '@utility/helpers';
import { Row, SectionLabel } from './CardParts';

const Captain = ({
  lootPile,
  shop,
  captainsOnBoats,
  firstBonusName,
  secondBonusName,
  firstBonus,
  secondBonus,
  firstBonusValue,
  secondBonusValue,
  level,
  exp,
  expReq,
  expValue,
  expReqValue,
  firstBonusIndex,
  secondBonusIndex,
  captainIndex,
  captainType,
  cost
}) => {
  const empty = captainType === -1;
  const boatIndex = captainsOnBoats?.[captainIndex];
  const canAfford = lootPile?.[0]?.amount >= cost;
  return <Card>
    <CardContent sx={{ width: 270 }}>
      <Stack direction={'row'} alignItems={'center'} gap={1}>
        <img style={{ width: 40, height: 50, objectFit: 'contain', opacity: empty ? 0.4 : 1 }}
             src={`${prefix}etc/Captain_${empty ? 0 : captainType}.png`} alt=""/>
        <Stack>
          <Typography variant={'body2'}>{shop
            ? 'Shop captain'
            : `Captain ${captainIndex}${empty ? '' : ` · Lv. ${level}`}`}</Typography>
          {!shop ? <Typography variant={'caption'} color={'text.secondary'}>{empty
            ? 'Empty slot'
            : boatIndex >= 0 ? `Boat ${boatIndex + 1}` : 'Not on a boat'}</Typography> : null}
        </Stack>
      </Stack>
      {!empty ? <>
        {!shop ? <>
          <Divider sx={{ my: 1 }}/>
          <SectionLabel>Exp</SectionLabel>
          <LinearProgress variant={'determinate'} value={Math.min(100, 100 * (expValue ?? 0) / (expReqValue || 1))}
                          sx={{ height: 4, borderRadius: 1, mb: 0.5 }}/>
          <Typography variant={'caption'} color={'text.secondary'}>{exp} / {expReq}</Typography>
        </> : null}
        <Divider sx={{ my: 1 }}/>
        <SectionLabel>Bonuses</SectionLabel>
        <Bonus shop={shop} index={firstBonusIndex} name={firstBonusName} total={firstBonus}
               perLevel={firstBonusValue}/>
        {secondBonusIndex >= 0 && secondBonusValue > 0
          ? <Bonus shop={shop} index={secondBonusIndex} name={secondBonusName} total={secondBonus}
                   perLevel={secondBonusValue}/>
          : <NoBonus/>}
        {shop ? <>
          <Divider sx={{ my: 1 }}/>
          <Row label={'Cost'} value={<Stack component={'span'} direction={'row'} alignItems={'center'} gap={0.5}>
            <img style={{ width: 20, objectFit: 'contain' }} src={`${prefix}data/SailT0.png`} alt="Sail T0"/>
            <Typography component={'span'} variant={'body2'} color={canAfford ? 'success.light' : 'error.light'}>
              {notateNumber(lootPile?.[0]?.amount, 'Big')} / {notateNumber(cost, 'Big')}
            </Typography>
          </Stack>}/>
        </> : null}
      </> : null}
    </CardContent>
  </Card>
};

const Bonus = ({ shop, index, name, total, perLevel }) => {
  return <Stack direction={'row'} alignItems={'center'} gap={1} mb={0.5}>
    <img style={{ width: 22, height: 22, objectFit: 'contain' }} src={`${prefix}etc/Sailing_Skill_${index}.png`} alt=""/>
    <Stack sx={{ flex: 1, minWidth: 0 }}>
      <Row label={cleanUnderscore(name)} value={shop ? `+${perLevel}%` : `+${commaNotation(total)}%`}/>
      <Typography variant={'caption'} color={'text.secondary'}>{shop ? 'per level' : `${perLevel}% per level`}</Typography>
    </Stack>
  </Stack>
}

// Keeps single-bonus cards the same height as their neighbours
const NoBonus = () => {
  return <Stack direction={'row'} alignItems={'center'} gap={1} mb={0.5}>
    <Box sx={{ width: 22, height: 22, flexShrink: 0 }}/>
    <Stack>
      <Typography variant={'body2'} color={'text.secondary'}>No second bonus</Typography>
      <Typography variant={'caption'} sx={{ visibility: 'hidden' }}>per level</Typography>
    </Stack>
  </Stack>
}

export default Captain;
