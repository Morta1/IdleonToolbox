import { Card, CardContent, Stack, Typography } from '@mui/material';
import StatusText from '@components/common/StatusText';
import { cleanUnderscore, notateNumber, commaNotation } from '@utility/helpers';
import React from 'react';
import BlackStars, { BlackStarPreviews } from './BlackStars';
import HiddenCapLine from '@components/common/HiddenCapLine';


const CardView = ({ filteredPalette, fastestIndices, blackStarsOwned }) => {
  return (
    <Stack gap={2} direction={'row'} flexWrap={'wrap'} sx={{ maxWidth: 300 * 7 }}>
      {filteredPalette?.map((item, index) => {
        // Skip if item is not an object (the final bonus is a number)
        if (typeof item !== 'object' || !item) return null;

        const { name, description, bonus, level, chance, active, blackStars, blackStarMulti, blackStarPreviews } = item;
        const hasBonus = bonus !== undefined && bonus !== null && bonus !== 0;
        const isTop3 = fastestIndices.has(item.index);
        const chanceValue = 1 / chance;
        const formattedChance = chanceValue > 999999 ? notateNumber(chanceValue, 'Big') : commaNotation(chanceValue);

        return (
          <Card
            key={`palette-${index}`}
            sx={{
              width: 300,
              border: hasBonus ? '1px solid' : '',
              borderColor: hasBonus ? 'success.main' : '',
              opacity: !hasBonus ? 0.5 : 1
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" gap={1} mb={1} flexWrap="wrap">
                <Typography variant={'body1'} sx={{ fontWeight: 'bold' }}>
                  {cleanUnderscore(name || `Palette ${index + 1}`)}
                </Typography>
                {active ? <StatusText status={'selected'}>Active</StatusText> : null}
                {isTop3 ? <StatusText status={'best'}>Fastest to level</StatusText> : null}
              </Stack>
              {level !== undefined && (
                <Typography variant={'body2'} sx={{ mb: 1, color: 'text.secondary' }}>
                  Level: {notateNumber(level)}
                </Typography>
              )}
              {blackStars > 0 ? (
                <Stack direction={'row'} alignItems={'center'} gap={1} sx={{ mb: 1 }}>
                  <BlackStars count={blackStars} size={18}/>
                  <Typography variant={'body2'} sx={{ color: 'text.secondary' }}>
                    {notateNumber(blackStarMulti ?? 1, 'MultiplierInfo')}x bonus
                  </Typography>
                </Stack>
              ) : null}
              {chance !== undefined && chance > 0 && (
                <Typography variant={'body2'} sx={{ mb: 1, color: 'text.secondary' }}>
                  Chance: 1 in {formattedChance}
                </Typography>
              )}
              {description && (
                <Typography variant={'body2'} sx={{ mb: 1 }}>
                  {cleanUnderscore(description)}
                </Typography>
              )}
              <HiddenCapLine system={'palette'} index={item.index} sx={{ mb: 1 }}/>
              <BlackStarPreviews description={description} previews={blackStarPreviews} owned={blackStarsOwned}/>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
};

export default CardView;

