import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, getBitIndex, notateNumber, prefix } from '@utility/helpers';

const Superbits = ({ superbits }) => {
  return <>
    <Stack gap={1} direction={'row'} flexWrap={'wrap'}>
      {superbits?.map(({ name, description, unlocked, bonus, totalBonus, additionalInfo, cost }, index) => {
        return <Card key={name + `${index}`} sx={{
          width: 300,
          border: unlocked ? '1px solid #81c784' : '',
          opacity: !unlocked ? 0.5 : 1,
        }}>
          <CardContent>
            <Typography>{cleanUnderscore(name.capitalize())}</Typography>
            <Typography
              sx={{ mt: 2 }}>{cleanUnderscore(description?.replace('}', bonus)?.replace('{', notateNumber(totalBonus)))}</Typography>
            <Stack my={2} direction={'row'} alignItems={'center'} gap={1}>
              <img src={`${prefix}etc/Bits_${getBitIndex(cost)}.png`} alt={''}/>
              <Typography>{notateNumber(cost, 'bits')}</Typography>
            </Stack>
            {additionalInfo ? <Typography sx={{ mt: 2 }}>{cleanUnderscore(additionalInfo)}</Typography> : null}
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default Superbits;
