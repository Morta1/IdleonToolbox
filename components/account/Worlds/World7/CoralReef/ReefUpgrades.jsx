import React from 'react';
import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';


const reefImageMap = ['z', 'A', 'B', 'C', 'D', 'E'];

const ReefUpgrades = ({ reefUpgrades }) => {
  if (!reefUpgrades || reefUpgrades.length === 0) {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 2 }}>Reef Upgrades</Typography>
        <Typography variant="body2" color="text.secondary">No reef upgrades available</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
        {reefUpgrades.map((reef, index) => {
          const imageName = reefImageMap[index] || 'A';
          return (
            <Card key={index} variant={'outlined'} sx={{ opacity: reef.level > 0 ? 1 : 0.6, height: '100%' }}>
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack direction={'row'} gap={1.5} alignItems={'center'}>
                    <img
                      src={`${prefix}data/Reef${imageName}1.png`}
                      alt={cleanUnderscore(reef.name)}
                      style={{ width: 40, height: 40 }}
                    />
                    <Stack flex={1}>
                      <Typography variant="subtitle1" >
                        {cleanUnderscore(reef.description)}
                      </Typography>
                    </Stack>
                  </Stack>

                  <Divider sx={{ my: 0.5 }} />

                  <Stack spacing={1}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                      <Typography variant="body2" color="text.secondary" component="span">
                        Level:
                      </Typography>
                      <Typography
                        variant="body2"
                        component="span"
                      >
                        {reef.level || 0} / {reef.x1 || 0}
                      </Typography>
                    </Stack>
                  </Stack>

                  {reef.cost !== undefined && (
                    <>
                      <Divider sx={{ my: 0.5 }} />
                      <Stack spacing={0.75}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                          <Typography variant="body2" color="text.secondary" component="span">
                            Cost:
                          </Typography>
                          {reef?.level < reef?.x1 ? <Typography variant="body2" component="span">
                            {notateNumber(reef.cost, "Big")}
                          </Typography> : <Typography variant="body2" component="span">
                            Maxed
                          </Typography>}
                        </Stack>
                      </Stack>
                    </>
                  )}
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
};

export default ReefUpgrades;

