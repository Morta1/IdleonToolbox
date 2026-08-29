// Every dashboard alert carries a dot path naming the alert data it renders ("World 2.alchemy.sigils"
// on the account tab, "worship.chargeOverdue" on the characters tab). The path is a hint, not a
// config address: the alert builders flatten some trackers' options up a level (General.gemsFromBosses
// is really the General.etc tracker's gemsFromBosses option), and some paths end in a plain data key
// ("shops.items"). So the path is matched against the saved config instead of trusted, and anything
// that doesn't line up degrades to the closest thing that does - tracker without option, or section
// without tracker.

const TAB_INDEX = { account: 0, characters: 1, timers: 2 };

// The characters config is a flat list of trackers; account and timers group theirs under sections.
const hasSections = (root) => {
  const firstValue = root ? Object.values(root)?.[0] : null;
  return Boolean(firstValue) && typeof firstValue === 'object' && !('checked' in firstValue);
};

const findTracker = (fields, name) => {
  if (!fields || !name) return null;
  if (fields[name]) return name;
  // The name is an option: find whichever tracker owns it.
  return Object.entries(fields).find(([, tracker]) =>
    tracker?.options?.some((option) => option?.name === name))?.[0] ?? null;
};

export const resolveSettingsTarget = (config, configType, target) => {
  const root = config?.[configType];
  if (!root || !target) return null;

  const parts = String(target).split('.').filter(Boolean);
  const sectioned = hasSections(root);
  const section = sectioned && root[parts[0]] ? parts[0] : null;
  const rest = section ? parts.slice(1) : parts;
  const fields = section ? root[section] : (sectioned ? null : root);
  if (!fields) return { tab: TAB_INDEX[configType], configType, section, trackerName: null, optionName: null };

  const trackerName = findTracker(fields, rest[0]) ?? findTracker(fields, rest[1]);
  const tracker = trackerName ? fields[trackerName] : null;
  // Whichever of the two path tails names one of the tracker's options - "alchemy.sigils" puts it
  // second, "gemsFromBosses" first. The deeper one wins: a tracker can carry an option named after
  // itself ("talents.talents"), which would otherwise swallow "talents.unmaxedTalents".
  const optionNames = tracker?.options?.map((option) => option?.name) ?? [];
  const optionName = [rest[1], rest[0]].find((name) => name && optionNames.includes(name)) ?? null;

  return { tab: TAB_INDEX[configType], configType, section, trackerName, optionName };
};

export default resolveSettingsTarget;
