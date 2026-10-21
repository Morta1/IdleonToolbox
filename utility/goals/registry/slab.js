import { items } from '@website-data';
import { GOAL_ROUTES } from '../routes';
import { itemIcon } from './itemIcon';
import { cleanUnderscore } from '@utility/helpers';

// The game's item type codes, gathered into categories. Every slab item type is listed (the registry test checks it), so
// no category sits empty in the group select
const CATEGORY_TYPES = {
  materials: ['bOre', 'bBar', 'bLog', 'bLeaf', 'bCraft', 'cOil', 'dFish', 'dBugs', 'dCritters', 'dSouls'],
  equipment: ['aHelmet', 'aHelmetMTX', 'aWeapon', 'aShirt', 'aPants', 'aShoes', 'aPendant', 'aRing', 'aChatRingMTX',
    'aCape', 'aKeychain', 'aTrophy', 'aNametag', 'aGown'],
  tools: ['aPick', 'aHatchet', 'aFishingRod', 'aBugNet', 'aTrap', 'aSkull', 'aDNAgun'],
  food: ['cFood'],
  stamps: ['aStamp'],
  obols: ['aObolCircle', 'aObolSquare', 'aObolHexagon', 'aObolSparkle'],
  storage: ['aCarryBag', 'aInventoryBag', 'aStorageChest'],
  quest: ['dQuest'],
  statues: ['dStatueStone'],
  stones: ['dStone'],
  currency: ['dCurrency'],
  fishingToolkit: ['dFishToolkit'],
  cardPacks: ['dCardPack'],
  timeCandy: ['dTimeCandy'],
  books: ['aRecipe', 'aTalentBook']
};
const CATEGORY_OF = Object.fromEntries(Object.entries(CATEGORY_TYPES)
  .flatMap(([category, types]) => types.map((type) => [type, category])));

export default {
  system: 'slab',
  label: 'Slab',
  entryLabel: 'slab item',
  scope: 'account',
  route: GOAL_ROUTES.slab,
  // Item goals cover a single item's amount, so the slab only tracks all of it or a category
  allOnly: true,
  groups: {
    label: 'Category',
    of: (row) => CATEGORY_OF[items?.[row.itemRawName]?.typeGen] ?? null,
    names: {
      materials: 'Materials',
      equipment: 'Equipment',
      tools: 'Tools',
      food: 'Food',
      stamps: 'Stamps',
      obols: 'Obols',
      storage: 'Bags and storage',
      quest: 'Quest items',
      statues: 'Statues',
      stones: 'Upgrade stones',
      currency: 'Currency',
      fishingToolkit: 'Fishing toolkit',
      cardPacks: 'Card packs',
      timeCandy: 'Time candy',
      books: 'Recipes and talent books'
    }
  },
  // a few slab ids have no item behind them (DungRNG0); without a name they would show as raw ids
  list: ({ account }) => (account?.looty?.slabItems ?? []).filter(({ name }) => name),
  key: (row) => row.itemRawName,
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => itemIcon(row.rawName),
  metrics: {
    obtained: { label: 'Obtained', value: (row) => (row.obtained ? 1 : 0), boolean: true }
  }
};
