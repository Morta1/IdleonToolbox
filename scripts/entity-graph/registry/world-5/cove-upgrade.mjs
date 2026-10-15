import { gameTable } from '../data.mjs';

// UPKEEP: RandoListo2[11..14] are the cove's names, texts, bonus per level and cost base (crystal-glunko-cove.ts).
const rows = (data) => (data.randomList2?.[11] || []).map((name, t) => ({
  name,
  description: data.randomList2?.[12]?.[t],
  perLevel: Number(data.randomList2?.[13]?.[t]),
  costBase: Number(data.randomList2?.[14]?.[t])
}));
// The cglunkoUpgradeCost table (Holes2 Cglunko_upgCost and the cove panel): odd slots cost oddScale x; slot t is paid in
// gooey shape floor((t % tabSize) / perShape) + shapesPerTab * floor(t / tabSize). No table, no price and no tab.
const shapeOf = (t, cove) => Math.floor((t % cove.tabSize) / cove.perShape) + cove.shapesPerTab * Math.floor(t / cove.tabSize);
const scaleOf = (t, cove) => (t % 2 === 1 ? cove.oddScale : 1);
// UPKEEP: the shape items are named "Gooey_Triangle_(Dungeon)"; the suffix is dropped.
const currencyOf = (shape, data) => String(data.items?.[`HoleGshape${shape}`]?.displayName ?? '').replace(/_/g, ' ').replace(' (Dungeon)', '');
// UPKEEP: the cove's two tabs are Crystal, then Jeweled. Not extracted: the tab names are drawn as art, never written as text.
const TABS = ['Crystal', 'Jeweled'];

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
  cost: (entry, index, data) => {
    const cove = gameTable(data, 'cglunkoUpgradeCost');
    return cove
      ? { formula: 'scaledPowPlusLevelFloor', args: { scale: scaleOf(index, cove), rate: entry.costBase }, currency: currencyOf(shapeOf(index, cove), data) }
      : null;
  },
  costs: (entry, index, data) => {
    const cove = gameTable(data, 'cglunkoUpgradeCost');
    return cove ? [{ item: `HoleGshape${shapeOf(index, cove)}`, qty: scaleOf(index, cove) }] : [];
  },
  fields: (entry, index, data) => {
    const cove = gameTable(data, 'cglunkoUpgradeCost');
    return [{ label: 'Tab', value: cove ? TABS[Math.floor(index / cove.tabSize)] : null }];
  }
};
