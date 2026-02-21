import React from 'react';
import Tooltip from '@components/Tooltip';
import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { IconSearch, IconEye, IconRainbow } from '@tabler/icons-react';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';

// Game order: research[6] = ["Magnifying_Glass", "Optical_Monocle", "Kaleidoscope"]. Placeholder icons – replace with final assets when ready.
const LENS_ICONS = {
  0: { Icon: IconSearch, title: 'Magnifying glass' },
  1: { Icon: IconEye, title: 'Optical Monocle' },
  2: { Icon: IconRainbow, title: 'Kaleidoscope' }
};

// Observation insight level colors from game (N.js Research UI: semicolon-separated RGB list indexed by level)
const OBSERVATION_LEVEL_RGB = '149,148,148;152,116,99;116,187,207;204,167,93;77,115,239;202,47,225;225,47,47;44,151,69;255,138,195;255,137,46;118,104,121'
  .split(';')
  .map((s) => s.trim());
// Game indexes color list by insight level (level 1 → index 1, level 6 → index 6 = red)
const getObservationLevelColor = (level) => {
  if (level < 1) return null;
  const i = Math.min(level, OBSERVATION_LEVEL_RGB.length - 1);
  const rgb = OBSERVATION_LEVEL_RGB[i];
  return rgb ? `rgb(${rgb})` : null;
};
const Observations = ({ observations }) => {
  const list = observations ?? [];
  if (list.length === 0) {
    return (
      <Box>
        <Typography variant="body2" color="text.secondary">
          No observations available. Progress Research to unlock more.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
      {list.map((obs) => {
        const insightLv = obs.insightLevel ?? 0;
        const levelColor = getObservationLevelColor(insightLv);
        return (
        <Card
          key={obs.index}
          variant="outlined"
          sx={{ opacity: obs.found ? 1 : 0.7, height: '100%' }}
        >
          <CardContent>
            <Stack spacing={1.5}>
              <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                <Typography
                  variant="subtitle1"
                  fontWeight={500}
                  component="span"
                  sx={levelColor ? { color: levelColor } : undefined}
                >
                  {cleanUnderscore(obs.name ?? `Observation ${obs.index + 1}`)}
                  {obs.found && (
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                      (Found)
                    </Typography>
                  )}
                </Typography>
                {Array.isArray(obs.lensTypes) && obs.lensTypes.length > 0 && (
                  <Stack direction="row" alignItems="center" gap={0.5} sx={{ ml: 'auto' }}>
                    {obs.lensTypes.map((t) => {
                      const { Icon, title } = LENS_ICONS[t] ?? { Icon: null, title: `Lens ${t}` };
                      return Icon ? (
                        <Tooltip key={t} title={title}>
                          <Box component="span" sx={{ display: 'inline-flex', color: 'text.secondary' }}>
                            <Icon size={20} />
                          </Box>
                        </Tooltip>
                      ) : null;
                    })}
                  </Stack>
                )}
              </Stack>

              {obs.description && (
                <Typography variant="body2" color="text.secondary">
                  {cleanUnderscore(obs.description)}
                </Typography>
              )}

              <Divider sx={{ my: 0.5 }} />

              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                  <Typography variant="body2" color="text.secondary">Research Lv Req:</Typography>
                  <Typography variant="body2">{obs.researchLvReq ?? 0}</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                  <Typography variant="body2" color="text.secondary">Insight Lv:</Typography>
                  <Typography variant="body2">{obs.insightLevel ?? 0}</Typography>
                </Stack>
                {obs.found && (
                  <>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                      <Typography variant="body2" color="text.secondary">Insight EXP:</Typography>
                      <Typography variant="body2">
                        {notateNumber(obs.insightExp ?? 0, 'Small')} / {notateNumber(obs.insightExpREQ ?? 0, 'Small')}
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                      <Typography variant="body2" color="text.secondary">Insight / hr:</Typography>
                      <Typography variant="body2">{notateNumber(obs.insightExpRate ?? 0, 'Small')}</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                      <Typography variant="body2" color="text.secondary">Research EXP rate:</Typography>
                      <Typography variant="body2">{notateNumber(obs.researchEXPrate ?? 0, 'Big')}</Typography>
                    </Stack>
                  </>
                )}

                <Divider sx={{ my: 0.5 }} />

                {(obs.mapName || obs.mapMob) && (
                  <Stack spacing={0.5}>
                    {obs.mapName && (
                      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                        <Typography variant="body2" color="text.secondary">Map:</Typography>
                        <Typography variant="body2">{cleanUnderscore(obs.mapName)}</Typography>
                      </Stack>
                    )}
                    {obs.mapMob && obs.mapMob !== "_" && obs.mapMobFace !== 0 && (
                      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                        <Typography variant="body2" color="text.secondary">Mob:</Typography>
                        <Stack direction="row" alignItems="center" gap={0.75}>
                          <Typography variant="body2">{cleanUnderscore(obs.mapMob)}</Typography>
                          {obs.mapMobFace != null && (
                            <Box
                              component="img"
                              src={`${prefix}data/Mface${obs.mapMobFace}.png`}
                              alt=""
                              sx={{ width: 28, height: 28, objectFit: 'contain' }}
                            />
                          )}
                        </Stack>
                      </Stack>
                    )}
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

export default Observations;
