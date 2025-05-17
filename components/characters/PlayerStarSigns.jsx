import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore } from 'utility/helpers';

const PlayerStarSigns = ({ signs }) => {
  const sortedSigns = signs?.toSorted((a, b) => a?.starName.localeCompare(b?.starName, 'en'))
  return <Stack>
    <Typography variant={'h5'}>Star Signs</Typography>
    <Stack gap={1}>
      {sortedSigns?.map(({ starName, bonuses }, index) => {
        const hasChipBoost = bonuses?.some(({ chipBoost }) => chipBoost > 1);
        return starName !== 'None' ? <Card key={starName + index}>
            <CardContent>
              <Typography fontWeight={'bold'} variant={'body1'}>{cleanUnderscore(starName)}</Typography>
              <Typography color={hasChipBoost ? 'info.light' : ''}>{bonuses?.map(({
                                                                                    rawName,
                                                                                    bonus
                                                                                  }, index) => `${cleanUnderscore(rawName?.replace('{', bonus))}${bonuses.length - 1 === index
                ? ''
                : ', '}`)}</Typography>
            </CardContent>
          </Card>
          : null;
      })}
    </Stack>
  </Stack>
};

export default PlayerStarSigns;
