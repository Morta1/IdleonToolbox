import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import { cleanUnderscore, commaNotation, numberWithCommas } from '@utility/helpers';
import { CardWithBreakdown } from '@components/common/Breakdown/CardWithBreakdown';
import React from 'react';

// The temple panel prints millions past 1e7 and billions past billionsFrom (1e13 for the torch count, 1e10 for costs)
const torchNotation = (value, billionsFrom) => {
  if (value > 999999999999999.9) return '999999B';
  if (value > billionsFrom) return `${commaNotation(value / 1e9)}B`;
  if (value > 9999999.9) return `${commaNotation(value / 1e6)}M`;
  return commaNotation(value);
};

const TheTemple = ({ hole }) => {
  return <>
    <Stack mb={3} direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      <CardTitleAndValue title={'Torches'} value={torchNotation(Math.floor(hole?.caverns?.theTemple?.torches ?? 0), 9999999999999.9)}
                         imgStyle={{ width: 32, height: 32, marginBottom: -10, marginRight: -10 }} icon={'data/HoleUIbuildUpg77.png'}/>
      <CardTitleAndValue title={'Layer'} value={hole?.caverns?.theTemple?.layer}/>
      <CardWithBreakdown title={'Extra torch chance'}
                         value={`${numberWithCommas(hole?.caverns?.theTemple?.extraTorchChance?.value ?? 0)}%`}
                         breakdown={hole?.caverns?.theTemple?.extraTorchChance?.breakdown}/>
      <CardTitleAndValue title={'Opals found'} icon={'data/Opal.png'} imgStyle={{ width: 24, height: 24 }}
                         value={hole?.holesObject?.opalsPerCavern?.[14] || 0}/>
    </Stack>
    <Divider sx={{ my: 2 }}/>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      {hole?.caverns?.theTemple?.bonuses?.map(({ name, description, cost }, index) => {
        return <Card key={`bonus-${index}`}>
          <CardContent sx={{ width: 300 }}>
            <Typography variant={'body1'} sx={{ fontWeight: 'bold' }}>{cleanUnderscore(name)}</Typography>
            <Typography mt={2}>{cleanUnderscore(description)}</Typography>
            <Stack direction={'row'} alignItems={'center'} mt={2} gap={1}>
              <Typography variant={'body2'}>Cost: {torchNotation(cost, 9999999999.9)}</Typography>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default TheTemple;
