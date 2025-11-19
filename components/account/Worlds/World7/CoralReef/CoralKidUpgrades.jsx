import React from 'react';
import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber } from '@utility/helpers';

const CoralKidUpgrades = ({ coralKidUpgrades }) => {
  if (!coralKidUpgrades || coralKidUpgrades.length === 0) {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 2 }}>Coral Kid Upgrades</Typography>
        <Typography variant="body2" color="text.secondary">No coral kid upgrades available</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
        {coralKidUpgrades.map((upgrade, index) => (
          <Card key={index} variant={'outlined'} sx={{ opacity: upgrade.level > 0 ? 1 : 0.6, height: '100%' }}>
            <CardContent>
              <Stack spacing={1.5}>
                {/* Header Section */}
                <Stack spacing={0.5}>
                  {upgrade.description && (
                    <Typography variant="body2">
                      {cleanUnderscore(upgrade.description)}
                    </Typography>
                  )}
                </Stack>

                {/* Divider */}
                <Divider sx={{ my: 0.5 }} />

                {/* Stats Section */}
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                    <Typography variant="body2" color="text.secondary" component="span">
                      Level:
                    </Typography>
                    <Typography variant="body2" component="span"                    >
                      {upgrade.level || 0}
                    </Typography>
                  </Stack>
                </Stack>

                {/* Cost Section */}
                {upgrade.cost !== undefined && (
                  <>
                    <Divider sx={{ my: 0.5 }} />
                    <Stack spacing={0.75}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                        <Typography variant="body2" color="text.secondary" component="span">
                          Cost:
                        </Typography>
                        <Typography variant="body2" component="span">
                          {notateNumber(upgrade.cost, "Big")}
                        </Typography>
                      </Stack>
                    </Stack>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default CoralKidUpgrades;

