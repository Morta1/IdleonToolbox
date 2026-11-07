import React from 'react';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import { formatNum } from '@utility/helpers';
import { TABS, metaOf, rankText } from './format';
import { openOnPlainClick } from './MetricCard';
import { bestInSection, medianRank } from './standing';

// One tile per category tab. `ranks` is the viewed player's, or undefined: then a tile is only its name and count.
// linkPlayer: the ?player= kept in each tile's href, for a middle click or a copied link.
const CategoryTiles = ({ index, ranks, onTab, linkPlayer = null }) => {
  const tiles = TABS.map((tab) => ({ tab, keys: index.categories[tab.toLowerCase()]?.metrics ?? [] })).filter(({ keys }) => keys.length);
  if (!tiles.length) return null;
  return (
    <CardGrid size="s" role="group" aria-label="Categories">
      {tiles.map(({ tab, keys }) => {
        const median = ranks ? medianRank(keys, ranks) : null;
        const best = ranks ? bestInSection(keys, ranks) : null;
        return (
          <ItemCard key={tab} href={`?t=${tab}${linkPlayer ? `&player=${encodeURIComponent(linkPlayer)}` : ''}`} onClick={openOnPlainClick(onTab, tab)}
                    title={tab} meta={`${formatNum(keys.length, 'whole')} ${keys.length === 1 ? 'board' : 'boards'}`}>
            <ItemCard.Facts rows={[
              median != null && ['Median rank', rankText(median)],
              best && ['Best board', `${rankText(best.r)} ${metaOf(index, best.key).label}`]
            ]}/>
          </ItemCard>
        );
      })}
    </CardGrid>
  );
};

export default CategoryTiles;
