import React from 'react';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { gameTables, items } from '@website-data';
import Panel from '@components/common/cards/Panel';
import { CatalogList } from '@components/account/Worlds/World7/Gallery/Trophies';

const BASE_STATS = gameTables.galleryBonusStats;

// Same text as the rack: base stats as "+12 STR", etc bonuses carry their own "%_" prefix
const bonusText = ({ name, value }) => cleanUnderscore(`+${formatNum(value ?? 0)}${BASE_STATS.includes(name) ? '_' : ''}${name}`);

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
  {hatBonuses?.length ? <Panel title={'Bonuses'} sx={{ mb: 3 }}
                               meta={`Totals with the hat rack multi ${formatGame(bonusMulti ?? 1, 'Gallery.HatrackBonusMulti')}x`}>
    <Panel.Columns>
      {hatBonuses.map((bonus, index) => <Panel.Row key={`bonus-${index}`} name={bonusText(bonus)}/>)}
    </Panel.Columns>
  </Panel> : null}
  <CatalogList page={'hat-rack'} title={'Premium helmets'} noun={'helmets'} items={allPremiumHelmets?.map(baseHelmet)} failed={sectionFailed}/>
</>;

export default HatRack;
