// Game systems whose parts are worth a page each: the Lab's chips and jewels, the Worship
// prayers, and the Construction buildings. None of them is an item, but each costs items, and
// before these pages existed the items they cost had no way to say so.
//
// Descriptions are filled at their base value, so a page reads "+10% Total Defence" rather than
// the raw "+{%" template. What a player actually gets depends on levels and account bonuses a
// save-less page cannot see.
const fill = (template, value) => String(template || '').replace(/[{}]/g, value);

export const chipNodes = (chips) => Object.fromEntries((chips || [])
  .filter((chip) => chip?.rawName && chip?.name)
  .map((chip) => [`chip:${chip.rawName}`, {
    kind: 'chip',
    rawName: chip.rawName,
    name: chip.name,
    icon: `/data/ConsoleChip${chip.index}.png`,
    category: 'World 4',
    description: fill(chip.bonus, chip.baseVal)
  }]));

export const jewelNodes = (jewels) => Object.fromEntries((jewels || [])
  .filter((jewel) => jewel?.name)
  .map((jewel) => [`jewel:ConsoleJwl${jewel.index}`, {
    kind: 'jewel',
    rawName: `ConsoleJwl${jewel.index}`,
    name: jewel.name,
    icon: `/data/ConsoleJwl${jewel.index}.png`,
    category: 'World 4',
    description: fill(jewel.effect, jewel.bonus)
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

// A prayer's bonus and curse both grow a tenth of their base per level, so level one is the base.
export const prayerNodes = (prayers) => Object.fromEntries((prayers || [])
  .filter((prayer) => prayer?.name)
  .map((prayer) => [`prayer:Prayer${prayer.prayerIndex}`, {
    kind: 'prayer',
    rawName: `Prayer${prayer.prayerIndex}`,
    name: prayer.name,
    icon: `/data/Prayer${prayer.prayerIndex}.png`,
    category: 'World 3',
    description: `Level 1: ${fill(prayer.effect, prayer.x1)}. Curse: ${fill(prayer.curse, prayer.x2)}.`
  }]));

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
    description: String(tower.desc || '').split('@')[0].replace(/_+$/, '')
  }]));
