import { inGroup } from '../group.mjs';
import spelunkUpgrade from './spelunk-upgrade.mjs';
import spelunkTunnel from './spelunk-tunnel.mjs';

export default inGroup('World 7', [spelunkUpgrade, spelunkTunnel]);
