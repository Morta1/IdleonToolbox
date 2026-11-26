import React from 'react';
import { formatGame } from '@utility/gameNotation';
import { formatNum, titleCaseName } from '@utility/helpers';
import { cleanText, gameText } from '@utility/goals/registry/names';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

// The parser's lines (the game's @), one each
const lines = (description) => gameText(`${description ?? ''}`).split('\n');

const COST_RULE = 'Thingies.OrbletMarketCost';

// Glorification has no levels: each try rolls on one outpost, so it counts the outposts left instead
const costRows = ({ costToMax, glorification }) => glorification
  ? [
    ['Outposts left', formatNum(glorification.outpostsLeft, 'whole')],
    glorification.averageCost > 0
      ? ['Average cost for all', formatGame(glorification.averageCost, COST_RULE, { whole: true })] : null
  ]
  : [costToMax > 0 ? ['Cost to max', formatGame(costToMax, COST_RULE, { whole: true })] : null];

// sectionFailed: the upgrades at zero by name (the parser's empty save), with no cost or state
const OrbletMarket = ({ orbletMarket, orblets, sectionFailed }) => {
  const catalog = orbletMarket ?? [];
  if (!catalog.length) return null;
  return <CardGrid size={'s'}>
    {catalog.map(({ index, name, description, level, maxLevel, cost, costToMax, glorification, maxed }) => <ItemCard
      key={index} icon={'data/Orblet.png'} title={titleCaseName(cleanText(name))}
      level={glorification ? undefined : { value: level ?? 0, max: maxLevel }}
      status={!sectionFailed && maxed ? (glorification ? 'done' : 'maxed') : undefined}
      statusLabel={glorification ? 'All glorified' : undefined}
      footer={sectionFailed || (glorification && maxed) ? null : <ItemCard.Cost icon={'data/Orblet_x1.png'} iconAlt={'Orblets'} game={COST_RULE}
                                                    need={cost} have={orblets ?? 0}/>}>
      <ItemCard.Desc text={lines(description)}/>
      {sectionFailed || maxed ? null : <ItemCard.Facts rows={costRows({ costToMax, glorification })}/>}
    </ItemCard>)}
  </CardGrid>;
};

export default OrbletMarket;
