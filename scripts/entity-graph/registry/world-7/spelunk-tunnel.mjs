import { spaced } from '../text.mjs';

// UPKEEP: generalSpelunky[6] holds the tunnel names, [7] the lore boss depth - 1, [14] the lore boss reward text.
const NAMES = 6;
const BOSS_DEPTH = 7;
const REWARDS = 14;
// UPKEEP: tunnel i draws its objects as CaveRock<letter><rock>, letters a-j in tunnel order.
const LETTERS = 'abcdefghij';
// UPKEEP: a tunnel's last rock row is its lore boss; the discovery count sums length - 1 per tunnel (N.js:118807).
const bossOf = (rocks) => rocks.at(-1);

// "Greg, the lore boss of Blushpit": the World 6 rows that a lore boss unlocks name it by this.
export const loreBossOf = (data, tunnel) => {
  const rocks = data.spelunkingRocks?.[tunnel];
  const name = data.generalSpelunky?.[NAMES]?.[tunnel];
  return rocks?.length && name ? `${spaced(bossOf(rocks).name)}, the lore boss of ${spaced(name)}` : null;
};

export default {
  kind: 'spelunktunnel',
  section: (data) => (data.generalSpelunky?.[NAMES] || []).map((name, index) => ({ name, index })),
  key: (entry) => `SpelunkTunnel${entry.index}`,
  icon: (entry, index, data) => `/data/CaveRock${LETTERS[index]}${(data.spelunkingRocks?.[index]?.length ?? 1) - 1}.png`,
  fallbackIcon: '/etc/Spelunking.png',
  // UPKEEP: unreleased tunnels are named Name11, Name12 and so on, with no rocks.
  skip: (entry, index, data) => (/^Name\d+$/.test(entry.name) || !data.spelunkingRocks?.[index] ? 'placeholder: unreleased tunnel' : false),
  describe: (entry, index, data) => `Lore_boss_reward:_${data.generalSpelunky[REWARDS][index]}`,
  fields: (entry, index, data) => {
    const rocks = data.spelunkingRocks[index];
    return [
      { label: 'Lore boss', value: spaced(bossOf(rocks).name) },
      { label: 'Lore boss depth', value: Number(data.generalSpelunky[BOSS_DEPTH][index]) + 1 },
      { label: 'Objects', value: rocks.slice(0, -1).map(({ name }) => spaced(name)) }
    ];
  }
};
