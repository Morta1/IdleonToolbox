// A set's pieces: its armour, the tool pool and the weapon pool. A pool is linked only when the
// set counts it (requiredTools / requiredWeapon above 0), matching GetSetBonus "PartsOn".
const piece = (set, rawName, slot) => ({
  from: `armorset:${set.setName}`, to: `item:${rawName}`, rel: 'setPiece', meta: { slot }, source: 'armor-sets'
});

export const armorSetEdges = (equipmentSets) => (equipmentSets || []).flatMap((set) => [
  ...set.armors.map((rawName) => piece(set, rawName, 'armor')),
  ...(set.requiredTools > 0 ? set.tools.map((rawName) => piece(set, rawName, 'tool')) : []),
  ...(set.requiredWeapon > 0 ? set.weapons.map((rawName) => piece(set, rawName, 'weapon')) : [])
]);
