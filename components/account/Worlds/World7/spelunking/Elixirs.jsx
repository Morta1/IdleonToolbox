import React from 'react';
import { Badge, Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';
import { CardTitleAndValue } from '@components/common/styles';

const Elixirs = ({ elixirs, ownedElixirs, ownedSlots, maxElixirDuplicates }) => {
  if (!elixirs || !Array.isArray(elixirs)) {
    return <div>No elixirs available</div>;
  }

  return (
    <>
      <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
        <CardTitleAndValue title={'Elixirs'} value={`${ownedElixirs} / 12`} />
        <CardTitleAndValue title={'Slots'} value={`${ownedSlots} / 5`} />
        <CardTitleAndValue title={'Duplicates'} value={`${maxElixirDuplicates} / 4`} />
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {elixirs.map((elixir, index) => {
          if (!elixir) {
            return null;
          }

          const card = (
            <Card 
              variant={'outlined'}
              sx={{
                borderColor: elixir.isInUse ? 'success.light' : undefined,
                borderWidth: elixir.isInUse ? 2 : undefined,
                borderStyle: elixir.isInUse ? 'solid' : undefined
              }}
            >
              <CardContent>
                <Stack direction={'row'} gap={1} alignItems={'center'} sx={{ opacity: elixir.acquired ? 1 : 0.5 }}>
                  <img src={`${prefix}data/CaveElix${index}.png`} alt={`elixir-${index}`} style={{ width: 40, height: 40, flexShrink: 0 }} />
                  <Stack flex={1}>
                    <Typography variant="subtitle1">{cleanUnderscore(elixir.description).replace(/{/, elixir.bonus)}</Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          );

          return (
            <Box key={index} sx={{ display: 'contents' }}>
              {elixir.timesUsed > 1 ? (
                <Badge 
                  badgeContent={elixir.timesUsed} 
                  color="success"
                  anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                >
                  {card}
                </Badge>
              ) : (
                card
              )}
            </Box>
          );
        })}
      </Box>
    </>
  );
};

export default Elixirs;

