import React from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';
import ProgressBar from '@components/common/ProgressBar';

// Firefrost grants charm levels, every other gemstone grants a percentage.
const isFlatBonus = (index) => index === 7;

const formatBonus = (value, index) => {
  const rounded = value >= 1e3 ? notateNumber(value, 'Big') : `${Math.round(value * 100) / 100}`;
  return isFlatBonus(index) ? `+${rounded}` : `${rounded}%`;
};

const Gemstones = ({ gemStones }) => {
  if (!gemStones?.length) return <Typography>No gemstones available</Typography>;

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
      {gemStones.map(({
                        rawName,
                        name,
                        description,
                        baseValue,
                        displayBonus,
                        displayMaxBonus,
                        saturationPct,
                        unlocked
                      }, index) => (
        <Stack key={'gemstone-' + index} sx={{ opacity: unlocked || baseValue > 0 ? 1 : 0.5 }}>
          <Stack direction={'row'} gap={1} alignItems={'center'} mb={1}>
            <img style={{ objectFit: 'contain', width: 32, height: 32 }} src={`${prefix}data/${rawName}.png`} alt={rawName}/>
            <Typography variant={'h6'}>{name}</Typography>
          </Stack>
          <Card variant={'outlined'} sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction={'row'} alignItems={'center'} gap={1} flexWrap={'wrap'}>
                <Typography variant={'subtitle1'}>{cleanUnderscore(description)}</Typography>
                <Typography variant={'subtitle2'} color={'text.secondary'}>
                  {notateNumber(baseValue, 'Big')} Gems
                </Typography>
              </Stack>
              <ProgressBar
                percent={saturationPct || 0}
                tooltipTitle={`${formatBonus(displayBonus || 0, index)} / ${formatBonus(displayMaxBonus || 0, index)} cap`}
              />
            </CardContent>
          </Card>
        </Stack>
      ))}
    </Box>
  );
};

export default Gemstones;
