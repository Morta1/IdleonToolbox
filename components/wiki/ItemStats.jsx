import React from 'react';
import InfoBox from './InfoBox';
import CoinAmount from './CoinAmount';
import { getPowerType } from '@parsers/powerTypes';
import { cleanUnderscore } from '@utility/helpers';

// Same stat colours ItemDisplay uses, so an item reads the same in a tooltip and here.
const STAT_COLOURS = {
  STR: 'error.dark',
  AGI: 'success.dark',
  WIS: 'secondary.dark',
  LUK: 'warning.dark'
};

// Grouped the way idleon.wiki's infobox groups it: what you need to equip the thing, then what it
// gives you, then what a vendor pays. Set Info is absent on purpose: equipmentSets holds 19 sets and
// none of the late-game ones.
//
// Sell price used to be absent too, on the grounds that every item's was 1. That is true of
// `stats.sellPrice`, which is undefined on all 1,175 items carrying stats, but the graph reads the
// item's own sellPrice, keeps it only when it is above 1, and 1,496 items have one across 197
// distinct values. Only the 128 stamps ever showed it.
//
// A craftable item's price is not its field either: the graph replaces it with the recipe price the
// game actually uses, so by the time it reaches here it is already the right number. See
// scripts/entity-graph/craft-prices.mjs.
const statGroups = (stats, rawName, type) => {
  const requirements = [];
  const values = [];
  const add = (into, label, value, color) => into.push({ label, value, color });

  if (stats.Class) add(requirements, 'Class', cleanUnderscore(stats.Class));
  if (stats.lvReqToEquip) add(requirements, 'Level', stats.lvReqToEquip);

  // The power a weapon grants depends on what it is: mining, fishing, choppin and so on.
  if (stats.Weapon_Power) add(values, getPowerType(stats.UQ1txt || rawName, type), stats.Weapon_Power);
  if (stats.Speed) add(values, 'Speed', stats.Speed);
  if (stats.Reach) add(values, 'Reach', stats.Reach);
  for (const stat of ['STR', 'AGI', 'WIS', 'LUK']) {
    if (stats[stat]) add(values, stat, stats[stat], STAT_COLOURS[stat]);
  }
  if (stats.Defence) add(values, 'Defence', stats.Defence);
  if (stats.UQ1txt && stats.UQ1val) add(values, 'Misc', cleanUnderscore(`+${stats.UQ1val}${stats.UQ1txt}`));
  if (stats.UQ2txt && stats.UQ2val) add(values, 'Misc', cleanUnderscore(`+${stats.UQ2val}${stats.UQ2txt}`));
  if (stats.Upgrade_Slots_Left > 0) add(values, 'Upgrade Slots', stats.Upgrade_Slots_Left);

  return [
    { title: 'Requirements', rows: requirements },
    { title: 'Stats', rows: values }
  ].filter((group) => group.rows.length > 0);
};

// A price is worth showing on its own: most of the 1,496 priced items are resources with no stats
// at all, and those pages used to carry no infobox whatsoever.
const ItemStats = ({ node }) => {
  const sellPrice = node?.kind === 'item' ? node.sellPrice : null;
  if (!node?.stats && !sellPrice) return null;

  const groups = node.stats ? statGroups(node.stats, node.rawName, node.category) : [];
  if (sellPrice) {
    groups.push({
      title: 'Other Info',
      rows: [{ label: 'Sell Price', value: <CoinAmount amount={sellPrice} size={16}/> }]
    });
  }
  return <InfoBox groups={groups}/>;
};

export default ItemStats;
