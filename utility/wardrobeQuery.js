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
  nametag: new Set(['NAMETAG'])
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
