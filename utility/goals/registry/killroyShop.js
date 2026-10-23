import { killRoySkullShop } from '@website-data';
import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

// Shop items 0-9 are the free daily ones, the permanent upgrades start at 10
const FIRST_PERMANENT_SHOP_INDEX = 10;
// The Gaming nugget (slot 2) is a fixed reward without a level
const NUGGET_SLOT = 2;

// The catalog text ends in the live bonus (by {x, Current bonus is {x), which would rename the row as it levels
const stableName = (slot) => cleanUnderscore((killRoySkullShop?.[FIRST_PERMANENT_SHOP_INDEX + slot]?.description ?? '')
  .replace(/[!.]?_Current_bonus_is_\{x?$/, '')
  .replace(/_(by_)?\+?\{[x%]?$/, ''));

export default {
  system: 'killroyShop',
  label: 'Killroy shop',
  entryLabel: 'shop upgrade',
  scope: 'account',
  route: GOAL_ROUTES.killroyShop,
  list: ({ account }) => (account?.killroy?.permanentUpgrades ?? [])
    .map((upgrade, slot) => ({ ...upgrade, slot }))
    .filter(({ slot }) => slot !== NUGGET_SLOT),
  key: (row) => String(row.slot),
  name: (row) => stableName(row.slot),
  icon: (row) => `etc/Skull_Shop_Item_${row.slot}`,
  metrics: {
    level: {
      label: 'Level',
      noun: 'level',
      value: (row) => row.level ?? 0,
      // the bonus is a decay curve, so only slots with a cap have a percent
      percentOfMax: (row) => row.progress ?? null,
      steps: [100, 1000]
    }
  }
};
