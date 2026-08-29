// Class identity: the class name constants, the talent-page ordering per class, and the base-class
// lookup. Extracted from talents.ts because these are plain values with no dependencies, while
// talents.ts imports 18 other parser modules — and through class-specific/{grimoire,tesseract} that
// reached monsterDrops. Anything importing just these constants from talents.ts pulled the whole
// parser graph and its data with it, which put megabytes onto the 137 public /tools/builds/* pages
// that only need the tab order.
//
// talents.ts re-exports all three, so existing importers are unaffected.
//
// The tree itself is no longer written down here. z-processing reads it out of the game's own
// ClassPromotionChoices and exports classPromotions, which is deliberately given its own file
// rather than riding in shared-data.json: importing one key out of that 1MB bundle would undo the
// split described above.

import { classPromotions } from '@website-data';

// A class is playable once it has a talent tab of its own. Infinilyte and Spiritual Monk are in the
// game's promotion list with art and family bonuses, but neither has talents, so nobody can be one
// and neither belongs in a class picker or a build page.
const released = Object.entries(classPromotions).filter(([, entry]: [string, any]) => entry?.released);

export const CLASSES: Record<string, string> = Object.fromEntries(
  released.map(([name]) => [name, name])
);

// Every talent tab a class can spend points in, in order: a Blood Berserker is Rage Basics,
// Warrior, Barbarian, Blood Berserker.
export const talentPagesMap: Record<string, string[]> = Object.fromEntries(
  released.map(([name, entry]: [string, any]) => [name, entry.talentTabs])
);

export function getBaseClass(className: any) {
  const path = talentPagesMap[className];
  if (!path) return null; // not found

  if (className === CLASSES.Beginner) return CLASSES.Beginner;
  if (path[0] === CLASSES.Beginner) return CLASSES.Beginner;
  return path[1];
}
