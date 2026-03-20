import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, prefix } from '@utility/helpers';
import React from 'react';

const Upgrades = ({ upgrades }) => {
  return <Stack mb={1} gap={3} direction={'row'} flexWrap={'wrap'}>
    {upgrades?.map(({ name, desc, lvl, maxLvl, unlocked, bonus }, index) => {
      if (name === 'Hmm...') return null;
      return <Card key={name + `${index}`} sx={{
        width: 350,
        border: lvl >= maxLvl ? '1px solid' : '',
        borderColor: lvl >= maxLvl ? 'success.main' : '',
        opacity: unlocked ? 1 : 0.5
      }}>
        <CardContent>
          <Stack direction={'row'} alignItems={'center'} gap={1}>
            {name !== 'Hmm...'
              ? <img src={`${prefix}etc/Dream_Upgrade_${index + 1}.png`}
                     alt="dream-icon" width={48} height={48} style={{ objectFit: 'contain' }}/>
              : null}
            <Typography sx={{ fontSize: 22 }}
                        align="center">{cleanUnderscore(name.capitalize())}</Typography>
          </Stack>
          {desc.map((line, index) => {
            return <Typography key={`${index}`} align="center" sx={{ mt: 2 }}>{cleanUnderscore(line)}</Typography>
          })}
          {index === 9 ? <Typography align="center" sx={{ mt: 2 }}>Bosses killed: {bonus}</Typography> : null}
          <Typography align="center" sx={{ mt: 2 }}>Lvl : {lvl}/{maxLvl}</Typography>
        </CardContent>
      </Card>
    })}
  </Stack>;
};

export default Upgrades;
