import { inGroup } from '../group.mjs';
import gene from './gene.mjs';
import labBonus from './lab-bonus.mjs';
import petUpgrade from './pet-upgrade.mjs';
import rift from './rift.mjs';
import riftBonus from './rift-bonus.mjs';
import tome from './tome.mjs';

export default inGroup('World 4', [gene, petUpgrade, labBonus, rift, riftBonus, tome]);
