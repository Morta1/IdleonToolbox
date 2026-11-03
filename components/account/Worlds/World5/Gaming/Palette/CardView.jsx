import StatusText from '@components/common/StatusText';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import React from 'react';
import BlackStars, { BlackStarPreviews } from './BlackStars';
import HiddenCapLine from '@components/common/HiddenCapLine';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

// The game's own print of a colour's odds: commas up to 999,999, Big past it (the amount kind's switch)
export const paletteOdds = (chance) => `1 in ${formatNum(1 / chance)}`;

export const colourName = (item) => cleanUnderscore(item?.name || `Palette ${(item?.index ?? 0) + 1}`);

const CardView = ({ colours, fastestIndices, blackStarsOwned }) => <CardGrid size={'m'}>
  {colours?.map((item) => {
    const { description, bonus, level, chance, active, blackStars, blackStarMulti, blackStarPreviews } = item;
    const hasBonus = bonus !== undefined && bonus !== null && bonus !== 0;
    return <ItemCard key={item.index} title={colourName(item)}
                     level={level !== undefined ? { value: level } : undefined}
                     status={active ? 'active' : undefined} dimmed={!hasBonus}
                     aside={fastestIndices.has(item.index) ? <StatusText status={'best'}>Fastest to level</StatusText> : null}>
      <ItemCard.Facts rows={[
        chance > 0 && chance < Infinity ? ['Chance', paletteOdds(chance)] : null,
        blackStars > 0 ? [<BlackStars key={'stars'} count={blackStars}/>, formatNum(blackStarMulti ?? 1, 'mult')] : null
      ]}/>
      {description ? <ItemCard.Desc text={description}/> : null}
      <HiddenCapLine system={'palette'} index={item.index} name={colourName(item)}/>
      <BlackStarPreviews description={description} previews={blackStarPreviews} owned={blackStarsOwned}/>
    </ItemCard>;
  })}
</CardGrid>;

export default CardView;
