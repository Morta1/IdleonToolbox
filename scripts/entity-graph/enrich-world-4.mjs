// World 4 details that belong on pages which already exist, so they ride along as `fields` or as the
// level calculator rather than getting a kind of their own: the meals, the spices (territories),
// the breeding mobs and the three jewels the Tesseract unlocks.
import { linked } from '../../utility/wiki/field-links.mjs';
import tesseractUpgrade from './registry/classes/tesseract-upgrade.mjs';
import { nodeId } from './registry/links.mjs';
import { spaced } from './registry/text.mjs';
import gene from './registry/world-4/gene.mjs';

const grouped = (value) => value.toLocaleString('en-US');
const addFields = (node, fields) => {
  node.fields = [...(node.fields || []), ...fields];
};

// UPKEEP: CookingMealMaxLVlol base 30 (cooking.ts DEFAULT_MEAL_MAX_LEVEL).
const MEAL_BASE_MAX = 30;
// UPKEEP: the Causticolumn artifact (artifacts index 17) is the one raiser of a meal's max level that has a page; the Jade Emporium upgrades, the Grimoire and the lore boss are unnamed.
const CAUSTICOLUMN = 17;

// The cap is raised by the account, and a page cannot know how far, so the calculator is uncapped.
const enrichMeals = (nodes, cookingMenu) => {
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
      linked(
        { label: 'Base max level', value: `${MEAL_BASE_MAX} (raised by the Causticolumn artifact, two Jade Emporium upgrades, the Grimoire and a Spelunking lore boss)` },
        'maxRaisedBy',
        `artifact:Arti${CAUSTICOLUMN}`
      ),
      { label: 'Menu text', value: spaced(meal.description) }
    ]);
  });
};

// UPKEEP: Breeding("TerritoryID"): slot k shows TerritoryInfo row k below 14 and k + 1 from 14 on (row 14 is the old Arena), while
// PetStuff("TotalTrekkingREQ") reads row k itself (TerritoryID with 42). Re-check both on a game patch.
const displayRow = (slot) => slot + Math.floor((slot + 86.1) / 100);

const enrichSpices = (nodes, territory, monsters) => {
  for (let slot = 0; ; slot++) {
    const node = nodes[`spice:CookingSpice${slot}`];
    if (!node) break;
    const shown = territory?.[displayRow(slot)];
    if (!shown) continue;
    // An empty enemy slot has no health.
    const present = (shown.enemies || []).filter((enemy) => enemy?.health);
    const enemies = present.map((enemy) => `${spaced(monsters?.[enemy.name]?.Name ?? enemy.name)} (${grouped(enemy.health)} HP)`);
    addFields(node, [
      { label: 'Territory battle', value: spaced(shown.battleName) },
      linked({ label: 'Territory enemies', value: enemies }, 'features', ...new Set(present.map((enemy) => `monster:${enemy.name}`))),
      { label: 'Enemy attack', value: shown.enemyAttack },
      // The requirement is (powerReq + claims) * Monolithic^claims, and the first claim is the bare number.
      { label: 'Trekking progress for the first spice', value: territory?.[slot]?.powerReq }
    ]);
  }
};

const enrichBreedingMobs = (nodes, petStats) => {
  (petStats || []).forEach((world, worldIndex) => (world || []).forEach((mob) => {
    const node = nodes[`monster:${mob?.monsterRawName}`];
    if (!node) return;
    addFields(node, [
      { label: 'Breeding', value: `World ${worldIndex + 1} Mob` },
      linked({ label: 'Gene', value: spaced(mob.gene?.name) }, 'featuredIn', mob.gene && nodeId(gene, null, mob.gene.index)),
      // UPKEEP: the shiny bonus is round(shiny level * base), levels 1-20 (Breeding("SpecialPassives")).
      { label: 'Shiny bonus per shiny level (up to 20)', value: spaced(String(mob.passive).replace('{', mob.baseValue)) }
    ]);
  }));
};

// UPKEEP: N.js sets Lab[14][21..23] = 1 once ArcaneUpgBonus 28 / 35 / 43 is above 0.
const TESSERACT_JEWELS = { 21: 28, 22: 35, 23: 43 };

const enrichJewels = (nodes, tesseract) => {
  for (const [jewel, upgrade] of Object.entries(TESSERACT_JEWELS)) {
    const node = nodes[`jewel:ConsoleJwl${jewel}`];
    if (node) {
      addFields(node, [linked({ label: 'Unlocked by', value: `${spaced(tesseract?.[upgrade]?.name)} (Tesseract)` }, 'unlockedBy', nodeId(tesseractUpgrade, null, upgrade))]);
    }
  }
};

export const enrichWorld4 = (nodes, { cookingMenu, territory, monsters, petStats, tesseract }) => {
  enrichMeals(nodes, cookingMenu);
  enrichSpices(nodes, territory, monsters);
  enrichBreedingMobs(nodes, petStats);
  enrichJewels(nodes, tesseract);
};
