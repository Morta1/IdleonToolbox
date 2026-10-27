import { getEventShopBonus, getEventShopItems } from '@parsers/misc';
import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';
import { withUniqueNames } from './names';
import { OPT } from '@parsers/accountOptions';

export default {
  system: 'eventShop',
  label: 'Event shop bonuses',
  entryLabel: 'event shop bonus',
  scope: 'account',
  route: GOAL_ROUTES.eventShop,
  // the catalog position is the bonus id
  list: ({ account }) => withUniqueNames(getEventShopItems().map(({ text, price }, index) => ({
    index,
    price: Number(price),
    title: cleanUnderscore(String(text).split('@')[0]).trim(),
    owned: getEventShopBonus(account, index)
  })), (row) => row.title),
  key: (row) => String(row.index),
  name: (row) => row.goalName,
  icon: (row) => `data/EventShopBuy${row.index}`,
  metrics: {
    owned: {
      label: 'Owned',
      value: (row) => row.owned,
      boolean: true,
      verb: 'buy',
      // bought with the stars the event shop page counts
      cost: { label: 'stars', icon: () => 'etc/Event_Currency', have: ({ account }) => account?.accountOptions?.[OPT.eventShopCurrency] ?? 0, price: (row) => row.price }
    }
  }
};
