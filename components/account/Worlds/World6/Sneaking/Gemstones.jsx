import React from 'react';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

// Firefrost grants charm levels, every other gemstone grants a percentage.
const isFlatBonus = (index) => index === 7;

// The cap is the toolbox's own number (lane B): a flat + for Firefrost, the pct kind for the rest
const bonusText = (value, index) => (isFlatBonus(index) ? `+${formatNum(value ?? 0)}` : formatNum(value ?? 0, 'pct'));

// The list loops the gem catalog, so a save and a guest both have every gemstone
const Gemstones = ({ gemStones }) => {
  return <CardGrid size={'m'}>
    {gemStones?.map(({
                       rawName,
                       name,
                       description,
                       baseValue,
                       displayBonus,
                       displayMaxBonus,
                       saturationPct,
                       unlocked
                     }, index) => (
      <ItemCard key={'gemstone-' + index} icon={`data/${rawName}.png`} title={name} meta={`${formatNum(baseValue ?? 0, 'whole')} gems`}
                dimmed={!(unlocked || baseValue > 0)}>
        <ItemCard.Desc text={cleanUnderscore(description)}/>
        <ItemCard.Progress label={'Bonus'} value={bonusText(displayBonus, index)} max={bonusText(displayMaxBonus, index)}
                           percent={saturationPct || 0}/>
      </ItemCard>
    ))}
  </CardGrid>;
};

export default Gemstones;
