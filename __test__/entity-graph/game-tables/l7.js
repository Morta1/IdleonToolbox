import { bubbleNodes } from '../../../scripts/entity-graph/nodes/alchemy.mjs';
import { prayerNodes } from '../../../scripts/entity-graph/nodes/systems.mjs';
import { vaultNodes } from '../../../scripts/entity-graph/nodes/vault.mjs';
import { rebuild } from './rebuild.js';

// Lane L7 of the wiki upkeep extraction (Tasks 11a, 11b: account, Worlds 1 and 2).
// Its build-time tables, in the same two maps as core.js. A reader is `rebuild(...kinds)` from ./rebuild.js, or a
// function of the website-data input.
export const READERS = {
  dungeonRngUpgCost: rebuild('dungeonitem'),
  dungeonPassiveCost: rebuild('dungeonpassive'),
  dungeonPassiveCaps: rebuild('dungeonpassive'),
  guildBonusHover: rebuild('guildbonus'),
  weeklyBossBars: rebuild('weeklyboss'),
  owlCost: rebuild('owl'),
  owlFeatherRate: rebuild('owl'),
  rooBonuses: rebuild('poppy'),
  rooFirstCost: rebuild('poppy'),
  rooTokenDecay: rebuild('tarpit'),
  tarPitMegafish: rebuild('tarpit'),
  // The cap in the bubble cost note; the rest of the table is read by the client (utility/wiki/effects.mjs).
  bubbleCost: (input) => bubbleNodes(input.cauldrons, input),
  // The structured boxes: a prayer's bonus, curse and soul cost, an Upgrade Vault upgrade's bonus and coin cost.
  prayerCost: (input) => prayerNodes(input.prayers, input),
  prayerBonus: (input) => prayerNodes(input.prayers, input),
  vaultUpgradeCost: (input) => vaultNodes(input.upgradeVault, input),
  vaultUpgradeBonus: (input) => vaultNodes(input.upgradeVault, input)
};
export const POINTERS = {};
