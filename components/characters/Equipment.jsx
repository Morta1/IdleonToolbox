import React from 'react';
import ItemDisplay from '../common/ItemDisplay';
import { cleanUnderscore, formatNum } from 'utility/helpers';
import { getGoldenFoodBonus } from '@parsers/misc';
import Panel from '@components/common/cards/Panel';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';

const SLOTS_PER_GROUP = 8;

const Equipment = ({ equipment, tools, food, account, character, characters }) => {
  const groups = [
    ['Equipment', equipment?.slice(0, SLOTS_PER_GROUP)],
    ['More equipment', equipment?.slice(SLOTS_PER_GROUP)],
    ['Tools', tools],
    ['Food', food]
  ];
  return <Panel title={'Equipment'}>
    {groups.map(([label, items]) => <Panel.Group key={label} label={label}>
      <CardGrid size={'icon'} sheetColumns={[8, 4]}>
        {items?.slice(0, SLOTS_PER_GROUP).map((item, itemIndex) => {
          const { rawName, displayName, amount } = item;
          // A slot with nothing in it has nothing to read: no note, no tab stop
          if (rawName === 'Blank' || !displayName || displayName === 'ERROR') {
            return <IconTile key={`${rawName}-${itemIndex}`} status={'empty'} alt={'Empty slot'}/>;
          }
          return <IconTile key={`${rawName}-${itemIndex}`} icon={`data/${rawName}.png`} alt={cleanUnderscore(displayName)}
                           value={amount ? formatNum(amount, 'whole') : undefined}
                           details={<ItemDisplay {...item} character={character} account={account} characters={characters}
                                                 getGoldenFoodBonus={getGoldenFoodBonus}/>}/>;
        })}
      </CardGrid>
    </Panel.Group>)}
  </Panel>;
};

export default Equipment;
