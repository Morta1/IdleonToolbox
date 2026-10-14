import { inGroup } from '../group.mjs';
import summoningUpgrade from './summoning-upgrade.mjs';
import summoningBattle from './summoning-battle.mjs';
import marketUpgrade from './market-upgrade.mjs';
import exoticUpgrade from './exotic-upgrade.mjs';

export default inGroup('World 6', [summoningUpgrade, summoningBattle, marketUpgrade, exoticUpgrade]);
