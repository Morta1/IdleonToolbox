import { gameTable } from '../registry/data.mjs';

// Lane L7 of the wiki upkeep extraction (Tasks 11a, 11b: account, Worlds 1 and 2).
// The client tables its rows read, written as in core.mjs: one literal read per name.
export const READ = {
  dungeonRngUpgCost: (data) => gameTable(data, 'dungeonRngUpgCost'),
  bubbleCost: (data) => gameTable(data, 'bubbleCost')
};
