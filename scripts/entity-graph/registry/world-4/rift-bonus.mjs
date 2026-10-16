import { linked } from '../../../../utility/wiki/field-links.mjs';
import { gameTable } from '../data.mjs';
import { nodeId } from '../links.mjs';
import rift from './rift.mjs';

// UPKEEP: bonus n is the n-th riftInfo row that carries a bonus (the extractor puts it on the row of the rift that unlocks it). Rows without
// a bonus have no name and are skipped as such.
const bonusOf = (index, data) => (data.riftInfo || []).slice(0, index).filter((entry) => entry?.riftBonus).length;

// RiftStuff("riftBonus", n) is on once Rift[0] >= step x (n + 1) (the riftBonusStep table), which the game's locked statue labels
// "RIFT_" + (step x (n + 1) + 1); Rift[0] is the rift's number minus one. No table, no field.
const unlockField = (index, data) => {
  const step = gameTable(data, 'riftBonusStep')?.step;
  if (step === undefined) return null;
  const level = step * (bonusOf(index, data) + 1);
  return linked({ label: 'Unlocked at', value: `Rift ${level + 1}` }, 'unlockedBy', nodeId(rift, null, level, data));
};

const row = {
  kind: 'riftbonus',
  section: 'riftInfo',
  key: (entry, index, data) => `RiftBonus${bonusOf(index, data)}`,
  name: (entry) => entry.riftBonus,
  icon: (entry) => `/etc/${entry.riftBonusIcon}.png`,
  fallbackIcon: '/etc/Rift_0.png',
  // UPKEEP: the extractor hand-keeps these texts (rift.js featuresText); the three mastery bonuses have none, their panels are tables. Not extracted: the game draws these as panels, with no text to read.
  describe: (entry) => entry.riftDescription || null,
  fields: (entry, index, data) => [unlockField(index, data)].filter(Boolean)
};

export default row;
