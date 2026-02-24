import React from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';

const GlimboTrades = ({ glimbo }) => {
  if (!glimbo || glimbo.length === 0) {
    return (
      <Box>
        <Typography variant="body2" color="text.secondary">No glimbo data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 2 }}>
      {glimbo.map((trade) => {
        const { index, itemName, rawItemName, trades, cost, vaultIdx, upgradeName, currentMaxLevel, nextBonusGain } = trade;

        return (
          <Card key={index} variant={'outlined'}>
            <CardContent>
              <Stack direction={'row'} alignItems={'center'} gap={2}>

                {/* You give */}
                <Stack alignItems={'center'} gap={0.5} sx={{ minWidth: 64 }}>
                  <img
                    src={`${prefix}data/${rawItemName}.png`}
                    alt={itemName}
                    style={{ width: 48, height: 48, imageRendering: 'pixelated' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <Typography variant="caption" color="text.secondary" textAlign={'center'}>
                    {cleanUnderscore(itemName)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" textAlign={'center'}>
                    Cost: {notateNumber(cost, 'Big')}
                  </Typography>
                </Stack>

                {/* Arrow + traded count */}
                <Stack alignItems={'center'} flex={1} gap={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Traded {trades} times
                  </Typography>
                </Stack>

                {/* You receive */}
                <Stack alignItems={'center'} gap={0.5} sx={{ minWidth: 100, maxWidth: 120 }} textAlign={'center'}>
                  <img
                    src={`${prefix}data/VaultUpg${vaultIdx}.png`}
                    alt={upgradeName}
                    style={{ width: 48, height: 48, imageRendering: 'pixelated' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <Typography variant="body2">
                    Max LV of {currentMaxLevel}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {cleanUnderscore(upgradeName)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Next: +{nextBonusGain} Max LV
                  </Typography>
                </Stack>

              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
};

export default GlimboTrades;
