// Lane L6 of the wiki upkeep extraction (Tasks 9a, 9b, 10a, 10b: World 6).
// The client tables its rows read, written as in core.mjs: one literal read per name.
import { gameTable } from '../registry/data.mjs';

export const READ = {
  detectionDec: (data) => gameTable(data, 'detectionDec'),
  ninjaItemStat: (data) => gameTable(data, 'ninjaItemStat')
};
