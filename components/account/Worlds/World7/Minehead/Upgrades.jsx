import React from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';

const Upgrades = ({ upgrades }) => {
  if (!upgrades || upgrades.length === 0) {
    return (
      <Box>
        <Typography variant="body2" color="text.secondary">No upgrades available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2 }}>
      {upgrades.map((upgrade) => {
        const { index, name, level, maxLevel, isMaxed, researchLvReq, isLocked, cost, canAfford, description } = upgrade;

        return (
          <Card
            key={index}
            variant={'outlined'}
            sx={{ opacity: isLocked ? 0.5 : 1 }}
          >
            <CardContent>
              <Stack gap={1.5}>
                <Stack direction={'row'} gap={1.5} alignItems={'center'}>
                  <img
                    src={`${prefix}data/MineUpg${index}.png`}
                    alt={name}
                    style={{ width: 48, height: 48, imageRendering: 'pixelated' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <Stack flex={1}>
                    <Typography variant="subtitle1" fontWeight={500}>
                      {cleanUnderscore(name)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {isMaxed
                        ? 'MAX LV'
                        : `Lv. ${level} / ${maxLevel}${isLocked ? ' — Locked' : ''}`
                      }
                    </Typography>
                    {isLocked && (
                      <Typography variant="caption" color="text.secondary">
                        Research Lv. {researchLvReq} required
                      </Typography>
                    )}
                  </Stack>
                </Stack>

                {description && (
                  <Typography variant="body2">
                    {description}
                  </Typography>
                )}

                {!isMaxed && (
                  <Typography variant="body2" color={canAfford ? 'text.primary' : 'error'}>
                    Cost: {notateNumber(cost, 'Big')}
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
};

export default Upgrades;
