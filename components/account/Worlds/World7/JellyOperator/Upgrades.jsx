import React from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { notateNumber, prefix } from '@utility/helpers';

const Upgrades = ({ upgrades, characters }) => {
  const maxResearchLevel = Math.max(0, ...(characters || []).map((c) => c?.skillsInfo?.research?.level ?? 0));

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'stretch' }}>
      {upgrades?.map(({ id, name, description, level, maxLevel, cost, lvReq, unlocked }) => {
        const isMaxed = maxLevel !== null && level >= maxLevel;
        const meetsLvReq = maxResearchLevel >= lvReq;
        return (
          <Card key={id} variant={'outlined'} sx={{ width: 320, opacity: meetsLvReq && unlocked ? 1 : 0.5 }}>
            <CardContent sx={{ height: '100%' }}>
              <Stack gap={1} sx={{ height: '100%' }}>
                <Stack direction="row" gap={1.5} alignItems="center">
                  <img
                    src={`${prefix}data/JellyUpg${id}.png`}
                    alt={name}
                    style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }}
                  />
                  <Typography variant="subtitle1" fontWeight={500}>{name}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {isMaxed ? 'MAX LV' : `Lv. ${level} / ${maxLevel ?? '∞'}`}
                </Typography>
                {description ? <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{description}</Typography> : null}
                <Stack mt="auto" pt={1}>
                  {!isMaxed ? <Stack direction="row" alignItems="center" gap={0.5}>
                    <Typography variant="body2" color="text.secondary">Cost: {notateNumber(cost, 'Big')}</Typography>
                    <img src={`${prefix}etc/Bloodcell.png`} alt="Bloodcells" style={{ width: 18, height: 18, objectFit: 'contain' }}/>
                  </Stack> : null}
                  {!meetsLvReq ? <Typography variant="caption" color="text.secondary">
                    Requires Research Lv. {lvReq}
                  </Typography> : null}
                  {!unlocked ? <Typography variant="caption" color="text.secondary">
                    Requires the previous upgrade
                  </Typography> : null}
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
