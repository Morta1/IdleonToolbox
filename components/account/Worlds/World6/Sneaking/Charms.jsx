import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';

const Charms = ({ charms }) => {
  return (
    (<Stack direction={'row'} flexWrap={'wrap'} gap={2}>
      {charms?.map(({ rawName, name, bonus, x3, unlocked, value }, index) => {
        bonus = bonus.replace(/}/, notateNumber(value, 'MultiplierInfo'));
        bonus = bonus.replace(/{/, value);
        return <Card sx={{
          width: 250,
          border: unlocked ? '1px solid' : '',
          borderColor: unlocked ? 'success.main' : '',
        }} key={'charm-' + index}>
          <CardContent>
            <Stack direction={'row'} gap={1}>
              <img style={{ objectFit: 'contain' }} src={`${prefix}data/NjTrP${index}.png`} alt={''}/>
              <Stack>
                <Typography>{cleanUnderscore(name)}</Typography>
                <Typography>{cleanUnderscore(bonus)}</Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>)
  );
};

export default Charms;
