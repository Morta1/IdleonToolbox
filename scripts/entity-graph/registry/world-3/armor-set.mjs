import { titleCase } from '../text.mjs';

// notateNumber "MultiplierInfo" below a million: always two decimals (1.5 -> "1.50", 2 -> "2.00").
// UPKEEP: no set bonus reaches a million; re-check if one does.
const multiplierInfo = (value) => value.toFixed(2);

// `{` is the bonus, `}` the bonus as a multiplier and `|` the game's line split (N.js set tooltip).
// UPKEEP: `{`, `}` and `|` are the game's placeholders in a set description; re-check when a patch adds one.
const bonusText = (entry) => String(entry.description || '')
  .replace(/\|/g, '_')
  .replace('{', String(entry.bonusValue))
  .replace('}', multiplierInfo(1 + entry.bonusValue / 100));

export default {
  kind: 'armorset',
  section: 'equipmentSets',
  // The game's key: the smithy's unlocked list (OptionsListAccount[379]) stores it.
  key: (entry) => entry.setName,
  name: (entry) => titleCase(entry.setName),
  // The set's hat, the piece the Armor Set Smithy draws.
  icon: (entry) => `/data/${entry.armors[0]}.png`,
  fallbackIcon: '/etc/Armor_Set_Smithy.png',
  describe: bonusText,
  fields: (entry) => [
    { label: 'Pieces to wear', value: entry.armors.length + entry.requiredTools + entry.requiredWeapon },
    { label: 'Armour pieces', value: entry.armors.length },
    ...(entry.requiredTools > 0 ? [{ label: 'Tools', value: `any ${entry.requiredTools} of ${entry.tools.length}` }] : []),
    ...(entry.requiredWeapon > 0 ? [{ label: 'Weapon', value: `any 1 of ${entry.weapons.length}` }] : [])
  ]
};
