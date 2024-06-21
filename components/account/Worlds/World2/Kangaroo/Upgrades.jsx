import React from 'react';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, notateNumber, prefix } from '@utility/helpers';

const Upgrades = ({ upgrades, isTar }) => {
  return <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
    {upgrades?.map((upgrade, index) => {
      let { name, desc, level, cost, unlocked } = upgrade;
      const hasUnlocked = upgrade.hasOwnProperty('unlocked');
      return <Card key={'upgrade-' + index}
                   sx={{ width: 350, mt: 1, opacity: (hasUnlocked && unlocked || !hasUnlocked) ? 1 : .5 }}>
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Stack direction={'row'} gap={2}>
            <img src={`${prefix}etc/KUpg${isTar ? 'b' : 'a'}_${index}.png`} alt={''}/>
            <Typography>{cleanUnderscore(name)}</Typography>
          </Stack>
          <Typography mt={1}>{cleanUnderscore(desc)}</Typography>
          <Stack mt={'auto'} direction={'row'} justifyContent={'space-between'}>
            <Typography>Lv. {level}</Typography>
            <Stack direction={'row'} gap={1}>
              <Typography>{cost < 9999999 ? commaNotation(Math.ceil(cost)) : notateNumber(cost, 'Big')}</Typography>
              <img style={{ objectFit: 'contain' }} src={`${prefix}etc/K${isTar ? 'Tar' : 'Fish'}.png`} alt={''}/>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    })}
  </Stack>;
};

export default Upgrades;
