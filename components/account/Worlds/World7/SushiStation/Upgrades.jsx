import React from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { notateNumber, prefix } from '@utility/helpers';

const Upgrades = ({ upgrades, characters }) => {
  if (!upgrades || upgrades.length === 0) {
    return (
      <Box>
        <Typography variant="body2" color="text.secondary">No upgrades available</Typography>
      </Box>
    );
  }

  const maxResearchLevel = Math.max(0, ...(characters || []).map(c => c?.skillsInfo?.research?.level ?? 0));

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'stretch' }}>
      {upgrades.map((upgrade, i) => {
        const {
          name,
          description,
          level,
          maxLevel,
          cost,
          lvReq,
          visualIndex
        } = upgrade;
        const isMaxed = maxLevel !== Infinity && level >= maxLevel;
        const maxLevelDisplay = maxLevel === Infinity ? '\u221E' : maxLevel;
        const meetsLvReq = maxResearchLevel >= lvReq;

        return (
          <Card
            key={visualIndex ?? i}
            variant={'outlined'}
            sx={{ width: 320, opacity: meetsLvReq ? 1 : 0.5 }}
          >
            <CardContent sx={{ height: '100%' }}>
              <Stack gap={1} sx={{ height: '100%' }}>
                <Stack direction="row" gap={1.5} alignItems="center">
                  <img
                    src={`${prefix}data/SushiUpg${upgrade.upgradeIndex}.png`}
                    alt={name}
                    style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }}
                  />
                  <Typography variant="subtitle1" fontWeight={500}>
                    {name}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {isMaxed
                    ? 'MAX LV'
                    : `Lv. ${level} / ${maxLevelDisplay}`
                  }
                </Typography>

                {description && (
                  <Typography variant="body2">
                    {description}
                  </Typography>
                )}

                <Stack mt="auto" pt={1}>
                  {!isMaxed && (
                    <Typography variant="body2" color="text.secondary">
                      Cost: {notateNumber(cost, 'Big')}
                    </Typography>
                  )}

                  {lvReq > 1 && (
                    <Typography variant="caption" color="text.secondary">
                      Requires Research Lv. {lvReq}
                    </Typography>
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
