import { inGroup } from '../group.mjs';
import compassUpgrade from './compass-upgrade.mjs';
import grimoireUpgrade from './grimoire-upgrade.mjs';
import tesseractUpgrade from './tesseract-upgrade.mjs';

export default inGroup('Classes', [grimoireUpgrade, compassUpgrade, tesseractUpgrade]);
