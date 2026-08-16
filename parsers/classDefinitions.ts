// Class identity: the class name constants, the talent-page ordering per class, and the
// base-class lookup. Extracted from talents.ts because these are plain values with no
// dependencies, while talents.ts imports 18 other parser modules — and through
// class-specific/{grimoire,tesseract} that reached monsterDrops. Anything importing just
// these constants from talents.ts pulled the whole parser graph and its data with it, which
// put megabytes onto the 137 public /tools/builds/* pages that only need the tab order.
//
// talents.ts re-exports all three, so existing importers are unaffected.

export const CLASSES = {
  'Beginner': 'Beginner',
  'Journeyman': 'Journeyman',
  'Maestro': 'Maestro',
  'Voidwalker': 'Voidwalker',
  'Warrior': 'Warrior',
  'Barbarian': 'Barbarian',
  'Blood_Berserker': 'Blood_Berserker',
  'Death_Bringer': 'Death_Bringer',
  'Squire': 'Squire',
  'Divine_Knight': 'Divine_Knight',
  'Archer': 'Archer',
  'Bowman': 'Bowman',
  'Siege_Breaker': 'Siege_Breaker',
  'Hunter': 'Hunter',
  'Beast_Master': 'Beast_Master',
  'Wind_Walker': 'Wind_Walker',
  'Mage': 'Mage',
  'Shaman': 'Shaman',
  'Bubonic_Conjuror': 'Bubonic_Conjuror',
  'Arcane_Cultist': 'Arcane_Cultist',
  'Wizard': 'Wizard',
  'Elemental_Sorcerer': 'Elemental_Sorcerer'
}

export const talentPagesMap = {
  [CLASSES.Beginner]: [CLASSES.Beginner],
  [CLASSES.Journeyman]: [CLASSES.Beginner, CLASSES.Journeyman],
  [CLASSES.Maestro]: [CLASSES.Beginner, CLASSES.Journeyman, CLASSES.Maestro],
  [CLASSES.Voidwalker]: [CLASSES.Beginner, CLASSES.Journeyman, CLASSES.Maestro, CLASSES.Voidwalker],
  //
  [CLASSES.Warrior]: ['Rage_Basics', CLASSES.Warrior],
  [CLASSES.Barbarian]: ['Rage_Basics', CLASSES.Warrior, CLASSES.Barbarian],
  [CLASSES.Blood_Berserker]: ['Rage_Basics', CLASSES.Warrior, CLASSES.Barbarian, CLASSES.Blood_Berserker],
  [CLASSES.Death_Bringer]: ['Rage_Basics', CLASSES.Warrior, CLASSES.Barbarian, CLASSES.Blood_Berserker,
    CLASSES.Death_Bringer],
  [CLASSES.Squire]: ['Rage_Basics', CLASSES.Warrior, CLASSES.Squire],
  [CLASSES.Divine_Knight]: ['Rage_Basics', CLASSES.Warrior, CLASSES.Squire, CLASSES.Divine_Knight],
  //
  [CLASSES.Archer]: ['Calm_Basics', CLASSES.Archer],
  [CLASSES.Bowman]: ['Calm_Basics', CLASSES.Archer, CLASSES.Bowman],
  [CLASSES.Siege_Breaker]: ['Calm_Basics', CLASSES.Archer, CLASSES.Bowman, CLASSES.Siege_Breaker],
  [CLASSES.Hunter]: ['Calm_Basics', CLASSES.Archer, CLASSES.Hunter],
  [CLASSES.Beast_Master]: ['Calm_Basics', CLASSES.Archer, CLASSES.Hunter, CLASSES.Beast_Master],
  [CLASSES.Wind_Walker]: ['Calm_Basics', CLASSES.Archer, CLASSES.Hunter, CLASSES.Beast_Master, CLASSES.Wind_Walker],
  //
  [CLASSES.Mage]: ['Savvy_Basics', CLASSES.Mage],
  [CLASSES.Shaman]: ['Savvy_Basics', CLASSES.Mage, CLASSES.Shaman],
  [CLASSES.Bubonic_Conjuror]: ['Savvy_Basics', CLASSES.Mage, CLASSES.Shaman, CLASSES.Bubonic_Conjuror],
  [CLASSES.Arcane_Cultist]: ['Savvy_Basics', CLASSES.Mage, CLASSES.Shaman, CLASSES.Bubonic_Conjuror,
    CLASSES.Arcane_Cultist],
  [CLASSES.Wizard]: ['Savvy_Basics', CLASSES.Mage, CLASSES.Wizard],
  [CLASSES.Elemental_Sorcerer]: ['Savvy_Basics', CLASSES.Mage, CLASSES.Wizard, CLASSES.Elemental_Sorcerer]
};

export function getBaseClass(className: any) {
  const path = talentPagesMap[className];
  if (!path) return null; // not found

  if (className === CLASSES.Beginner) return CLASSES.Beginner;
  if (path[0] === CLASSES.Beginner) return CLASSES.Beginner;
  return path[1];
}
