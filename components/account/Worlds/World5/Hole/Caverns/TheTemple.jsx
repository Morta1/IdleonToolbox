import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import { cleanUnderscore, commaNotation } from '@utility/helpers';
import React from 'react';

const TheTemple = ({ hole }) => {
  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      <CardTitleAndValue title={'Torches'} value={Math.floor(hole?.caverns?.theTemple?.torches)}
                         imgStyle={{ width: 32, height: 32, marginBottom: -10, marginRight: -10 }} icon={'data/HoleUIbuildUpg77.png'}/>
      <CardTitleAndValue title={'Layer'} value={hole?.caverns?.theTemple?.layer}/>
    </Stack>
    <Divider sx={{ my: 2 }}/>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      {hole?.caverns?.theTemple?.bonuses?.map(({ name, description, cost }, index) => {
        return <Card key={`bonus-${index}`}>
          <CardContent sx={{ width: 300 }}>
            <Typography variant={'body1'} sx={{ fontWeight: 'bold' }}>{cleanUnderscore(name)}</Typography>
            <Typography mt={2}>{cleanUnderscore(description)}</Typography>
            <Stack direction={'row'} alignItems={'center'} mt={2} gap={1}>
              <Typography variant={'body2'}>Cost: {commaNotation(cost)}</Typography>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default TheTemple;
