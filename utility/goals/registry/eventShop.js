import { getEventShopBonus, getEventShopItems } from '@parsers/misc';
import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';
import { withUniqueNames } from './names';

export default {
  system: 'eventShop',
  label: 'Event shop bonuses',
  entryLabel: 'event shop bonus',
  scope: 'account',
  route: GOAL_ROUTES.eventShop,
  // the catalog position is the bonus id
  list: ({ account }) => withUniqueNames(getEventShopItems().map(({ text }, index) => ({
    index,
    title: cleanUnderscore(String(text).split('@')[0]).trim(),
    owned: getEventShopBonus(account, index)
  })), (row) => row.title),
  key: (row) => String(row.index),
  name: (row) => row.goalName,
  icon: (row) => `data/EventShopBuy${row.index}`,
  metrics: {
    owned: { label: 'Owned', value: (row) => row.owned, boolean: true }
  }
};
