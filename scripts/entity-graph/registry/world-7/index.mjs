import { inGroup } from '../group.mjs';
import spelunkUpgrade from './spelunk-upgrade.mjs';
import spelunkTunnel from './spelunk-tunnel.mjs';
import researchSquare from './research-square.mjs';
import observation from './observation.mjs';
import sticker from './sticker.mjs';
import legendTalent from './legend-talent.mjs';
import zenithUpgrade from './zenith-upgrade.mjs';
import adviceFish from './advice-fish.mjs';

export default inGroup('World 7', [spelunkUpgrade, spelunkTunnel, researchSquare, observation, sticker, legendTalent, zenithUpgrade, adviceFish]);
