import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { cleanUnderscore } from '@utility/helpers';
import { getShapeColor, hasShape } from './researchGridShared';

const CARD_WIDTH = 240;
const CARD_MIN_HEIGHT = 160;

const cardListSx = {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 1.5,
  justifyContent: 'flex-start',
};

/** Card view: flex row of cards for relevant squares only (has level or under a shape). */
const CardView = ({ squares }) => {
  const relevantSquares = (squares ?? [])
    .map((sq, i) => ({ sq, i }))
    .filter(({ sq }) => sq && ((sq?.level ?? 0) >= 1 || hasShape(sq)));

  return (
    <Box sx={cardListSx}>
      {relevantSquares.map(({ sq, i }) => {
        const level = sq?.level ?? 0;
        const maxLv = Math.max(1, sq?.maxLv ?? 1);
        const shapeColor = hasShape(sq) ? getShapeColor(sq.placementShapeIndex) : null;
        const multi =
          hasShape(sq) && sq?.shapeAffectMultiplier != null
            ? `×${Number(sq.shapeAffectMultiplier).toFixed(2)}`
            : null;

        return (
          <Card
            key={i}
            variant="outlined"
            sx={{
              ...(shapeColor && { borderWidth: 2, borderColor: shapeColor.border }),
              width: CARD_WIDTH,
              minHeight: CARD_MIN_HEIGHT,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CardContent
              sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column', '&:last-child': { pb: 1.5 } }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {cleanUnderscore(sq?.name || `Square ${i}`)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25 }}>
                Lv {level} / {maxLv}
              </Typography>
              {sq?.description && (
                <Typography variant="body2" sx={{ mt: 0.75 }}>
                  {cleanUnderscore(sq.description)}
                </Typography>
              )}
              {multi && (
                <Typography variant="caption" color="primary.main" sx={{ mt: 0.5, fontWeight: 500 }}>
                  Multi {multi}
                </Typography>
              )}
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
};

export default CardView;
