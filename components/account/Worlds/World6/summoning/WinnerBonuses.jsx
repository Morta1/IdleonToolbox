import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber } from '@utility/helpers';

const rawBonusIds = [4, 9, 11, 12, 18, 19, 20, 21, 22, 23, 24, 25, 27, 28, 29, 30];
const WinnerBonuses = ({ winnerBonuses }) => {
  return <>
    <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
      {winnerBonuses?.map(({ rawName, name, bonus, bonusId, x3, unlocked, value }, index) => {
        bonus = rawBonusIds.includes(bonusId)
          ? bonus.replace('{', notateNumber(value, 'Big'))
          : bonus.replace('<', notateNumber(1 + value / 100, 'MultiplierInfo'));
        return <Card sx={{
          width: 250,
          opacity: value ? 1 : .5
        }} key={'winner-' + index}>
          <CardContent>
            <Stack direction={'row'} gap={1}>
              <Stack>
                <Typography>{cleanUnderscore(name)}</Typography>
                <Typography>{cleanUnderscore(bonus)}</Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default WinnerBonuses;
