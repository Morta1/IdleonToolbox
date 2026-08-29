// The 25 playable classes, and the tree they promote along.
//
// Classes earn a page now that talents have one. A talent page says which tab a talent sits in, and
// a class page is the other half: what a Blood Berserker is, what it came from, and which talents
// are its own.
//
// Nothing about the tree is written down here. z-processing reads it out of the game's own
// ClassPromotionChoices - entry 7, Warrior, is ["8","9"], which is Barbarian and Squire - and
// exports it as classPromotions, so the promotion tree, the talent-tab chain and the Basics tab in
// front of each base class all arrive as data. parsers/classDefinitions.ts keeps the same tree by
// hand for the builds tool, and __test__ asserts the two agree.
//
// Infinilyte and Spiritual Monk are in the game's promotion list with art and family bonuses, but
// neither has a talent tab, so nobody can be one. They carry released: false and are left out: a
// class page with no talents and nothing to promote into is a page about nothing.

// A family is the branch a class sits on, and the first tab of its chain is what says which:
// Blood Berserker starts at Rage Basics, and the class that owns Rage Basics is Warrior.
const familyOf = (promotions, entry) => {
  const first = entry?.talentTabs?.[0];
  if (!first) return null;
  const owner = Object.entries(promotions)
    .find(([, other]) => other?.basicsTab === first);
  return owner ? owner[0] : first;
};

// Beginner, then the three it promotes into, in the game's own index order.
const familyRank = (promotions, family) => promotions?.[family]?.index ?? Number.MAX_SAFE_INTEGER;

export const classOrder = (promotions) => Object.entries(promotions || {})
  .filter(([, entry]) => entry?.released)
  .map(([name, entry]) => ({ name, entry, family: familyOf(promotions, entry) }))
  .sort((a, b) => (
    familyRank(promotions, a.family) - familyRank(promotions, b.family)
    || a.entry.index - b.entry.index
  ));

export const classNodes = (promotions) => {
  const nodes = {};
  for (const [position, { name, entry, family }] of classOrder(promotions).entries()) {
    nodes[`class:${name}`] = {
      kind: 'class',
      rawName: name,
      name,
      // The index in classes.json is what the art is named after: Blood Berserker sits at 10 and
      // draws from ClassIcons10.png.
      icon: entry.index >= 0 ? `/data/ClassIcons${entry.index}.png` : null,
      // The family reads as the category so the listing bands into the four the game has, rather
      // than 25 bands of one.
      category: String(family || '').replace(/_/g, ' '),
      // How far along its own branch it sits: Beginner and Warrior are 0, Barbarian 1, Death
      // Bringer 3. Counted from the chain with the Basics tab dropped, since that is a tab and not
      // a step anybody promotes through.
      tier: Math.max(0, (entry.talentTabs || [])
        .filter((tab) => !/basics$/i.test(tab))
        .indexOf(name)),
      order: position,
      basicsTab: entry.basicsTab ? entry.basicsTab.replace(/_/g, ' ') : null,
      talentTabs: (entry.talentTabs || []).map((tab) => tab.replace(/_/g, ' '))
    };
  }
  return nodes;
};
