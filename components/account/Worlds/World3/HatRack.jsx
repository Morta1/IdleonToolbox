import React from 'react';
import { formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { items } from '@website-data';
import BonusesPanel, { bonusRows } from '@components/account/BonusesPanel';
import { CatalogList } from '@components/account/Worlds/World7/Gallery/Trophies';

const rackValue = (value, percent) => `+${formatNum(value)}${percent ? '%' : ''}`;

// The game's rack draws a picked helmet's own numbers, its UQ1val and UQ2val with no multi (N.js, the hat rack
// screen), so every line of a card is base: the parser's multiplied misc lines give way to the item's own
const baseHelmet = (hat) => ({
  ...hat,
  UQ1val: items?.[hat?.rawName]?.UQ1val ?? hat?.UQ1val,
  UQ2val: items?.[hat?.rawName]?.UQ2val ?? hat?.UQ2val
});

// Gallery's catalog cards (5d): the title opens the wiki page, a helmet not acquired takes the card's dim and says so.
// The rack's multi shows once, on the Bonuses panel, whose totals hold it. sectionFailed: the catalog at zero with no
// state words
const HatRack = ({ bonusMulti, hatBonuses, allPremiumHelmets, sectionFailed }) => <>
  <BonusesPanel rows={bonusRows(hatBonuses, rackValue)} sx={{ mb: 3 }}
                meta={`Totals with the hat rack multi ${formatGame(bonusMulti ?? 1, 'Gallery.HatrackBonusMulti')}x`}/>
  <CatalogList page={'hat-rack'} title={'Premium helmets'} noun={'helmets'} items={allPremiumHelmets?.map(baseHelmet)} failed={sectionFailed}/>
</>;

export default HatRack;
