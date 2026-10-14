// What Killroy's Skull Shop and the Weekly Boss Shop sell that is not an item: weekly boosts,
// permanent upgrades, UI skins and currency deposits. They have a price and a picture but no page,
// so the shop lists them itself. A row that hands over an item is a `sells` edge instead, and the
// two never overlap: a catalog row is exactly a row the edge builder turns down.
import { realItem, skullRowSellsItem, weeklyRowSellsItem } from './edges/currency-shops.mjs';
import { tidy } from './registry/text.mjs';

// The cap each permanent upgrade's decay curve approaches, which is what its `{` reads once maxed.
// The row's own `x1` is its price, not a curve constant, so the cap cannot come from the data.
// UPKEEP: copied from parsers/misc.ts permanentUpgradeCapMap (keyed there by row - 10); re-check both on a game patch.
const SKULL_CAPS = { 11: 2, 13: 10, 14: 3, 16: 2.3, 17: 1.8, 18: 25, 19: 3 };

// UPKEEP: rows 10 onward are the permanent upgrades drawn from etc/Skull_Shop_Item_<row - 10>.png, screen crops with the price baked into the art, so re-crop them when a price changes.
const PERMANENT_ROW = 10;

// The placeholders the game fills from a save; a row still holding one has nothing neutral to say.
const PLACEHOLDER = /[{}$#]/;

// `|` is the game's line split, and a word it wraps keeps its hyphen in front of the break.
// UPKEEP: the game hyphenates a wrapped word as "-_" before a lowercase letter (auto-_matically); re-check the raw strings for other wrap styles on a game patch.
const unwrap = (text) => String(text || '').replace(/\|/g, '_').replace(/-_(?=[a-z])/g, '');

// The curve only approaches its cap, so the row states the ceiling rather than a current value. The
// description writes the number as `{x`, `+{%` or `by {x`: the sign, when there is one, stays in front,
// and "Current bonus" would read as a figure from someone's save, so it loses the word.
// UPKEEP: the game's curve rows say "Current_bonus_is_{x" or "by_{x"; re-check the wording on a game patch.
const skullText = (row, index) => {
  const text = tidy(unwrap(row.description));
  const cap = SKULL_CAPS[index];
  if (cap != null && text.includes('{')) return text.replace('Current_bonus', 'The_bonus').replace(/(\+?)\{/, `up_to_$1${cap}`);
  return text;
};

const skullIcon = (row, index) => {
  if (index >= PERMANENT_ROW) return `/etc/Skull_Shop_Item_${index - PERMANENT_ROW}.png`;
  // A dropping row that reached the catalog names a family (`Timecandy#`, a random one of these),
  // which has no art of its own; its first tier does.
  if (Number(row.x2) === 1 && String(row.bonusName || '').endsWith('#')) return `/data/${row.bonusName.slice(0, -1)}1.png`;
  // The special-handler rows carry the Timecandy1 placeholder as their bonusName, which is not their art.
  return '/etc/Killroy_Skull.png';
};

export const skullCatalog = (killRoySkullShop, items) => {
  const isRealItem = realItem(items);
  return (killRoySkullShop || []).flatMap((row, index) => {
    if (!row || skullRowSellsItem(row, isRealItem)) return [];
    const text = skullText(row, index);
    if (!text || PLACEHOLDER.test(text)) return [];
    const quantity = Number(row.x2) === 1 && Number(row.x3) > 1 ? { quantity: Number(row.x3) } : {};
    return [{ text, price: Number(row.x1 || 0), currency: 'skull', icon: skullIcon(row, index), ...quantity }];
  });
};

// The weekly shop's deposits are "of the type shown to the left": the game draws this week's pick
// beside them, so the art here is the first of each family.
// UPKEEP: keyed by the rawName of the x2 = 0 rows in weeklyBossesShop[1]; a new deposit row needs its art here.
const WEEKLY_ICONS = {
  Quest69: '/etc/Killroy_Skull.png',
  FoodG: '/data/FoodG1.png',
  EquipmentStatues: '/data/EquipmentStatues1.png'
};

// The first list is the UI skins, whose names already end in "_UI"; the second is the deposits.
// A deposit's description leads with the count it hands over. "of the type shown to the left" points
// at the game screen, so those read by name with the count as a quantity; the skulls row is a
// finished sentence and reads as the game wrote it.
// UPKEEP: the deposit count is the leading number of the description; re-check the wording on a game patch.
const DEPOSIT_COUNT = /^(\d+)_/;
const DEPOSIT_ON_SCREEN = /_to_the_left$/;
export const weeklyCatalog = (weeklyBossesShop, items) => {
  const isRealItem = realItem(items);
  const [skins = [], rows = []] = weeklyBossesShop || [];
  const entry = (row, text, icon) => ({ text, price: Number(row.x1 || 0), currency: 'token', icon });
  return [
    // A skin's art is the whole 960px HUD strip, which a square icon would shrink to a line; `cover`
    // tells the list to show a square of it instead.
    ...skins.filter(Boolean).map((row) => ({ ...entry(row, `${row.name}_skin`, `/data/${row.rawName}.png`), iconFit: 'cover' })),
    ...rows.filter((row) => row && !weeklyRowSellsItem(row, isRealItem))
      .map((row) => {
        const icon = WEEKLY_ICONS[row.rawName] ?? null;
        const count = Number(DEPOSIT_COUNT.exec(row.description || '')?.[1]);
        if (!DEPOSIT_ON_SCREEN.test(row.description || '')) return entry(row, tidy(unwrap(row.description)) || row.name, icon);
        return { ...entry(row, row.name, icon), ...(count > 1 ? { quantity: count } : {}) };
      })
  ];
};
