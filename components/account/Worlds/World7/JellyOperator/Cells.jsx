import React from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { notateNumber, prefix } from '@utility/helpers';

const Cells = ({ cells }) => {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'stretch' }}>
      {cells?.map(({ index, name, unlocked, level, expReq, dps, passive, effect }) => (
        <Card key={index} variant={'outlined'} sx={{ width: 240, opacity: unlocked ? 1 : 0.45 }}>
          <CardContent>
            <Stack gap={1}>
              <Stack direction="row" gap={1.5} alignItems="center">
                <img
                  src={`${prefix}data/JellyUnit${index}.png`}
                  alt={name}
                  style={{ width: 40, height: 40, objectFit: 'contain', flexShrink: 0 }}
                />
                <Stack>
                  <Typography variant="subtitle1" fontWeight={500}>{name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {unlocked ? `Lv. ${level}` : 'Locked'}
                  </Typography>
                </Stack>
              </Stack>
              <Typography variant="body2">DPS: {notateNumber(dps, 'Big')}</Typography>
              {passive ? <Typography variant="body2">Passive: {passive}</Typography> : null}
              {effect ? <Typography variant="body2">{effect}</Typography> : null}
              <Typography variant="body2" color="text.secondary">Next level: {notateNumber(expReq, 'Big')} EXP</Typography>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default Cells;
