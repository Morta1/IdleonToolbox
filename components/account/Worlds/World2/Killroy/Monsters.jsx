import { Card, CardContent, Stack, Typography } from '@mui/material';
import { notateNumber, prefix } from '@utility/helpers';
import React from 'react';

const Monsters = ({ killroy }) => {
  return (
    <Stack direction={'row'} flexWrap={'wrap'} gap={1}>
      {killroy?.list?.map(({ rawName, world, killRoyKills, icon }, index) => {
        return <Card key={rawName + index}>
          <CardContent>
            <Stack alignItems={'center'} gap={1}>
              <img src={`${prefix}data/${icon}.png`} alt="monster-icon"/>
              <Typography>{notateNumber(killRoyKills ?? 0, 'Big')}</Typography>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  );
};

export default Monsters;
