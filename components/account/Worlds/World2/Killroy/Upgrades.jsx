import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import React from 'react';
import { prefix } from '@utility/helpers';

const Upgrades = ({ killroy }) => {
  return (
    <Stack direction={'row'} alignItems={'center'} flexWrap={'wrap'} gap={1}>
      {killroy?.upgrades?.map(({ level, description, upgrade }, index) => <Card key={`upgrade-${index}`}
                                                                                sx={{ height: 200, width: 350 }}>
        <CardContent>
          <Stack direction={'row'} gap={2}>
            <img style={{ objectFit: 'contain' }} src={`${prefix}etc/Killroy_${index}.png`} alt=""/>
            <Stack>
              <Typography>Lv. {level}</Typography>
              <Divider sx={{ my: 1 }}/>
              <Typography>{upgrade}</Typography>
              <Typography>{description}</Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>)}
    </Stack>
  );
};

export default Upgrades;

