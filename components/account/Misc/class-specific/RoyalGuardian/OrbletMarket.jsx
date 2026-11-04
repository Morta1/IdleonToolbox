import React from 'react';
import { formatGame } from '@utility/gameNotation';
import { cleanText } from '@utility/goals/registry/names';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

// GLORIFICATION's whole sentence is a $ the game fills per map (N.js, the orblet market draw): its effect line, while the
// current map's outpost is not yet glorified, is the one that says what the upgrade does. Any other $ reads "?".
const GLORIFY = '10%_chance_to_Glorify_the_current_Outpost';
// The parser's lines (the game's @), one each
const lines = (description, index) => cleanText(`${description ?? ''}`.split('$').join(index === 4 ? GLORIFY : '?')).split('\n');

// sectionFailed: the upgrades at zero by name (the parser's empty save), with no bonus, cost or state
const OrbletMarket = ({ orbletMarket, orblets, sectionFailed }) => {
  const catalog = orbletMarket ?? [];
  if (!catalog.length) return null;
  return <CardGrid size={'s'}>
    {catalog.map(({ index, name, description, level, maxLevel, cost, bonus, maxed }) => <ItemCard
      key={index} icon={'data/Orblet.png'} title={cleanText(name)}
      level={{ value: level ?? 0, max: maxLevel }}
      status={!sectionFailed && maxed ? 'maxed' : undefined}
      footer={sectionFailed ? null : <ItemCard.Cost icon={'data/Orblet_x1.png'} iconAlt={'Orblets'} game={'Thingies.OrbletMarketCost'}
                                                    need={cost} have={orblets ?? 0}/>}>
      <ItemCard.Desc text={lines(description, index)}/>
      {/* A sentence the parser filled with the bonus prints it already: only a $ sentence (GLORIFICATION's) leaves it out */}
      {sectionFailed || !`${description ?? ''}`.includes('$') ? null
        : <ItemCard.Facts rows={[['Bonus', formatGame(bonus ?? 0, 'Thingies.OrbletMarketBonus')]]}/>}
    </ItemCard>)}
  </CardGrid>;
};

export default OrbletMarket;
