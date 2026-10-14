import { inGroup } from '../group.mjs';
import guildBonus from './guild-bonus.mjs';
import meritShop from './merit-shop.mjs';

// The dungeon kinds land here with their rows.
export default inGroup('Account', [guildBonus, meritShop]);
