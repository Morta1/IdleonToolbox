// World 4 details that belong on pages which already exist, so they ride along as `fields` or as the
// level calculator rather than getting a kind of their own: the meals, the spices (territories),
// the breeding mobs and the three jewels the Tesseract unlocks.
import { linked } from '../../utility/wiki/field-links.mjs';
import tesseractUpgrade from './registry/classes/tesseract-upgrade.mjs';
import { gameTable } from './registry/data.mjs';
import { nodeId } from './registry/links.mjs';
import { spaced } from './registry/text.mjs';
import gene from './registry/world-4/gene.mjs';

const grouped = (value) => value.toLocaleString('en-US');
const addFields = (node, fields) => {
  node.fields = [...(node.fields || []), ...fields];
};

// The base max level and the one raiser that has a page, the Causticolumn artifact: the mealMaxLevel table,
// CookingR("CookingMealMaxLVlol")'s base and its ArtifactBonus argument. The Jade Emporium upgrades, the Grimoire and the
// lore boss are unnamed. No table, no field.
const maxLevelField = (maxLevel) => (maxLevel
  ? linked(
    { label: 'Base max level', value: `${maxLevel.base} (raised by the Causticolumn artifact, two Jade Emporium upgrades, the Grimoire and a Spelunking lore boss)` },
    'maxRaisedBy',
    `artifact:Arti${maxLevel.artifact}`
  )
  : null);

// The cap is raised by the account, and a page cannot know how far, so the calculator is uncapped.
const enrichMeals = (nodes, cookingMenu, maxLevel) => {
  (cookingMenu || []).forEach((meal, index) => {
    const node = nodes[`meal:CookingM${index}`];
    if (!node) return;
    Object.assign(node, {
      registry: true,
      description: meal.effect,
      effect: { levelLabel: 'Meal level', cap: null, terms: [{ token: '{', formula: 'linear', args: { perLevel: meal.baseStat } }] },
      cost: { formula: 'mealCost', args: {}, currency: meal.name, label: 'Meals for this level', note: 'Before the Food Lust, achievement and companion discounts.' }
    });
    addFields(node, [
      maxLevelField(maxLevel),
      { label: 'Menu text', value: spaced(meal.description) }
    ].filter(Boolean));
  });
};

// The TerritoryInfo row slot k shows: Breeding("TerritoryID") (the territoryId table), k + floor((k + offset) / divisor),
// so row k below 14 and k + 1 from 14 on (row 14 is the old Arena). PetStuff("TotalTrekkingREQ") reads row k itself
// (TerritoryID with 42). No table, no battle.
const displayRow = (slot, id) => slot + Math.floor((slot + id.offset) / id.divisor);

// An empty enemy slot has no health.
const battleFields = (shown, monsters) => {
  const present = (shown.enemies || []).filter((enemy) => enemy?.health);
  const enemies = present.map((enemy) => `${spaced(monsters?.[enemy.name]?.Name ?? enemy.name)} (${grouped(enemy.health)} HP)`);
  return [
    { label: 'Territory battle', value: spaced(shown.battleName) },
    linked({ label: 'Territory enemies', value: enemies }, 'features', ...new Set(present.map((enemy) => `monster:${enemy.name}`))),
    { label: 'Enemy attack', value: shown.enemyAttack }
  ];
};

const enrichSpices = (nodes, territory, monsters, id) => {
  for (let slot = 0; ; slot++) {
    const node = nodes[`spice:CookingSpice${slot}`];
    if (!node) break;
    const shown = id ? territory?.[displayRow(slot, id)] : null;
    if (id && !shown) continue;
    addFields(node, [
      ...(shown ? battleFields(shown, monsters) : []),
      // The requirement is (powerReq + claims) * Monolithic^claims, and the first claim is the bare number.
      { label: 'Trekking progress for the first spice', value: territory?.[slot]?.powerReq }
    ]);
  }
};

const enrichBreedingMobs = (nodes, petStats, shiny) => {
  (petStats || []).forEach((world, worldIndex) => (world || []).forEach((mob) => {
    const node = nodes[`monster:${mob?.monsterRawName}`];
    if (!node) return;
    addFields(node, [
      { label: 'Breeding', value: `World ${worldIndex + 1} Mob` },
      linked({ label: 'Gene', value: spaced(mob.gene?.name) }, 'featuredIn', mob.gene && nodeId(gene, null, mob.gene.index)),
      // The shiny bonus is round(shiny level * base), up to the shinyLevels table's maxLevel (Breeding("SpecialPassives")).
      { label: `Shiny bonus per shiny level${shiny ? ` (up to ${shiny.maxLevel})` : ''}`, value: spaced(String(mob.passive).replace('{', mob.baseValue)) }
    ]);
  }));
};

// _event_CompassTitan sets Lab[14][jewel] = 1 once ArcaneUpgBonus of its upgrade is above 0 (the tesseractJewels table).
// No table, no fields.
const enrichJewels = (nodes, tesseract, jewels) => {
  for (const [jewel, upgrade] of Object.entries(jewels || {})) {
    const node = nodes[`jewel:ConsoleJwl${jewel}`];
    if (node) {
      addFields(node, [linked({ label: 'Unlocked by', value: `${spaced(tesseract?.[upgrade]?.name)} (Tesseract)` }, 'unlockedBy', nodeId(tesseractUpgrade, null, upgrade))]);
    }
  }
};

export const enrichWorld4 = (nodes, data) => {
  const { cookingMenu, territory, monsters, petStats, tesseract } = data;
  enrichMeals(nodes, cookingMenu, gameTable(data, 'mealMaxLevel'));
  enrichSpices(nodes, territory, monsters, gameTable(data, 'territoryId'));
  enrichBreedingMobs(nodes, petStats, gameTable(data, 'shinyLevels'));
  enrichJewels(nodes, tesseract, gameTable(data, 'tesseractJewels'));
};
