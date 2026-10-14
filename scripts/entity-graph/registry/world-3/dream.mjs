import { sentence } from '../text.mjs';

// Field values render as written, so game names are spaced here.
const spaced = (text) => String(text || '').replace(/_/g, ' ');

export default {
  kind: 'dream',
  section: 'equinoxChallenges',
  // UPKEEP: the game titles challenge i "Dream #(i + 1)" (N.js "Dream_#" + CloudsTask + 1), so a key by table position renumbers every dream after an inserted one, in game too.
  key: (entry, index) => `Dream${index + 1}`,
  name: (entry, index) => `Dream_#${index + 1}`,
  fallbackIcon: '/data/Dream_Cloud.png',
  describe: (entry) => sentence(entry.label),
  fields: (entry) => [
    { label: 'Reward', value: spaced(entry.reward) },
    // A goal of 1 is a yes/no task: the sentence already says it.
    ...(Number(entry.goal) > 1 ? [{ label: 'Target', value: Number(entry.goal) }] : [])
  ]
};
