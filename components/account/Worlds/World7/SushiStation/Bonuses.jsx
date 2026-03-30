import React from 'react';
import { Box, Card, CardContent, Divider, LinearProgress, Stack, Typography } from '@mui/material';
import { notateNumber, prefix } from '@utility/helpers';

const Bonuses = ({ rogBonuses, uniqueSushi, knowledge }) => {
  if (!rogBonuses || rogBonuses.length === 0) {
    return (
      <Box>
        <Typography variant="body2" color="text.secondary">No bonus data available</Typography>
      </Box>
    );
  }

  return (
    <Stack gap={2}>
      <Typography variant="body2" color="text.secondary">
        {uniqueSushi ?? 0} / {rogBonuses.length} unlocked
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'stretch' }}>
        {rogBonuses.map((bonus) => {
          const { index, name, description, unlocked } = bonus;
          const sushiName = name || `Sushi ${index}`;
          const kn = knowledge?.[index];
          const hasKnowledge = kn && kn.discovered && kn.level > 0;
          const xpPct = kn?.xpReq > 0 ? Math.min(100, (kn.xp / kn.xpReq) * 100) : 0;
          return (
            <Card
              key={index}
              variant="outlined"
              sx={{
                width: 300,
                opacity: unlocked ? 1 : 0.45
              }}
            >
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, height: '100%' }}>
                <Stack sx={{ height: '100%' }}>
                  <Stack direction="row" gap={1.5} alignItems="flex-start">
                    <img
                      src={`${prefix}data/Sushi${index}.png`}
                      alt={sushiName}
                      style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }}
                    />
                    <Stack sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {sushiName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {description}
                      </Typography>
                    </Stack>
                  </Stack>
                  {kn?.discovered && (
                    <Stack gap={0.25} mt={'auto'} pt={0.75}>
                      <Divider sx={{ my: 1 }}/>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" gap={0.5} alignItems="center">
                          <Typography variant="body2" color="text.secondary">
                            Knowledge Lv.{kn.level}
                          </Typography>
                          {kn.perfecto && (
                            <img
                              src={`${prefix}etc/SushiPerfectoStar.png`}
                              alt="Perfecto"
                              style={{ width: 28, height: 28, objectFit: 'contain', imageRendering: 'pixelated' }}
                            />
                          )}
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {notateNumber(kn.xp, 'Small')} / {notateNumber(kn.xpReq, 'Small')}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={xpPct}
                        sx={{ height: 4, borderRadius: 1 }}
                      />
                      {kn.bonusDescription && (
                        <Typography variant="caption" color="text.secondary">
                          {kn.bonusDescription}
                        </Typography>
                      )}
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Stack>
  );
};

export default Bonuses;
