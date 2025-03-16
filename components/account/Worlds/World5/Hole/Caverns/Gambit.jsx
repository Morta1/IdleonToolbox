import React from 'react';
import { CardTitleAndValue } from '@components/common/styles';
import { cleanUnderscore, commaNotation, msToDate, notateNumber, numberWithCommas } from '@utility/helpers';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import Tooltip from '@components/Tooltip';
import InfoIcon from '@mui/icons-material/Info';

const Gambit = ({ hole }) => {
  const nextUnlock = hole?.caverns?.gambit?.nextUnlock;

  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      {hole?.caverns?.gambit?.times?.map((time, index) => <CardTitleAndValue
        title={''} key={`rupie-${index}`} stackProps icon={`etc/Gambit_${index}.png`}
        imgStyle={{ width: 24, height: 24, objectFit:'contain' }}
        value={msToDate(time * 1000)}/>)}
    </Stack>
    <Divider />
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      <CardTitleAndValue title={'Base points'} value={numberWithCommas(Math.floor(hole?.caverns?.gambit?.basePoints))}/>
      <CardTitleAndValue title={'Points'} value={numberWithCommas(Math.floor(hole?.caverns?.gambit?.points))}/>
      <CardTitleAndValue title={'PointsMulti'}
                         value={`${notateNumber(hole?.caverns?.gambit?.pointsMulti, 'MultiplierInfo')}x`}/>
      {nextUnlock ? <CardTitleAndValue title={'Next upgrade'} value={<Tooltip title={<Stack gap={1}>
        <Typography sx={{ fontWeight: 'bold' }}>{cleanUnderscore(nextUnlock?.name)}</Typography>
        <Typography>{cleanUnderscore(nextUnlock?.description)}</Typography>
      </Stack>}>
        <Stack direction={'row'} gap={1}>
          {commaNotation(nextUnlock?.pointsReq)}
          <InfoIcon/>
        </Stack>
      </Tooltip>}/> : null}
      <CardTitleAndValue title={'Summoning Doublers'}
                         value={`${hole?.caverns?.gambit?.summoningDoublers?.appointed}/${hole?.caverns?.gambit?.summoningDoublers?.total}`}/>
    </Stack>
    <Divider sx={{ mb: 2 }}/>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      {hole?.caverns?.gambit?.bonuses?.map(({ name, description, pointsReq }, index) => <Card
        key={`collectible-${index}`}>
        <CardContent sx={{
          width: 350,
          minHeight: 215,
          opacity: hole?.caverns?.gambit?.points > pointsReq ? 1 : .5
        }}>
          <Typography variant={'body1'}>{cleanUnderscore(name)}</Typography>
          <Typography variant={'body1'} mt={2}>{cleanUnderscore(description)}</Typography>
          <Typography variant={'body1'} mt={2}>Req: {commaNotation(pointsReq)}</Typography>
        </CardContent>
      </Card>)}
    </Stack>
  </>
};

export default Gambit;
