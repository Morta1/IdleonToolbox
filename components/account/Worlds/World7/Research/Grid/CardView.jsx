import React from 'react';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import HiddenCapLine from '@components/common/HiddenCapLine';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import { gridLabelIcon, hasShape } from './researchGridShared';

/** Card view: one card per square, the unlevelled ones dimmed. A shape's multi is already in the description's bonus. */
const CardView = ({ squares }) => <CardGrid size={'s'}>
  {squares?.map((square) => {
    const name = cleanUnderscore(square?.name);
    const shaped = hasShape(square);
    return <ItemCard key={square?.index} icon={gridLabelIcon(square?.index)} title={name}
                     level={{ value: square?.level ?? 0, max: Math.max(1, square?.maxLv ?? 1) }}
                     dimmed={!((square?.level ?? 0) >= 1)}>
      {square?.description ? <ItemCard.Desc text={square.description}/> : null}
      {shaped && square?.shapeAffectMultiplier != null
        ? <ItemCard.Facts rows={[['Shape multi', formatNum(Number(square.shapeAffectMultiplier), 'mult')]]}/>
        : null}
      <HiddenCapLine system={'grid'} index={square?.index} name={name}/>
    </ItemCard>;
  })}
</CardGrid>;

export default CardView;
