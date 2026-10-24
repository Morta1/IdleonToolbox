import React from 'react';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { notateNumber, prefix } from '@utility/helpers';
import { cleanText } from '@utility/goals/registry/names';

const OrbletMarket = ({ orbletMarket, orblets }) => {
  return (
    <Stack direction="row" gap={2} flexWrap="wrap" alignItems="stretch">
      {orbletMarket?.map(({ index, name, description, level, maxLevel, cost, bonus, maxed }) => (
        <Card key={index}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', width: 320, minHeight: 210 }}>
            <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
              <img style={{ width: 32, height: 32 }} src={`${prefix}data/Orblet.png`} alt=""/>
              <Typography>{cleanText(name)} ({level} / {maxLevel})</Typography>
            </Stack>
            <Divider sx={{ my: 1 }}/>
            <Typography>{cleanText(description)}</Typography>
            <Divider sx={{ my: 1, mt: 'auto' }}/>
            <Typography variant="body2">Bonus: {notateNumber(bonus)}</Typography>
            <Stack direction="row" gap={1} alignItems="center">
              <img style={{ width: 20, height: 20 }} src={`${prefix}data/Orblet_x1.png`} alt=""/>
              {maxed ? <Typography variant="body2">Maxed</Typography> : <Typography variant="body2">
                Cost: {notateNumber(orblets ?? 0)} / {notateNumber(cost)}
              </Typography>}
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
};

export default OrbletMarket;
