import { dropReadout, spaced, tidy } from '../registry/text.mjs';
import { gameTable } from '../registry/data.mjs';

// Game systems whose parts are worth a page each: the Lab's chips and jewels, the Worship
// prayers, and the Construction buildings. None of them is an item, but each costs items, and
// before these pages existed the items they cost had no way to say so.
//
// Descriptions are filled at their base value, so a page reads "+10% Total Defence" rather than
// the raw "+{%" template. What a player actually gets depends on levels and account bonuses a
// save-less page cannot see.
const fill = (template, value) => String(template || '').replace(/[{}]/g, value);

// A chip's text is its bonus and nothing more, so it is the Details box's one row and the page shows the box.
export const chipNodes = (chips) => Object.fromEntries((chips || [])
  .filter((chip) => chip?.rawName && chip?.name)
  .map((chip) => [`chip:${chip.rawName}`, {
    kind: 'chip',
    rawName: chip.rawName,
    name: chip.name,
    icon: `/data/ConsoleChip${chip.index}.png`,
    category: 'World 4',
    description: fill(chip.bonus, chip.baseVal),
    fields: [{ label: 'Bonus', value: spaced(fill(chip.bonus, chip.baseVal)) }],
    hideDescription: true
  }]));

// The number a jewel's text fills, with the sign and unit around it ("+}%", "}x", "1.}x"), so the box reads as the text does.
const jewelBonus = (effect, bonus) => {
  const [around] = /[+-]?(?:1\.)?\}[%x]?/.exec(String(effect)) || [];
  return around ? around.replace('}', bonus) : null;
};

// A jewel's text explains itself beyond its number, so it stays the page's prose; the box holds the number.
export const jewelNodes = (jewels) => Object.fromEntries((jewels || [])
  .filter((jewel) => jewel?.name)
  .map((jewel) => [`jewel:ConsoleJwl${jewel.index}`, {
    kind: 'jewel',
    rawName: `ConsoleJwl${jewel.index}`,
    name: jewel.name,
    icon: `/data/ConsoleJwl${jewel.index}.png`,
    category: 'World 4',
    description: fill(tidy(dropReadout(jewel.effect)), jewel.bonus),
    fields: [{ label: 'Bonus', value: jewelBonus(jewel.effect, jewel.bonus) }].filter(({ value }) => value != null)
  }]));

// Cooking meals and spices. Neither is an item (they live in the kitchen, not an inventory), but
// the Lab charges them for every chip and jewel, so each gets a page those costs can link to.
// A meal's index in the menu is its CookingM number; its bonus grows with its level.
export const mealNodes = (cookingMenu) => Object.fromEntries((cookingMenu || [])
  .map((meal, index) => [meal, index])
  .filter(([meal]) => meal?.name)
  .map(([meal, index]) => [`meal:CookingM${index}`, {
    kind: 'meal',
    rawName: `CookingM${index}`,
    name: meal.name,
    icon: `/data/CookingM${index}.png`,
    category: 'World 4',
    description: `Level 1: ${fill(meal.effect, meal.baseStat)}`
  }]));

export const spiceNodes = (spiceNames) => Object.fromEntries((spiceNames || [])
  .map((name, index) => [`spice:CookingSpice${index}`, {
    kind: 'spice',
    rawName: `CookingSpice${index}`,
    name: `${name} Spice`,
    icon: `/data/CookingSpice${index}.png`,
    category: 'World 4'
  }]));

// UPKEEP: game placeholder, re-check on a game update: Some_Prayer_Name0 is the name the game gives its six unreleased prayer slots (Prayer19-24).
const UNRELEASED_PRAYER = /^Some_Prayer_Name\d*$/;
export const isPlaceholderPrayer = (prayer) => UNRELEASED_PRAYER.test(prayer?.name || '');

// A prayer's bonus and curse are round(base * max(1, 1 + (L - offset) / divisor)) (prayersReal, the prayerBonus
// table), the bonus from column x1 and the curse from x2. Each is a line of the Effect box, the curse labelled; the
// description joins them for the bot and search. Without the table the numbers go and the text stays.
const prayerTerm = (token, base, curve) => ({
  token,
  formula: 'rounded',
  args: { formula: 'scaledPastLevel', args: { base, offset: curve.offset, divisor: curve.divisor } }
});

