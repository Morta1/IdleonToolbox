import { Card, CardContent, Stack, Typography, Chip } from '@mui/material';
import { cleanUnderscore, notateNumber, commaNotation } from '@utility/helpers';
import React from 'react';


const CardView = ({ filteredPalette, selectedSlots }) => {  
  const itemsWithIndex = filteredPalette
    .map((item, index) => ({ item, index, chance: item?.chance || 0 }))
    .filter(({ chance }) => chance > 0 && chance < Infinity);

  const sortedByChance = [...itemsWithIndex].sort((a, b) => b.chance - a.chance);
  const topIndices = new Set(sortedByChance.slice(0, selectedSlots ?? 3).map(({ index }) => index));

  return (
    <Stack gap={2} direction={'row'} flexWrap={'wrap'} sx={{ maxWidth: 300 * 7 }}>
      {filteredPalette?.map((item, index) => {
        // Skip if item is not an object (the final bonus is a number)
        if (typeof item !== 'object' || !item) return null;

        const { name, description, bonus, level, chance, active } = item;
        const hasBonus = bonus !== undefined && bonus !== null && bonus !== 0;
        const isTop3 = topIndices.has(index);
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
                {active && (
                  <Chip
                    label="ACTIVE"
                    color="primary"
                    size="small"
                    sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}
                  />
                )}
                {isTop3 && (
                  <Chip
                    label="FASTEST TO LEVEL"
                    size="small"
                    sx={{
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      backgroundColor: '#d18d28',
                      color: '#000'
                    }}
                  />
                )}
              </Stack>
              {level !== undefined && (
                <Typography variant={'body2'} sx={{ mb: 1, color: 'text.secondary' }}>
                  Level: {notateNumber(level)}
                </Typography>
              )}
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
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
};

export default CardView;

