import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, getBitIndex, notateNumber, prefix } from '@utility/helpers';

const Superbits = ({ superbits }) => {
  const superBits = superbits?.filter(item => !item.isDuper) || [];
  const duperBits = superbits?.filter(item => item.isDuper) || [];

  const renderBits = (bits) => {
    return bits.map(({ name, description, unlocked, bonus, totalBonus, additionalInfo, cost, originalIndex }, index) => {
      return <Card key={name + `${index}`} sx={{
        width: 300,
        border: unlocked ? '1px solid #81c784' : '',
        opacity: !unlocked ? 0.5 : 1
      }}>
        <CardContent>
          <Typography>{cleanUnderscore(name.capitalize())}</Typography>
          <Typography
            sx={{ mt: 2 }}>{cleanUnderscore(description?.replace('}', bonus)?.replace('{', notateNumber(totalBonus, 'MultiplierInfo').replace('.00', '')))}</Typography>
          <Stack my={2} direction={'row'} alignItems={'center'} gap={1}>
            <img src={`${prefix}etc/Bits_${getBitIndex(cost)}.png`} alt={''} />
            <Typography>{notateNumber(cost, 'bits')}</Typography>
          </Stack>
          {additionalInfo ? <Typography sx={{ mt: 2 }}>{cleanUnderscore(additionalInfo)}</Typography> : null}
        </CardContent>
      </Card>
    });
  };

  return <>
    {superBits.length > 0 && (
      <Stack gap={2} sx={{ mb: 4 }}>
        <Typography variant="h6">Super Bits</Typography>
        <Stack gap={1} direction={'row'} flexWrap={'wrap'} sx={{ maxWidth: 300 * 7 }}>
          {renderBits(superBits)}
        </Stack>
      </Stack>
    )}
    {duperBits.length > 0 && (
      <Stack gap={2}>
        <Typography variant="h6">Duper Bits</Typography>
        <Stack gap={1} direction={'row'} flexWrap={'wrap'} sx={{ maxWidth: 300 * 7 }}>
          {renderBits(duperBits)}
        </Stack>
      </Stack>
    )}
  </>
};

export default Superbits;
