import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore } from '@utility/helpers';

const Mastery = ({ masteryBonuses, masteryLevel }) => {
  return (
    (<Stack direction={'row'} flexWrap={'wrap'} gap={2}>
      {masteryBonuses?.map(({ description, bonus }, index) => {
        const unlocked = masteryLevel >= index + 1;
        return <Card sx={{
          width: 250,
          border: unlocked ? '1px solid' : '',
          borderColor: unlocked ? 'success.main' : ''
        }} key={'mastery-' + index}>
          <CardContent>
            <Stack gap={1}>
              <Typography>{cleanUnderscore(description)}{cleanUnderscore(bonus)}</Typography>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>)
  );
};

export default Mastery;
