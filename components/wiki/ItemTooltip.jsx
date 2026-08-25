import React from 'react';
import ItemDisplay from '@components/common/ItemDisplay';

// The same tooltip the rest of the site gives an item, built from the node: itemNodes flattened
// the stats off the item and merged its description at build time, which is what ItemDisplay reads.
// It stays light because ItemDisplay takes getGoldenFoodBonus injected rather than imported.
//
// Only for art ItemDisplay can find: it builds its own src from the rawName, so a node whose icon
// is not the standard path (Coins5 for COIN) or was nulled by the build would show it broken.
export const itemTooltip = (node) => {
  if (node?.kind !== 'item' || node.icon !== `/data/${node.rawName}.png`) return null;
  return <ItemDisplay
    {...(node.stats || {})}
    Type={node.category}
    rawName={node.rawName}
    displayName={node.name}
    description={node.description}
  />;
};
