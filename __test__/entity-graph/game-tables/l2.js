import { rebuild } from './rebuild.js';

// Lane L2 of the wiki upkeep extraction (Tasks 5a, 5b: World 7 shops).
// Its build-time tables, in the same two maps as core.js. A reader is `rebuild(...kinds)` from ./rebuild.js, or a
// function of the website-data input.

// A shop's buy check lets a max past `above` (998) through, and no shipped max sits between 998 and the shifted 1997,
// so the shifted read would not show: this reader rebuilds with the first upgrade's max at 999, the first such max.
const withMax999 = (kind, section, setMax) => (input) => {
  const entries = input[section];
  const first = Object.keys(entries)[0];
  const copy = Array.isArray(entries) ? [...entries] : { ...entries };
  copy[first] = setMax(entries[first]);
  return rebuild(kind)({ ...input, [section]: copy });
};
const listMax999 = (entry) => [entry[0], '999', ...entry.slice(2)];

export const READERS = {
  jellyCanBuy: withMax999('jellyupgrade', 'jellyUpgrades', listMax999),
  jellyUpgradeCost: rebuild('jellyupgrade'),
  jellyUpgradeLevelReq: rebuild('jellyupgrade'),
  jellyPanelFills: rebuild('jellyupgrade'),
  sushiCanBuy: withMax999('sushiupgrade', 'sushiUpgrades', listMax999),
  sushiUpgradeCost: rebuild('sushiupgrade'),
  sushiUpgradeLevelReq: rebuild('sushiupgrade'),
  sushiBaseFills: rebuild('sushiupgrade'),
  sushiDollarFills: rebuild('sushiupgrade'),
  sushiKnowledgePerTier: rebuild('sushi'),
  mineheadUpgradeCost: rebuild('mineheadupgrade'),
  // The extractor's `baseCost` column is the max level.
  mineheadCanBuy: withMax999('mineheadupgrade', 'mineheadUpgrades', (entry) => ({ ...entry, baseCost: 999 })),
  mineheadUpgradeLevelReq: rebuild('mineheadupgrade'),
  mineheadOpponentHP: rebuild('mineheadopponent'),
  mineheadPanelFills: rebuild('mineheadupgrade'),
  bubbaUpgradeCost: rebuild('bubbaupgrade'),
  bubbaHappinessFromUpgrade: rebuild('bubbaupgrade'),
  bubbaReset: rebuild('bubbaupgrade'),
  bubbaPanelDiscounts: rebuild('bubbaupgrade'),
  zenithMarketCost: rebuild('zenithupgrade')
};
export const POINTERS = {};
