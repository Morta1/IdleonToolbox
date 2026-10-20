import { gemShop } from '@website-data';
import { GOAL_ROUTES } from '../routes';
import { realCap } from '../caps';
import { titleCaseTiers, withUniqueNames } from './names';

// Placeholder cap on the pack and stone rows that have no real limit
const GEM_SHOP_PLACEHOLDER = 100000;

// The page skips the Blank rows. The limited and past specials are left out: the past ones show "?? / max" and
// reuse the limited ones' globalIndex, so the save's count for those slots belongs to neither. Index 65 is shared
// by two card packs (Ancient, Eternal) and the World 7 filler reuses 47: the first row of each index is the entry.
const SPECIALS = ['past_limited_specials'];
const LIMITED_SECTION = 'Limited_Specials';

const gemShopItems = () => {
  const seen = new Set();
  return gemShop
    .filter(({ name }) => !SPECIALS.includes(name))
    .flatMap(({ sections }) => Object.entries(sections).filter(([section]) => section !== LIMITED_SECTION).flatMap(([, items]) => items))
    .filter(({ rawName, displayName, globalIndex }) => {
      if (rawName === 'Blank' || displayName === 'NAME_OF_ITEM' || seen.has(globalIndex)) return false;
      seen.add(globalIndex);
      return true;
    });
};

export default {
  system: 'gemShop',
  label: 'Gem shop',
  entryLabel: 'gem shop item',
  scope: 'account',
  route: GOAL_ROUTES.gemShop,
  list: ({ account }) => withUniqueNames(
    gemShopItems().map((item) => ({ ...item, purchases: account?.gemShopPurchases?.[item.globalIndex] ?? 0 })),
    (row) => titleCaseTiers(row.displayName)
  ),
  key: (row) => String(row.globalIndex),
  name: (row) => row.goalName,
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    purchases: {
      label: 'Purchases',
      value: (row) => row.purchases,
      max: (row) => realCap(row.maxPurchases, GEM_SHOP_PLACEHOLDER)
    }
  }
};
