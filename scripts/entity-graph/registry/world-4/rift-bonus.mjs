// UPKEEP: the extractor puts bonus n on riftInfo[5 * (n + 1)], and RiftStuff("riftBonus", n) is on once Rift[0] >= 5 * (n + 1), which the
// game's locked statue labels "RIFT_" + (5 * (n + 1) + 1). Rows without a bonus have no name and are skipped as such.
const bonusOf = (index) => index / 5 - 1;

export default {
  kind: 'riftbonus',
  section: 'riftInfo',
  key: (entry, index) => `RiftBonus${bonusOf(index)}`,
  name: (entry) => entry.riftBonus,
  icon: (entry) => `/etc/${entry.riftBonusIcon}.png`,
  fallbackIcon: '/etc/Rift_0.png',
  // UPKEEP: the extractor hand-keeps these texts (rift.js featuresText); the three mastery bonuses have none, their panels are tables.
  describe: (entry) => entry.riftDescription || null,
  fields: (entry, index) => [{ label: 'Unlocked at', value: `Rift ${index + 1}` }]
};
