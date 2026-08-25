import React from 'react';
import InfoBox from './InfoBox';
import CoinDisplay from '@components/common/CoinDisplay';
import { cleanUnderscore, getCoinsArray } from '@utility/helpers';

// idleon.wiki's Stamp Info and Other Info boxes, minus the calculator: its numbers need a stamp
// level, which a page with no save does not have.
//
// The sell price is stored in the game's smallest coin, so 6000 reads as 60 silver. getCoinsArray
// splits it into denominations the way every other coin figure on the site is shown, and the zero
// denominations are dropped so a stamp worth 60 silver does not also print "0 copper".
const StampInfo = ({ node }) => {
  const { stamp } = node;
  if (!stamp) return null;

  const rows = [];
  if (stamp.category) rows.push({ label: 'Type', value: stamp.category });
  if (stamp.number) rows.push({ label: 'Number', value: stamp.number });
  if (node.description) rows.push({ label: 'Bonus', value: cleanUnderscore(node.description) });

  // No Material row: it is an edge now, so the panel prints it as its own linked section directly
  // above this box, and repeating it here was the same word and the same link twice.

  const coins = node.sellPrice ? getCoinsArray(node.sellPrice).filter(([, quantity]) => quantity > 0) : [];

  return <InfoBox groups={[
    { title: 'Stamp Info', rows },
    {
      title: 'Other Info',
      rows: coins.length > 0
        ? [{ label: 'Sell Price', value: <CoinDisplay title={''} variant={'horizontal'} centered={false} money={coins}/> }]
        : []
    }
  ]}/>;
};

export default StampInfo;
