import { inGroup } from '../group.mjs';
import spelunkUpgrade from './spelunk-upgrade.mjs';
import spelunkTunnel from './spelunk-tunnel.mjs';
import researchSquare from './research-square.mjs';
import observation from './observation.mjs';
import legendTalent from './legend-talent.mjs';
import zenithUpgrade from './zenith-upgrade.mjs';
import adviceFish from './advice-fish.mjs';
import mineheadUpgrade from './minehead-upgrade.mjs';
import mineheadOpponent from './minehead-opponent.mjs';
import sushiUpgrade from './sushi-upgrade.mjs';
import sushi from './sushi.mjs';
import jellyUpgrade from './jelly-upgrade.mjs';
import jellyObstruction from './jelly-obstruction.mjs';
import bubbaUpgrade from './bubba-upgrade.mjs';
import clamUpgrade from './clam-upgrade.mjs';
import menagerieMission from './menagerie-mission.mjs';
import menagerieUnlock from './menagerie-unlock.mjs';
import menagerieBoost from './menagerie-boost.mjs';
import menagerieJelly from './menagerie-jellyfish.mjs';

export default inGroup('World 7', [spelunkUpgrade, spelunkTunnel, researchSquare, observation, legendTalent, zenithUpgrade, adviceFish, mineheadUpgrade, mineheadOpponent, sushiUpgrade, sushi, jellyUpgrade, jellyObstruction, bubbaUpgrade, clamUpgrade,
  menagerieMission, menagerieUnlock, menagerieBoost, menagerieJelly]);
