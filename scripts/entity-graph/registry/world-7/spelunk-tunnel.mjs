import { listAt } from '../data.mjs';
import { nodeId } from '../links.mjs';
import { spaced } from '../text.mjs';

// The tunnel names and the lore boss depths - 1 are listIndexes.tunnelNames and tunnelBossDepths (_customEvent_SpelunkStuff,
// _customEvent_InsideCavernStuff).
const namesOf = (data) => listAt(data.generalSpelunky, data, 'tunnelNames');
// UPKEEP: generalSpelunky[14] holds the lore boss reward text. Not extracted: only a numbered event reads it (_event_5), which no
// locator may anchor on.
const REWARDS = 14;
// UPKEEP: tunnel i draws its objects as CaveRock<letter><rock>, letters a-j in tunnel order.
const LETTERS = 'abcdefghij';
// UPKEEP: a tunnel's last rock row is its lore boss; the discovery count sums length - 1 per tunnel (N.js:118807).
const bossOf = (rocks) => rocks.at(-1);

// "Greg, the lore boss of Blushpit": the World 6 rows that a lore boss unlocks name it by this.
export const loreBossOf = (data, tunnel) => {
  const rocks = data.spelunkingRocks?.[tunnel];
  const name = namesOf(data)?.[tunnel];
  return rocks?.length && name ? `${spaced(bossOf(rocks).name)}, the lore boss of ${spaced(name)}` : null;
};

// The page id of a tunnel, for the rows a lore boss unlocks.
export const tunnelId = (tunnel) => nodeId(row, { index: tunnel });

const row = {
  kind: 'spelunktunnel',
  section: (data) => (namesOf(data) || []).map((name, index) => ({ name, index })),
  key: (entry) => `SpelunkTunnel${entry.index}`,
  icon: (entry, index, data) => `/data/CaveRock${LETTERS[index]}${(data.spelunkingRocks?.[index]?.length ?? 1) - 1}.png`,
  fallbackIcon: '/etc/Spelunking.png',
  // UPKEEP: unreleased tunnels are named Name11, Name12 and so on, with no rocks.
  skip: (entry, index, data) => (/^Name\d+$/.test(entry.name) || !data.spelunkingRocks?.[index] ? 'placeholder: unreleased tunnel' : false),
  describe: (entry, index, data) => `Lore_boss_reward:_${data.generalSpelunky[REWARDS][index]}`,
  fields: (entry, index, data) => {
    const rocks = data.spelunkingRocks[index];
    const depths = listAt(data.generalSpelunky, data, 'tunnelBossDepths');
    return [
      { label: 'Lore boss', value: spaced(bossOf(rocks).name) },
      { label: 'Lore boss depth', value: depths ? Number(depths[index]) + 1 : null },
      { label: 'Objects', value: rocks.slice(0, -1).map(({ name }) => spaced(name)) }
    ];
  }
};

export default row;
