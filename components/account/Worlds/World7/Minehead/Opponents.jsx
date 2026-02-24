import React from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';
import { research as researchData } from '@website-data';

// researchData[10] = space-separated list of 32 MineheadIDs for opponent sprites
const mineheadIDs = (researchData?.[10] ?? '').split(' ');

const Opponents = ({ opponents, opponentsBeat }) => {
  if (!opponents || opponents.length === 0) {
    return (
      <Box>
        <Typography variant="body2" color="text.secondary">No opponent data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
      {opponents.map((opponent) => {
        const { index, name, ordinal, title, maxHP, minesCount, bonusDescription, beaten } = opponent;
        const spriteID = mineheadIDs[index] ?? index;

        return (
          <Card
            key={index}
            variant={'outlined'}
            sx={{ opacity: beaten ? 1 : 0.6 }}
          >
            <CardContent>
              <Stack gap={1.5}>
                <Stack direction={'row'} gap={1.5} alignItems={'center'}>
                  <img
                    src={`${prefix}data/MineH${spriteID}.png`}
                    alt={name}
                    style={{ width: 48, height: 48, imageRendering: 'pixelated' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <Stack flex={1}>
                    <Typography variant="subtitle1" fontWeight={500}>
                      {cleanUnderscore(name)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {title}, {ordinal} opponent
                    </Typography>
                    <Typography variant="caption" color={beaten ? 'success.main' : 'text.disabled'}>
                      {beaten ? 'Beaten' : 'Not beaten'}
                    </Typography>
                  </Stack>
                </Stack>

                <Stack direction={'row'} gap={3}>
                  <Stack>
                    <Typography variant="caption" color="text.secondary">Max HP</Typography>
                    <Typography variant="body2">{notateNumber(maxHP, 'Big')}</Typography>
                  </Stack>
                  <Stack>
                    <Typography variant="caption" color="text.secondary">Depth Charges</Typography>
                    <Typography variant="body2">{minesCount}</Typography>
                  </Stack>
                </Stack>

                {beaten && bonusDescription && (
                  <Stack>
                    <Typography variant="caption" color="text.secondary">Reward</Typography>
                    <Typography variant="body2">{bonusDescription}</Typography>
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
};

export default Opponents;
