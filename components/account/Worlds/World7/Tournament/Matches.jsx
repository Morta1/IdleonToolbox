import React from 'react';
import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { cleanUnderscore, prefix } from '@utility/helpers';

const teamPower = (pets, companions) =>
  pets.reduce((sum, idx) => sum + (companions?.[idx]?.tourPower ?? 0), 0);

const ResultChip = ({ result }) => {
  if (result === 'win') return <Chip label="Win" size="small" color="success" />;
  if (result === 'loss') return <Chip label="Loss" size="small" color="error" />;
  return <Chip label="?" size="small" />;
};

const PetGrid = ({ label, pets, companions, totalPower }) => (
  <Stack gap={0.5}>
    <Stack direction="row" gap={1} alignItems="baseline">
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      {totalPower > 0 && (
        <Stack direction="row" alignItems="center" gap={0.5}>
          <img width={14} height={14} style={{ objectFit: 'contain' }} src={`${prefix}etc/Companion_Power.png`} alt={''} />
          <Typography variant="caption" color="primary.main">{totalPower}</Typography>
        </Stack>
      )}
    </Stack>
    <Stack direction="row" gap={0.75} flexWrap="wrap">
      {pets.map((petIdx, i) => {
        const comp = companions?.[petIdx];
        if (!comp) return null;
        return (
          <Stack key={i} alignItems="center" gap={0} sx={{ width: 36 }}>
            <Box title={cleanUnderscore(comp.name)}>
              <img
                width={32}
                height={32}
                style={{ objectFit: 'contain' }}
                src={`${prefix}afk_targets/${comp.name}.png`}
                alt={comp.name}
              />
            </Box>
            {(comp.tourPower ?? 0) > 0 && (
              <Stack direction="row" alignItems="center" gap={0.25}>
                <img width={10} height={10} style={{ objectFit: 'contain' }} src={`${prefix}etc/Companion_Power.png`} alt={''} />
                <Typography variant="caption" sx={{ fontSize: 9, lineHeight: 1, color: 'text.secondary' }}>
                  {comp.tourPower}
                </Typography>
              </Stack>
            )}
          </Stack>
        );
      })}
    </Stack>
  </Stack>
);

const Matches = ({ tournament, companions }) => {
  const { matches = [] } = tournament ?? {};
  const companionList = companions ?? [];

  if (!matches.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No match history available. Match data is loaded from the server when you are signed in.
      </Typography>
    );
  }

  return (
    <Stack gap={2}>
      <Typography variant="body2" color="text.secondary">
        {matches.length} match{matches.length !== 1 ? 'es' : ''} recorded this tournament day.
      </Typography>
      <Stack gap={2}>
        {matches.map((match, idx) => {
          const myPower = teamPower(match.playerPets, companionList);
          const oppPower = teamPower(match.opponentPets, companionList);
          return (
            <Card key={idx}>
              <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
                <Stack gap={1.5}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                    <Typography variant="body1" fontWeight="bold">
                      vs {match.opponentName}
                    </Typography>
                    <Stack direction="row" gap={1} alignItems="center">
                      <ResultChip result={match.result} />
                      <Typography variant="caption" color="text.secondary">
                        ❤ {match.playerLives}
                      </Typography>
                    </Stack>
                  </Stack>
                  <PetGrid label="Your team" pets={match.playerPets} companions={companionList} totalPower={myPower} />
                  <PetGrid label="Opponent's team" pets={match.opponentPets} companions={companionList} totalPower={oppPower} />
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Stack>
  );
};

export default Matches;
