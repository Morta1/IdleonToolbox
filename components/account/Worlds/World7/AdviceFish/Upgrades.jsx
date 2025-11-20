import React from 'react';
import { Box, Card, CardContent, Stack, Typography, Divider } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix, getCoinsArray } from '@utility/helpers';
import CoinDisplay from '@components/common/CoinDisplay';

const Upgrades = ({ upgrades }) => {
  // Format description with placeholder replacements
  const formatDescription = (description, bonus) => {
    if (!description) return description;
    let text = description;
    
    // Replace { with Math.ceil(100 * bonus) / 100
    const bonusValue = Math.ceil(100 * bonus) / 100;
    text = text.replace(/\{/g, '' + bonusValue);
    
    // Replace } with Math.ceil(100 * (1 + bonus / 100)) / 100
    const multiplierValue = Math.ceil(100 * (1 + bonus / 100)) / 100;
    text = text.replace(/\}/g, '' + multiplierValue);
    
    return text;
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
        return (
          <Card
            key={upgrade.name || index}
            variant={'outlined'}
            sx={{
              opacity: upgrade.level > 0 ? 1 : 0.6,
              height: '100%'
            }}
          >
            <CardContent>
              <Stack spacing={1.5}>
                <Stack direction={'row'} gap={1.5} alignItems={'center'}>
                  <img
                    src={`${prefix}etc/Advice_Fish_${index}.png`}
                    alt={cleanUnderscore(upgrade.name)}
                    style={{ width: 40, height: 40, objectFit: 'contain' }}
                  />
                  <Stack flex={1}>
                    <Typography variant="subtitle1" fontWeight={500}>
                      {cleanUnderscore(upgrade.name)}
                    </Typography>
                  </Stack>
                </Stack>

                {upgrade.description && (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      {cleanUnderscore(formatDescription(upgrade.description, upgrade.bonus || 0))}
                    </Typography>
                    <Divider sx={{ my: 0.5 }} />
                  </>
                )}

                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                    <Typography variant="body2" color="text.secondary" component="span">
                      Level:
                    </Typography>
                    <Typography variant="body2" component="span">
                      {upgrade.level || 0}
                    </Typography>
                  </Stack>

                  {upgrade.cost !== undefined && (
                    <Stack spacing={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        Next Cost:
                      </Typography>
                      <CoinDisplay
                        title=""
                        money={getCoinsArray(upgrade.cost)}
                        maxCoins={5}
                        centered={false}
                        variant="horizontal"
                      />
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

