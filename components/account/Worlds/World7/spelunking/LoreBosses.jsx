import React from 'react';
import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { cleanUnderscore, notateNumber, number2letter, prefix } from '@utility/helpers';
import Tooltip from '@components/Tooltip';

const LoreBosses = ({ loreBosses, bestCaveLevels }) => {
  if (!loreBosses || !Array.isArray(loreBosses)) {
    return <div>No lore bosses available</div>;
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
      {loreBosses.map((boss) => {
        if (!boss) {
          return null;
        }
        const iconLetter = number2letter[boss.index];
        const hasAnyDiscovery = boss.discoveries.some((discovery) => discovery.acquired);
        return (
          <Stack key={boss.index}>
            <Card variant={'outlined'} sx={{ height: '100%', opacity: !hasAnyDiscovery ? 0.5 : 1 }}>
              <CardContent>
                <Stack direction={'row'} gap={1} alignItems={'center'} mb={2}>
                  <img style={{ width: 72, height: 72, objectFit: 'contain', opacity: !boss.defeated ? 0.4 : 1 }} src={`${prefix}data/CaveBoss${boss.index}.png`} />
                  <Stack direction={'row'} alignItems={'center'} gap={1} flex={1}>
                    <Typography sx={{ opacity: !boss.defeated ? 0.4 : 1 }} variant="body1">{cleanUnderscore(boss.description)}</Typography>
                  </Stack>
                </Stack>
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <Stack>
                      <Typography variant="body2" color="text.secondary">
                        Best
                      </Typography>
                      <Typography variant="body1">
                        Depth {bestCaveLevels?.[boss.index]}
                      </Typography>
                    </Stack>
                  </Grid>
                  <Grid size={6}>
                    <Stack>
                      <Typography variant="body2" color="text.secondary">
                        Found at
                      </Typography>
                      <Typography variant="body1">
                        Depth {boss.foundAt}
                      </Typography>
                    </Stack>
                  </Grid>
                  <Grid size={6}>
                    <Stack>
                      <Typography variant="body2" color="text.secondary">
                        Biggest Haul
                      </Typography>
                      <Typography variant="body1">
                        {notateNumber(boss.biggestHaul, "Big")}
                      </Typography>
                    </Stack>
                  </Grid>
                  <Grid size={6}>
                    <Stack>
                      <Typography variant="body2" color="text.secondary">
                        Best Cave Level
                      </Typography>
                      <Typography variant="body1">
                        {boss.bestCaveLevel}
                      </Typography>
                    </Stack>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body1">
                  Discoveries: {boss?.discoveriesCount ?? '0'} / {boss.maxDiscoveries}
                </Typography>
                <Stack mt={2} direction={'row'} gap={1} flexWrap={'wrap'}>
                  {boss.discoveries.map((discovery) => {
                    const name = cleanUnderscore(discovery.name);
                    const tooltipTitle = discovery.powerReqFormatted
                      ? (
                        <Stack>
                          <Typography variant="body2" fontWeight="bold">{name}</Typography>
                          <Typography variant="body2">
                            Power Req: {discovery.powerReqFormatted}
                          </Typography>
                        </Stack>
                      )
                      : name;
                    return (
                      <Tooltip title={tooltipTitle} key={boss.index + discovery.index}>
                        <img style={{
                          width: 32, height: 32, objectFit: 'contain',
                          opacity: discovery.acquired ? 1 : 0.3,
                        }}
                          src={`${prefix}data/CaveRock${iconLetter}${discovery.index}.png`} />
                      </Tooltip>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        );
      })}
    </Box>
  );
};

export default LoreBosses;

