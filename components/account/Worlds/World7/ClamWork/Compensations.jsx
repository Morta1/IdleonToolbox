import React from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, prefix } from '@utility/helpers';

const Compensations = ({ compensations }) => {
  if (!compensations || compensations.length === 0) {
    return (
      <Box>
        <Typography variant="body2" color="text.secondary">No compensations available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2 }}>
      {compensations.map((compensation, index) => {
        const isUnlocked = compensation.unlocked === 1;

        return (
          <Card
            key={index}
            variant={'outlined'}
            sx={{ opacity: isUnlocked ? 1 : 0.6 }}
          >
            <CardContent>
              <Stack gap={1.5}>
                <Stack direction={'row'} gap={1.5} alignItems={'center'}>
                  <Stack flex={1}>
                    <Typography variant="subtitle1" fontWeight={500}>
                      {cleanUnderscore(compensation.name)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {isUnlocked ? 'Unlocked' : 'Locked'}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
};

export default Compensations;

