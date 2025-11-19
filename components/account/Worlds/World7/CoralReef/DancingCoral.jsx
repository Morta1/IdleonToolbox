import React from 'react';
import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';

const DancingCoral = ({ dancingCoral }) => {
  if (!dancingCoral || dancingCoral.length === 0) {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 2 }}>Dancing Coral</Typography>
        <Typography variant="body2" color="text.secondary">No dancing coral available</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
        {dancingCoral.map((coral, index) => (
          <Card key={index} variant={'outlined'} sx={{ opacity: coral.level > 0 ? 1 : 0.6, height: '100%' }}>
            <CardContent>
              <Stack spacing={1.5}>
                {/* Header Section */}
                <Stack spacing={0.5}>
                  {coral.coralName && (
                    <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
                      {cleanUnderscore(coral.coralName)}
                    </Typography>
                  )}
                  {coral.description && (
                    <Typography variant="body2" sx={{ opacity: 0.85, mb: 0.5 }}>
                      {cleanUnderscore(coral.description)}
                    </Typography>
                  )}
                  {<Typography variant="body2" sx={{ opacity: 0.85 }}>
                    +100 levels to {cleanUnderscore(coral.tower.name)}
                  </Typography>}
                </Stack>

                {/* Divider */}
                <Divider sx={{ my: 0.5 }} />

                {/* Stats Section */}
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                    <Typography variant="body2" color="text.secondary" component="span">
                      Level:
                    </Typography>
                    <Typography
                      variant="body2"

                      component="span"
                    >
                      {coral.level || 0}
                    </Typography>
                  </Stack>

                  {coral.dropResource && (
                    <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                      <Typography variant="body2" color="text.secondary" component="span">
                        Source:
                      </Typography>
                      <Typography variant="body2" component="span">
                        {cleanUnderscore(coral.dropResource)}
                      </Typography>
                    </Stack>
                  )}
                </Stack>

                {/* Cost and Bonus Section */}
                {(coral.cost !== undefined || (coral.bonus !== undefined && coral.bonus > 0)) && (
                  <>
                    <Divider sx={{ my: 0.5 }} />
                    <Stack spacing={0.75}>
                      {coral.cost !== undefined && (
                        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                          <Typography variant="body2" color="text.secondary" component="span">
                            Cost:
                          </Typography>
                          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                            <img
                              onError={(e) => {
                                e.target.src = `${prefix}data/Coral0.png`;
                              }}
                              src={`${prefix}data/Coral${index}.png`}
                              alt={cleanUnderscore(coral.coralName)}
                              style={{ width: 20, height: 20 }} />
                            <Typography variant="body2" component="span">
                              {notateNumber(coral.cost, "Big")}
                            </Typography>
                          </Stack>
                        </Stack>
                      )}
                      {coral.bonus !== undefined && coral.bonus > 0 && (
                        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                          <Typography variant="body2" color="text.secondary" component="span">
                            Bonus:
                          </Typography>
                          <Typography variant="body2" color="primary.main" component="span">
                            {notateNumber(coral.bonus, "Big")}
                          </Typography>
                        </Stack>
                      )}
                    </Stack>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default DancingCoral;

