import { linked } from '../../../../utility/wiki/field-links.mjs';
import { gameTable } from '../data.mjs';
import { dropReadout, spaced } from '../text.mjs';

// The jewel whose bonus a connected bonus adds: the labJewelBoosts table, MainframeBonus's `N == e` chain adding
// MainframeBonus(100 + jewel). Spelunker Obol (8) takes Pure Opal Navette's (19) raw bonus / 100. No table, no field.
const jewelField = (entry, data) => {
  const jewel = gameTable(data, 'labJewelBoosts')?.[entry.index];
  return jewel == null ? null : linked({ label: 'Boosted by jewel', value: spaced(data.jewels?.[jewel]?.name) }, 'boostedBy', `jewel:ConsoleJwl${jewel}`);
};

// The bonuses pushed onto LabMainBonus from NinjaInfo once their Jade Emporium upgrade is bought: the labJadeBonuses table,
// the push loop's `Ninja("EmporiumBonus", firstUpgrade + i)` from bonus firstBonus on. No table, no field.
const unlockField = (entry, data) => {
  const jade = gameTable(data, 'labJadeBonuses');
  if (!jade || entry.index < jade.firstBonus) return null;
  const upgrade = data.jadeUpgrades?.[jade.firstUpgrade + entry.index - jade.firstBonus];
  return linked({ label: 'Unlocked by', value: `${spaced(upgrade?.name)} (Jade Emporium)` }, 'unlockedBy', upgrade && `jade:NjJupg${upgrade.x3}`);
};

export default {
  kind: 'labbonus',
  section: 'labBonuses',
  // UPKEEP: keyed by the game's own index column; the art (LabBonus<i>) follows it.
  key: (entry) => `LabBonus${entry.index}`,
  icon: (entry) => `/data/LabBonus${entry.index}.png`,
  fallbackIcon: '/data/ClassIcons53.png',
  // Animal Farm, Fungi Finger Pocketer and Banking Fury end on a "Total Bonus" readout of the player's own total.
  describe: (entry) => dropReadout(entry.description),
  fields: (entry, index, data) => [unlockField(entry, data), jewelField(entry, data)].filter(Boolean)
};
