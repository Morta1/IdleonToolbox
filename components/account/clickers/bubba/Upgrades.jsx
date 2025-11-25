import React from 'react';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, notateNumber, prefix } from '@utility/helpers';

const Upgrades = ({ upgrades }) => {
  return <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
    {upgrades?.map((upgrade, index) => {
      const { name, description, level, cost, unlocked } = upgrade;
      return <Card key={'upgrade-' + index}
        sx={{ width: 350, mt: 1, opacity: unlocked ? 1 : 0.5 }}>
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Stack direction={'row'} gap={2} alignItems={'center'}>
            <img src={`${prefix}etc/Bubbo_Upgrade_${index}.png`} alt={''} style={{ width: 32, height: 32, objectFit: 'contain' }} />
            <Typography>{cleanUnderscore(name)}</Typography>
          </Stack>
          <Typography mt={1} variant={'body2'} color={'text.secondary'}>
            {cleanUnderscore(description)}
          </Typography>
          <Stack mt={1} direction={'row'} justifyContent={'space-between'} alignItems={'center'}>
            <Typography>Lv. {level}</Typography>
            <Stack direction={'row'} gap={1} alignItems={'center'}>
              <Typography>{cost < 9999999 ? commaNotation(Math.ceil(cost)) : notateNumber(cost, 'Big')}</Typography>
              <img style={{ objectFit: 'contain', width: 20, height: 20 }} src={`${prefix}etc/Bubba_0.png`} alt={''} />
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    })}
  </Stack>;
};

export default Upgrades;

