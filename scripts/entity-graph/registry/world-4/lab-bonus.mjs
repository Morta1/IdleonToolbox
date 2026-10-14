import { dropReadout, spaced } from '../text.mjs';

// UPKEEP: MainframeBonus(n) adds MainframeBonus(100 + jewel) to these connected bonuses (lab.ts LAB_BONUS_JEWEL_BOOSTS); Spelunker Obol (8) takes Pure Opal Navette's (19) raw bonus / 100. Re-check both tables on a game patch.
const BOOSTING_JEWEL = { 0: 1, 3: 7, 8: 19, 9: 13, 11: 17, 15: 18, 17: 20 };
// UPKEEP: bonuses 14-17 are pushed onto LabMainBonus from NinjaInfo[25..28] once Jade Emporium upgrade 8 + (n - 14) is bought.
const FIRST_JADE_BONUS = 14;
// UPKEEP: jadeUpgrades[8..11] are The_Artifact_Matrix to The_Crop_Matrix, the upgrades N.js checks with Ninja("EmporiumBonus", 8 + i).
const FIRST_JADE_UPGRADE = 8;

export default {
  kind: 'labbonus',
  section: 'labBonuses',
  // UPKEEP: keyed by the game's own index column; the art (LabBonus<i>) follows it.
  key: (entry) => `LabBonus${entry.index}`,
  icon: (entry) => `/data/LabBonus${entry.index}.png`,
  fallbackIcon: '/data/ClassIcons53.png',
  // Animal Farm, Fungi Finger Pocketer and Banking Fury end on a "Total Bonus" readout of the player's own total.
  describe: (entry) => dropReadout(entry.description),
  fields: (entry, index, data) => [
    ...(entry.index >= FIRST_JADE_BONUS
      ? [{ label: 'Unlocked by', value: `${spaced(data.jadeUpgrades?.[FIRST_JADE_UPGRADE + entry.index - FIRST_JADE_BONUS]?.name)} (Jade Emporium)` }]
      : []),
    ...(BOOSTING_JEWEL[entry.index] != null
      ? [{ label: 'Boosted by jewel', value: spaced(data.jewels?.[BOOSTING_JEWEL[entry.index]]?.name) }]
      : [])
  ]
};
