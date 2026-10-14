import { inGroup } from '../group.mjs';
import spelunkUpgrade from './spelunk-upgrade.mjs';
import spelunkTunnel from './spelunk-tunnel.mjs';
import researchSquare from './research-square.mjs';
import observation from './observation.mjs';
import sticker from './sticker.mjs';

export default inGroup('World 7', [spelunkUpgrade, spelunkTunnel, researchSquare, observation, sticker]);
