import { inGroup } from '../group.mjs';
import summoningUpgrade from './summoning-upgrade.mjs';
import summoningBattle from './summoning-battle.mjs';
import marketUpgrade from './market-upgrade.mjs';
import exoticUpgrade from './exotic-upgrade.mjs';
import seed from './seed.mjs';
import landRank from './land-rank.mjs';
import ninjaUpgrade from './ninja-upgrade.mjs';
import pristineCharm from './pristine-charm.mjs';
import ninjaItem from './ninja-item.mjs';

export default inGroup('World 6', [summoningUpgrade, summoningBattle, marketUpgrade, exoticUpgrade, seed, landRank, ninjaUpgrade, pristineCharm, ninjaItem]);
