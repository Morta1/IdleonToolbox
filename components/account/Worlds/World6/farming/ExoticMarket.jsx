import { Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, prefix } from '@utility/helpers';
import React from 'react';
import Tooltip from '@components/Tooltip';
import { IconInfoCircleFilled } from '@tabler/icons-react';

const Market = ({ market, crop }) => {

  const currentRotation = market?.filter(u => u.isAvailableThisWeek);
  const offRotation = market?.filter(u => !u.isAvailableThisWeek);

  const renderCards = (list) =>
    list?.map((
      {
        name,
        level,
        value,
        maxValue,
        percentOfCap,
        isCapped,
        displayText,
        x2
      },
      marketIndex
    ) => (
      <Card sx={{ width: 250 }} key={'upgrade' + marketIndex}>
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Stack direction={'row'} gap={2} alignItems={'center'} flexWrap="wrap">
            <img src={`${prefix}data/FarmCrop${x2}.png`} alt="" width={24} height={24}/>
            <Typography>{cleanUnderscore(name.toLowerCase().capitalizeAll())}</Typography>
            <Typography variant="caption">Lv. {level}</Typography>
          </Stack>

          {isCapped ? (
            <>
              <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 1 }}>
                <Typography variant="body2">
                  Effect: {Math.round(value * 100) / 100} / {maxValue} ({percentOfCap != null ? Math.round(percentOfCap * 10) / 10 : 0}%)
                </Typography>
                <Tooltip
                  title={`${Math.round(value * 100) / 100} is ${percentOfCap != null ? Math.round(percentOfCap * 10) / 10 : 0}% of possible hard cap effect of ${maxValue}`}
                >
                  <IconInfoCircleFilled size={16} style={{ cursor: 'pointer', flexShrink: 0 }} />
                </Tooltip>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, percentOfCap ?? 0)}
                sx={{ mt: 1, mb: 1 }}
              />
            </>
          ) : (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Effect: {Math.round(value * 100) / 100} (no cap; scales with level)
            </Typography>
          )}

          <Typography mt={isCapped ? 1 : 2}>
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
