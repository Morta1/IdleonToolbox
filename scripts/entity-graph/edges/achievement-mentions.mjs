// What an achievement is about.
//
// 208 of the 268 achievement pages were leaves: a name, a description, and nothing to click. The
// description is what fixes that, because it names the thing the achievement is for - "Equip the
// Copper Helmet and Copper Platebody", "Defeat Grandfrogger", "Get the mining certificate from
// Glumlee" - and every one of those is already a page here.
//
// Matching is exact on the entity's own display name, the same rule the rest of the graph resolves
// by, so nothing is guessed. Three guards keep it that way:
//
//  - Longest name first, and a matched span is consumed. "Bad Doggy!" names Chaotic Amarok, and
//    without this it would also match the Amarok inside it and link to the wrong monster.
//  - A single-word item name is never matched. There are items called Cool, Rock and Target, and
//    they turn ordinary sentences into links. Monsters and NPCs keep their single-word names, which
//    is where Grandfrogger and Glumlee come from.
//  - Nothing shorter than five characters, which drops the short names that are really
//    abbreviations.
const MIN_NAME = 5;
const KINDS = new Set(['item', 'monster', 'npc']);

// Names the game reuses for something that is not the entity. Each of these is an ore or a fish
// whose name is also a game term, and in every case the achievement means the term:
//
//   Copper, Dementia  the Deathnote skull ranks, as in "Get a Copper Skull or higher"
//   Divinity          the World 5 system, as in "Unlock the 3rd Divinity God"
//   Kraken            a World 3 tower, as in "without placing a single Kraken Tower"
//
// Nothing is lost by dropping them. Copper is named in three descriptions and the other two are
// already claimed by the longer Copper Ore and Copper Helmet, so only the skull one falls through.
const AMBIGUOUS = new Set(['Copper', 'Dementia', 'Divinity', 'Kraken']);

const plain = (value) => String(value || '').replace(/_/g, ' ');

// Pets are deliberately out. A pet carries its monster's name, so every monster match would have a
// second identical pet match behind it, and the monster is the one the achievement means.
const candidates = (nodes) => Object.entries(nodes)
  .filter(([, node]) => KINDS.has(node.kind) && node.name)
  .map(([id, node]) => ({ id, kind: node.kind, name: plain(node.name) }))
  .filter((entry) => entry.name.length >= MIN_NAME)
  .filter((entry) => entry.kind !== 'item' || entry.name.includes(' '))
  .filter((entry) => !AMBIGUOUS.has(entry.name))
  // Longest first so the most specific name claims its span before a shorter one inside it can.
  .sort((a, b) => b.name.length - a.name.length);

export const achievementMentionEdges = (nodes) => {
  const pool = candidates(nodes);
  const edges = [];

  for (const [id, node] of Object.entries(nodes)) {
    if (node.kind !== 'achievement' || !node.description) continue;
    const text = plain(node.description);
    const claimed = [];
    const seen = new Set();

    for (const entry of pool) {
      const at = text.indexOf(entry.name);
      if (at === -1 || seen.has(entry.id)) continue;
      const end = at + entry.name.length;
      if (claimed.some(([from, to]) => at < to && end > from)) continue;
      claimed.push([at, end]);
      seen.add(entry.id);
      edges.push({ from: id, to: entry.id, rel: 'about', meta: {}, source: 'achievement-mentions' });
    }
  }
  return edges;
};
