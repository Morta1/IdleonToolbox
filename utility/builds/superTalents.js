// Super Talent Points — the game lets you spend a limited pool of points to
// give individual talents a big flat level boost. Build guides need to say
// where those points go, so authors mark them here and readers see the same
// golden border the game draws.
//
// Game rules mirrored from the client:
//   Thingies("SuperTalentPTS_totaltospend")
//     = min(20, floor(max(0, classLv - 400) / 100) + spelunkLore5)
//   RunCodeOfTypeXforThingY("TalentBannedforAllLV")
//     = talents excluded from every "added levels" source, super points included.
//
// The per-point level gain is account-dependent (50 + Legend Talent 7 + Zenith 5),
// so it isn't shown here — a build can't know the reader's account.

export const SUPER_TALENT_MAX_POINTS = 20;

// Talents that can never receive a super talent point.
export const isSuperTalentEligible = (skillIndex) => {
  // Explicit, because Number(null) is 0 and 0 is a real talent — a stored
  // null would otherwise star the first talent of the first tab.
  if (skillIndex == null || skillIndex === '') return false;
  const index = Number(skillIndex);
  if (!Number.isInteger(index)) return false;
  if (index >= 49 && index <= 59) return false;
  if (index === 149 || index === 374 || index === 505 || index === 539) return false;
  return index >= 0 && index <= 614;
};

// Flat list of every starred skillIndex across all tabs. Super points are one
// per-character pool, not per-tab, so the cap counts the whole build.
export const collectSuperTalents = (tabs) => {
  const indices = [];
  (tabs || []).forEach((tab) => {
    (tab?.talents || []).forEach((talent) => {
      if (!talent?.isSuperTalent) return;
      if (talent.skillIndex == null) return;
      if (!isSuperTalentEligible(talent.skillIndex)) return;
      indices.push(Number(talent.skillIndex));
    });
  });
  return indices.slice(0, SUPER_TALENT_MAX_POINTS);
};
