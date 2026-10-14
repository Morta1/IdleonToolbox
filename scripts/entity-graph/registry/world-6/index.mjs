import { inGroup } from '../group.mjs';
import summoningUpgrade from './summoning-upgrade.mjs';
import summoningBattle from './summoning-battle.mjs';

export default inGroup('World 6', [summoningUpgrade, summoningBattle]);
