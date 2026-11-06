// The loadout lives in the query string so a look can be shared. These params describe this page
// only, so they are deliberately not in nav-query's SESSION_QUERY_PARAMS: they must not ride along
// to other pages.
export const LOADOUT_PARAMS = ['hat', 'weapon', 'cape', 'costume', 'trophy', 'nametag', 'companion', 'pose', 'name'];
export const SLOT_TYPES = {
  hat: new Set(['HELMET', 'PREMIUM_HELMET']),
  weapon: new Set(['FISTICUFF', 'SPEAR', 'BOW', 'WAND']),
  cape: new Set(['CAPE']),
  costume: new Set(['ATTIRE']),
  // The trophy slot holds either the real trophy or its replica; the game draws both from the same
  // Trophy<ID>disp image, so the canvas treats the two types alike.
  trophy: new Set(['TROPHY', 'REPLICA_TROPHY']),
  // Slot 14 is the replica nametag slot. A few tags exist only as replicas (Tome Immortal, the
  // tournament borders), so the slot must take the replica type too.
  nametag: new Set(['NAMETAG', 'REPLICA_NAMETAG'])
};
const SLOTS = Object.keys(SLOT_TYPES);
// Only the three poses the page offers are addressable: idle, walk and the virtual `attack`,
// which the page resolves to 2a/2b/2c/2_ by weapon type. Kept as a local set rather than imported
// from paperDoll.js, so the query helpers stay free of the drawing code.
const POSES = new Set(['0', '1', 'attack']);

// In-game names are alphanumeric and capped at 16 characters, and the label font only ships art
// for [A-Za-z0-9] plus a space advance, so anything else is dropped rather than drawn as a gap.
export const MAX_NAME_LENGTH = 16;
export const DEFAULT_NAME = 'Mannequin';
export const sanitiseName = (value) => String(value ?? '').replace(/[^A-Za-z0-9]/g, '').slice(0, MAX_NAME_LENGTH);

const SLOT_INDEX = { hat: 0, premiumHat: 8, weapon: 1, trophy: 10, cape: 12, nametag: 14, costume: 15 };
// EquipOrder slot 8 is the premium (cosmetic) hat, verified in the game code; the game draws it
// instead of slot 0's normal hat whenever it's actually equipped, both using frame ID + 2 on the
// same hat sheet (see components/tools/wardrobe/slots.js).
const BLANK_HAT_NAMES = new Set(['Blank', 'EquipmentHats38']); // EquipmentHats38 = Invisible Hat

// items is the catalog, passed in so these helpers stay free of the game data.
export const loadoutFromCharacter = (character, items, companion = null) => {
  const slotItem = (equipped) => {
    const item = items[equipped?.rawName];
    return item && Number.isFinite(item.ID) ? item : null;
  };
  const premiumHat = character.equipment?.[SLOT_INDEX.premiumHat];
  const premiumHatItem = premiumHat?.rawName && !BLANK_HAT_NAMES.has(premiumHat.rawName)
    ? slotItem(premiumHat)
    : null;
  return {
    pose: '0',
    name: sanitiseName(character.name) || DEFAULT_NAME,
    hat: premiumHatItem ?? slotItem(character.equipment?.[SLOT_INDEX.hat]),
    weapon: slotItem(character.equipment?.[SLOT_INDEX.weapon]),
    cape: slotItem(character.equipment?.[SLOT_INDEX.cape]),
    costume: slotItem(character.equipment?.[SLOT_INDEX.costume]),
    trophy: slotItem(character.equipment?.[SLOT_INDEX.trophy]),
    nametag: slotItem(character.equipment?.[SLOT_INDEX.nametag]),
    companion
  };
};

const first = (value) => (Array.isArray(value) ? value[0] : value);

// Every default is omitted so a bare /tools/wardrobe encodes to an empty query: the page's
// mirror-to-URL guard then matches and skips the hydration-time router.replace entirely.
export const encodeLoadout = (loadout) => {
  const query = {};
  for (const slot of SLOTS) {
    if (loadout[slot]?.rawName) query[slot] = loadout[slot].rawName;
  }
  if (loadout.companion?.rawName) query.companion = loadout.companion.rawName;
  if (loadout.pose && loadout.pose !== '0') query.pose = loadout.pose;
  if (loadout.name && loadout.name !== DEFAULT_NAME) query.name = loadout.name;
  return query;
};

// The wardrobe renders every slot value through `displayName`, which a companion has no field for:
// its roster entry carries `name`. One shape for both the picker's options and the loadout, so a
// seeded companion and a picked one render and compare the same way. The four unreleased
// companions ("Not officially in the game") carry no name at all, so they fall back to the raw one.
export const companionOption = (companion) =>
  (companion ? { ...companion, displayName: companion.name ?? companion.rawName } : null);

// The companion is not an equipment item: it is one of the game's companions, addressed by the
// monster rawName its art comes from, so it resolves against that list rather than the catalog.
export const decodeLoadout = (query, items, companions) => {
  const pose = first(query?.pose);
  const loadout = {
    pose: POSES.has(pose) ? pose : '0',
    name: sanitiseName(first(query?.name)) || DEFAULT_NAME
  };
  for (const slot of SLOTS) {
    const item = items?.[first(query?.[slot])];
    loadout[slot] = item && SLOT_TYPES[slot].has(item.Type) ? item : null;
  }
  const companionRawName = first(query?.companion);
  loadout.companion = companionOption(companions?.find(({ rawName }) => rawName === companionRawName));
  return loadout;
};
