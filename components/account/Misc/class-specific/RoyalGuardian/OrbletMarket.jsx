import React from 'react';
import { formatGame } from '@utility/gameNotation';
import { titleCaseName } from '@utility/helpers';
import { cleanText, gameText } from '@utility/goals/registry/names';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

// The parser's lines (the game's @), one each
const lines = (description) => gameText(`${description ?? ''}`).split('\n');

// sectionFailed: the upgrades at zero by name (the parser's empty save), with no bonus, cost or state
const OrbletMarket = ({ orbletMarket, orblets, sectionFailed }) => {
  const catalog = orbletMarket ?? [];
  if (!catalog.length) return null;
  return <CardGrid size={'s'}>
    {catalog.map(({ index, name, description, level, maxLevel, cost, bonus, bonusInSentence, maxed }) => <ItemCard
      key={index} icon={'data/Orblet.png'} title={titleCaseName(cleanText(name))}
      level={{ value: level ?? 0, max: maxLevel }}
      status={!sectionFailed && maxed ? 'maxed' : undefined}
      footer={sectionFailed ? null : <ItemCard.Cost icon={'data/Orblet_x1.png'} iconAlt={'Orblets'} game={'Thingies.OrbletMarketCost'}
                                                    need={cost} have={orblets ?? 0}/>}>
      <ItemCard.Desc text={lines(description)}/>
      {sectionFailed || bonusInSentence ? null
        : <ItemCard.Facts rows={[['Bonus', formatGame(bonus ?? 0, 'Thingies.OrbletMarketBonus')]]}/>}
    </ItemCard>)}
  </CardGrid>;
};

export default OrbletMarket;
