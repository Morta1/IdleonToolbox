import { getAllItems } from '@parsers/items';

// getAllItems walks every inventory, storage and the forge; resolving thousands of item goals must not repeat it
const cache = new WeakMap();

export const ownedItemsOf = ({ account, characters }) => {
  if (!account || typeof account !== 'object') return getAllItems(characters, account);
  if (!cache.has(account)) cache.set(account, getAllItems(characters, account));
  return cache.get(account);
};
