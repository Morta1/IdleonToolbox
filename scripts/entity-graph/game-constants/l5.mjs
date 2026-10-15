import { gameTable } from '../registry/data.mjs';

// Lane L5 of the wiki upkeep extraction (Tasks 8a, 8b, 8c: World 5).
// The client tables its rows read, written as in core.mjs: one literal read per name.
export const READ = {
  cglunkoUpgradeCost: (data) => gameTable(data, 'cglunkoUpgradeCost')
};
