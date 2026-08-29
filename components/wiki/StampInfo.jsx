import React from 'react';
import InfoBox from './InfoBox';
import CoinDisplay from '@components/common/CoinDisplay';
import { cleanUnderscore, getCoinsArray, growth } from '@utility/helpers';

// idleon.wiki's Stamp Info and Other Info boxes, minus the calculator: its numbers need a stamp
// level, which a page with no save does not have.
//
// The sell price is stored in the game's smallest coin, so 6000 reads as 60 silver. getCoinsArray
// splits it into denominations the way every other coin figure on the site is shown, and the zero
// denominations are dropped so a stamp worth 60 silver does not also print "0 copper".
// The stamp's effect is a template with a `{` where its number goes, and what fills it is the
// bonus at the reader's level. A page with no save has no level, so it reads at level one, the
// same answer a vial's box gives for the same reason: "+1 Base Damage" rather than a sentence
// with the number cut out of it.
const LEVEL = 1;

const stampBonus = (node) => {
  const { template, func, x1, x2 } = node?.stamp?.effect || {};
  if (!template || !func) return node.description ? cleanUnderscore(node.description) : null;
  const value = growth(func, LEVEL, x1, x2, false);
  const shown = Number.isFinite(value) ? Math.round(value * 100) / 100 : '';
  return cleanUnderscore(String(template).replace(/{/g, String(shown)));
};

const StampInfo = ({ node }) => {
  const { stamp } = node;
  if (!stamp) return null;

  const rows = [];
  if (stamp.category) rows.push({ label: 'Type', value: stamp.category });
  if (stamp.number) rows.push({ label: 'Number', value: stamp.number });
  const bonus = stampBonus(node);
  if (bonus) rows.push({ label: stamp.effect ? 'Lv 1' : 'Bonus', value: bonus });

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
