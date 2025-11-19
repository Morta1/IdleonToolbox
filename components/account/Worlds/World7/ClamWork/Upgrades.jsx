import React from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, commaNotation, prefix } from '@utility/helpers';
import { getClamWorkBonus } from '@parsers/world-7/clamWork';

const Upgrades = ({ upgrades, account }) => {
  // Format bonus for display
  const formatBonus = (bonus) => {
    if (bonus > 1e9) {
      return notateNumber(bonus, 'Big');
    } else if (bonus > 0 && bonus < 1) {
      return `${(bonus * 100).toFixed(2)}%`;
    } else {
      return commaNotation(bonus);
    }
  };

  // Get upgrade level from account options
  const getUpgradeLevel = (index) => {
    return account?.accountOptions?.[Math.round(index + 455)] ?? 0;
  };

  // Check if upgrade is unlocked
  const isUpgradeUnlocked = (index) => {
    return getClamWorkBonus(account, index) === 1;
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
                <Stack direction={'row'} gap={1.5} alignItems={'center'}>
                  <img
                    src={`${prefix}data/ClamPearl0.png`}
                    alt=""
                    style={{ width: 32, height: 32 }}
                  />
                  <Stack flex={1}>
                    <Typography variant="subtitle1" fontWeight={500}>
                      {cleanUnderscore(upgrade.name)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Level: {level}
                      {upgrade.unlocked ? '' : ' (Locked)'}
                    </Typography>
                  </Stack>
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
                      <Typography variant="body2">
                        {notateNumber(upgrade.cost, 'Big')}
                      </Typography>
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

