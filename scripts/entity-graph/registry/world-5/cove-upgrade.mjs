// UPKEEP: RandoListo2[11..14] are the cove's names, texts, bonus per level and cost base (crystal-glunko-cove.ts).
const rows = (data) => (data.randomList2?.[11] || []).map((name, t) => ({
  name,
  description: data.randomList2?.[12]?.[t],
  perLevel: Number(data.randomList2?.[13]?.[t]),
  costBase: Number(data.randomList2?.[14]?.[t])
}));
// UPKEEP: Cglunko_upgCost: odd slots cost 5x; slot t is paid in gooey shape floor((t % 12) / 2) + 6 * floor(t / 12).
const shapeOf = (t) => Math.floor((t % 12) / 2) + 6 * Math.floor(t / 12);
const scaleOf = (t) => (t % 2 === 1 ? 5 : 1);
// UPKEEP: the shape items are named "Gooey_Triangle_(Dungeon)"; the suffix is dropped.
const currencyOf = (t, data) => String(data.items?.[`HoleGshape${shapeOf(t)}`]?.displayName ?? '').replace(/_/g, ' ').replace(' (Dungeon)', '');
// UPKEEP: the cove has two tabs of 12 upgrades: Crystal, then Jeweled.
const TAB_SIZE = 12;

export default {
  kind: 'coveupgrade',
  section: rows,
  key: (entry, index) => `CoveUpgrade${index}`,
  fallbackIcon: '/etc/Cavern_17.png',
  // UPKEEP: the game's slot for a World 7 skill not released yet.
  skip: (entry) => (entry.name === 'IDK_Broh' ? 'placeholder: not released' : false),
  effect: (entry) => ({
    levelLabel: 'Upgrade level',
    cap: null,
    terms: [
      { token: '{', formula: 'linear', args: { perLevel: entry.perLevel } },
      { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.perLevel / 100 } },
      { token: '$', formula: 'diminishingPercent', args: { perLevel: entry.perLevel } }
    ]
  }),
  // The game's discounts (Active Drops, Study 17) are left out: they depend on the player, so the default base-cost note applies.
  cost: (entry, index, data) => ({
    formula: 'scaledPowPlusLevelFloor',
    args: { scale: scaleOf(index), rate: entry.costBase },
    currency: currencyOf(index, data)
  }),
  costs: (entry, index) => [{ item: `HoleGshape${shapeOf(index)}`, qty: scaleOf(index) }],
  fields: (entry, index) => [{ label: 'Tab', value: index < TAB_SIZE ? 'Crystal' : 'Jeweled' }]
};
