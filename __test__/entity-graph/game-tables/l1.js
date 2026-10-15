import { rebuild } from './rebuild.js';

// Lane L1 of the wiki upkeep extraction (Tasks 3b, 4a, 4b: class shops).
// Its build-time tables, in the same two maps as core.js. A reader is `rebuild(...kinds)` from ./rebuild.js, or a
// function of the website-data input.
export const READERS = {
  arcaneUpgradeCost: rebuild('tesseractupgrade'),
  arcaneNotFractal: rebuild('tesseractupgrade'),
  arcanePrismaOdds: rebuild('tesseractupgrade'),
  arcaneDollarFills: rebuild('tesseractupgrade'),
  upgradeHelpUnmarked: rebuild('tesseractupgrade', 'armoryupgrade'),
  orbletMarketCost: rebuild('orbletupgrade'),
  armoryUpgradeCost: rebuild('armoryupgrade'),
  royalGuardianClass: rebuild('armoryupgrade'),
  armoryPanelFills: rebuild('armoryupgrade'),
  armoryTradingRank: rebuild('armoryupgrade'),
  armoryBoostedBy: rebuild('armoryupgrade'),
  armoryMarbleDrop: rebuild('armoryupgrade'),
  royalRecruitUpgradeId: rebuild('armoryupgrade'),
  armoryCompounding: rebuild('armoryupgrade'),
  compassUpgradeCost: rebuild('compassupgrade'),
  compassPanel: rebuild('compassupgrade'),
  compassBonus: rebuild('compassupgrade'),
  compassVisibility: rebuild('compassupgrade'),
  tempestDropOdds: rebuild('compassupgrade')
};
export const POINTERS = { arcaneNotFractal: ['multiplierRow'] };
