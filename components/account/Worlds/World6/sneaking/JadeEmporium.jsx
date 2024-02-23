import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';

const JadeEmporium = ({ upgrades }) => {
  return <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
    {upgrades?.map(({ name, description, unlocked, cost, x3 }, index) => {
      return <Card key={name + index}
                   sx={{
                     width: 340,
                     border: unlocked ? '1px solid' : '',
                     borderColor: unlocked ? 'success.main' : '',
                   }}>
        <CardContent>
          <Stack direction={'row'} gap={1} alignItems={'center'}>
            <img width={64}  src={`${prefix}data/NjJupg${x3}.png`} alt={'jade_coin'}/>
            <Typography variant={'subtitle1'}>{cleanUnderscore(name)}</Typography>
          </Stack>
          <Typography mt={1} variant={'body1'}>{cleanUnderscore(description)}</Typography>
          <Stack direction={'row'} alignItems={'center'} gap={1} mt={1}>
            <img width={19} height={19} src={`${prefix}etc/jade_coin.png`} alt={'jade_coin'}/>
            {notateNumber(cost, 'Big')}
          </Stack>
        </CardContent>
      </Card>
    })}
  </Stack>
};

export default JadeEmporium;
