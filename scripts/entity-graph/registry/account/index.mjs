import { inGroup } from '../group.mjs';
import guildBonus from './guild-bonus.mjs';
import meritShop from './merit-shop.mjs';
import dungeonItem from './dungeon-item.mjs';
import dungeonPassive from './dungeon-passive.mjs';
import dungeonTrait from './dungeon-trait.mjs';

export default inGroup('Account', [guildBonus, meritShop, dungeonItem, dungeonPassive, dungeonTrait]);
