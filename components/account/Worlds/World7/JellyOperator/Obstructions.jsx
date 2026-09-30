import React from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { notateNumber, prefix } from '@utility/helpers';

const Obstructions = ({ obstructions }) => {
  const released = obstructions?.filter(({ placeholder }) => !placeholder) ?? [];

  return (
    <Stack gap={2}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'stretch' }}>
        {released.map(({ index, name, description, defeated, hp, time }) => (
          <Card key={index} variant="outlined" sx={{ width: 300, opacity: defeated ? 1 : 0.45 }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, height: '100%' }}>
              <Stack direction="row" gap={1.5} alignItems="flex-start" sx={{ height: '100%' }}>
                <img
                  src={`${prefix}data/JellyOp${index}.png`}
                  alt={name}
                  style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }}
                />
                <Stack sx={{ minWidth: 0, flex: 1, height: '100%' }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                    {description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" mt="auto" pt={0.5}>
                    {notateNumber(hp, 'Big')} HP · {time}s
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Stack>
  );
};

export default Obstructions;