// WorshipStuff PrayerCost (the prayerCost table): souls for the next level, one prayer on a curve of its own. The rates
// carry the prayer's index term, so the formula needs no index.
const prayerCost = (prayer, table, souls) => {
  if (!table || prayer.costMulti == null) return null;
  const late = prayer.prayerIndex === table.special.index ? table.special : table.late;
  return {
    formula: 'affineThenPow',
    args: {
      scale: prayer.costMulti,
      below: table.earlyBelow,
      earlyRate: table.early.base + prayer.prayerIndex / table.early.divisor,
      lateRate: late.base + prayer.prayerIndex / late.divisor,
      growth: late.growth,
      pivot: late.pivot,
      cap: table.cap
    },
    currency: souls?.[prayer.soul]?.displayName ?? prayer.soul
  };
};

export const prayerNodes = (prayers, data) => {
  const curve = gameTable(data, 'prayerBonus');
  const costs = gameTable(data, 'prayerCost');
  return Object.fromEntries((prayers || [])
    .filter((prayer) => prayer?.name && !isPlaceholderPrayer(prayer))
    .map((prayer) => {
      const lines = [{ label: null, text: tidy(prayer.effect) }, { label: 'Curse', text: tidy(String(prayer.curse || '').replace(/{/g, '}')) }]
        .filter(({ text }) => text && (curve || !/[{}]/.test(text)));
      const cost = prayerCost(prayer, costs, data?.items);
      return [`prayer:Prayer${prayer.prayerIndex}`, {
        kind: 'prayer',
        rawName: `Prayer${prayer.prayerIndex}`,
        name: prayer.name,
        icon: `/data/Prayer${prayer.prayerIndex}.png`,
        category: 'World 3',
        registry: true,
        description: lines.map(({ label, text }) => `${label ? `${label}:_` : ''}${text.replace(/[.!]$/, '')}.`).join('_'),
        effect: {
          levelLabel: 'Prayer level',
          cap: prayer.maxLevel ?? null,
          terms: curve ? [prayerTerm('{', prayer.x1, curve), prayerTerm('}', prayer.x2, curve)] : [],
          lines
        },
        ...(cost ? { cost } : {}),
        ...(prayer.unlockZone ? { fields: [{ label: 'Unlocked at', value: `${prayer.unlockZone}, wave ${prayer.unlockWave}` }] } : {})
      }];
    }));
};

// A building's text runs on into its live bonus readout after the first `@`, which is all
// placeholders without a save, so only the lead-in is kept.
export const buildingNodes = (towers) => Object.fromEntries(Object.entries(towers || {})
  .filter(([, tower]) => tower?.index != null)
  .map(([name, tower]) => [`building:${name}`, {
    kind: 'building',
    rawName: name,
    name,
    icon: `/data/ConTower${tower.index}.png`,
    category: 'World 3',
    description: String(tower.desc || '').split('@')[0].replace(/_+$/, ''),
    // Atoms and other bonuses raise it (construction.ts applyMaxLevelToTowers). A shrine trades this for its own fields.
    ...(tower.maxLevel != null ? { fields: [{ label: 'Base max level', value: tower.maxLevel }] } : {})
  }]));

// The nine shrines are buildings with a levelled bonus of their own (shrines.ts), so their page
// gains the level calculator. Three of the buildings' own texts never mention levelling, which is
// why the original text moves to a field labelled for the building, not for how it levels.
// UPKEEP: `shrines` is keyed by tower index; re-check if the tower table is reordered.
export const enrichShrines = (nodes, towers, shrines) => {
  for (const [name, tower] of Object.entries(towers || {})) {
    const shrine = shrines?.[tower?.index];
    const node = nodes[`building:${name}`];
    if (!shrine || !node) continue;
    const buildingText = String(node.description || '').replace(/_/g, ' ');
    Object.assign(node, {
      registry: true,
      description: shrine.desc,
      effect: {
        levelLabel: 'Shrine level',
        cap: null,
        // The game reads (level - 1) * bonusPerLevel + baseBonus, which bigBase writes as x1 + x2 * level.
        terms: [{ token: '{', formula: 'growth', args: { func: 'bigBase', x1: shrine.baseBonus - shrine.bonusPerLevel, x2: shrine.bonusPerLevel } }]
      },
      // The number is hours of waiting, not a price, and the level-up speed bonuses are the player's own.
      cost: {
        formula: 'shrineHours',
        args: {},
        currency: 'hours of shrine progress',
        label: 'Time to reach this level',
        note: 'Before shrine level-up speed bonuses.'
      },
      fields: [{ label: 'About this building', value: buildingText }]
    });
  }
};
