// TalentBannedforAllLV, mirrored from the game client: the skillIndexes excluded from every
// "added levels" source (super talent points, AllTalentLVz additions). The last clause is
// unbounded, not a range: every id past 614 (star talents) is excluded.
// Dependency-free on purpose: the builds editor imports this on public pages and must not
// drag the parser modules along (see utility/builds/hydrate.js).
export const isTalentBannedForAllLevels = (skillIndex) => (
  (skillIndex >= 49 && skillIndex <= 59)
  || skillIndex === 149 || skillIndex === 374 || skillIndex === 505 || skillIndex === 539
  || skillIndex > 614
);
