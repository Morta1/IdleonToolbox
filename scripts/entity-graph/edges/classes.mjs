// What a class is: where it sits in the promotion tree, and which talents are its own.
//
// A class teaches the talents on its own tab, and a base class also teaches the Basics tab that
// sits in front of it - a Warrior's first five talents are in Rage Basics, which is a tab and not
// a class. Inherited talents are deliberately NOT repeated: a Death Bringer would otherwise list
// 65, most of them Warrior's, and the promotion chain is one click away in either direction. The
// Star Talents belong to no class at all and stay unattached.
//
// Both relations come from classPromotions, which z-processing reads out of the game.
export const classEdges = (nodes, promotions) => {
  const edges = [];

  for (const [name, entry] of Object.entries(promotions || {})) {
    if (!entry?.released) continue;
    for (const child of entry?.promotesTo || []) {
      if (!nodes[`class:${name}`] || !nodes[`class:${child}`]) continue;
      edges.push({
        from: `class:${name}`, to: `class:${child}`, rel: 'promotesTo', meta: {}, source: 'classes'
      });
    }
  }

  // A tab's talents are found by the category they already carry, which is the tab's own name.
  const tabs = new Map();
  for (const [id, node] of Object.entries(nodes)) {
    if (node.kind !== 'talent') continue;
    if (!tabs.has(node.category)) tabs.set(node.category, []);
    tabs.get(node.category).push(id);
  }

  for (const [name, entry] of Object.entries(promotions || {})) {
    if (!entry?.released || !nodes[`class:${name}`]) continue;
    const own = [name.replace(/_/g, ' '), entry?.basicsTab?.replace(/_/g, ' ')].filter(Boolean);
    for (const tab of own) {
      for (const talent of tabs.get(tab) || []) {
        edges.push({
          from: `class:${name}`, to: talent, rel: 'teaches', meta: {}, source: 'classes'
        });
      }
    }
  }
  return edges;
};
