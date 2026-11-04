import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatStarSignBonus } from 'utility/helpers';

const PlayerStarSigns = ({ signs }) => {
  const sortedSigns = signs?.toSorted((a, b) => a?.starName.localeCompare(b?.starName, 'en'))
  return <Stack sx={{ width: { xs: '100%', sm: 340 } }}>
    <Typography variant={'sectionTitle'} component={'h2'}>Star Signs</Typography>
    <Stack gap={1}>
      {sortedSigns?.map(({ starName, bonuses }, index) => {
        const hasChipBoost = bonuses?.some(({ chipBoost }) => chipBoost > 1);
        return starName !== 'None' ? <Card key={starName + index}>
            <CardContent>
              <Typography fontWeight={'bold'} variant={'body1'}>{cleanUnderscore(starName)}</Typography>
              {/* Each of the game's lines on its own: a comma between them broke a sentence that runs over two */}
              {bonuses?.map(({ rawName, bonus }, lineIndex) => <Typography key={lineIndex} color={hasChipBoost ? 'text.info' : ''}>
                {cleanUnderscore(formatStarSignBonus(rawName, bonus))}
              </Typography>)}
            </CardContent>
          </Card>
          : null;
      })}
    </Stack>
  </Stack>
};

export default PlayerStarSigns;
