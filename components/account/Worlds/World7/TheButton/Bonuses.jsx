import React from 'react';
import { Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material';
import HtmlTooltip from '@components/Tooltip';
import InfoIcon from '@mui/icons-material/Info';

const Bonuses = ({ bonuses, activeBonusIndex, pressesIntoCurrentBonus }) => {
  const totalCategories = bonuses?.length ?? 9;
  const nextIndex = (activeBonusIndex + 1) % totalCategories;

  return <Stack gap={2}>
    <Typography variant="body2" color="text.secondary">
      Every 5 presses, the next bonus in the rotation gets boosted.
    </Typography>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      {bonuses?.map((bonus, idx) => {
        const isActive = idx === activeBonusIndex;
        const isNext = idx === nextIndex;

        return <Card key={idx} sx={{
          minWidth: 140,
          border: isActive ? 2 : isNext ? 1 : undefined,
          borderColor: isActive ? 'success.main' : isNext ? 'info.main' : undefined
        }}>
          <CardContent sx={{ textAlign: 'center', '&:last-child': { pb: 2 } }}>
            <Stack direction="row" alignItems="center" justifyContent="center" gap={0.5}>
              <Typography variant="body2" color={isActive ? 'success.main' : 'text.secondary'}>
                {bonus.name}
              </Typography>
              {bonus.name === 'Xtra' && (
                <HtmlTooltip title="Increase masterclass resources drop rate">
                  <InfoIcon sx={{ fontSize: 14, cursor: 'pointer' }} />
                </HtmlTooltip>
              )}
            </Stack>
            <Typography variant="h5" fontWeight="bold" sx={{ my: 0.5 }}>
              {bonus.displayValue}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              +{bonus.bonusPerPress} per press
            </Typography>
            {isActive && <>
              <LinearProgress
                variant="determinate"
                value={pressesIntoCurrentBonus / 5 * 100}
                color="success"
                sx={{ mt: 1, height: 6, borderRadius: 1 }}
              />
              <Typography variant="caption" color="success.main">
                {pressesIntoCurrentBonus}/5 presses
              </Typography>
            </>}
            {isNext && <Typography variant="caption" display="block" color="info.main" sx={{ mt: 0.5 }}>
              up next
            </Typography>}
          </CardContent>
        </Card>;
      })}
    </Stack>
  </Stack>;
};

export default Bonuses;
