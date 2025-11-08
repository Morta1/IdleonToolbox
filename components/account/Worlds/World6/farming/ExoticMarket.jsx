import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber } from '@utility/helpers';

const Market = ({ market, crop }) => {

  const currentRotation = market?.filter(u => u.isAvailableThisWeek);
  const offRotation = market?.filter(u => !u.isAvailableThisWeek);

  const renderCards = (list) =>
    list?.map((
      {
        name,
        level,
        maxLvl = 0,
        bonus,
        value,
        displayText
      },
      marketIndex
    ) => (
      <Card sx={{ width: 250 }} key={'upgrade' + marketIndex}>
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Stack direction={'row'} gap={2} alignItems={'center'}>
            <Typography>{cleanUnderscore(name.toLowerCase().capitalizeAll())}</Typography>
            <Typography variant="caption">{level} / {maxLvl}</Typography>
          </Stack>

          <Typography mt={2}>
            {cleanUnderscore(displayText)}
          </Typography>
        </CardContent>
      </Card>
    ));

  return (
    <Stack gap={4}>
      {/* Current Rotation */}
      <Stack>
        <Typography sx={{ mb: 3 }} variant="h6">Current Rotation</Typography>
        <Stack direction="row" flexWrap="wrap" gap={2}>
          {renderCards(currentRotation)}
        </Stack>
      </Stack>

      {/* Off Rotation */}
      <Stack>
        <Typography sx={{ mb: 3 }} variant="h6">Off Rotation</Typography>
        <Stack direction="row" flexWrap="wrap" gap={2}>
          {renderCards(offRotation)}
        </Stack>
      </Stack>
    </Stack>
  );
};

export default Market;
