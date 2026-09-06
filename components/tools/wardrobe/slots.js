import { companions, itemsArray } from '@website-data';
import { companionOption, SLOT_TYPES } from '@utility/wardrobeQuery';
import { prefix } from '@utility/helpers';
import { monsterImage } from '@utility/spriteImages';

// EquipOrder[0] indices, verified from a saved character and from the game's own code: 0 hat,
// 1 weapon, 2 shirt, 3 pendant, 4 pants, 5 ring, 6 shoes, 7 ring, 8 premium (cosmetic) hat,
// 9 keychain, 10 trophy, 11 keychain, 12 cape, 13 chat ring, 14 replica nametag, 15 costume.
// The game draws hat, weapon, cape and costume on the body, and the trophy and the nametag on the
// separate name-label actor under it; the rest are inventory-only.
export const EQUIPMENT_SLOTS = [
  { index: 0, label: 'Hat', slot: 'hat' },
  { index: 1, label: 'Weapon', slot: 'weapon' },
  { index: 2, label: 'Shirt' },
  { index: 3, label: 'Pendant' },
  { index: 4, label: 'Pants' },
  { index: 5, label: 'Ring' },
  { index: 6, label: 'Shoes' },
  { index: 7, label: 'Ring' },
  { index: 8, label: 'Premium Hat' },
  { index: 9, label: 'Keychain' },
  { index: 10, label: 'Trophy', slot: 'trophy' },
  { index: 11, label: 'Keychain' },
  { index: 12, label: 'Cape', slot: 'cape' },
  { index: 13, label: 'Chat Ring' },
  { index: 14, label: 'Replica Nametag', slot: 'nametag' },
  { index: 15, label: 'Costume', slot: 'costume' }
];

// HELMET (normal hat, slot 0) and PREMIUM_HELMET (cosmetic hat, slot 8) share IDs 1 and 71 in the
// item catalog - a game quirk, not a collision to fix. The resolver mirrors the game and never
// distinguishes the two types, so the picker's single `hat` slot accepts both.
// TROPHY and REPLICA_TROPHY collide the same way (a replica shares its original's ID and art) but
// they are genuinely different items with different names, so both stay in the trophy list.
// The body sprite is the same for every class, so the picker offers every item of the slot's
// type; the class requirement is shown on the option, not enforced. The Skills tab's class only
// decides which talents play and which attack pose fists use.
// The companion slot holds a companion, not an item: its options are the roster reshaped into the
// { rawName, displayName } pair the picker draws. Two roster rows can share one rawName (both
// Glunko The Massive entries are slimeB), and they encode to the same URL, so the list is deduped.
// A roster row with no name is one of the game's unreleased placeholders ("Not officially in the
// game and may never be"): it has no art and no label, so it is not offered. A URL can still name
// one, and the card then reports it has no art yet.
const companionOptions = () => {
  const byRawName = new Map();
  for (const companion of companions) {
    if (!companion.name?.trim() || byRawName.has(companion.rawName)) continue;
    byRawName.set(companion.rawName, companionOption(companion));
  }
  return [...byRawName.values()].sort((a, b) => a.displayName.localeCompare(b.displayName));
};

export const itemsForSlot = (slot) => (slot === 'companion' ? companionOptions() : itemsArray
  .filter((item) => SLOT_TYPES[slot]?.has(item.Type) && Number.isFinite(item.ID))
  .sort((a, b) => (a.lvReqToEquip ?? 0) - (b.lvReqToEquip ?? 0) || a.displayName.localeCompare(b.displayName)));

// A companion's art comes from the monster it is a pet of; everything else is an item icon.
export const iconFor = (slot, value) => (slot === 'companion'
  ? monsterImage(value.rawName)
  : `${prefix}data/${value.rawName}.png`);

// The Wardrobe shows only what the game draws, in the order the design fixed (not slot order):
// body layers first, then the two label decorations, then the companion. The companion has no
// EquipOrder index at all: it lives on the account, not in the character's equipment.
const DRAWN_SLOT_ORDER = ['hat', 'weapon', 'cape', 'costume', 'trophy', 'nametag'];
export const DRAWN_SLOTS = [
  ...DRAWN_SLOT_ORDER.map((slot) => {
    const entry = EQUIPMENT_SLOTS.find((candidate) => candidate.slot === slot);
    return { ...entry, label: slot === 'nametag' ? 'Nametag' : entry.label };
  }),
  { index: null, label: 'Companion', slot: 'companion' }
];
