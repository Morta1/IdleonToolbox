// What the system pages in nodes/systems.mjs cost, as the same two relations the rest of the
// graph already uses, so an item's existing "Used in crafting" and "Used in upgrades" sections
// pick them up without a section of their own:
//   - a chip or jewel is made once from three items: craftedFrom, with the amount
//   - a prayer or building is levelled with one item on a rising curve: upgradedWith, with the
//     level-one cost as baseCost (what a bubble's edge carries too)

// Chips and jewels also cost a cooking meal and a spice. Neither is an item, so they point at the
// meal and spice pages from nodes/systems.mjs instead.
const costTarget = (rawName) => {
  if (/^CookingM\d+$/.test(rawName)) return `meal:${rawName}`;
  if (/^CookingSpice\d+$/.test(rawName)) return `spice:${rawName}`;
  return `item:${rawName}`;
};

const crafted = (from, requirements) => (requirements || [])
  .filter((req) => req?.rawName)
  .map((req) => ({
    from,
    to: costTarget(req.rawName),
    rel: 'craftedFrom',
    meta: req.amount > 0 ? { quantity: Number(req.amount) } : {},
    source: 'systems'
  }));

const upgraded = (from, rawName, baseCost) => ({
  from,
  to: `item:${rawName}`,
  rel: 'upgradedWith',
  meta: baseCost > 0 ? { baseCost: Number(baseCost) } : {},
  source: 'systems'
});

export const labEdges = (chips, jewels) => [
  ...(chips || []).filter((chip) => chip?.rawName).flatMap((chip) => crafted(`chip:${chip.rawName}`, chip.requirements)),
  ...(jewels || []).flatMap((jewel) => crafted(`jewel:ConsoleJwl${jewel.index}`, jewel.requirements))
];

export const prayerEdges = (prayers) => (prayers || [])
  .filter((prayer) => prayer?.soul)
  .map((prayer) => upgraded(`prayer:Prayer${prayer.prayerIndex}`, prayer.soul, prayer.costMulti));

// The Salt Lick is a building that sells upgrades of its own, eleven of them paid in six of the
// salts. They have no names to tell them apart, so each salt is linked once with no cost; a salt
// the building's own levels already charge keeps that costed edge instead of a second row.
export const buildingEdges = (towers, saltLicks) => {
  const edges = Object.entries(towers || {}).flatMap(([name, tower]) => (tower?.itemReq || [])
    .filter((req) => req?.rawName)
    .map((req) => upgraded(`building:${name}`, req.rawName, req.amount)));
  const lickCovered = new Set(edges.filter((edge) => edge.from === 'building:Salt_Lick').map((edge) => edge.to));
  for (const rawName of new Set((saltLicks || []).map((upgrade) => upgrade?.rawName).filter(Boolean))) {
    if (lickCovered.has(`item:${rawName}`)) continue;
    edges.push(upgraded('building:Salt_Lick', rawName, 0));
  }
  return edges;
};
