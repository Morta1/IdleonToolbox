import { inGroup } from '../group.mjs';
import gene from './gene.mjs';
import labBonus from './lab-bonus.mjs';
import petUpgrade from './pet-upgrade.mjs';

export default inGroup('World 4', [gene, petUpgrade, labBonus]);
