import { cleanUnderscore } from 'utility/helpers';
import { formatGame } from '@utility/gameNotation';
import ItemDisplay from '../common/ItemDisplay';
import { HIDDEN_INVENTORY_BAG } from '@parsers/character';
import Panel from '@components/common/cards/Panel';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';

// The bag is all its tile says: the sheet's 40 px, as talents, skills and equipment (players asked for bigger icons). The
// inventory bags keep the sheet's 44 px floor though they show no number: a bare tile went to 36 px beside another
// character, under the sprite.
const Bags = ({ bags, capBags }) => <Panel title={'Bags'}>
  <Panel.Group label={'Inventory bags'}>
    <CardGrid size={'icon'} sheetColumns={[8, 6]}>
      {bags?.filter((bag) => bag?.displayName !== HIDDEN_INVENTORY_BAG).map((bag, index) => <IconTile
        key={bag?.displayName + index} icon={`data/${bag?.rawName}.png`} alt={cleanUnderscore(bag?.displayName ?? '')} iconSize={40}
        status={bag?.acquired ? undefined : 'missing'} details={<ItemDisplay {...bag}/>}/>)}
    </CardGrid>
  </Panel.Group>
  <Panel.Group label={'Carry bags'}>
    <CardGrid size={'icon'} sheetColumns={[8, 4]}>
      {/* The game draws every MaxCapacity kind in Big */}
      {capBags?.map((item, index) => <IconTile key={item?.displayName + index} icon={`data/${item?.rawName}.png`}
                                               alt={cleanUnderscore(item?.displayName ?? '')} iconSize={40}
                                               value={formatGame(item?.capacityPerSlot, 'Big', { whole: true })} details={<ItemDisplay {...item}/>}/>)}
    </CardGrid>
  </Panel.Group>
</Panel>;

export default Bags;
