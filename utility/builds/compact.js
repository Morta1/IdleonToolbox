// Inverse of hydrate(): takes the full build shape (as edited in BuildForm) and
// produces the compact payload we store in Mongo. Drops static reference data,
// drops talents with level 0 / empty string, drops tabs with no content.
//
// Input (what BuildForm submits):
//   {
//     class, subclass, title, description, tags, isAnonymous,
//     tabs: [ { name, note, talents: [{ skillIndex, level, ... }] } ]
//   }
//
// Output (what we store under `payload`):
//   { v: 1, tabs: [ null | { note, talents: { [skillIndex]: number | string } } ] }

const isMeaningfulLevel = (level) => {
  if (level == null) return false;
  if (typeof level === 'string') {
    const trimmed = level.trim();
    if (!trimmed) return false;
    // numeric strings: "0" → false, "35" → true
    const n = Number(trimmed);
    if (!Number.isNaN(n)) return n !== 0;
    // annotation strings like "*1" — keep
    return true;
  }
  return level !== 0;
};

const coerceLevel = (level) => {
  if (typeof level === 'string') {
    const trimmed = level.trim();
    const n = Number(trimmed);
    if (!Number.isNaN(n)) return n; // "35" → 35
    return trimmed; // "*1" stays as string
  }
  return level;
};

export const compactPayload = (fullBuild) => {
  const tabs = (fullBuild?.tabs || []).map((tab) => {
    if (!tab) return null;
    const talentMap = {};
    (tab.talents || []).forEach((t) => {
      if (!isMeaningfulLevel(t?.level)) return;
      if (t?.skillIndex == null) return;
      talentMap[String(t.skillIndex)] = coerceLevel(t.level);
    });
    const hasNote = typeof tab.note === 'string' && tab.note.trim().length > 0;
    const hasTalents = Object.keys(talentMap).length > 0;
    if (!hasNote && !hasTalents) return null;
    const out = {};
    if (hasNote) out.note = tab.note.trim();
    if (hasTalents) out.talents = talentMap;
    return out;
  });

  // Trim trailing nulls so we don't waste bytes on empty tails
  while (tabs.length > 0 && tabs[tabs.length - 1] == null) tabs.pop();

  return { v: 1, tabs };
};

// Take an incoming edit/create form object and produce the full document shape
// the Worker expects on POST / PUT.
export const toStorageBuild = ({
  class: className,
  subclass,
  title,
  description,
  tags,
  isAnonymous,
  tabs
}) => ({
  class: className,
  subclass: subclass || null,
  title: (title || '').trim(),
  description: (description || '').trim(),
  tags: Array.isArray(tags) ? tags.slice(0, 5) : [],
  isAnonymous: !!isAnonymous,
  payload: compactPayload({ tabs })
});
