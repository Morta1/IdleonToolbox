import { cleanUnderscore } from 'utility/helpers';
import { formatGame } from '@utility/gameNotation';
import ItemDisplay from '../common/ItemDisplay';
import { HIDDEN_INVENTORY_BAG } from '@parsers/character';
import Panel from '@components/common/cards/Panel';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';

const Bags = ({ bags, capBags }) => <Panel title={'Bags'}>
  <Panel.Group label={'Inventory bags'}>
    <CardGrid size={'icon'} fill sx={{ p: 1.5 }}>
      {bags?.filter((bag) => bag?.displayName !== HIDDEN_INVENTORY_BAG).map((bag, index) => <IconTile
        key={bag?.displayName + index} icon={`data/${bag?.rawName}.png`} alt={cleanUnderscore(bag?.displayName ?? '')}
        status={bag?.acquired ? undefined : 'missing'} details={<ItemDisplay {...bag}/>}/>)}
    </CardGrid>
  </Panel.Group>
  <Panel.Group label={'Carry bags'}>
    <CardGrid size={'icon'} fill sx={{ p: 1.5 }}>
      {/* The game draws every MaxCapacity kind in Big */}
      {capBags?.map((item, index) => <IconTile key={item?.displayName + index} icon={`data/${item?.rawName}.png`}
                                               alt={cleanUnderscore(item?.displayName ?? '')}
                                               value={formatGame(item?.capacityPerSlot, 'Big')} details={<ItemDisplay {...item}/>}/>)}
    </CardGrid>
  </Panel.Group>
</Panel>;

export default Bags;
