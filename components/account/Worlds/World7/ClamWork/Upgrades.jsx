import React from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum, notateNumber, prefix } from '@utility/helpers';

const Upgrades = ({ upgrades, account }) => {
  // Format bonus for display
  const formatBonus = (bonus) => (bonus > 0 && bonus < 1 ? formatNum(bonus * 100, 'pct') : formatNum(bonus, 'amount'));

  // Get upgrade level from account options
  const getUpgradeLevel = (index) => {
    return account?.accountOptions?.[Math.round(index + 455)] ?? 0;
  };

  if (!upgrades || upgrades.length === 0) {
    return (
      <Box>
        <Typography variant="body2" color="text.secondary">No upgrades available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2 }}>
      {upgrades.map((upgrade, index) => {
        const level = getUpgradeLevel(index);

        return (
          <Card
            key={upgrade.name || index}
            variant={'outlined'}
            sx={{
              opacity: upgrade.unlocked ? 1 : 0.6,
            }}
          >
            <CardContent>
              <Stack gap={1.5}>
                <Stack>
                  <Typography variant={'cardTitle'} component={'h3'}>
                    {cleanUnderscore(upgrade.name)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Level: {level}
                    {upgrade.unlocked ? '' : ' (Locked)'}
                  </Typography>
                </Stack>

                {upgrade.description && (
                  <Typography variant="body2" color="text.secondary">
                    {cleanUnderscore(upgrade.description)}
                  </Typography>
                )}

                <Stack direction={'row'} justifyContent={'space-between'}>
                  {upgrade.cost > 0 && (
                    <Stack direction={'column'} >
                      <Typography variant="caption" color="text.secondary">
                        Cost:
                      </Typography>
                      <Stack direction={'row'} gap={.5} alignItems={'center'}>
                        <img src={`${prefix}data/ClamPearl0.png`} alt="" style={{ width: 20, height: 20 }} />
                        <Typography variant="body2">
                          {notateNumber(upgrade.cost, 'Big')}
                        </Typography>
                      </Stack>
                    </Stack>
                  )}

                  {upgrade.requiredPearls > 0 && index > 0 && !upgrade.unlocked && (
                    <Stack direction={'column'} >
                      <Typography variant="caption" color="text.secondary">
                        Required Pearls:
                      </Typography>
                      <Typography variant="body2">
                        {notateNumber(upgrade.requiredPearls, 'Big')}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
};

export default Upgrades;

