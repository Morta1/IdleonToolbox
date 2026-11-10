import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import HiddenCapLine from '@components/common/HiddenCapLine';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import { getShapeColor, gridLabelIcon, hasShape } from './researchGridShared';

// A shape's color stays the game's mark beside its words
const shapeMark = (shapeIndex) => <Stack component={'span'} direction={'row'} alignItems={'center'} gap={0.5}>
  <Box component={'span'} sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: (theme) => getShapeColor(theme, shapeIndex).line }}/>
  <Typography variant={'body2'} color={'text.secondary'} component={'span'}>{`Shape ${shapeIndex + 1}`}</Typography>
</Stack>;

/** Card view: one card per square, the unlevelled ones dimmed. A shape's multi shows with the Details pill: the
 * description's bonus already counts it. */
const CardView = ({ squares, details }) => <CardGrid size={'s'} details={details}>
  {squares?.map((square) => {
    const name = cleanUnderscore(square?.name);
    const shaped = hasShape(square);
    return <ItemCard key={square?.index} icon={gridLabelIcon(square?.index)} title={name}
                     level={{ value: square?.level ?? 0, max: Math.max(1, square?.maxLv ?? 1) }}
                     dimmed={!((square?.level ?? 0) >= 1)} aside={shaped ? shapeMark(square.placementShapeIndex) : null}
                     more={shaped && square?.shapeAffectMultiplier != null
                       ? <ItemCard.Facts rows={[['Shape multi', formatNum(Number(square.shapeAffectMultiplier), 'mult')]]}/>
                       : null}>
      {square?.description ? <ItemCard.Desc text={square.description}/> : null}
      <HiddenCapLine system={'grid'} index={square?.index} name={name}/>
    </ItemCard>;
  })}
</CardGrid>;

export default CardView;
