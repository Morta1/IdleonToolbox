import React from 'react';
import { Divider, Stack } from '@mui/material';
import ItemDisplay from '../../common/ItemDisplay';
import { cleanUnderscore, formatNum } from 'utility/helpers';
import { CLASSES, talentPagesMap } from '@parsers/talents';
import { items as itemsList } from '@website-data';
import { getGoldenFoodBonus } from '@parsers/misc';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import Panel from '@components/common/cards/Panel';
import StatusText from '@components/common/StatusText';
import { isSectionFailed } from '@components/common/styles';
import { ownerName } from '@components/tools/item-planner/ItemTooltip';

const Equipment = ({ equipment, tools, food, account, character, characters, weaponByClass, hideEmpty, allAccountItems }) => {
  const page = (windowName, items, weapons) => <EquipmentPage allAccountItems={allAccountItems} weaponByClass={weapons} windowName={windowName}
                                                              hideEmpty={hideEmpty} items={items} character={character}
                                                              account={account} characters={characters}/>;
  return <Panel title={'Equipment'}>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'flex-start'} sx={{ p: 2 }}>
      {page('equipment', equipment?.slice(0, 8), weaponByClass)}
      {page('equipment', equipment?.slice(8))}
      {page('tools', tools)}
      {page('food', food)}
    </Stack>
  </Panel>;
};

// Where an item stands for this character, in words: a guest has no character to say it of, and a failed storage section
// can't say nobody owns it.
const ownedLine = (isEquipped, owners, storageFailed) => {
  if (isEquipped) return <StatusText status={'active'}>Equipped</StatusText>;
  if (!owners.length && storageFailed) return null;
  return <StatusText status={'needs'} wrap>{owners.length ? `Not equipped: in ${owners.join(', ')}` : 'Not owned'}</StatusText>;
};

const EquipmentPage = ({ allAccountItems, items, character, account, characters, hideEmpty, windowName, weaponByClass }) => {
  const classes = [CLASSES.Warrior, CLASSES.Mage, CLASSES.Archer];
  const baseClass = classes.find(cls => talentPagesMap?.[character?.class]?.includes(cls)) || CLASSES.Beginner;
  const actualItem = itemsList?.[weaponByClass?.[baseClass]];

  const storageFailed = isSectionFailed(account, 'storage');

  // Two columns of tiles, 72 px each from 600 px. Two pages share a phone's row: 136 px is what 360 px leaves each.
  return <CardGrid size={'icon'} columns={2} sx={{ flex: { xs: '1 1 136px', sm: '0 0 152px' }, maxWidth: 152 }}>
    {items?.slice(0, 8).map((item, itemIndex) => {
      const shownItem = (itemIndex === 1 && actualItem ? actualItem : item) || {};
      const { rawName, displayName, amount } = shownItem;
      if (hideEmpty && rawName === 'Blank') return null;

      const isEquipped = character?.[windowName]?.some(({ rawName: rName }) => rName === rawName);
      const owners = isEquipped ? [] : [...new Set(allAccountItems.filter(({ rawName: rName }) => rName === rawName).map(({ owner }) => ownerName(owner ?? '')))].filter(Boolean);
      const known = displayName && displayName !== 'ERROR';
      const line = character?.name ? ownedLine(isEquipped, owners, storageFailed) : null;
      return <IconTile
        key={`${rawName}-${itemIndex}`}
        icon={`data/${rawName}.png`}
        fallback={`data/${rawName}_x1.png`}
        alt={known ? cleanUnderscore(displayName) : rawName}
        status={isEquipped ? undefined : 'missing'}
        value={known && rawName !== 'Blank' && amount !== undefined ? formatNum(Number(amount), 'whole') : undefined}
        details={known ? <>
          {line ? <>{line}<Divider sx={{ my: 1 }}/></> : null}
          <ItemDisplay {...shownItem} character={character} account={account} characters={characters} getGoldenFoodBonus={getGoldenFoodBonus}/>
        </> : undefined}
      />;
    })}
  </CardGrid>;
};

export default Equipment;
