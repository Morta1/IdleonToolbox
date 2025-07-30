import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, prefix } from '@utility/helpers';
import React from 'react';

const Battles = ({ stones }) => {
  return <>
    <Stack direction={'row'} gap={2}>

    </Stack>

    <Stack gap={2} direction={'row'} flexWrap={'wrap'}>
      {stones?.map(({ name, bonus, kills, monsterIcon, index, mapName, mapMonsterName, mapMonsterIcon }) => {
        return <Card key={'upgrade-' + index} sx={{ width: 220 }}>
          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
              <img style={{ width: 50, height: 50, objectFit: 'contain' }}
                   src={`${prefix}etc/SumStone_${index}.png`} alt={''}/>
              <img style={{ width: 50, height: 50, objectFit: 'contain' }}
                   src={`${prefix}${monsterIcon}.png`} alt={''}/>
              <Typography variant={'caption'}>Kills: {kills}</Typography>
            </Stack>
            <Divider sx={{ my: 1 }}></Divider>
            <Typography variant={'body1'}>{cleanUnderscore(name)}</Typography>
            <Divider sx={{ my: 1 }}></Divider>
            <Stack direction={'row'} gap={1}>
              <Stack>
                <Typography mt={1} variant={'body2'}>{cleanUnderscore(bonus).capitalizeAll()}</Typography>
              </Stack>
            </Stack>
            <Divider sx={{ my: 1 }}></Divider>
            <Stack>
              <Typography variant={'body2'}>Found at:</Typography>
              <Typography variant={'body2'}>{cleanUnderscore(mapName)}</Typography>
              <Stack direction={'row'} alignItems={'center'} gap={1}>
                {mapMonsterIcon && <img style={{ width: 50, height: 50, objectFit: 'contain' }}
                  src={`${prefix}${mapMonsterIcon}.png`} alt={''} />}
                {mapMonsterName && <Typography variant={'caption'}>{cleanUnderscore(mapMonsterName)}</Typography>}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default Battles;
